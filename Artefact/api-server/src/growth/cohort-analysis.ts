/**
 * GROWTH DECISION BRAIN — Analyse de cohortes
 *
 * Suit les comportements d'achat par cohorte (date premier achat),
 * calcule les courbes de rétention et les drop-offs pour orienter
 * les décisions de scaling et de créatif.
 */

export interface CohortDataPoint {
  cohort_month: string; // "YYYY-MM"
  customers_acquired: number;
  revenue_month_0: number;
  revenue_month_1?: number;
  revenue_month_2?: number;
  revenue_month_3?: number;
  revenue_month_6?: number;
  revenue_month_12?: number;
}

export interface CohortAnalysis {
  cohort_month: string;
  customers_acquired: number;
  retention_m1: number | null;
  retention_m2: number | null;
  retention_m3: number | null;
  drop_off_rate_m1_to_m3: number | null;
  projected_annual_revenue_per_customer: number;
  cohort_health: "poor" | "average" | "good" | "excellent";
}

/**
 * Analyse une cohorte et calcule ses métriques de rétention.
 */
export function analyzeCohort(data: CohortDataPoint): CohortAnalysis {
  const rev0 = data.revenue_month_0;
  if (rev0 === 0) {
    return {
      cohort_month: data.cohort_month,
      customers_acquired: data.customers_acquired,
      retention_m1: null,
      retention_m2: null,
      retention_m3: null,
      drop_off_rate_m1_to_m3: null,
      projected_annual_revenue_per_customer: 0,
      cohort_health: "poor",
    };
  }

  const retention_m1 = data.revenue_month_1 != null ? data.revenue_month_1 / rev0 : null;
  const retention_m2 = data.revenue_month_2 != null ? data.revenue_month_2 / rev0 : null;
  const retention_m3 = data.revenue_month_3 != null ? data.revenue_month_3 / rev0 : null;

  const drop_off_rate_m1_to_m3 =
    retention_m1 != null && retention_m3 != null
      ? retention_m1 - retention_m3
      : null;

  const months_known = [
    data.revenue_month_0,
    data.revenue_month_1 ?? 0,
    data.revenue_month_2 ?? 0,
    data.revenue_month_3 ?? 0,
  ];
  const known_sum = months_known.reduce((a, b) => a + b, 0);
  const avg_monthly = known_sum / months_known.length;
  const projected_annual_revenue_per_customer =
    data.customers_acquired > 0
      ? (avg_monthly * 12) / data.customers_acquired
      : 0;

  const avg_retention =
    [retention_m1, retention_m2, retention_m3]
      .filter((r): r is number => r !== null)
      .reduce((a, b) => a + b, 0) /
    Math.max([retention_m1, retention_m2, retention_m3].filter((r) => r !== null).length, 1);

  const cohort_health: CohortAnalysis["cohort_health"] =
    avg_retention > 0.4
      ? "excellent"
      : avg_retention > 0.25
        ? "good"
        : avg_retention > 0.1
          ? "average"
          : "poor";

  return {
    cohort_month: data.cohort_month,
    customers_acquired: data.customers_acquired,
    retention_m1,
    retention_m2,
    retention_m3,
    drop_off_rate_m1_to_m3,
    projected_annual_revenue_per_customer: Math.round(projected_annual_revenue_per_customer * 100) / 100,
    cohort_health,
  };
}

/**
 * Compare plusieurs cohortes et identifie les tendances.
 */
export function compareCohorts(cohorts: CohortDataPoint[]): {
  best_cohort: string;
  worst_cohort: string;
  avg_retention_m1: number;
  trend: "improving" | "stable" | "declining";
} {
  const analyses = cohorts.map(analyzeCohort);

  const sorted_by_retention = [...analyses].sort(
    (a, b) => (b.retention_m1 ?? 0) - (a.retention_m1 ?? 0),
  );

  const avg_retention_m1 =
    analyses.filter((a) => a.retention_m1 != null).reduce((acc, a) => acc + (a.retention_m1 ?? 0), 0) /
    Math.max(analyses.filter((a) => a.retention_m1 != null).length, 1);

  // Tendance : compare les 3 premières vs les 3 dernières cohortes
  const recent = analyses.slice(-3).map((a) => a.retention_m1 ?? 0);
  const older = analyses.slice(0, 3).map((a) => a.retention_m1 ?? 0);
  const recent_avg = recent.reduce((a, b) => a + b, 0) / Math.max(recent.length, 1);
  const older_avg = older.reduce((a, b) => a + b, 0) / Math.max(older.length, 1);
  const trend: "improving" | "stable" | "declining" =
    recent_avg > older_avg * 1.1
      ? "improving"
      : recent_avg < older_avg * 0.9
        ? "declining"
        : "stable";

  return {
    best_cohort: sorted_by_retention[0]?.cohort_month ?? "n/a",
    worst_cohort: sorted_by_retention[sorted_by_retention.length - 1]?.cohort_month ?? "n/a",
    avg_retention_m1: Math.round(avg_retention_m1 * 1000) / 10,
    trend,
  };
}
