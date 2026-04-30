/**
 * STRATEGIC POSITIONING ENGINE — Positioning Stress Test (Agency Mode)
 *
 * Évalue la robustesse du positionnement stratégique sur 5 dimensions :
 * - Alignement de ton avec le secteur
 * - Cohérence narrative
 * - Consistance émotionnelle
 * - Chevauchement concurrentiel
 * - Clarté stratégique
 */

import { type BrandArchetype as Archetype } from "./archetype-engine";
import { type BrandTerritory } from "./territory-builder";
import { type MarketMapResult as MarketMap } from "./market-mapping";

export interface StressTestInput {
  brand_name: string;
  sector?: string;
  tone?: string;
  archetype: Archetype;
  territory: BrandTerritory;
  market_map: MarketMap;
  values?: string[];
}

export interface StressTestDimension {
  dimension: string;
  score: number;
  max: number;
  label: string;
  observation: string;
}

export interface StressTestResult {
  brand_name: string;
  generated_at: string;
  positioning_coherence: number;
  differentiation_strength: number;
  strategic_clarity: number;
  overlap_risk: "Low" | "Moderate" | "High";
  emotional_consistency: number;
  dimensions: StressTestDimension[];
  global_score: number;
  verdict: string;
  recommendations: string[];
}

const SECTOR_TONE_MAP: Record<string, string[]> = {
  cosmetics: ["elegant", "doux", "naturel", "inspirant", "premium"],
  fashion: ["audacieux", "statement", "contemporain", "cool", "désirable"],
  finance: ["expert", "rassurant", "sérieux", "autoritaire", "clair"],
  saas: ["expert", "efficace", "technique", "direct", "clair"],
  food: ["chaleureux", "authentique", "savoureux", "naturel", "convivial"],
  fitness: ["motivant", "énergique", "direct", "intense", "positif"],
};

const ARCHETYPE_EMOTIONAL_TONES: Record<Archetype, string[]> = {
  Innocent: ["espoir", "pureté", "joie", "confiance"],
  Everyman: ["chaleur", "authenticité", "simplicité", "accessibilité"],
  Hero: ["courage", "dépassement", "victoire", "force"],
  Outlaw: ["rébellion", "transgression", "liberté", "provocation"],
  Explorer: ["découverte", "aventure", "curiosité", "liberté"],
  Creator: ["imagination", "originalité", "vision", "expression"],
  Ruler: ["prestige", "autorité", "excellence", "maîtrise"],
  Magician: ["transformation", "magie", "révélation", "puissance"],
  Lover: ["désir", "beauté", "sensualité", "connexion"],
  Caregiver: ["soin", "bienveillance", "protection", "empathie"],
  Jester: ["humour", "légèreté", "joie", "spontanéité"],
  Sage: ["sagesse", "expertise", "vérité", "clarté"],
};

/**
 * Exécute le stress test complet du positionnement.
 */
export function runStressTest(input: StressTestInput): StressTestResult {
  const { brand_name, sector, tone, archetype, territory, market_map, values } = input;

  const dimensions: StressTestDimension[] = [];

  // ── 1. Alignement de ton avec le secteur ─────────────────────────────────
  const sector_key = (sector ?? "").toLowerCase().replace(/\s/g, "_");
  const expected_tones = SECTOR_TONE_MAP[sector_key] ?? [];
  const tone_match = tone ? expected_tones.some((t) => tone.toLowerCase().includes(t)) : false;
  const tone_score = expected_tones.length === 0 ? 7 : tone_match ? 9 : 5;

  dimensions.push({
    dimension: "Alignement Ton / Secteur",
    score: tone_score,
    max: 10,
    label: tone_score >= 8 ? "Excellent" : tone_score >= 6 ? "Correct" : "À revoir",
    observation:
      tone_match
        ? `Le ton "${tone}" est cohérent avec les standards du secteur ${sector}`
        : expected_tones.length > 0
          ? `Le ton "${tone}" diffère des normes sectorielles — peut être un avantage différenciateur ou un risque`
          : "Secteur non référencé — évaluation manuelle recommandée",
  });

  // ── 2. Cohérence narrative ────────────────────────────────────────────────
  const has_tension = (territory.core_tension?.length ?? 0) > 20;
  const has_promise = (territory.brand_promise?.length ?? 0) > 20;
  const has_pillars = !!(territory.functional_pillar && territory.emotional_hook && territory.cultural_anchor);
  const narrative_score = [has_tension, has_promise, has_pillars].filter(Boolean).length * 3 + 1;

  dimensions.push({
    dimension: "Cohérence Narrative",
    score: Math.min(narrative_score, 10),
    max: 10,
    label: narrative_score >= 8 ? "Solide" : narrative_score >= 5 ? "Partielle" : "Incomplète",
    observation:
      narrative_score >= 8
        ? "Territoire narratif complet et articulé"
        : "Éléments manquants : " + [!has_tension && "tension", !has_promise && "promesse", !has_pillars && "piliers fonctionnels"].filter(Boolean).join(", "),
  });

  // ── 3. Consistance émotionnelle ───────────────────────────────────────────
  const expected_emotions = ARCHETYPE_EMOTIONAL_TONES[archetype] ?? [];
  const values_lower = (values ?? []).map((v) => v.toLowerCase());
  const emotion_matches = expected_emotions.filter((e) =>
    values_lower.some((v) => v.includes(e) || e.includes(v)),
  ).length;

  const emotional_consistency = Math.round(
    expected_emotions.length > 0
      ? 5 + (emotion_matches / expected_emotions.length) * 5
      : 7,
  );

  dimensions.push({
    dimension: "Consistance Émotionnelle",
    score: emotional_consistency,
    max: 10,
    label: emotional_consistency >= 8 ? "Élevée" : emotional_consistency >= 6 ? "Modérée" : "Faible",
    observation:
      emotion_matches > 0
        ? `${emotion_matches}/${expected_emotions.length} signaux émotionnels de l'archétype ${archetype} présents`
        : `Signaux émotionnels de l'archétype ${archetype} (${expected_emotions.join(", ")}) peu présents dans les valeurs`,
  });

  // ── 4. Chevauchement concurrentiel ────────────────────────────────────────
  const axes_extreme =
    market_map.axes.filter((a) => Math.abs(a.position) >= 1.5).length;
  const overlap_score = Math.min(4 + axes_extreme * 2, 10);
  const overlap_risk: StressTestResult["overlap_risk"] =
    overlap_score >= 8 ? "Low" : overlap_score >= 5 ? "Moderate" : "High";

  dimensions.push({
    dimension: "Chevauchement Concurrentiel",
    score: overlap_score,
    max: 10,
    label: overlap_risk === "Low" ? "Risque faible" : overlap_risk === "Moderate" ? "Risque modéré" : "Risque élevé",
    observation:
      axes_extreme >= 2
        ? `Positionnement différencié sur ${axes_extreme} axes — chevauchement limité`
        : "Positionnement central — risque de dilution dans la masse",
  });

  // ── 5. Clarté stratégique ─────────────────────────────────────────────────
  const clarity_score = Math.round(
    (tone_score * 0.25 + narrative_score * 0.35 + emotional_consistency * 0.25 + overlap_score * 0.15),
  );

  dimensions.push({
    dimension: "Clarté Stratégique",
    score: clarity_score,
    max: 10,
    label: clarity_score >= 8 ? "Excellente" : clarity_score >= 6 ? "Bonne" : "À consolider",
    observation:
      clarity_score >= 8
        ? "La stratégie est lisible, cohérente et différenciante"
        : "Des ajustements sont nécessaires pour renforcer la lisibilité",
  });

  // ── Scores globaux ────────────────────────────────────────────────────────
  const positioning_coherence = Math.round((tone_score + narrative_score) / 2 * 10) / 10;
  const differentiation_strength = Math.round((overlap_score + emotional_consistency) / 2 * 10) / 10;
  const strategic_clarity = clarity_score;
  const global_score = Math.round(
    dimensions.reduce((a, d) => a + d.score, 0) / dimensions.length * 10,
  ) / 10;

  const verdict =
    global_score >= 8.5
      ? "Positionnement solide — prêt pour le déploiement"
      : global_score >= 7
        ? "Positionnement robuste avec ajustements mineurs recommandés"
        : global_score >= 5.5
          ? "Positionnement partiel — renforcements nécessaires avant déploiement"
          : "Positionnement fragile — révision stratégique obligatoire";

  const recommendations = buildRecommendations(dimensions);

  return {
    brand_name,
    generated_at: new Date().toISOString(),
    positioning_coherence,
    differentiation_strength,
    strategic_clarity,
    overlap_risk,
    emotional_consistency,
    dimensions,
    global_score,
    verdict,
    recommendations,
  };
}

function buildRecommendations(dimensions: StressTestDimension[]): string[] {
  return dimensions
    .filter((d) => d.score < 7)
    .sort((a, b) => a.score - b.score)
    .map((d) => `Renforcer "${d.dimension}" (${d.score}/10) : ${d.observation}`);
}
