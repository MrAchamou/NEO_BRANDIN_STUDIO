/**
 * BRAND MEMORY ENGINE — Strategic Drift Detector (Agency Mode)
 *
 * Détecte la dérive stratégique d'une marque en analysant les patterns
 * d'overrides, rejections, corrections et changements de mode sur la timeline.
 */

import { getMemoryEntries } from "./memory-store";
import { getDecisions } from "./decision-history";

export interface DriftSignal {
  dimension: string;
  count: number;
  threshold: number;
  severity: "low" | "medium" | "high";
  detail: string;
}

export interface DriftReport {
  brand_id: string;
  generated_at: string;
  drift_detected: boolean;
  drift_score: number;
  signals: DriftSignal[];
  overall_severity: "none" | "low" | "medium" | "high" | "critical";
  recommendation: string;
  recalibrate_positioning: boolean;
}

const THRESHOLDS = {
  tone_overrides: 10,
  claim_rejections: 5,
  positioning_corrections: 3,
  growth_mode_switches: 3,
  high_impact_corrections: 4,
};

/**
 * Analyse la mémoire d'une marque et détecte les signaux de dérive stratégique.
 */
export function detectBrandDrift(brand_id: string): DriftReport {
  const entries = getMemoryEntries(brand_id);
  const decisions = getDecisions(brand_id, undefined, 100);

  const signals: DriftSignal[] = [];

  // ── Signal 1 : Overrides de ton ──────────────────────────────────────────
  const tone_overrides = entries.filter(
    (e) => e.type === "override" && (e.metadata?.rule_category === "tone" || e.context?.includes("ton")),
  ).length;

  if (tone_overrides > 0) {
    signals.push({
      dimension: "tone_overrides",
      count: tone_overrides,
      threshold: THRESHOLDS.tone_overrides,
      severity: tone_overrides >= THRESHOLDS.tone_overrides ? "high" : tone_overrides >= 5 ? "medium" : "low",
      detail: `${tone_overrides} override(s) de ton détecté(s)`,
    });
  }

  // ── Signal 2 : Rejections de claims ──────────────────────────────────────
  const claim_rejections = entries.filter(
    (e) => e.type === "rejection",
  ).length;

  if (claim_rejections > 0) {
    signals.push({
      dimension: "claim_rejections",
      count: claim_rejections,
      threshold: THRESHOLDS.claim_rejections,
      severity: claim_rejections >= THRESHOLDS.claim_rejections ? "high" : claim_rejections >= 3 ? "medium" : "low",
      detail: `${claim_rejections} claim(s) rejeté(s)`,
    });
  }

  // ── Signal 3 : Corrections de positionnement ─────────────────────────────
  const positioning_corrections = entries.filter(
    (e) =>
      e.type === "correction" &&
      (e.module === "positioning" || e.context?.includes("position") || e.section_key?.includes("territory")),
  ).length;

  if (positioning_corrections > 0) {
    signals.push({
      dimension: "positioning_corrections",
      count: positioning_corrections,
      threshold: THRESHOLDS.positioning_corrections,
      severity:
        positioning_corrections >= THRESHOLDS.positioning_corrections
          ? "high"
          : positioning_corrections >= 2
            ? "medium"
            : "low",
      detail: `${positioning_corrections} correction(s) de positionnement`,
    });
  }

  // ── Signal 4 : Changements de growth mode ────────────────────────────────
  const growth_switches = decisions.filter((d) => d.category === "growth_mode").length;

  if (growth_switches > 0) {
    signals.push({
      dimension: "growth_mode_switches",
      count: growth_switches,
      threshold: THRESHOLDS.growth_mode_switches,
      severity:
        growth_switches >= THRESHOLDS.growth_mode_switches ? "high" : growth_switches >= 2 ? "medium" : "low",
      detail: `${growth_switches} changement(s) de growth mode`,
    });
  }

  // ── Signal 5 : Corrections high-impact ───────────────────────────────────
  const high_impact = entries.filter((e) => e.type === "correction" && e.impact_level === "high").length;

  if (high_impact > 0) {
    signals.push({
      dimension: "high_impact_corrections",
      count: high_impact,
      threshold: THRESHOLDS.high_impact_corrections,
      severity: high_impact >= THRESHOLDS.high_impact_corrections ? "high" : high_impact >= 2 ? "medium" : "low",
      detail: `${high_impact} correction(s) à impact élevé`,
    });
  }

  // ── Calcul du drift score ─────────────────────────────────────────────────
  const drift_score = signals.reduce((acc, s) => {
    const ratio = Math.min(s.count / s.threshold, 1);
    const weight = s.severity === "high" ? 3 : s.severity === "medium" ? 2 : 1;
    return acc + ratio * weight;
  }, 0);

  const normalized_score = Math.min(Math.round((drift_score / (signals.length * 3 || 1)) * 100), 100);

  const drift_detected =
    signals.some((s) => s.count >= s.threshold) || drift_score >= 2;

  const overall_severity: DriftReport["overall_severity"] = drift_detected
    ? normalized_score >= 80
      ? "critical"
      : normalized_score >= 60
        ? "high"
        : normalized_score >= 40
          ? "medium"
          : "low"
    : signals.length > 0
      ? "low"
      : "none";

  const recalibrate_positioning =
    positioning_corrections >= THRESHOLDS.positioning_corrections ||
    overall_severity === "critical" ||
    overall_severity === "high";

  const recommendation = buildRecommendation(overall_severity, signals, recalibrate_positioning);

  return {
    brand_id,
    generated_at: new Date().toISOString(),
    drift_detected,
    drift_score: normalized_score,
    signals,
    overall_severity,
    recommendation,
    recalibrate_positioning,
  };
}

function buildRecommendation(
  severity: DriftReport["overall_severity"],
  signals: DriftSignal[],
  recalibrate: boolean,
): string {
  if (severity === "none") return "Marque stable — aucune dérive détectée.";

  const parts: string[] = [];

  if (recalibrate) parts.push("Recalibrer le Positioning Lock est fortement conseillé.");

  const top = signals.filter((s) => s.severity === "high").map((s) => s.dimension);
  if (top.length > 0) {
    parts.push(`Dimensions critiques : ${top.join(", ")}.`);
  }

  if (severity === "critical") {
    parts.push("Audit stratégique complet recommandé avant la prochaine génération.");
  } else if (severity === "high") {
    parts.push("Révision du brief client recommandée.");
  } else if (severity === "medium") {
    parts.push("Surveiller l'évolution — revisiter dans 2 semaines.");
  } else {
    parts.push("Drift léger — continuer la surveillance.");
  }

  return parts.join(" ");
}
