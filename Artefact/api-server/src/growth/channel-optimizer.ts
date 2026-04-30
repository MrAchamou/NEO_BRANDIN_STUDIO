/**
 * GROWTH DECISION BRAIN — Cross-Channel Optimization Matrix (Agency Mode)
 *
 * Détecte les déséquilibres de canal et génère des recommandations
 * de redistribution budgétaire client-ready.
 */

export type Channel = "meta" | "google" | "tiktok" | "email" | "seo" | "youtube" | "pinterest";

export interface ChannelMetrics {
  channel: Channel;
  roas?: number;
  cpa?: number;
  ctr?: number;
  frequency?: number;
  budget_share_pct: number;
  status: "underperforming" | "stable" | "overperforming" | "fatigue";
}

export interface ChannelRecommendation {
  channel: Channel;
  current_share_pct: number;
  recommended_share_pct: number;
  delta_pct: number;
  action: "reduce" | "maintain" | "increase" | "pause" | "invest";
  rationale: string;
}

export interface ChannelOptimizationResult {
  generated_at: string;
  overall_health: "poor" | "mixed" | "good" | "excellent";
  channel_statuses: ChannelMetrics[];
  recommendations: ChannelRecommendation[];
  budget_redistribution_summary: string;
  priority_action: string;
}

/**
 * Analyse le mix canal et génère une matrice d'optimisation.
 */
export function optimizeChannelMix(channels: ChannelMetrics[]): ChannelOptimizationResult {
  const total_budget = channels.reduce((a, c) => a + c.budget_share_pct, 0);
  const recommendations: ChannelRecommendation[] = [];

  let underperforming = 0;
  let overperforming = 0;

  for (const ch of channels) {
    let recommended = ch.budget_share_pct;
    let action: ChannelRecommendation["action"] = "maintain";
    let rationale = "";

    if (ch.status === "underperforming") {
      underperforming++;
      if (ch.budget_share_pct > 20) {
        recommended = Math.max(ch.budget_share_pct - 10, 5);
        action = "reduce";
        rationale = `Sous-performance sur ${ch.channel} — réduire l'exposition et analyser`;
      } else {
        action = "pause";
        recommended = 0;
        rationale = `${ch.channel} sous-performe avec une allocation réduite — considérer une pause`;
      }
    } else if (ch.status === "overperforming") {
      overperforming++;
      recommended = Math.min(ch.budget_share_pct + 10, 50);
      action = "increase";
      rationale = `${ch.channel} surperforme — élargir l'investissement`;
    } else if (ch.status === "fatigue") {
      recommended = Math.max(ch.budget_share_pct - 5, 0);
      action = "reduce";
      rationale = `Fatigue détectée sur ${ch.channel} — rafraîchir les créatifs avant de scaler`;
    } else {
      rationale = `${ch.channel} stable — maintenir le mix actuel`;
    }

    const delta = recommended - ch.budget_share_pct;

    recommendations.push({
      channel: ch.channel,
      current_share_pct: ch.budget_share_pct,
      recommended_share_pct: recommended,
      delta_pct: delta,
      action,
      rationale,
    });
  }

  // Rééquilibrer pour que le total = 100%
  const projected_total = recommendations.reduce((a, r) => a + r.recommended_share_pct, 0);
  if (projected_total !== 100 && projected_total > 0) {
    const scale = 100 / projected_total;
    for (const r of recommendations) {
      r.recommended_share_pct = Math.round(r.recommended_share_pct * scale);
    }
  }

  const overall_health: ChannelOptimizationResult["overall_health"] =
    underperforming >= channels.length / 2
      ? "poor"
      : underperforming > 0 && overperforming > 0
        ? "mixed"
        : overperforming >= channels.length / 2
          ? "excellent"
          : "good";

  const top_reduce = recommendations
    .filter((r) => r.action === "reduce" || r.action === "pause")
    .map((r) => r.channel);
  const top_increase = recommendations.filter((r) => r.action === "increase").map((r) => r.channel);

  const budget_redistribution_summary =
    top_reduce.length > 0 || top_increase.length > 0
      ? `Réduire sur ${top_reduce.join(", ") || "aucun canal"}. Augmenter sur ${top_increase.join(", ") || "aucun canal"}.`
      : "Mix canal équilibré — maintenir la répartition actuelle.";

  const priority_action =
    recommendations.find((r) => r.action === "pause")?.rationale ??
    recommendations.find((r) => r.action === "increase")?.rationale ??
    "Maintenir le mix actuel et surveiller les indicateurs hebdomadaires.";

  return {
    generated_at: new Date().toISOString(),
    overall_health,
    channel_statuses: channels,
    recommendations,
    budget_redistribution_summary,
    priority_action,
  };
}

/**
 * Déduit automatiquement les statuts de canaux depuis les métriques brutes.
 */
export function inferChannelStatuses(
  raw: Array<{
    channel: Channel;
    roas?: number;
    cpa?: number;
    ctr?: number;
    frequency?: number;
    budget_share_pct: number;
  }>,
): ChannelMetrics[] {
  return raw.map((ch) => {
    let status: ChannelMetrics["status"] = "stable";

    const roas_ok = ch.roas !== undefined ? ch.roas >= 2.5 : true;
    const ctr_ok = ch.ctr !== undefined ? ch.ctr >= 0.01 : true;
    const freq_ok = ch.frequency !== undefined ? ch.frequency <= 3.5 : true;

    if (ch.frequency !== undefined && ch.frequency > 4.5) {
      status = "fatigue";
    } else if (!roas_ok && !ctr_ok) {
      status = "underperforming";
    } else if (ch.roas !== undefined && ch.roas >= 4.5) {
      status = "overperforming";
    } else if (!freq_ok) {
      status = "fatigue";
    }

    return { ...ch, status };
  });
}
