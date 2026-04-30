/**
 * BRAND MEMORY ENGINE — Constructeur de profil mémoire dynamique
 *
 * Agrège les données de correction-log et decision-history pour construire
 * un profil mémoire évolutif. Ce profil est ensuite injecté dans le pipeline
 * de génération pour adapter les outputs futurs.
 */

import { getMemoryEntries, getMemoryStats } from "./memory-store";
import { summarizeCorrectionPatterns } from "./correction-log";
import { summarizeDecisionHistory } from "./decision-history";

export type ToneIntensityPreference = "minimal" | "low" | "medium" | "high" | "very_high";
export type CreativeComplexity = "minimal" | "moderate" | "rich" | "experimental";
export type GrowthRiskAppetite = "conservative" | "balanced" | "aggressive";
export type DesignStrictness = "low" | "medium" | "high";

export interface BrandMemoryProfile {
  brand_id: string;
  generated_at: string;
  tone_intensity_preference: ToneIntensityPreference;
  urgency_tolerance: boolean;
  creative_complexity: CreativeComplexity;
  growth_risk_appetite: GrowthRiskAppetite;
  design_strictness: DesignStrictness;
  preferred_modules: string[];
  rejected_patterns: string[];
  approval_rate: number;
  total_interactions: number;
  memory_confidence: "low" | "medium" | "high";
}

const profileCache = new Map<string, { profile: BrandMemoryProfile; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Construit ou récupère le profil mémoire d'une marque.
 * Recalculé périodiquement selon TTL.
 */
export function getMemoryProfile(brand_id: string): BrandMemoryProfile {
  const cached = profileCache.get(brand_id);
  if (cached && cached.expires > Date.now()) return cached.profile;

  const profile = buildMemoryProfile(brand_id);
  profileCache.set(brand_id, { profile, expires: Date.now() + CACHE_TTL_MS });
  return profile;
}

/**
 * Force le recalcul du profil mémoire (après une correction significative).
 */
export function invalidateMemoryProfile(brand_id: string): void {
  profileCache.delete(brand_id);
}

function buildMemoryProfile(brand_id: string): BrandMemoryProfile {
  const stats = getMemoryStats(brand_id);
  const correctionSummary = summarizeCorrectionPatterns(brand_id);
  const decisionSummary = summarizeDecisionHistory(brand_id);

  const total_interactions =
    stats.correction + stats.approval + stats.rejection + stats.override;

  const approval_rate =
    total_interactions > 0 ? stats.approval / total_interactions : 0.5;

  const rejection_rate = correctionSummary.rejection_rate;

  // ── Tone intensity : déduit du taux de corrections et du mode de croissance
  const growth_trajectory = decisionSummary.growth_mode_trajectory;
  const last_growth_mode = growth_trajectory[growth_trajectory.length - 1] ?? "premium_brand";

  const tone_intensity = inferToneIntensity(
    last_growth_mode,
    stats.correction,
    rejection_rate,
  );

  // ── Urgency tolerance : false si rejections élevées ou mode premium
  const urgency_tolerance =
    rejection_rate < 0.3 && last_growth_mode !== "premium_brand";

  // ── Creative complexity : déduite du nombre de corrections élevé impact
  const creative_complexity = inferCreativeComplexity(correctionSummary.high_impact_count);

  // ── Growth risk appetite : déduit du mode de croissance et des overrides
  const growth_risk_appetite = inferGrowthRisk(last_growth_mode, stats.override);

  // ── Design strictness : haute si beaucoup de corrections
  const design_strictness = inferDesignStrictness(correctionSummary.total_corrections);

  // ── Modules préférés : ceux avec le meilleur taux d'approbation
  const approved_entries = getMemoryEntries(brand_id, { type: "approval" });
  const preferred_modules = [
    ...new Set(approved_entries.slice(-20).map((e) => e.module)),
  ].slice(0, 5);

  // ── Patterns rejetés : extraire depuis les rejections
  const rejected_entries = getMemoryEntries(brand_id, { type: "rejection" });
  const rejected_patterns = rejected_entries
    .slice(-10)
    .map((e) => e.context)
    .filter(Boolean)
    .slice(0, 5);

  // ── Confiance mémoire : basée sur le volume d'interactions
  const memory_confidence =
    total_interactions > 50 ? "high" : total_interactions > 10 ? "medium" : "low";

  return {
    brand_id,
    generated_at: new Date().toISOString(),
    tone_intensity_preference: tone_intensity,
    urgency_tolerance,
    creative_complexity,
    growth_risk_appetite,
    design_strictness,
    preferred_modules,
    rejected_patterns,
    approval_rate,
    total_interactions,
    memory_confidence,
  };
}

function inferToneIntensity(
  growth_mode: string,
  corrections: number,
  rejection_rate: number,
): ToneIntensityPreference {
  if (growth_mode === "aggressive_dtc") return rejection_rate > 0.4 ? "medium" : "high";
  if (growth_mode === "premium_brand") return corrections > 10 ? "minimal" : "low";
  if (rejection_rate > 0.5) return "low";
  return "medium";
}

function inferCreativeComplexity(high_impact_corrections: number): CreativeComplexity {
  if (high_impact_corrections > 10) return "minimal";
  if (high_impact_corrections > 5) return "moderate";
  if (high_impact_corrections > 2) return "rich";
  return "experimental";
}

function inferGrowthRisk(growth_mode: string, overrides: number): GrowthRiskAppetite {
  if (growth_mode === "aggressive_dtc" || overrides > 5) return "aggressive";
  if (growth_mode === "premium_brand" && overrides < 2) return "conservative";
  return "balanced";
}

function inferDesignStrictness(total_corrections: number): DesignStrictness {
  if (total_corrections > 20) return "high";
  if (total_corrections > 5) return "medium";
  return "low";
}

/**
 * Sérialise le profil mémoire en bloc injectable dans un system prompt.
 */
export function memoryProfileToPromptBlock(profile: BrandMemoryProfile): string {
  if (profile.memory_confidence === "low") return "";

  const lines: string[] = ["═══ BRAND MEMORY LAYER ═══"];
  lines.push(
    `• Tone intensity préférée : ${profile.tone_intensity_preference} (confiance: ${profile.memory_confidence})`,
  );
  lines.push(`• Tolérance urgence : ${profile.urgency_tolerance ? "oui" : "non"}`);
  lines.push(`• Complexité créative : ${profile.creative_complexity}`);
  lines.push(`• Appétit pour le risque : ${profile.growth_risk_appetite}`);
  lines.push(`• Rigueur design : ${profile.design_strictness}`);
  lines.push(`• Taux d'approbation historique : ${Math.round(profile.approval_rate * 100)}%`);

  if (profile.preferred_modules.length > 0) {
    lines.push(`• Modules préférés : ${profile.preferred_modules.join(", ")}`);
  }
  if (profile.rejected_patterns.length > 0) {
    lines.push(`• Patterns à éviter : ${profile.rejected_patterns.slice(0, 3).join(" | ")}`);
  }

  return lines.join("\n");
}
