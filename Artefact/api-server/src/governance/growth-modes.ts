/**
 * GOVERNANCE — Growth Modes
 *
 * Trois modes encadrent la posture de la marque sur l'ensemble des modules :
 *
 *   • premium_brand    — par défaut. Storytelling, ingrédient, rituel, preuve
 *                        subtile. Aucun pattern d'urgence. Exclamations interdites.
 *   • balanced_growth  — équilibre. Urgence légère tolérée (offres réelles),
 *                        une exclamation max, ton mesuré.
 *   • aggressive_dtc   — DTC moderne. Urgence et social proof tolérés tant
 *                        qu'ils restent vrais et conformes (zéro dark pattern).
 *
 * Ces modes calibrent automatiquement la sévérité du Voice Enforcer et le ton
 * attendu dans les system prompts.
 */

import type { GrowthMode, BrandLockVoice } from "./types";

export interface GrowthModeProfile {
  mode: GrowthMode;
  label: string;
  description: string;
  voice: BrandLockVoice;
  cta_style: string;
  acquisition_ratio: number;
  urgency_tolerance: "none" | "low" | "high";
  kpi_thresholds: {
    min_roas: number;
    min_ltv_cac_ratio: number;
  };
}

const PROFILES: Record<GrowthMode, GrowthModeProfile> = {
  premium_brand: {
    mode: "premium_brand",
    label: "Premium Brand",
    description:
      "Storytelling raffiné, transparence ingrédient, rituel, preuve subtile. Zéro urgence, zéro dark pattern.",
    voice: {
      forbidden_words: [
        "buy now", "act fast", "limited stock", "guaranteed", "magic",
        "anti-aging", "stop aging", "hurry up", "don't miss", "last chance",
        "only X left", "selling fast", "clinically proven",
      ],
      urgency_allowed: false,
      max_exclamation_marks: 0,
      emojis_allowed: false,
    },
    cta_style: "Discover • Explore • Experience",
    acquisition_ratio: 0.5,
    urgency_tolerance: "none",
    kpi_thresholds: { min_roas: 2.5, min_ltv_cac_ratio: 3.0 },
  },
  balanced_growth: {
    mode: "balanced_growth",
    label: "Balanced Growth",
    description:
      "Équilibre conversion / image. Urgence basée sur des faits réels, social proof transparent.",
    voice: {
      forbidden_words: [
        "magic", "guaranteed results", "anti-aging", "stop aging",
        "clinically proven", "miracle", "secret formula",
      ],
      urgency_allowed: true,
      max_exclamation_marks: 1,
      emojis_allowed: false,
    },
    cta_style: "Shop the collection • Add to cart • Start your ritual",
    acquisition_ratio: 0.6,
    urgency_tolerance: "low",
    kpi_thresholds: { min_roas: 2.0, min_ltv_cac_ratio: 2.5 },
  },
  aggressive_dtc: {
    mode: "aggressive_dtc",
    label: "Aggressive DTC",
    description:
      "Posture DTC dynamique : urgence assumée, social proof, hooks forts. Dark patterns toujours interdits.",
    voice: {
      forbidden_words: [
        "magic", "miracle", "anti-aging", "stop aging",
        "clinically proven", "guaranteed results", "100% sure",
      ],
      urgency_allowed: true,
      max_exclamation_marks: 2,
      emojis_allowed: true,
    },
    cta_style: "Shop now • Claim your offer • Get yours today",
    acquisition_ratio: 0.7,
    urgency_tolerance: "high",
    kpi_thresholds: { min_roas: 1.8, min_ltv_cac_ratio: 2.0 },
  },
};

export function getGrowthProfile(mode: GrowthMode | string | undefined): GrowthModeProfile {
  if (!mode) return PROFILES.premium_brand;
  return PROFILES[mode as GrowthMode] ?? PROFILES.premium_brand;
}

export function listGrowthProfiles(): GrowthModeProfile[] {
  return [PROFILES.premium_brand, PROFILES.balanced_growth, PROFILES.aggressive_dtc];
}
