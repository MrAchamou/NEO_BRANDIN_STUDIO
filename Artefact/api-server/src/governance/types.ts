/**
 * GOVERNANCE — Types partagés
 *
 * Représentation centralisée du « Brand Lock » : contrat factuel et de
 * conformité que tous les modules doivent respecter. Une fois ce verrou
 * construit côté serveur, plus aucun module ne peut inventer de prix,
 * de claim, de certification ni de packaging.
 *
 * v2.1 — ajout de la couche Sector Intelligence : le lock embarque un
 * snapshot du profil sector×region (config-driven, JSON).
 */

import type { SectorProfile } from "./sector-engine";

export type GrowthMode = "premium_brand" | "balanced_growth" | "aggressive_dtc";

export interface BrandLockProduct {
  name?: string;
  size?: string;
  price?: number;
  old_price?: number;
  currency?: string;
  margin_percent?: number;
  packaging?: string;
  origin?: string;
  certifications: string[];
  claims_allowed: string[];
  claims_forbidden: string[];
}

export interface BrandLockColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  raw?: string;
}

export interface BrandLockVoice {
  forbidden_words: string[];
  urgency_allowed: boolean;
  max_exclamation_marks: number;
  emojis_allowed: boolean;
  /** Présent uniquement après build du BrandLock complet (sector-aware). */
  aggressiveness_level?: "low" | "medium" | "high";
}

export interface BrandLock {
  brand: {
    name: string;
    sector: string;
    region: string;
    tone: string;
    values: string[];
  };
  product: BrandLockProduct;
  colors: BrandLockColors;
  voice: BrandLockVoice;
  mode: GrowthMode;
  /** Snapshot du profil sectoriel résolu (sector×region) — verrouillé au build du lock. */
  sector_profile: SectorProfile;
  /** True si le profil a matché un fichier dédié (false = fallback générique). */
  sector_profile_matched: boolean;
}

export type GovernanceSeverity = "info" | "warning" | "critical";

export type GovernanceCategory =
  | "compliance.claim_forbidden"
  | "compliance.medical_vocab"
  | "compliance.health_claim"
  | "compliance.financial_promise"
  | "compliance.fake_stat"
  | "compliance.fake_urgency"
  | "compliance.fake_certification"
  | "compliance.temporal_guarantee"
  | "compliance.efsa_violation"
  | "compliance.sector_forbidden_word"
  | "voice.forbidden_word"
  | "voice.exclamation_overload"
  | "voice.emoji_used"
  | "voice.urgency_blocked"
  | "voice.aggressiveness_too_high"
  | "facts.price_mismatch"
  | "facts.invented_certification"
  | "facts.invented_packaging"
  | "facts.fabricated_number"
  | "wcag.contrast_low"
  | "wcag.invalid_color"
  | "sector.profile_missing"
  | "sector.disclaimer_missing";

export interface GovernanceFinding {
  severity: GovernanceSeverity;
  category: GovernanceCategory;
  match: string;
  replacement?: string;
  hint?: string;
}

export interface GovernanceReport {
  pass: boolean;
  mode: GrowthMode;
  sector_profile_id: string;
  sector_profile_matched: boolean;
  findings: GovernanceFinding[];
  rewrites: number;
  blocked: boolean;
}

export interface GovernanceResult {
  content: string;
  report: GovernanceReport;
}
