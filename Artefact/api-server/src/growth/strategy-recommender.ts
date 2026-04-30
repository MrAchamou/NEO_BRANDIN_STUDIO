/**
 * GROWTH DECISION BRAIN — Recommandateur stratégique
 *
 * Agrège LTV, cohortes, saisonnalité et fatigue créative pour produire
 * une recommandation de scaling contextuelle et un résumé stratégique hebdo.
 * Remplace les règles ROAS statiques par de la logique multi-facteur.
 */

import { type LtvAnalysis } from "./ltv-engine";
import { type SeasonalContext } from "./seasonality-model";
import { type CreativeFatigueReport } from "./creative-fatigue-detector";

export interface StrategyInput {
  ltv_analysis: LtvAnalysis;
  seasonal_context: SeasonalContext;
  fatigue_report: CreativeFatigueReport;
  current_margin_stable: boolean;
  weeks_running: number;
}

export interface ScalingDecision {
  action: "pause" | "hold" | "scale_gradual" | "scale_aggressive";
  scale_percent: number | null;
  rationale: string[];
  risk_factors: string[];
}

export interface WeeklyStrategicSummary {
  generated_at: string;
  strategic_outlook: "bearish" | "neutral" | "bullish" | "very_bullish";
  scaling_opportunities: string[];
  risk_factors: string[];
  creative_signals: string[];
  profit_sustainability: "unsustainable" | "marginal" | "sustainable" | "excellent";
  recommended_action: ScalingDecision;
}

/**
 * Décision de scaling contextuelle multi-facteur.
 * Remplace le seuil statique ROAS > 3.5 → scale 30%.
 */
export function makeScalingDecision(input: StrategyInput): ScalingDecision {
  const { ltv_analysis, seasonal_context, fatigue_report, current_margin_stable } = input;

  const rationale: string[] = [];
  const risk_factors: string[] = [];

  // ── Conditions de scaling ──────────────────────────────────────────────────
  const good_ltv = ltv_analysis.ltv_cac_ratio >= 3;
  const no_fatigue = !fatigue_report.creative_fatigue;
  const positive_seasonality = seasonal_context.seasonality_score >= 1.0;
  const margin_ok = current_margin_stable;

  if (good_ltv) rationale.push(`LTV/CAC favorable : ${ltv_analysis.ltv_cac_ratio}x ≥ 3`);
  else risk_factors.push(`LTV/CAC insuffisant : ${ltv_analysis.ltv_cac_ratio}x < 3`);

  if (no_fatigue) rationale.push("Aucune fatigue créative détectée");
  else risk_factors.push(`Fatigue créative active (score: ${fatigue_report.fatigue_score}/10)`);

  if (positive_seasonality)
    rationale.push(`Saisonnalité positive : score ${seasonal_context.seasonality_score}x`);
  else risk_factors.push(`Saisonnalité défavorable : ${seasonal_context.seasonality_index}`);

  if (margin_ok) rationale.push("Marge stable");
  else risk_factors.push("Marge instable — risque de compression");

  const conditions_met = [good_ltv, no_fatigue, positive_seasonality, margin_ok].filter(Boolean).length;

  // ── Décision ────────────────────────────────────────────────────────────────
  let action: ScalingDecision["action"];
  let scale_percent: number | null;

  if (conditions_met === 4) {
    action = "scale_aggressive";
    // Scaling ajusté par la saisonnalité : entre 15 et 30%
    scale_percent = Math.round(15 + (seasonal_context.seasonality_score - 1) * 30);
    scale_percent = Math.min(Math.max(scale_percent, 15), 35);
  } else if (conditions_met >= 3) {
    action = "scale_gradual";
    scale_percent = Math.round(10 + (seasonal_context.seasonality_score - 0.9) * 15);
    scale_percent = Math.min(Math.max(scale_percent, 10), 20);
  } else if (conditions_met >= 2 && good_ltv) {
    action = "hold";
    scale_percent = null;
    rationale.push("Attendre résolution des risques avant scaling");
  } else {
    action = "pause";
    scale_percent = null;
    rationale.push("Trop de facteurs défavorables — pause recommandée");
  }

  return { action, scale_percent, rationale, risk_factors };
}

/**
 * Génère le résumé stratégique hebdomadaire complet.
 */
export function generateWeeklyStrategicSummary(input: StrategyInput): WeeklyStrategicSummary {
  const decision = makeScalingDecision(input);
  const { ltv_analysis, seasonal_context, fatigue_report } = input;

  const scaling_opportunities: string[] = [];
  const risk_factors: string[] = [...decision.risk_factors];
  const creative_signals: string[] = fatigue_report.recommended_actions;

  if (decision.action === "scale_aggressive" || decision.action === "scale_gradual") {
    scaling_opportunities.push(
      `Scaling +${decision.scale_percent}% recommandé — ${decision.rationale.join(" | ")}`,
    );
  }
  if (seasonal_context.key_events.length > 0) {
    scaling_opportunities.push(`Évènements clés : ${seasonal_context.key_events.join(", ")}`);
  }

  const profit_sustainability: WeeklyStrategicSummary["profit_sustainability"] =
    ltv_analysis.profitability_score === "excellent"
      ? "excellent"
      : ltv_analysis.profitability_score === "healthy"
        ? "sustainable"
        : ltv_analysis.profitability_score === "marginal"
          ? "marginal"
          : "unsustainable";

  const strategic_outlook: WeeklyStrategicSummary["strategic_outlook"] =
    decision.action === "scale_aggressive"
      ? "very_bullish"
      : decision.action === "scale_gradual"
        ? "bullish"
        : decision.action === "hold"
          ? "neutral"
          : "bearish";

  return {
    generated_at: new Date().toISOString(),
    strategic_outlook,
    scaling_opportunities,
    risk_factors,
    creative_signals,
    profit_sustainability,
    recommended_action: decision,
  };
}

/**
 * Sérialise le résumé stratégique pour injection en system prompt.
 */
export function weeklySummaryToPromptBlock(summary: WeeklyStrategicSummary): string {
  const lines = ["═══ GROWTH DECISION BRAIN ═══"];
  lines.push(`• Outlook stratégique : ${summary.strategic_outlook}`);
  lines.push(`• Durabilité profit : ${summary.profit_sustainability}`);
  lines.push(`• Action recommandée : ${summary.recommended_action.action}${summary.recommended_action.scale_percent ? ` (+${summary.recommended_action.scale_percent}%)` : ""}`);
  if (summary.scaling_opportunities.length > 0) {
    lines.push(`• Opportunités : ${summary.scaling_opportunities.join(" | ")}`);
  }
  if (summary.risk_factors.length > 0) {
    lines.push(`• Risques : ${summary.risk_factors.join(" | ")}`);
  }
  return lines.join("\n");
}
