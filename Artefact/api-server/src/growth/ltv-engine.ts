/**
 * GROWTH DECISION BRAIN — Moteur LTV/CAC dynamique
 *
 * Calcule LTV, CAC, ratio LTV/CAC, break-even, contribution margin et
 * profit net par commande. Remplace les seuils CPA statiques par une
 * intelligence multi-facteur contextuelle.
 */

export interface OrderMetrics {
  avg_order_value: number;
  purchase_frequency_per_year: number;
  customer_lifespan_years: number;
  gross_margin_percent: number;
  cac: number;
  refund_rate_percent?: number;
  fixed_costs_per_order?: number;
}

export interface LtvAnalysis {
  ltv: number;
  cac: number;
  ltv_cac_ratio: number;
  break_even_months: number;
  contribution_margin_per_order: number;
  net_profit_per_order: number;
  profitability_score: "negative" | "marginal" | "healthy" | "excellent";
  scale_recommendation: "pause" | "hold" | "scale_cautiously" | "scale_aggressively";
}

/**
 * Calcule une analyse LTV complète à partir des métriques commande.
 */
export function calculateLtv(metrics: OrderMetrics): LtvAnalysis {
  const {
    avg_order_value,
    purchase_frequency_per_year,
    customer_lifespan_years,
    gross_margin_percent,
    cac,
    refund_rate_percent = 0,
    fixed_costs_per_order = 0,
  } = metrics;

  const effective_aov = avg_order_value * (1 - refund_rate_percent / 100);
  const ltv = effective_aov * (gross_margin_percent / 100) * purchase_frequency_per_year * customer_lifespan_years;
  const ltv_cac_ratio = cac > 0 ? ltv / cac : 0;

  const contribution_margin_per_order =
    effective_aov * (gross_margin_percent / 100) - fixed_costs_per_order;

  const net_profit_per_order = contribution_margin_per_order;

  const monthly_revenue_per_customer =
    (effective_aov * (gross_margin_percent / 100) * purchase_frequency_per_year) / 12;
  const break_even_months =
    monthly_revenue_per_customer > 0 ? cac / monthly_revenue_per_customer : 999;

  const profitability_score: LtvAnalysis["profitability_score"] =
    ltv_cac_ratio < 1
      ? "negative"
      : ltv_cac_ratio < 2
        ? "marginal"
        : ltv_cac_ratio < 4
          ? "healthy"
          : "excellent";

  const scale_recommendation: LtvAnalysis["scale_recommendation"] =
    ltv_cac_ratio < 1
      ? "pause"
      : ltv_cac_ratio < 2
        ? "hold"
        : ltv_cac_ratio < 3
          ? "scale_cautiously"
          : "scale_aggressively";

  return {
    ltv: Math.round(ltv * 100) / 100,
    cac,
    ltv_cac_ratio: Math.round(ltv_cac_ratio * 100) / 100,
    break_even_months: Math.round(break_even_months * 10) / 10,
    contribution_margin_per_order: Math.round(contribution_margin_per_order * 100) / 100,
    net_profit_per_order: Math.round(net_profit_per_order * 100) / 100,
    profitability_score,
    scale_recommendation,
  };
}

/**
 * Génère un résumé textuel de l'analyse LTV pour injection en prompt.
 */
export function ltvAnalysisToText(analysis: LtvAnalysis): string {
  return [
    `LTV: ${analysis.ltv}€ | CAC: ${analysis.cac}€ | Ratio LTV/CAC: ${analysis.ltv_cac_ratio}x`,
    `Break-even: ${analysis.break_even_months} mois | Marge contribution/commande: ${analysis.contribution_margin_per_order}€`,
    `Rentabilité: ${analysis.profitability_score} → Recommandation scaling: ${analysis.scale_recommendation}`,
  ].join("\n");
}
