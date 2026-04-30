/**
 * GROWTH DECISION BRAIN — Scenario Simulator (Agency Mode)
 *
 * Simule l'impact projeté de décisions budgétaires ou créatives sur :
 * - ROAS projeté
 * - CPA projeté
 * - Impact LTV
 * - Ajustement de risque
 */

import { type LtvAnalysis } from "./ltv-engine";
import { type CreativeFatigueReport } from "./creative-fatigue-detector";
import { type SeasonalContext } from "./seasonality-model";

export interface SimulationInput {
  ltv_analysis: LtvAnalysis;
  fatigue_report: CreativeFatigueReport;
  seasonal_context: SeasonalContext;
  current_roas: number;
  current_cpa: number;
  current_budget: number;
}

export interface SimulationResult {
  scenario: string;
  change_description: string;
  projected_roas: number;
  projected_cpa: number;
  projected_ltv_impact_pct: number;
  risk_adjustment: "lower" | "neutral" | "higher";
  confidence: "low" | "medium" | "high";
  rationale: string;
}

/**
 * Simule une augmentation de budget de X%.
 */
export function simulateBudgetChange(
  input: SimulationInput,
  change_pct: number,
): SimulationResult {
  const { ltv_analysis, fatigue_report, seasonal_context, current_roas, current_cpa } = input;

  const fatigue_penalty = fatigue_report.creative_fatigue ? 0.85 : 1.0;
  const season_multiplier = Math.max(0.85, Math.min(seasonal_context.seasonality_score, 1.2));

  const scaling_efficiency = change_pct > 0
    ? Math.max(0.7, 1 - (change_pct / 200))
    : 1.1;

  const projected_roas = Math.round(current_roas * fatigue_penalty * season_multiplier * scaling_efficiency * 100) / 100;
  const projected_cpa = Math.round((current_cpa / (projected_roas / current_roas)) * 100) / 100;
  const projected_ltv_impact_pct = change_pct > 0
    ? Math.round((ltv_analysis.ltv_cac_ratio >= 3 ? 8 : 3) * season_multiplier)
    : -5;

  const risk_adjustment: SimulationResult["risk_adjustment"] =
    change_pct > 30 && fatigue_report.creative_fatigue
      ? "higher"
      : change_pct < 0
        ? "lower"
        : "neutral";

  const confidence: SimulationResult["confidence"] =
    ltv_analysis.profitability_score === "excellent"
      ? "high"
      : ltv_analysis.profitability_score === "healthy"
        ? "medium"
        : "low";

  const direction = change_pct >= 0 ? `+${change_pct}%` : `${change_pct}%`;

  return {
    scenario: "budget_change",
    change_description: `Budget ${direction}`,
    projected_roas,
    projected_cpa,
    projected_ltv_impact_pct,
    risk_adjustment,
    confidence,
    rationale: buildBudgetRationale(change_pct, fatigue_report, seasonal_context),
  };
}

/**
 * Simule l'effet d'un rafraîchissement créatif.
 */
export function simulateNewCreative(input: SimulationInput): SimulationResult {
  const { ltv_analysis, seasonal_context, current_roas, current_cpa } = input;

  const uplift = input.fatigue_report.creative_fatigue ? 1.18 : 1.04;
  const projected_roas = Math.round(current_roas * uplift * 100) / 100;
  const projected_cpa = Math.round((current_cpa * (1 / uplift)) * 100) / 100;
  const projected_ltv_impact_pct = input.fatigue_report.creative_fatigue ? 12 : 3;

  return {
    scenario: "new_creative",
    change_description: "Rafraîchissement créatif",
    projected_roas,
    projected_cpa,
    projected_ltv_impact_pct,
    risk_adjustment: "lower",
    confidence: input.fatigue_report.creative_fatigue ? "high" : "medium",
    rationale: input.fatigue_report.creative_fatigue
      ? `Fatigue créative active (score ${input.fatigue_report.fatigue_score}/10) — le rafraîchissement devrait restaurer les performances à +${Math.round((uplift - 1) * 100)}%`
      : "Pas de fatigue détectée — gain marginal attendu du rafraîchissement",
  };
}

/**
 * Simule l'expansion vers une nouvelle audience.
 */
export function simulateNewAudience(input: SimulationInput): SimulationResult {
  const { ltv_analysis, current_roas, current_cpa, seasonal_context } = input;

  const expansion_penalty = 0.80;
  const ltv_upside = ltv_analysis.ltv_cac_ratio >= 3 ? 1.15 : 1.05;

  const projected_roas = Math.round(current_roas * expansion_penalty * 100) / 100;
  const projected_cpa = Math.round((current_cpa / expansion_penalty) * 100) / 100;
  const projected_ltv_impact_pct = Math.round((ltv_upside - 1) * 100);

  const risk = ltv_analysis.ltv_cac_ratio < 2 ? "higher" : "neutral";

  return {
    scenario: "new_audience",
    change_description: "Expansion nouvelle audience",
    projected_roas,
    projected_cpa,
    projected_ltv_impact_pct,
    risk_adjustment: risk,
    confidence: "medium",
    rationale: `Nouvelle audience : coût d'acquisition initial plus élevé (-20% ROAS estimé) mais potentiel de diversification LTV +${projected_ltv_impact_pct}% si le produit résonne`,
  };
}

function buildBudgetRationale(
  change_pct: number,
  fatigue: CreativeFatigueReport,
  season: SeasonalContext,
): string {
  const parts: string[] = [];

  if (change_pct > 0) {
    if (fatigue.creative_fatigue) {
      parts.push(`Fatigue créative active — scaling ${change_pct > 30 ? "agressif" : "modéré"} risqué sans rafraîchissement`);
    } else {
      parts.push(`Aucune fatigue créative — budget scalable`);
    }
    if (season.seasonality_score >= 1.1) {
      parts.push(`Saisonnalité favorable (${season.seasonality_index}) — fenêtre idéale`);
    }
  } else {
    parts.push("Réduction budgétaire — préserver les créatifs performants");
  }

  return parts.join(". ");
}
