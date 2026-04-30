/**
 * GOVERNANCE — Brand Lock Builder
 *
 * Construit le contrat factuel à partir du Brand Brief envoyé par le frontend.
 * Le lock devient la source unique de vérité pour tous les modules : nom,
 * prix, devise, marge, packaging, certifications, claims autorisés / interdits,
 * couleurs, voice et mode de croissance.
 */

import type { BrandLock, GrowthMode } from "./types";
import { getGrowthProfile } from "./growth-modes";

export interface RawBrandBriefInput {
  brand_name?: string;
  sector?: string;
  tone?: string;
  values?: string | string[];

  product_name?: string;
  product_size?: string;
  product_price?: string | number;
  price?: string | number;
  old_price?: string | number;
  currency?: string;
  margin_percent?: string | number;
  packaging?: string;
  origin?: string;

  certifications?: string;
  claims_allowed?: string;
  claims_forbidden?: string;

  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  colors?: string;

  // Voice & mode
  growth_mode?: string;
  voice_forbidden_words?: string;
  urgency_allowed?: string | boolean;
  emojis_allowed?: string | boolean;
}

function toList(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(/[\n,;|]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toValuesList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return toList(value ?? "");
}

function toNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function toBool(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const s = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "oui", "on"].includes(s)) return true;
  if (["false", "0", "no", "non", "off"].includes(s)) return false;
  return fallback;
}

export function buildBrandLock(input: RawBrandBriefInput | undefined | null): BrandLock {
  const raw = input ?? {};
  const mode = (raw.growth_mode as GrowthMode) || "premium_brand";
  const profile = getGrowthProfile(mode);

  const customForbidden = toList(raw.voice_forbidden_words);
  const mergedForbidden = Array.from(
    new Set([...profile.voice.forbidden_words, ...customForbidden]),
  );

  return {
    brand: {
      name: raw.brand_name?.trim() ?? "",
      sector: raw.sector?.trim().toLowerCase() ?? "",
      tone: raw.tone?.trim().toLowerCase() ?? "",
      values: toValuesList(raw.values),
    },
    product: {
      name: raw.product_name?.trim() || undefined,
      size: raw.product_size?.trim() || undefined,
      price: toNumber(raw.product_price ?? raw.price),
      old_price: toNumber(raw.old_price),
      currency: raw.currency?.trim() || "EUR",
      margin_percent: toNumber(raw.margin_percent),
      packaging: raw.packaging?.trim() || undefined,
      origin: raw.origin?.trim() || undefined,
      certifications: toList(raw.certifications),
      claims_allowed: toList(raw.claims_allowed),
      claims_forbidden: toList(raw.claims_forbidden),
    },
    colors: {
      primary: raw.primary_color?.trim() || undefined,
      secondary: raw.secondary_color?.trim() || undefined,
      accent: raw.accent_color?.trim() || undefined,
      raw: raw.colors?.trim() || undefined,
    },
    voice: {
      forbidden_words: mergedForbidden,
      urgency_allowed: toBool(raw.urgency_allowed, profile.voice.urgency_allowed),
      max_exclamation_marks: profile.voice.max_exclamation_marks,
      emojis_allowed: toBool(raw.emojis_allowed, profile.voice.emojis_allowed),
    },
    mode,
  };
}

/**
 * Sérialise le lock en bloc texte injectable dans un system prompt.
 * Compact mais complet — tous les champs critiques sont listés.
 */
export function brandLockToPromptBlock(lock: BrandLock): string {
  const profile = getGrowthProfile(lock.mode);
  const p = lock.product;
  const lines: string[] = [];

  lines.push("═══ BRAND LOCK (FACT LOCK ENGINE — IMMUABLE) ═══");
  lines.push(`• Brand: ${lock.brand.name || "(non défini)"} | Sector: ${lock.brand.sector || "n/a"} | Tone: ${lock.brand.tone || "n/a"}`);
  if (lock.brand.values.length) {
    lines.push(`• Values: ${lock.brand.values.join(", ")}`);
  }
  if (p.name) lines.push(`• Product: ${p.name}${p.size ? ` (${p.size})` : ""}`);
  if (p.price !== undefined) {
    lines.push(`• Price: ${p.price} ${p.currency} (IMMUABLE — never alter, never round, never invent old price)`);
  }
  if (p.margin_percent !== undefined) {
    lines.push(`• Margin: ${p.margin_percent}% (gross)`);
  }
  if (p.packaging) lines.push(`• Packaging: ${p.packaging} (IMMUABLE)`);
  if (p.origin) lines.push(`• Origin: ${p.origin}`);
  if (p.certifications.length) {
    lines.push(`• Certifications (only these): ${p.certifications.join(", ")}`);
  } else {
    lines.push(`• Certifications: NONE — never claim any certification, label or award.`);
  }
  if (p.claims_allowed.length) {
    lines.push(`• Claims allowed (use ONLY these or paraphrase within them):`);
    p.claims_allowed.forEach((c) => lines.push(`    ✓ ${c}`));
  }
  if (p.claims_forbidden.length) {
    lines.push(`• Claims forbidden (NEVER use, even as paraphrase):`);
    p.claims_forbidden.forEach((c) => lines.push(`    ✗ ${c}`));
  }
  if (lock.colors.raw || lock.colors.primary) {
    const colorParts = [
      lock.colors.primary && `primary ${lock.colors.primary}`,
      lock.colors.secondary && `secondary ${lock.colors.secondary}`,
      lock.colors.accent && `accent ${lock.colors.accent}`,
      lock.colors.raw,
    ].filter(Boolean);
    lines.push(`• Brand colors (SACRED): ${colorParts.join(" | ")}`);
  }
  lines.push("");
  lines.push(`═══ GROWTH MODE: ${profile.label.toUpperCase()} ═══`);
  lines.push(`${profile.description}`);
  lines.push(`• CTA style: ${profile.cta_style}`);
  lines.push(`• Urgency tolerance: ${profile.urgency_tolerance}`);
  lines.push(`• Max exclamation marks per output: ${profile.voice.max_exclamation_marks}`);
  lines.push(`• Emojis allowed: ${profile.voice.emojis_allowed ? "yes (sparingly)" : "no"}`);
  lines.push("");
  lines.push("═══ ABSOLUTE RULES ═══");
  lines.push("1. Never modify the product price, currency, margin, packaging or origin.");
  lines.push("2. Never invent certifications, awards, study results, statistics, founding dates, customer numbers.");
  lines.push("3. Never use forbidden claims — not even paraphrased.");
  if (!lock.voice.urgency_allowed) {
    lines.push("4. Never fabricate urgency: no fake stock, no fake countdown, no 'only X left', no 'last chance'.");
  }
  if (!lock.voice.emojis_allowed) {
    lines.push("5. Do not use emojis in the output.");
  }
  lines.push("6. Never include fake testimonials, fake media mentions, or fake reviews.");
  lines.push("7. If a fact is not in this lock, OMIT it. Do not infer, do not assume.");

  return lines.join("\n");
}

/**
 * Variante plus courte pour les modules qui ont déjà un system prompt très chargé.
 */
export function brandLockToCompactBlock(lock: BrandLock): string {
  const p = lock.product;
  const profile = getGrowthProfile(lock.mode);
  const parts: string[] = [];
  parts.push(`Brand=${lock.brand.name}`);
  if (p.price !== undefined) parts.push(`Price=${p.price}${p.currency}`);
  if (p.margin_percent !== undefined) parts.push(`Margin=${p.margin_percent}%`);
  if (p.packaging) parts.push(`Packaging=${p.packaging}`);
  parts.push(`Mode=${profile.label}`);
  parts.push(`Urgency=${lock.voice.urgency_allowed ? "ok" : "FORBIDDEN"}`);
  parts.push(`Emoji=${lock.voice.emojis_allowed ? "ok" : "no"}`);
  if (p.claims_forbidden.length) {
    parts.push(`ForbiddenClaims=[${p.claims_forbidden.slice(0, 6).join(" | ")}]`);
  }
  return `[BRAND LOCK] ${parts.join(" · ")}`;
}
