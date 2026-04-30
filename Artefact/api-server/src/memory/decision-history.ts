/**
 * BRAND MEMORY ENGINE — Historique des décisions stratégiques
 *
 * Trace toutes les décisions stratégiques prises par l'utilisateur :
 * changements de tone, growth_mode, positionnement, risk tolerance.
 */

export type DecisionCategory =
  | "tone_change"
  | "growth_mode_change"
  | "positioning_change"
  | "risk_tolerance_change"
  | "sector_override"
  | "creative_direction";

export interface StrategicDecision {
  id: string;
  timestamp: string;
  brand_id: string;
  category: DecisionCategory;
  from_value: string;
  to_value: string;
  rationale?: string;
  metadata?: Record<string, unknown>;
}

const decisionStore = new Map<string, StrategicDecision[]>();

function getBrandDecisions(brand_id: string): StrategicDecision[] {
  if (!decisionStore.has(brand_id)) decisionStore.set(brand_id, []);
  return decisionStore.get(brand_id)!;
}

/**
 * Enregistre une décision stratégique.
 */
export function recordDecision(
  brand_id: string,
  category: DecisionCategory,
  from_value: string,
  to_value: string,
  rationale?: string,
  metadata?: Record<string, unknown>,
): StrategicDecision {
  const decision: StrategicDecision = {
    id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    brand_id,
    category,
    from_value,
    to_value,
    rationale,
    metadata,
  };
  getBrandDecisions(brand_id).push(decision);
  return decision;
}

/**
 * Récupère les décisions d'une marque, filtrées par catégorie si demandé.
 */
export function getDecisions(
  brand_id: string,
  category?: DecisionCategory,
  limit = 50,
): StrategicDecision[] {
  let decisions = [...getBrandDecisions(brand_id)];
  if (category) decisions = decisions.filter((d) => d.category === category);
  return decisions.slice(-limit);
}

/**
 * Retourne la valeur courante d'une catégorie de décision (dernière valeur connue).
 */
export function getCurrentValue(brand_id: string, category: DecisionCategory): string | null {
  const decisions = getDecisions(brand_id, category);
  return decisions.length > 0 ? decisions[decisions.length - 1].to_value : null;
}

/**
 * Résume l'évolution des décisions pour construire le profil mémoire.
 */
export function summarizeDecisionHistory(brand_id: string): {
  growth_mode_trajectory: string[];
  tone_trajectory: string[];
  risk_trajectory: string[];
  total_decisions: number;
  most_changed_category: DecisionCategory | null;
} {
  const decisions = getBrandDecisions(brand_id);

  const byCategory = decisions.reduce(
    (acc, d) => {
      if (!acc[d.category]) acc[d.category] = [];
      acc[d.category].push(d);
      return acc;
    },
    {} as Record<DecisionCategory, StrategicDecision[]>,
  );

  const mostChanged = Object.entries(byCategory).sort(
    (a, b) => b[1].length - a[1].length,
  )[0];

  return {
    growth_mode_trajectory: (byCategory["growth_mode_change"] ?? []).map((d) => d.to_value),
    tone_trajectory: (byCategory["tone_change"] ?? []).map((d) => d.to_value),
    risk_trajectory: (byCategory["risk_tolerance_change"] ?? []).map((d) => d.to_value),
    total_decisions: decisions.length,
    most_changed_category: mostChanged ? (mostChanged[0] as DecisionCategory) : null,
  };
}
