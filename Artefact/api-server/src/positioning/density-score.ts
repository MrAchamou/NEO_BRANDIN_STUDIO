/**
 * STRATEGIC POSITIONING ENGINE — Competitive Density Score (Agency Mode)
 *
 * Mesure la densité compétitive d'un secteur et identifie les espaces blancs
 * pour positionner une marque avec un avantage différenciateur.
 */

import { type BrandArchetype } from "./archetype-engine";

export type Archetype = BrandArchetype;

export interface DensityScoreInput {
  sector?: string;
  archetype: Archetype;
  values?: string[];
  tone?: string;
}

export interface DensityScoreResult {
  category_crowding_level: "Low" | "Medium" | "High";
  differentiation_strength: number;
  white_space_opportunity_score: number;
  dominant_archetypes_in_sector: Archetype[];
  white_space_archetypes: Archetype[];
  crowding_analysis: string;
  differentiation_levers: string[];
}

// ── Archétypes dominants par secteur ────────────────────────────────────────
const SECTOR_DOMINANT_ARCHETYPES: Record<string, Archetype[]> = {
  cosmetics: ["Innocent", "Lover", "Caregiver"],
  fashion: ["Ruler", "Creator", "Lover"],
  finance: ["Ruler", "Sage", "Guardian"],
  saas: ["Sage", "Creator", "Hero"],
  food: ["Innocent", "Caregiver", "Explorer"],
  fitness: ["Hero", "Explorer", "Rebel"],
  luxury: ["Ruler", "Lover", "Creator"],
  ecommerce: ["Everyman", "Hero", "Innocent"],
};

const ALL_ARCHETYPES: Archetype[] = [
  "Innocent", "Everyman", "Hero", "Outlaw", "Explorer",
  "Creator", "Ruler", "Magician", "Lover", "Caregiver", "Jester", "Sage",
];

/**
 * Calcule le score de densité compétitive et les espaces blancs disponibles.
 */
export function computeDensityScore(input: DensityScoreInput): DensityScoreResult {
  const sector_key = (input.sector ?? "").toLowerCase().replace(/\s/g, "_");
  const dominant = SECTOR_DOMINANT_ARCHETYPES[sector_key] ?? SECTOR_DOMINANT_ARCHETYPES["ecommerce"];

  const is_dominant = dominant.includes(input.archetype);
  const dominant_count = dominant.length;

  // ── Niveau de crowding ────────────────────────────────────────────────────
  const category_crowding_level: DensityScoreResult["category_crowding_level"] =
    dominant_count >= 3 && is_dominant
      ? "High"
      : dominant_count >= 2 && is_dominant
        ? "Medium"
        : "Low";

  // ── Espace blanc ──────────────────────────────────────────────────────────
  const white_space_archetypes = ALL_ARCHETYPES.filter((a) => !dominant.includes(a));
  const white_space_opportunity_score = is_dominant
    ? Math.max(10 - dominant_count * 2, 2)
    : Math.min(8 + (white_space_archetypes.length > 5 ? 2 : 1), 10);

  // ── Force de différenciation ──────────────────────────────────────────────
  const value_bonus = (input.values?.length ?? 0) >= 3 ? 1.5 : 0.5;
  const tone_bonus = input.tone && !["neutral", "standard"].includes(input.tone.toLowerCase()) ? 1 : 0;
  const archetype_bonus = is_dominant ? 0 : 2;

  const differentiation_strength = Math.min(
    Math.round((5 + value_bonus + tone_bonus + archetype_bonus) * 10) / 10,
    10,
  );

  // ── Leviers de différenciation ────────────────────────────────────────────
  const differentiation_levers: string[] = [];

  if (is_dominant) {
    differentiation_levers.push(
      `L'archétype ${input.archetype} est dominant dans ce secteur — différencier via l'exécution et le ton`,
    );
    differentiation_levers.push("Cibler un sous-segment de niche non saturé");
    differentiation_levers.push(`Considérer un archétype secondaire : ${white_space_archetypes.slice(0, 2).join(", ")}`);
  } else {
    differentiation_levers.push(
      `L'archétype ${input.archetype} est rare dans ce secteur — avantage de positionnement distinct`,
    );
    differentiation_levers.push("Exploiter la dissonance créative vs la concurrence");
    differentiation_levers.push("Construire un territoire narratif inédit");
  }

  const crowding_analysis = buildCrowdingAnalysis(category_crowding_level, dominant, input.archetype, sector_key);

  return {
    category_crowding_level,
    differentiation_strength,
    white_space_opportunity_score,
    dominant_archetypes_in_sector: dominant,
    white_space_archetypes: white_space_archetypes.slice(0, 4),
    crowding_analysis,
    differentiation_levers,
  };
}

function buildCrowdingAnalysis(
  level: "Low" | "Medium" | "High",
  dominant: Archetype[],
  brand_archetype: Archetype,
  sector: string,
): string {
  const sector_label = sector.replace(/_/g, " ");
  if (level === "High") {
    return `Le secteur ${sector_label} est très saturé sur les archétypes ${dominant.join(", ")}. La marque partage son archétype (${brand_archetype}) avec ses principaux concurrents — différenciation par le ton et l'exécution essentielle.`;
  }
  if (level === "Medium") {
    return `Le secteur ${sector_label} présente une densité compétitive modérée. L'archétype ${brand_archetype} est partiellement partagé — des espaces de distinction existent.`;
  }
  return `Le secteur ${sector_label} offre un espace compétitif ouvert. L'archétype ${brand_archetype} représente une différenciation forte dans ce contexte.`;
}
