/**
 * GROWTH DECISION BRAIN — Risk Meter System (Agency Mode)
 *
 * Calcule les 4 indices de risque / santé pour une marque :
 * - Scaling Risk Index
 * - Creative Fatigue Score (0–100)
 * - Profit Stability Index (0–100)
 * - Retention Health Score (0–100)
 */

import { type LtvAnalysis } from "./ltv-engine";
import { type CohortAnalysis as CohortAnalysisResult } from "./cohort-analysis";
import { type CreativeFatigueReport } from "./creative-fatigue-detector";

export interface RiskMeterInput {
  ltv_analysis: LtvAnalysis;
  cohort_analysis: CohortAnalysisResult;
  fatigue_report: CreativeFatigueReport;
  weeks_running?: number;
}

export interface RiskMeterResult {
  scaling_risk_index: "Low" | "Medium" | "High";
  creative_fatigue_score: number;
  profit_stability_index: number;
  retention_health_score: number;
  composite_risk_score: number;
  agency_summary: {
    headline: string;
    bullets: string[];
    action_urgency: "none" | "watch" | "act" | "urgent";
  };
}

/**
 * Calcule tous les indices de risque pour un rapport agence.
 */
export function computeRiskMeter(input: RiskMeterInput): RiskMeterResult {
  const { ltv_analysis, cohort_analysis, fatigue_report, weeks_running = 4 } = input;

  // ── Creative Fatigue Score (0–100) ────────────────────────────────────────
  const creative_fatigue_score = Math.min(
    Math.round(fatigue_report.fatigue_score * 10),
    100,
  );

  // ── Profit Stability Index (0–100) ────────────────────────────────────────
  const ltv_ratio = Math.min(ltv_analysis.ltv_cac_ratio / 5, 1);
  const profitability_score =
    ltv_analysis.profitability_score === "excellent"
      ? 1
      : ltv_analysis.profitability_score === "healthy"
        ? 0.75
        : ltv_analysis.profitability_score === "marginal"
          ? 0.45
          : 0.2;

  const profit_stability_index = Math.round((ltv_ratio * 0.5 + profitability_score * 0.5) * 100);

  // ── Retention Health Score (0–100) — retention_m1/m3 sont des ratios 0–1 ──
  const m1_score = (cohort_analysis.retention_m1 ?? 0) * 0.5;
  const m3_score = (cohort_analysis.retention_m3 ?? 0) * 0.5;
  const retention_health_score = Math.round((m1_score + m3_score) * 100);

  // ── Scaling Risk Index ────────────────────────────────────────────────────
  const risk_inputs = [
    creative_fatigue_score > 60 ? 1 : 0,
    profit_stability_index < 40 ? 1 : 0,
    retention_health_score < 30 ? 1 : 0,
    ltv_analysis.ltv_cac_ratio < 2 ? 1 : 0,
  ];

  const risk_count = risk_inputs.reduce((a, b) => a + b, 0);
  const scaling_risk_index: RiskMeterResult["scaling_risk_index"] =
    risk_count >= 3 ? "High" : risk_count >= 2 ? "Medium" : "Low";

  // ── Composite Risk Score ─────────────────────────────────────────────────
  const composite_risk_score = Math.round(
    (creative_fatigue_score * 0.3 +
      (100 - profit_stability_index) * 0.35 +
      (100 - retention_health_score) * 0.35) /
      1,
  );

  // ── Agency Summary ────────────────────────────────────────────────────────
  const bullets: string[] = [];
  let action_urgency: RiskMeterResult["agency_summary"]["action_urgency"] = "none";

  if (creative_fatigue_score > 70) {
    bullets.push(`Fatigue créative élevée (${creative_fatigue_score}/100) — rafraîchissement créatif urgent`);
    action_urgency = "urgent";
  } else if (creative_fatigue_score > 40) {
    bullets.push(`Fatigue créative modérée (${creative_fatigue_score}/100) — surveiller`);
    if (action_urgency === "none") action_urgency = "watch";
  }

  if (profit_stability_index < 40) {
    bullets.push(`Stabilité profit faible (${profit_stability_index}/100) — réviser le modèle économique`);
    action_urgency = "urgent";
  } else if (profit_stability_index < 65) {
    bullets.push(`Marge sous tension (${profit_stability_index}/100) — surveiller les coûts`);
    if (action_urgency === "none") action_urgency = "watch";
  } else {
    bullets.push(`Stabilité profit satisfaisante (${profit_stability_index}/100)`);
  }

  if (retention_health_score < 30) {
    bullets.push(`Rétention critique (${retention_health_score}/100) — problème produit probable`);
    if (action_urgency !== "urgent") action_urgency = "act";
  } else if (retention_health_score < 55) {
    bullets.push(`Rétention perfectible (${retention_health_score}/100) — programme fidélisation conseillé`);
    if (action_urgency === "none") action_urgency = "watch";
  } else {
    bullets.push(`Rétention saine (${retention_health_score}/100)`);
  }

  const headline =
    scaling_risk_index === "High"
      ? "⚠️ Risque de scaling élevé — action immédiate recommandée"
      : scaling_risk_index === "Medium"
        ? "📊 Risque modéré — surveiller les indicateurs clés"
        : "✅ Conditions favorables au scaling";

  return {
    scaling_risk_index,
    creative_fatigue_score,
    profit_stability_index,
    retention_health_score,
    composite_risk_score,
    agency_summary: { headline, bullets, action_urgency },
  };
}
