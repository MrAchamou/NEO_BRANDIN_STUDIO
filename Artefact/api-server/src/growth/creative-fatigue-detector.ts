/**
 * GROWTH DECISION BRAIN — Détecteur de fatigue créative
 *
 * Détecte si les créatifs actuels montrent des signes de saturation :
 * baisse de CTR, fréquence élevée, déclin du ROAS.
 * Recommande un refresh créatif si les seuils sont atteints.
 */

export interface PerformancePeriod {
  period_label: string; // ex: "W1", "W2", "Mois1"
  ctr: number; // ex: 0.025 = 2.5%
  roas: number; // ex: 3.5
  frequency: number; // impressions / reach
  spend: number;
  revenue: number;
}

export interface CreativeFatigueReport {
  creative_fatigue: boolean;
  recommend_refresh: boolean;
  fatigue_signals: FatigueSignal[];
  fatigue_score: number; // 0 à 10
  urgency: "none" | "low" | "medium" | "high" | "critical";
  recommended_actions: string[];
}

export interface FatigueSignal {
  type: "ctr_decline" | "frequency_high" | "roas_decline" | "engagement_drop";
  description: string;
  severity: "warning" | "critical";
  value?: number;
}

const THRESHOLDS = {
  ctr_decline_rate: 0.15, // 15% de baisse sur 3 périodes
  frequency_warning: 3.0,
  frequency_critical: 5.0,
  roas_decline_rate: 0.2, // 20% de baisse
  min_periods_for_analysis: 2,
};

/**
 * Analyse les données de performance et détecte la fatigue créative.
 */
export function detectCreativeFatigue(periods: PerformancePeriod[]): CreativeFatigueReport {
  const signals: FatigueSignal[] = [];
  let fatigue_score = 0;

  if (periods.length < THRESHOLDS.min_periods_for_analysis) {
    return {
      creative_fatigue: false,
      recommend_refresh: false,
      fatigue_signals: [],
      fatigue_score: 0,
      urgency: "none",
      recommended_actions: ["Données insuffisantes — continuer à collecter au moins 2 périodes."],
    };
  }

  // ── 1) Baisse CTR sur 3 périodes consécutives ──────────────────────────────
  if (periods.length >= 3) {
    const ctrs = periods.slice(-3).map((p) => p.ctr);
    const declining = ctrs[0] > ctrs[1] && ctrs[1] > ctrs[2];
    if (declining) {
      const decline_rate = (ctrs[0] - ctrs[2]) / ctrs[0];
      if (decline_rate > THRESHOLDS.ctr_decline_rate) {
        fatigue_score += 3;
        signals.push({
          type: "ctr_decline",
          description: `CTR en baisse sur 3 périodes : ${(ctrs[0] * 100).toFixed(2)}% → ${(ctrs[2] * 100).toFixed(2)}%`,
          severity: decline_rate > 0.3 ? "critical" : "warning",
          value: Math.round(decline_rate * 100),
        });
      }
    }
  }

  // ── 2) Fréquence élevée ─────────────────────────────────────────────────────
  const lastPeriod = periods[periods.length - 1];
  if (lastPeriod.frequency >= THRESHOLDS.frequency_critical) {
    fatigue_score += 4;
    signals.push({
      type: "frequency_high",
      description: `Fréquence critique : ${lastPeriod.frequency.toFixed(1)}x (seuil: ${THRESHOLDS.frequency_critical})`,
      severity: "critical",
      value: lastPeriod.frequency,
    });
  } else if (lastPeriod.frequency >= THRESHOLDS.frequency_warning) {
    fatigue_score += 2;
    signals.push({
      type: "frequency_high",
      description: `Fréquence élevée : ${lastPeriod.frequency.toFixed(1)}x (seuil: ${THRESHOLDS.frequency_warning})`,
      severity: "warning",
      value: lastPeriod.frequency,
    });
  }

  // ── 3) Déclin ROAS avec trafic stable ──────────────────────────────────────
  if (periods.length >= 3) {
    const roasTrend = periods.slice(-3).map((p) => p.roas);
    const spendTrend = periods.slice(-3).map((p) => p.spend);
    const roas_declining = roasTrend[0] > roasTrend[1] && roasTrend[1] > roasTrend[2];
    const spend_stable =
      Math.abs(spendTrend[0] - spendTrend[2]) / Math.max(spendTrend[0], 1) < 0.2;

    if (roas_declining && spend_stable) {
      const roas_decline_rate = (roasTrend[0] - roasTrend[2]) / roasTrend[0];
      if (roas_decline_rate > THRESHOLDS.roas_decline_rate) {
        fatigue_score += 3;
        signals.push({
          type: "roas_decline",
          description: `ROAS en baisse avec budget stable : ${roasTrend[0].toFixed(1)} → ${roasTrend[2].toFixed(1)}x`,
          severity: roas_decline_rate > 0.35 ? "critical" : "warning",
          value: Math.round(roas_decline_rate * 100),
        });
      }
    }
  }

  const creative_fatigue = fatigue_score >= 4;
  const recommend_refresh = fatigue_score >= 3;

  const urgency: CreativeFatigueReport["urgency"] =
    fatigue_score >= 8
      ? "critical"
      : fatigue_score >= 6
        ? "high"
        : fatigue_score >= 4
          ? "medium"
          : fatigue_score >= 2
            ? "low"
            : "none";

  const recommended_actions: string[] = [];
  if (signals.some((s) => s.type === "ctr_decline")) {
    recommended_actions.push("Tester de nouveaux visuels / hooks créatifs");
    recommended_actions.push("Rafraîchir le copywriting des CTAs");
  }
  if (signals.some((s) => s.type === "frequency_high")) {
    recommended_actions.push("Élargir l'audience cible ou exclure les acheteurs récents");
    recommended_actions.push("Réduire le budget ou la pression d'enchères");
  }
  if (signals.some((s) => s.type === "roas_decline")) {
    recommended_actions.push("Rotation créative immédiate — tester 3+ variantes");
    recommended_actions.push("Revoir l'offre et la proposition de valeur");
  }
  if (recommended_actions.length === 0) {
    recommended_actions.push("Aucun signe de fatigue — continuer et monitorer.");
  }

  return {
    creative_fatigue,
    recommend_refresh,
    fatigue_signals: signals,
    fatigue_score: Math.min(fatigue_score, 10),
    urgency,
    recommended_actions,
  };
}
