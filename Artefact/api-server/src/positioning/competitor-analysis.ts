/**
 * STRATEGIC POSITIONING ENGINE — Analyse concurrentielle
 *
 * Orchestre la cartographie de marché et la matrice de différenciation
 * pour produire une analyse concurrentielle complète et actionnable.
 */

import { buildMarketMap } from "./market-mapping";
import { buildDifferentiationMatrix } from "./differentiation-matrix";
import type { BrandArchetype } from "./archetype-engine";

export interface CompetitorAnalysisInput {
  brand_name: string;
  sector?: string;
  tone?: string;
  values?: string[];
  growth_mode?: string;
  description?: string;
  archetype?: BrandArchetype;
  price_tier?: "budget" | "mid" | "premium" | "luxury";
}

export interface CompetitorAnalysisResult {
  market_map_summary: string;
  differentiation_summary: string;
  whitespace_zones: string[];
  strongest_differentiators: string[];
  strategic_opportunity: string;
  competitive_density: "low" | "medium" | "high";
  brand_positioning_statement: string;
}

/**
 * Analyse concurrentielle complète : positionne la marque sur le marché,
 * identifie les espaces blancs et formule un énoncé de positionnement.
 */
export function runCompetitorAnalysis(input: CompetitorAnalysisInput): CompetitorAnalysisResult {
  const market_map = buildMarketMap({
    sector: input.sector,
    tone: input.tone,
    values: input.values,
    growth_mode: input.growth_mode,
    description: input.description,
    price_tier: input.price_tier,
  });

  const diff_matrix = buildDifferentiationMatrix(market_map.axes, input.sector ?? "");

  // Résumé cartographie
  const axes_summary = market_map.axes
    .map((a) => {
      const label = a.brand_position > 0.3
        ? a.right_pole
        : a.brand_position < -0.3
          ? a.left_pole
          : `Centré (${a.left_pole}↔${a.right_pole})`;
      return `${label}`;
    })
    .join(", ");

  const market_map_summary = `Positionnement : ${axes_summary}`;

  const differentiation_summary = diff_matrix.opportunity_summary;

  // Énoncé de positionnement
  const price_axis = market_map.axes.find((a) => a.name === "price_positioning");
  const comm_axis = market_map.axes.find((a) => a.name === "communication_style");

  const price_label = price_axis
    ? price_axis.brand_position > 0.4
      ? "premium"
      : price_axis.brand_position < -0.4
        ? "accessible"
        : "mid-market"
    : "mid-market";

  const comm_label = comm_axis
    ? comm_axis.brand_position > 0.3
      ? "à fort impact émotionnel"
      : comm_axis.brand_position < -0.3
        ? "à valeur technique"
        : "équilibré"
    : "équilibré";

  const archetype_label = input.archetype ?? "Creator";

  const brand_positioning_statement =
    `${input.brand_name} est une marque ${price_label}, ${comm_label}, ` +
    `portée par l'archétype ${archetype_label}, ` +
    `qui se différencie sur : ${diff_matrix.strongest_differentiators.join(" et ") || "l'exécution créative"}.`;

  return {
    market_map_summary,
    differentiation_summary,
    whitespace_zones: market_map.whitespace_zones,
    strongest_differentiators: diff_matrix.strongest_differentiators,
    strategic_opportunity: market_map.strategic_opportunity,
    competitive_density: market_map.competitive_density,
    brand_positioning_statement,
  };
}
