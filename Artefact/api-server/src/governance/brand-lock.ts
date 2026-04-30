/**
 * GOVERNANCE — Brand Lock Builder (v2.1 sector-aware)
 *
 * Construit le contrat factuel à partir du Brand Brief envoyé par le frontend.
 * Le lock devient la source unique de vérité pour tous les modules : nom,
 * prix, devise, marge, packaging, certifications, claims autorisés / interdits,
 * couleurs, voice et mode de croissance.
 *
 * v2.1 — résout le profil sector×region via `loadSectorProfile`. Les voice
 * rules sont ensuite l'INTERSECTION du growth_mode et du profil sectoriel
 * (le plus strict des deux gagne).
 */

import type { BrandLock, BrandLockVoice, GrowthMode } from "./types";
import { getGrowthProfile } from "./growth-modes";
import { loadSectorProfile, sectorProfileToPromptBlock } from "./sector-engine";

export interface RawBrandBriefInput {
  brand_name?: string;
  sector?: string;
  region?: string;
  market?: string; // alias région côté frontend existant
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

  certifications?: string | string[];
  claims_allowed?: string | string[];
  claims_forbidden?: string | string[];

  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  colors?: string;

  // Voice & mode
  growth_mode?: string;
  voice_forbidden_words?: string | string[];
  urgency_allowed?: string | boolean;
  emojis_allowed?: string | boolean;
}

function toList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
  return String(value)
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

/**
 * Calcule les voice rules en prenant la borne la plus stricte entre le
 * growth_mode et le profil sectoriel. Les overrides utilisateur peuvent
 * uniquement durcir, jamais assouplir une règle sectorielle critique.
 */
function intersectVoice(
  modeVoice: BrandLockVoice,
  profileTone: { aggressiveness_level: "low" | "medium" | "high"; emojis_allowed: boolean; exclamation_limit: number },
  profileForbidden: string[],
  customForbidden: string[],
  briefUrgency: boolean | undefined,
  briefEmojis: boolean | undefined,
  profileUrgencyAllowed: boolean,
): BrandLockVoice {
  // Mots interdits : union (union de tous, dédupliqué)
  const merged = Array.from(
    new Set([
      ...modeVoice.forbidden_words,
      ...profileForbidden,
      ...customForbidden,
    ]),
  );

  // Urgence : si le profil interdit, c'est interdit. Sinon le brief peut surcharger, sinon le mode décide.
  let urgency = modeVoice.urgency_allowed;
  if (!profileUrgencyAllowed) urgency = false;
  else if (briefUrgency !== undefined) urgency = briefUrgency && modeVoice.urgency_allowed;

  // Emojis : si profil interdit, c'est interdit. Sinon, intersection brief × mode.
  let emojis = modeVoice.emojis_allowed;
  if (!profileTone.emojis_allowed) emojis = false;
  else if (briefEmojis !== undefined) emojis = briefEmojis && modeVoice.emojis_allowed;

  // Exclamations : minimum entre la limite mode et la limite profil
  const excl = Math.min(modeVoice.max_exclamation_marks, profileTone.exclamation_limit);

  return {
    forbidden_words: merged,
    urgency_allowed: urgency,
    max_exclamation_marks: excl,
    emojis_allowed: emojis,
    aggressiveness_level: profileTone.aggressiveness_level,
  };
}

export function buildBrandLock(input: RawBrandBriefInput | undefined | null): BrandLock {
  const raw = input ?? {};
  const mode = (raw.growth_mode as GrowthMode) || "premium_brand";
  const profile = getGrowthProfile(mode);
  const sector = raw.sector?.trim().toLowerCase() ?? "";
  // Le frontend existant envoie `market` ; on accepte aussi `region`.
  const region = (raw.region ?? raw.market ?? "")?.toString().trim().toLowerCase();

  const sectorLookup = loadSectorProfile(sector, region);
  const sectorProfile = sectorLookup.profile;

  const customForbidden = toList(raw.voice_forbidden_words);
  const briefUrgency = raw.urgency_allowed === undefined || raw.urgency_allowed === ""
    ? undefined
    : toBool(raw.urgency_allowed, true);
  const briefEmojis = raw.emojis_allowed === undefined || raw.emojis_allowed === ""
    ? undefined
    : toBool(raw.emojis_allowed, true);

  const modeVoice: BrandLockVoice = {
    ...profile.voice,
    aggressiveness_level: "medium",
  };

  const voice = intersectVoice(
    modeVoice,
    sectorProfile.tone_constraints,
    sectorProfile.forbidden_words,
    customForbidden,
    briefUrgency,
    briefEmojis,
    sectorProfile.urgency_policy.allowed,
  );

  return {
    brand: {
      name: raw.brand_name?.trim() ?? "",
      sector,
      region: region || sectorProfile.region,
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
      background: raw.background_color?.trim() || undefined,
      raw: raw.colors?.trim() || undefined,
    },
    voice,
    mode,
    sector_profile: sectorProfile,
    sector_profile_matched: sectorLookup.matched,
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
  lines.push(`• Brand: ${lock.brand.name || "(non défini)"} | Sector: ${lock.brand.sector || "n/a"} | Region: ${lock.brand.region || "n/a"} | Tone: ${lock.brand.tone || "n/a"}`);
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
      lock.colors.background && `background ${lock.colors.background}`,
      lock.colors.raw,
    ].filter(Boolean);
    lines.push(`• Brand colors (SACRED): ${colorParts.join(" | ")}`);
  }

  // ── Sector Intelligence ──────────────────────────────────────────────────
  lines.push("");
  lines.push(sectorProfileToPromptBlock(lock.sector_profile));
  if (!lock.sector_profile_matched) {
    lines.push(`  ⚠ Aucun profil dédié pour ${lock.brand.sector || "?"} × ${lock.brand.region || "?"} — fallback générique.`);
  }

  lines.push("");
  lines.push(`═══ GROWTH MODE: ${profile.label.toUpperCase()} ═══`);
  lines.push(`${profile.description}`);
  lines.push(`• CTA style: ${profile.cta_style}`);
  lines.push(`• Urgency tolerance: ${profile.urgency_tolerance}`);
  lines.push(`• Max exclamation marks per output: ${lock.voice.max_exclamation_marks}`);
  lines.push(`• Emojis allowed: ${lock.voice.emojis_allowed ? "yes (sparingly)" : "no"}`);
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
  if (lock.sector_profile.mandatory_disclaimers.length) {
    lines.push("8. Append the mandatory disclaimers verbatim where appropriate (footer, legal section, ad disclaimers).");
  }

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
  parts.push(`Sector=${lock.sector_profile.id}`);
  parts.push(`Urgency=${lock.voice.urgency_allowed ? "ok" : "FORBIDDEN"}`);
  parts.push(`Emoji=${lock.voice.emojis_allowed ? "ok" : "no"}`);
  if (p.claims_forbidden.length) {
    parts.push(`ForbiddenClaims=[${p.claims_forbidden.slice(0, 6).join(" | ")}]`);
  }
  return `[BRAND LOCK] ${parts.join(" · ")}`;
}
