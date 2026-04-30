/**
 * GOVERNANCE — WCAG Color Contrast Validator
 *
 * Vérifie la conformité WCAG 2.1 AA des paires de couleurs : ratio de contraste
 * minimum 4.5:1 pour le texte normal, 3:1 pour le texte large. Suggère un
 * ajustement automatique en assombrissant ou éclaircissant la couleur de
 * premier plan jusqu'à atteindre le seuil.
 *
 * Activé conditionnellement par les profils sectoriels (finance_eu, saas...).
 */

import type { GovernanceFinding } from "./types";

// ─── Conversion & calcul de luminance ────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.trim().replace(/^#/, "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h)) return null;
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function relativeLuminance(rgb: [number, number, number]): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = rgb.map(channel) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number | null {
  const f = hexToRgb(fg);
  const b = hexToRgb(bg);
  if (!f || !b) return null;
  const lf = relativeLuminance(f);
  const lb = relativeLuminance(b);
  const light = Math.max(lf, lb);
  const dark = Math.min(lf, lb);
  return (light + 0.05) / (dark + 0.05);
}

// ─── Auto-ajustement ─────────────────────────────────────────────────────────

function adjustColor(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map((v) => v * factor);
  return rgbToHex(r, g, b);
}

/**
 * Cherche une variation de la couleur de premier plan qui atteint le ratio
 * cible. Tente d'abord d'assombrir, puis d'éclaircir. Renvoie null si aucune
 * variation viable trouvée en 16 itérations.
 */
export function suggestAccessibleColor(
  fg: string,
  bg: string,
  targetRatio = 4.5,
): string | null {
  const start = contrastRatio(fg, bg);
  if (start === null) return null;
  if (start >= targetRatio) return fg;

  for (const direction of [0.85, 1.15]) {
    let current = fg;
    for (let i = 0; i < 16; i++) {
      current = adjustColor(current, direction);
      const ratio = contrastRatio(current, bg);
      if (ratio !== null && ratio >= targetRatio) {
        return current;
      }
    }
  }
  return null;
}

// ─── API publique ────────────────────────────────────────────────────────────

export interface PaletteInput {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
}

export interface WcagPair {
  label: string;
  fg: string;
  bg: string;
  ratio: number;
  passesAA: boolean;
  passesAALarge: boolean;
  suggestedFg?: string;
}

export interface WcagOutcome {
  pairs: WcagPair[];
  findings: GovernanceFinding[];
}

/**
 * Audite la palette : couples primary/background, secondary/background,
 * accent/background. La couleur de fond par défaut est blanc (#ffffff) si
 * aucune n'est précisée par le brief.
 */
export function runWcagValidator(palette: PaletteInput): WcagOutcome {
  const bg = palette.background?.trim() || "#ffffff";
  const candidates: Array<{ label: string; fg?: string }> = [
    { label: "primary",   fg: palette.primary },
    { label: "secondary", fg: palette.secondary },
    { label: "accent",    fg: palette.accent },
  ];

  const pairs: WcagPair[] = [];
  const findings: GovernanceFinding[] = [];

  for (const { label, fg } of candidates) {
    if (!fg) continue;
    const ratio = contrastRatio(fg, bg);
    if (ratio === null) {
      findings.push({
        severity: "info",
        category: "wcag.invalid_color",
        match: `${label}=${fg}`,
        hint: "Format couleur invalide (attendu #rrggbb ou #rgb).",
      });
      continue;
    }
    const passesAA = ratio >= 4.5;
    const passesAALarge = ratio >= 3;
    let suggestedFg: string | undefined;
    if (!passesAA) {
      const suggestion = suggestAccessibleColor(fg, bg, 4.5);
      if (suggestion) suggestedFg = suggestion;
      findings.push({
        severity: passesAALarge ? "warning" : "critical",
        category: "wcag.contrast_low",
        match: `${label} ${fg} on ${bg} (ratio ${ratio.toFixed(2)})`,
        replacement: suggestedFg,
        hint: passesAALarge
          ? "Suffisant pour titre large (≥ 18pt bold), insuffisant pour le corps de texte (WCAG AA 4.5:1)."
          : `Contraste très faible — passez à ${suggestedFg ?? "une teinte plus foncée"} pour atteindre 4.5:1.`,
      });
    }
    pairs.push({ label, fg, bg, ratio, passesAA, passesAALarge, suggestedFg });
  }

  return { pairs, findings };
}
