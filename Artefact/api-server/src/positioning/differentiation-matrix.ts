/**
 * STRATEGIC POSITIONING ENGINE — Matrice de différenciation
 *
 * Génère une matrice comparant la marque à des archétypes concurrents
 * sur les axes stratégiques, et identifie les zones d'opportunité.
 */

import type { MarketAxis } from "./market-mapping";

export interface CompetitorProfile {
  name: string;
  axes_positions: Record<string, number>; // nom de l'axe → position -1 à +1
}

export interface DifferentiationEntry {
  axis_name: string;
  left_pole: string;
  right_pole: string;
  brand_position: number;
  competitors: { name: string; position: number }[];
  gap: number; // distance moyenne entre la marque et les concurrents
  opportunity_zone: boolean;
}

export interface DifferentiationMatrix {
  entries: DifferentiationEntry[];
  strongest_differentiators: string[];
  weakest_differentiators: string[];
  opportunity_summary: string;
}

// ─── Profils concurrents archétypes par secteur ──────────────────────────────

const SECTOR_ARCHETYPES: Record<string, CompetitorProfile[]> = {
  cosmetics: [
    {
      name: "Mass Market Player",
      axes_positions: {
        price_positioning: -0.6,
        communication_style: 0.3,
        visual_language: 0.2,
        brand_stance: -0.1,
      },
    },
    {
      name: "Luxury Beauty House",
      axes_positions: {
        price_positioning: 0.9,
        communication_style: 0.5,
        visual_language: -0.3,
        brand_stance: -0.2,
      },
    },
    {
      name: "Clean Beauty Brand",
      axes_positions: {
        price_positioning: 0.3,
        communication_style: 0.4,
        visual_language: -0.5,
        brand_stance: -0.6,
      },
    },
  ],
  fashion: [
    {
      name: "Fast Fashion",
      axes_positions: {
        price_positioning: -0.7,
        communication_style: 0.5,
        visual_language: 0.6,
        brand_stance: 0.2,
      },
    },
    {
      name: "Luxury Maison",
      axes_positions: {
        price_positioning: 0.95,
        communication_style: 0.2,
        visual_language: -0.2,
        brand_stance: -0.4,
      },
    },
    {
      name: "Mid-Market DTC",
      axes_positions: {
        price_positioning: 0.1,
        communication_style: 0.4,
        visual_language: 0.1,
        brand_stance: 0.3,
      },
    },
  ],
  saas: [
    {
      name: "Enterprise Legacy",
      axes_positions: {
        price_positioning: 0.7,
        communication_style: -0.7,
        visual_language: -0.4,
        brand_stance: -0.5,
      },
    },
    {
      name: "Startup Challenger",
      axes_positions: {
        price_positioning: -0.3,
        communication_style: 0.3,
        visual_language: 0.5,
        brand_stance: 0.8,
      },
    },
  ],
  food: [
    {
      name: "Industrial Brand",
      axes_positions: {
        price_positioning: -0.8,
        communication_style: 0.2,
        visual_language: 0.4,
        brand_stance: -0.3,
      },
    },
    {
      name: "Premium Organic",
      axes_positions: {
        price_positioning: 0.6,
        communication_style: 0.3,
        visual_language: -0.3,
        brand_stance: -0.7,
      },
    },
  ],
  finance: [
    {
      name: "Traditional Bank",
      axes_positions: {
        price_positioning: 0.2,
        communication_style: -0.8,
        visual_language: -0.5,
        brand_stance: -0.8,
      },
    },
    {
      name: "Fintech Disruptor",
      axes_positions: {
        price_positioning: -0.2,
        communication_style: 0.4,
        visual_language: 0.3,
        brand_stance: 0.9,
      },
    },
  ],
};

/**
 * Génère la matrice de différenciation pour une marque.
 */
export function buildDifferentiationMatrix(
  brand_axes: MarketAxis[],
  sector: string,
): DifferentiationMatrix {
  const normalizedSector = Object.keys(SECTOR_ARCHETYPES).find((k) =>
    sector.toLowerCase().includes(k),
  );
  const competitors = normalizedSector ? SECTOR_ARCHETYPES[normalizedSector] : [];

  const entries: DifferentiationEntry[] = brand_axes.map((axis) => {
    const competitor_positions = competitors.map((comp) => ({
      name: comp.name,
      position: comp.axes_positions[axis.name] ?? 0,
    }));

    const avg_competitor_pos =
      competitor_positions.length > 0
        ? competitor_positions.reduce((a, c) => a + c.position, 0) / competitor_positions.length
        : 0;

    const gap = Math.abs(axis.brand_position - avg_competitor_pos);
    const opportunity_zone = gap >= 0.4;

    return {
      axis_name: axis.name,
      left_pole: axis.left_pole,
      right_pole: axis.right_pole,
      brand_position: axis.brand_position,
      competitors: competitor_positions,
      gap: Math.round(gap * 100) / 100,
      opportunity_zone,
    };
  });

  const sorted_by_gap = [...entries].sort((a, b) => b.gap - a.gap);
  const strongest_differentiators = sorted_by_gap
    .slice(0, 2)
    .filter((e) => e.opportunity_zone)
    .map((e) => `${e.left_pole} ↔ ${e.right_pole} (gap: ${e.gap})`);

  const weakest_differentiators = sorted_by_gap
    .slice(-2)
    .map((e) => `${e.left_pole} ↔ ${e.right_pole} (gap: ${e.gap})`);

  const opportunity_summary =
    strongest_differentiators.length > 0
      ? `Avantage distinctif sur : ${strongest_differentiators.join(" | ")}`
      : "Positionnement proche des concurrents — différenciation par l'exécution nécessaire";

  return { entries, strongest_differentiators, weakest_differentiators, opportunity_summary };
}
