/**
 * GOVERNANCE — Sector Intelligence Engine
 *
 * Charge dynamiquement un profil sectoriel × régional pour adapter :
 *   • la liste des claim packs activés (compliance-agent)
 *   • le ton, les emojis, les exclamations (voice-enforcer)
 *   • la validation WCAG des palettes (wcag-validator)
 *   • les disclaimers obligatoires injectés dans le brand lock
 *
 * Architecture purement config-driven : ajouter un secteur = ajouter un fichier
 * JSON dans `../config/sectors/`. Aucune modification du moteur central requise.
 */

import cosmeticsEU from "../config/sectors/cosmetics_eu.json" with { type: "json" };
import fashion from "../config/sectors/fashion.json" with { type: "json" };
import financeEU from "../config/sectors/finance_eu.json" with { type: "json" };
import foodEU from "../config/sectors/food_eu.json" with { type: "json" };
import saas from "../config/sectors/saas.json" with { type: "json" };

export type AggressivenessLevel = "low" | "medium" | "high";

export type ClaimPack =
  | "cosmetic_eu_physiological"
  | "medical_vocab"
  | "health_claims"
  | "financial_guarantees"
  | "food_eu_efsa"
  | "fake_certifications"
  | "fake_stats"
  | "hyperbolic"
  | "temporal_guarantees"
  | "urgency_dark_patterns";

export interface SectorProfile {
  id: string;
  sector: string;
  region: string;
  label: string;
  regulation: string;
  medical_claims_allowed: boolean;
  financial_promises_allowed: boolean;
  health_claims_allowed: boolean;
  urgency_policy: {
    allowed: boolean;
    requires_real_inventory: boolean;
  };
  forbidden_words: string[];
  tone_constraints: {
    aggressiveness_level: AggressivenessLevel;
    emojis_allowed: boolean;
    exclamation_limit: number;
  };
  requires_wcag_validation: boolean;
  requires_price_lock: boolean;
  requires_claim_validation: boolean;
  claim_packs: ClaimPack[];
  mandatory_disclaimers: string[];
  notes?: string;
}

// ─── Registry ────────────────────────────────────────────────────────────────

const PROFILES: Record<string, SectorProfile> = {
  cosmetics_eu: cosmeticsEU as SectorProfile,
  fashion: fashion as SectorProfile,
  fashion_global: fashion as SectorProfile,
  finance_eu: financeEU as SectorProfile,
  food_eu: foodEU as SectorProfile,
  saas: saas as SectorProfile,
  saas_global: saas as SectorProfile,
};

// Aliases utiles : permet de matcher "cosmetique" / "beauté" sur cosmetics_eu, etc.
const SECTOR_ALIASES: Record<string, string> = {
  cosmétique: "cosmetics",
  cosmetique: "cosmetics",
  cosmetic: "cosmetics",
  skincare: "cosmetics",
  beauté: "cosmetics",
  beaute: "cosmetics",
  beauty: "cosmetics",
  mode: "fashion",
  fashion: "fashion",
  apparel: "fashion",
  luxe: "fashion",
  luxury: "fashion",
  finance: "finance",
  banking: "finance",
  banque: "finance",
  insurance: "finance",
  assurance: "finance",
  fintech: "finance",
  food: "food",
  alimentaire: "food",
  nutrition: "food",
  supplements: "food",
  compléments: "food",
  complements: "food",
  saas: "saas",
  software: "saas",
  tech: "saas",
  b2b: "saas",
};

const REGION_ALIASES: Record<string, string> = {
  eu: "eu",
  europe: "eu",
  european: "eu",
  france: "eu",
  fr: "eu",
  ue: "eu",
  global: "global",
  international: "global",
  monde: "global",
  world: "global",
  na: "global",
  us: "global",
  usa: "global",
  apac: "global",
  asia: "global",
};

function normalizeSector(input: string | undefined): string {
  if (!input) return "";
  const key = input.trim().toLowerCase();
  return SECTOR_ALIASES[key] ?? key;
}

function normalizeRegion(input: string | undefined): string {
  if (!input) return "";
  const key = input.trim().toLowerCase();
  return REGION_ALIASES[key] ?? key;
}

/**
 * Profil neutre utilisé en fallback si aucun match. Permissif côté tone mais
 * conserve les protections universelles (fake stats, hyperbolic, fake certs).
 */
const DEFAULT_PROFILE: SectorProfile = {
  id: "default",
  sector: "generic",
  region: "global",
  label: "Profil générique (fallback)",
  regulation: "Bonnes pratiques marketing universelles",
  medical_claims_allowed: false,
  financial_promises_allowed: false,
  health_claims_allowed: false,
  urgency_policy: { allowed: true, requires_real_inventory: true },
  forbidden_words: [],
  tone_constraints: {
    aggressiveness_level: "medium",
    emojis_allowed: true,
    exclamation_limit: 1,
  },
  requires_wcag_validation: false,
  requires_price_lock: true,
  requires_claim_validation: true,
  claim_packs: ["fake_stats", "hyperbolic", "fake_certifications"],
  mandatory_disclaimers: [],
  notes: "Aucun profil sector×region trouvé — fallback générique appliqué.",
};

export interface SectorLookup {
  profile: SectorProfile;
  matched: boolean;
  resolvedKey: string;
}

/**
 * Charge le profil correspondant à `sector × region`. Cascade de fallback :
 *   1. {sector}_{region}        (ex. cosmetics_eu)
 *   2. {sector}                 (ex. fashion)
 *   3. {sector}_global          (ex. saas_global)
 *   4. DEFAULT_PROFILE
 */
export function loadSectorProfile(
  sector: string | undefined,
  region: string | undefined,
): SectorLookup {
  const s = normalizeSector(sector);
  const r = normalizeRegion(region);

  if (s) {
    const candidates = [
      r ? `${s}_${r}` : null,
      s,
      `${s}_global`,
    ].filter(Boolean) as string[];

    for (const key of candidates) {
      const profile = PROFILES[key];
      if (profile) {
        return { profile, matched: true, resolvedKey: key };
      }
    }
  }

  return { profile: DEFAULT_PROFILE, matched: false, resolvedKey: "default" };
}

/** Liste tous les profils chargés (UI / debug). */
export function listSectorProfiles(): SectorProfile[] {
  const seen = new Set<string>();
  const out: SectorProfile[] = [];
  for (const profile of Object.values(PROFILES)) {
    if (seen.has(profile.id)) continue;
    seen.add(profile.id);
    out.push(profile);
  }
  return out;
}

/** Sérialise un profil sectoriel sous forme de bloc texte injectable en system prompt. */
export function sectorProfileToPromptBlock(profile: SectorProfile): string {
  const lines: string[] = [];
  lines.push("═══ SECTOR INTELLIGENCE LAYER ═══");
  lines.push(`• Profil : ${profile.label} (${profile.id})`);
  lines.push(`• Régulation de référence : ${profile.regulation}`);
  lines.push(`• Claims médicaux : ${profile.medical_claims_allowed ? "autorisés" : "INTERDITS"}`);
  lines.push(`• Claims santé : ${profile.health_claims_allowed ? "autorisés" : "INTERDITS"}`);
  lines.push(`• Promesses financières : ${profile.financial_promises_allowed ? "autorisées" : "INTERDITES"}`);
  lines.push(`• Urgence commerciale : ${profile.urgency_policy.allowed ? "tolérée (stock réel obligatoire)" : "INTERDITE"}`);
  lines.push(`• Ton : ${profile.tone_constraints.aggressiveness_level} | emojis ${profile.tone_constraints.emojis_allowed ? "OK" : "non"} | max ${profile.tone_constraints.exclamation_limit} "!"`);
  if (profile.forbidden_words.length) {
    lines.push(`• Mots interdits sectoriels : ${profile.forbidden_words.slice(0, 12).join(", ")}`);
  }
  if (profile.requires_wcag_validation) {
    lines.push(`• WCAG AA exigé : tout choix de couleur doit passer un contraste 4.5:1 minimum.`);
  }
  if (profile.mandatory_disclaimers.length) {
    lines.push(`• Disclaimers obligatoires :`);
    profile.mandatory_disclaimers.forEach((d) => lines.push(`    – ${d}`));
  }
  return lines.join("\n");
}
