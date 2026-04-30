/**
 * ROUTES — Growth Decision Brain (v3.x Agency Mode)
 *
 * Expose les endpoints agence pour la prise de décision croissance :
 * risk meter, scenario simulator, weekly brief, channel optimizer.
 */

import { Router } from "express";
import { calculateLtv, type OrderMetrics } from "../growth/ltv-engine";
import { analyzeCohort, type CohortDataPoint } from "../growth/cohort-analysis";
import { getSeasonalContext } from "../growth/seasonality-model";
import { detectCreativeFatigue, type PerformancePeriod } from "../growth/creative-fatigue-detector";
import { generateWeeklyStrategicSummary } from "../growth/strategy-recommender";
import { computeRiskMeter } from "../growth/risk-meter";
import {
  simulateBudgetChange,
  simulateNewCreative,
  simulateNewAudience,
} from "../growth/scenario-simulator";
import { optimizeChannelMix, inferChannelStatuses, type ChannelMetrics } from "../growth/channel-optimizer";
import { renderBriefHtml, type ClientReadyBrief } from "../growth/brief-export";

const router = Router();

/**
 * Construit le brief client-ready à partir des entrées brutes.
 * Mutualisé entre /weekly-brief et /weekly-brief/export.
 */
function buildClientReadyBrief(payload: {
  order_metrics: OrderMetrics;
  cohort_data: CohortDataPoint;
  creative_metrics: PerformancePeriod[];
  sector?: string;
  weeks_running?: number;
  current_margin_stable?: boolean;
}): ClientReadyBrief {
  const ltv_analysis = calculateLtv(payload.order_metrics);
  const cohort_analysis = analyzeCohort(payload.cohort_data);
  const seasonal_context = getSeasonalContext(payload.sector ?? "ecommerce");
  const fatigue_report = detectCreativeFatigue(payload.creative_metrics);

  const weekly_summary = generateWeeklyStrategicSummary({
    ltv_analysis,
    seasonal_context,
    fatigue_report,
    current_margin_stable: payload.current_margin_stable ?? true,
    weeks_running: payload.weeks_running ?? 4,
  });

  const risk_meter = computeRiskMeter({
    ltv_analysis,
    cohort_analysis,
    fatigue_report,
    weeks_running: payload.weeks_running ?? 4,
  });

  return {
    title: "Rapport Stratégique Hebdomadaire",
    generated_at: weekly_summary.generated_at,
    performance_overview: {
      outlook: weekly_summary.strategic_outlook,
      profit_sustainability: weekly_summary.profit_sustainability,
      risk_index: risk_meter.scaling_risk_index,
    },
    scaling_opportunities: weekly_summary.scaling_opportunities,
    risk_flags: weekly_summary.risk_factors,
    creative_analysis: weekly_summary.creative_signals,
    retention_update: {
      m1: Math.round((cohort_analysis.retention_m1 ?? 0) * 100) + "%",
      m3: Math.round((cohort_analysis.retention_m3 ?? 0) * 100) + "%",
      health: cohort_analysis.cohort_health,
    },
    profit_check: {
      ltv_cac_ratio: ltv_analysis.ltv_cac_ratio,
      profitability: ltv_analysis.profitability_score,
      break_even_months: ltv_analysis.break_even_months,
    },
    recommended_action: weekly_summary.recommended_action,
    agency_footer: `Généré par AI BRAND OS v3.x — ${new Date().toLocaleDateString("fr-FR")}`,
  };
}

/**
 * POST /api/growth/risk-meter
 * Calcule les 4 indices de risque agence : Scaling Risk, Creative Fatigue,
 * Profit Stability, Retention Health.
 */
router.post("/growth/risk-meter", (req, res) => {
  const { order_metrics, cohort_data, creative_metrics, sector, weeks_running } = req.body;

  if (!order_metrics || !cohort_data || !creative_metrics) {
    res.status(400).json({
      error: "order_metrics, cohort_data, creative_metrics requis",
      example: {
        order_metrics: {
          avg_order_value: 80,
          purchase_frequency_per_year: 3,
          customer_lifespan_years: 2,
          gross_margin_percent: 55,
          cac: 40,
        },
        cohort_data: {
          cohort_month: "2024-01",
          customers_acquired: 500,
          revenue_month_0: 40000,
          revenue_month_1: 28000,
          revenue_month_2: 22000,
          revenue_month_3: 18000,
        },
        creative_metrics: [
          { period_label: "W1", ctr: 0.025, frequency: 2.1, roas: 3.8, spend: 5000, revenue: 19000 },
          { period_label: "W2", ctr: 0.018, frequency: 3.2, roas: 2.9, spend: 5000, revenue: 14500 },
          { period_label: "W3", ctr: 0.012, frequency: 4.8, roas: 2.1, spend: 5000, revenue: 10500 },
        ],
        sector: "cosmetics",
        weeks_running: 6,
      },
    });
    return;
  }

  const ltv_analysis = calculateLtv(order_metrics as OrderMetrics);
  const cohort_analysis = analyzeCohort(cohort_data as CohortDataPoint);
  const seasonal_context = getSeasonalContext(sector ?? "ecommerce");
  const fatigue_report = detectCreativeFatigue(creative_metrics as PerformancePeriod[]);

  const risk_meter = computeRiskMeter({
    ltv_analysis,
    cohort_analysis,
    fatigue_report,
    weeks_running: weeks_running ?? 4,
  });

  res.json({
    risk_meter,
    ltv_analysis,
    seasonal_context,
    fatigue_detected: fatigue_report.creative_fatigue,
  });
});

/**
 * POST /api/growth/simulate
 * Simule l'impact de changements stratégiques sur ROAS, CPA, LTV.
 * scenarios: "budget_change" | "new_creative" | "new_audience"
 */
router.post("/growth/simulate", (req, res) => {
  const {
    order_metrics,
    creative_metrics,
    sector,
    current_roas,
    current_cpa,
    current_budget,
    scenarios,
    budget_change_pct,
  } = req.body;

  if (!order_metrics || !creative_metrics) {
    res.status(400).json({ error: "order_metrics et creative_metrics requis" });
    return;
  }

  const ltv_analysis = calculateLtv(order_metrics as OrderMetrics);
  const seasonal_context = getSeasonalContext(sector ?? "ecommerce");
  const fatigue_report = detectCreativeFatigue(creative_metrics as PerformancePeriod[]);

  const sim_input = {
    ltv_analysis,
    fatigue_report,
    seasonal_context,
    current_roas: current_roas ?? 3.0,
    current_cpa: current_cpa ?? 40,
    current_budget: current_budget ?? 5000,
  };

  const requested = Array.isArray(scenarios)
    ? scenarios
    : ["budget_change", "new_creative", "new_audience"];

  const results: Record<string, unknown> = {};

  if (requested.includes("budget_change")) {
    results.budget_change = simulateBudgetChange(sim_input, budget_change_pct ?? 20);
  }
  if (requested.includes("new_creative")) {
    results.new_creative = simulateNewCreative(sim_input);
  }
  if (requested.includes("new_audience")) {
    results.new_audience = simulateNewAudience(sim_input);
  }

  res.json({ simulations: results, baseline: { roas: sim_input.current_roas, cpa: sim_input.current_cpa } });
});

/**
 * POST /api/growth/weekly-brief
 * Génère le brief stratégique hebdomadaire complet — format client-ready.
 */
router.post("/growth/weekly-brief", (req, res) => {
  const {
    order_metrics,
    cohort_data,
    creative_metrics,
    sector,
    weeks_running,
    current_margin_stable,
    output_mode,
  } = req.body;

  if (!order_metrics || !cohort_data || !creative_metrics) {
    res.status(400).json({ error: "order_metrics, cohort_data, creative_metrics requis" });
    return;
  }

  const is_client_ready = output_mode === "client_ready";

  if (is_client_ready) {
    res.json(
      buildClientReadyBrief({
        order_metrics: order_metrics as OrderMetrics,
        cohort_data: cohort_data as CohortDataPoint,
        creative_metrics: creative_metrics as PerformancePeriod[],
        sector,
        weeks_running,
        current_margin_stable,
      }),
    );
    return;
  }

  const ltv_analysis = calculateLtv(order_metrics as OrderMetrics);
  const cohort_analysis = analyzeCohort(cohort_data as CohortDataPoint);
  const seasonal_context = getSeasonalContext(sector ?? "ecommerce");
  const fatigue_report = detectCreativeFatigue(creative_metrics as PerformancePeriod[]);

  const weekly_summary = generateWeeklyStrategicSummary({
    ltv_analysis,
    seasonal_context,
    fatigue_report,
    current_margin_stable: current_margin_stable ?? true,
    weeks_running: weeks_running ?? 4,
  });

  const risk_meter = computeRiskMeter({
    ltv_analysis,
    cohort_analysis,
    fatigue_report,
    weeks_running: weeks_running ?? 4,
  });

  res.json({
    weekly_summary,
    risk_meter,
    ltv_analysis,
    cohort_analysis,
    seasonal_context,
    fatigue_report,
  });
});

/**
 * POST /api/growth/weekly-brief/export
 * Génère le brief client-ready au format HTML autonome (téléchargeable
 * ou imprimable en PDF directement depuis le navigateur).
 *
 * Query params :
 *   - format=html|pdf  (défaut: html)
 *   - download=1       (force le header Content-Disposition: attachment)
 */
router.post("/growth/weekly-brief/export", (req, res) => {
  const {
    order_metrics,
    cohort_data,
    creative_metrics,
    sector,
    weeks_running,
    current_margin_stable,
    brand_name,
  } = req.body;

  if (!order_metrics || !cohort_data || !creative_metrics) {
    res.status(400).json({ error: "order_metrics, cohort_data, creative_metrics requis" });
    return;
  }

  const format = String(req.query.format ?? "html").toLowerCase();
  const download = req.query.download === "1" || req.query.download === "true";

  const brief = buildClientReadyBrief({
    order_metrics: order_metrics as OrderMetrics,
    cohort_data: cohort_data as CohortDataPoint,
    creative_metrics: creative_metrics as PerformancePeriod[],
    sector,
    weeks_running,
    current_margin_stable,
  });

  const html = renderBriefHtml(brief, {
    autoPrint: format === "pdf",
    brandName: typeof brand_name === "string" && brand_name.trim() ? brand_name.trim() : undefined,
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  const ext = format === "pdf" ? "pdf.html" : "html";
  const fileName = `brief-strategique-${dateStamp}.${ext}`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (download) {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`,
    );
  }
  res.send(html);
});

/**
 * POST /api/growth/channel-optimizer
 * Analyse le mix canal et génère des recommandations de redistribution budgétaire.
 */
router.post("/growth/channel-optimizer", (req, res) => {
  const { channels } = req.body;

  if (!Array.isArray(channels) || channels.length === 0) {
    res.status(400).json({
      error: "channels requis (tableau)",
      example: {
        channels: [
          { channel: "meta", roas: 2.1, ctr: 0.009, frequency: 5.2, budget_share_pct: 45 },
          { channel: "google", roas: 3.8, ctr: 0.032, budget_share_pct: 30 },
          { channel: "tiktok", roas: 2.8, ctr: 0.018, frequency: 3.1, budget_share_pct: 15 },
          { channel: "email", budget_share_pct: 10 },
        ],
      },
    });
    return;
  }

  const enriched = inferChannelStatuses(channels as ChannelMetrics[]);
  const result = optimizeChannelMix(enriched);

  res.json(result);
});

export default router;
