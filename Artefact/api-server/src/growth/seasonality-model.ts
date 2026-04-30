/**
 * GROWTH DECISION BRAIN — Modèle de saisonnalité
 *
 * Calcule le contexte saisonnier courant pour informer les décisions
 * de scaling. Prend en compte le secteur, le mois, et les données
 * historiques de performance.
 */

export type SeasonalityIndex = "very_low" | "low" | "neutral" | "high" | "peak";

export interface SeasonalContext {
  month: number;
  sector: string;
  seasonality_index: SeasonalityIndex;
  seasonality_score: number; // 0.0 à 2.0, 1.0 = neutre
  key_events: string[];
  scaling_multiplier: number;
  recommendation: string;
}

// ─── Calendrier saisonnier par secteur ──────────────────────────────────────

type MonthMap = Record<number, { score: number; events: string[] }>;

const SECTOR_SEASONALITY: Record<string, MonthMap> = {
  cosmetics: {
    1: { score: 0.7, events: ["Soldes janvier", "New Year skincare"] },
    2: { score: 0.8, events: ["Valentine's Day beauty"] },
    3: { score: 0.9, events: ["Printemps beauté"] },
    4: { score: 1.0, events: ["Routine printemps"] },
    5: { score: 1.1, events: ["Fête des mères"] },
    6: { score: 1.0, events: ["Beauté été"] },
    7: { score: 0.8, events: ["Soldes été"] },
    8: { score: 0.7, events: ["Vacances"] },
    9: { score: 1.1, events: ["Rentrée beauté", "Routine automne"] },
    10: { score: 1.2, events: ["Halloween beauty", "Routine hiver"] },
    11: { score: 1.8, events: ["Black Friday", "Cyber Monday", "Noël anticipé"] },
    12: { score: 2.0, events: ["Noël", "Fêtes de fin d'année", "Coffrets cadeaux"] },
  },
  fashion: {
    1: { score: 1.0, events: ["Soldes hiver"] },
    2: { score: 0.8, events: ["Fashion Week"] },
    3: { score: 1.0, events: ["Printemps mode"] },
    4: { score: 0.9, events: ["Collections printemps"] },
    5: { score: 1.1, events: ["Fête des mères"] },
    6: { score: 1.3, events: ["Soldes été", "Festivals"] },
    7: { score: 1.2, events: ["Summer fashion"] },
    8: { score: 0.7, events: ["Vacances"] },
    9: { score: 1.3, events: ["Rentrée mode", "Fashion Week"] },
    10: { score: 1.0, events: ["Collections automne"] },
    11: { score: 1.8, events: ["Black Friday", "Noël mode"] },
    12: { score: 1.9, events: ["Fêtes", "Cadeaux mode"] },
  },
  food: {
    1: { score: 1.0, events: ["New Year wellness"] },
    2: { score: 0.9, events: ["Valentine's Day"] },
    3: { score: 1.0, events: ["Ramadan"] },
    4: { score: 1.1, events: ["Pâques", "Printemps santé"] },
    5: { score: 1.0, events: ["Fête des mères"] },
    6: { score: 1.1, events: ["Été lifestyle"] },
    7: { score: 0.9, events: ["Vacances"] },
    8: { score: 0.8, events: ["Vacances"] },
    9: { score: 1.2, events: ["Rentrée bien-être"] },
    10: { score: 1.0, events: ["Automne"] },
    11: { score: 1.5, events: ["Black Friday"] },
    12: { score: 1.8, events: ["Fêtes", "Coffrets gourmands"] },
  },
  saas: {
    1: { score: 1.2, events: ["New Year budgets", "Q1 planning"] },
    2: { score: 1.0, events: ["Q1 actif"] },
    3: { score: 1.1, events: ["Q1 clôture", "Fin d'exercice"] },
    4: { score: 1.0, events: ["Q2 planning"] },
    5: { score: 0.9, events: [] },
    6: { score: 1.0, events: ["Mi-année reviews"] },
    7: { score: 0.7, events: ["Vacances"] },
    8: { score: 0.7, events: ["Vacances"] },
    9: { score: 1.3, events: ["Rentrée B2B", "Budget Q4 planning"] },
    10: { score: 1.2, events: ["Q4 début"] },
    11: { score: 1.1, events: ["Black Friday SaaS"] },
    12: { score: 0.9, events: ["Fin d'année", "Budget freeze"] },
  },
  finance: {
    1: { score: 1.3, events: ["Bilan fiscal", "Résolutions financières"] },
    2: { score: 1.0, events: [] },
    3: { score: 1.2, events: ["Déclaration impôts", "Fin Q1"] },
    4: { score: 1.2, events: ["Déclarations fiscales"] },
    5: { score: 0.9, events: [] },
    6: { score: 1.0, events: ["Mi-année"] },
    7: { score: 0.7, events: ["Vacances"] },
    8: { score: 0.6, events: ["Vacances"] },
    9: { score: 1.2, events: ["Rentrée", "Budget annuel"] },
    10: { score: 1.1, events: [] },
    11: { score: 0.9, events: [] },
    12: { score: 1.3, events: ["Optimisation fiscale fin d'année"] },
  },
};

const DEFAULT_SEASONALITY: MonthMap = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [i + 1, { score: 1.0, events: [] }]),
);

/**
 * Calcule le contexte saisonnier pour un secteur et un mois donnés.
 */
export function getSeasonalContext(
  sector: string,
  month?: number,
): SeasonalContext {
  const currentMonth = month ?? new Date().getMonth() + 1;
  const normalizedSector = Object.keys(SECTOR_SEASONALITY).find((k) =>
    sector.toLowerCase().includes(k),
  );
  const monthMap = normalizedSector
    ? SECTOR_SEASONALITY[normalizedSector]
    : DEFAULT_SEASONALITY;

  const monthData = monthMap[currentMonth] ?? { score: 1.0, events: [] };
  const score = monthData.score;

  const seasonality_index: SeasonalityIndex =
    score >= 1.8
      ? "peak"
      : score >= 1.3
        ? "high"
        : score >= 0.9
          ? "neutral"
          : score >= 0.7
            ? "low"
            : "very_low";

  const scaling_multiplier = score;

  const recommendation =
    seasonality_index === "peak"
      ? "Saison haute — budget max, créatifs premium, fréquence élevée."
      : seasonality_index === "high"
        ? "Bonne saisonnalité — accélère progressivement."
        : seasonality_index === "neutral"
          ? "Saisonnalité neutre — maintenir le cap, tester de nouveaux créatifs."
          : seasonality_index === "low"
            ? "Période creuse — réduire les dépenses, travailler la rétention."
            : "Saison très basse — minimum viable, focus fidélisation.";

  return {
    month: currentMonth,
    sector,
    seasonality_index,
    seasonality_score: Math.round(score * 100) / 100,
    key_events: monthData.events,
    scaling_multiplier,
    recommendation,
  };
}
