/**
 * ROUTES — Strategic Positioning Engine (v3.0)
 *
 * Expose les endpoints pour le positionnement stratégique :
 * détection d'archétype, cartographie de marché, analyse concurrentielle,
 * territoire narratif, et gestion du positioning lock.
 */

import { Router } from "express";
import { detectArchetype } from "../positioning/archetype-engine";
import { buildMarketMap } from "../positioning/market-mapping";
import { runCompetitorAnalysis } from "../positioning/competitor-analysis";
import { buildBrandTerritory, brandTerritoryToPromptBlock } from "../positioning/territory-builder";
import {
  setPositioningLock,
  getPositioningLock,
  clearPositioningLock,
  positioningLockToPromptBlock,
} from "../positioning/positioning-lock";
import { computeDensityScore } from "../positioning/density-score";
import { runStressTest } from "../positioning/stress-test";
import { generateStrategicCompression } from "../positioning/strategic-compression";

const router = Router();

/**
 * POST /api/positioning/analyze
 * Analyse complète de positionnement stratégique pour une marque.
 * Construit l'archétype, la carte de marché, le territoire narratif
 * et enregistre automatiquement le positioning lock.
 */
router.post("/positioning/analyze", (req, res) => {
  const {
    brand_id,
    brand_name,
    sector,
    tone,
    values,
    growth_mode,
    description,
    price_tier,
  } = req.body;

  if (!brand_id || !brand_name) {
    res.status(400).json({ error: "brand_id et brand_name requis" });
    return;
  }

  const values_array = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values.split(/[\n,;]/).map((v: string) => v.trim()).filter(Boolean)
      : [];

  // 1) Détection d'archétype
  const archetype_result = detectArchetype({
    brand_name,
    sector,
    tone,
    values: values_array,
    growth_mode,
    description,
  });

  // 2) Cartographie de marché
  const market_map = buildMarketMap({
    sector,
    tone,
    values: values_array,
    growth_mode,
    description,
    price_tier,
  });

  // 3) Territoire narratif
  const territory = buildBrandTerritory(
    archetype_result.primary,
    brand_name,
    sector ?? "",
  );

  // 4) Analyse concurrentielle
  const competitor_analysis = runCompetitorAnalysis({
    brand_name,
    sector,
    tone,
    values: values_array,
    growth_mode,
    description,
    archetype: archetype_result.primary,
    price_tier,
  });

  // 5) Enregistrement du positioning lock
  const lock = setPositioningLock(brand_id, {
    archetype: archetype_result.primary,
    secondary_archetype: archetype_result.secondary,
    territory,
    market_map,
  });

  res.json({
    archetype: archetype_result,
    market_map,
    territory,
    competitor_analysis,
    positioning_lock: lock,
    prompt_block: brandTerritoryToPromptBlock(territory),
  });
});

/**
 * GET /api/positioning/lock/:brand_id
 * Récupère le positioning lock actif d'une marque.
 */
router.get("/positioning/lock/:brand_id", (req, res) => {
  const { brand_id } = req.params;
  const lock = getPositioningLock(brand_id);

  if (!lock) {
    res.status(404).json({ error: "Aucun positioning lock pour cette marque", brand_id });
    return;
  }

  res.json({
    lock,
    prompt_block: positioningLockToPromptBlock(lock),
  });
});

/**
 * DELETE /api/positioning/lock/:brand_id
 * Réinitialise le positioning lock d'une marque.
 */
router.delete("/positioning/lock/:brand_id", (req, res) => {
  const { brand_id } = req.params;
  clearPositioningLock(brand_id);
  res.json({ success: true, message: `Positioning lock de ${brand_id} supprimé` });
});

/**
 * POST /api/positioning/archetype
 * Détecte uniquement l'archétype sans tout le pipeline.
 */
router.post("/positioning/archetype", (req, res) => {
  const { brand_name, sector, tone, values, growth_mode, description } = req.body;

  if (!brand_name) {
    res.status(400).json({ error: "brand_name requis" });
    return;
  }

  const values_array = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values.split(/[\n,;]/).map((v: string) => v.trim()).filter(Boolean)
      : [];

  const result = detectArchetype({ brand_name, sector, tone, values: values_array, growth_mode, description });
  res.json(result);
});

/**
 * POST /api/positioning/density
 * Calcule le Competitive Density Score et identifie les espaces blancs (Agency Mode).
 */
router.post("/positioning/density", (req, res) => {
  const { sector, archetype, values, tone } = req.body;

  if (!archetype) {
    res.status(400).json({ error: "archetype requis" });
    return;
  }

  const values_array = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values.split(/[\n,;]/).map((v: string) => v.trim()).filter(Boolean)
      : [];

  const result = computeDensityScore({ sector, archetype, values: values_array, tone });
  res.json(result);
});

/**
 * POST /api/positioning/stress-test
 * Exécute le stress test du positionnement sur 5 dimensions (Agency Mode).
 */
router.post("/positioning/stress-test", (req, res) => {
  const { brand_id, brand_name, sector, tone, values, archetype } = req.body;

  if (!brand_name || !archetype) {
    res.status(400).json({ error: "brand_name et archetype requis" });
    return;
  }

  const lock = brand_id ? getPositioningLock(brand_id) : null;
  const values_array = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values.split(/[\n,;]/).map((v: string) => v.trim()).filter(Boolean)
      : [];

  // Construire le territoire si pas de lock
  const territory = lock?.territory ?? buildBrandTerritory(archetype, brand_name, sector ?? "");
  const market_map = lock?.market_map ?? buildMarketMap({ sector, tone, values: values_array });

  const result = runStressTest({
    brand_name,
    sector,
    tone,
    archetype,
    territory,
    market_map,
    values: values_array,
  });

  res.json(result);
});

/**
 * POST /api/positioning/compress
 * Génère la compression stratégique complète — 5 livrables agency-ready.
 */
router.post("/positioning/compress", (req, res) => {
  const { brand_id, brand_name, sector, tone, values, archetype, output_mode } = req.body;

  if (!brand_name || !archetype) {
    res.status(400).json({ error: "brand_name et archetype requis" });
    return;
  }

  const lock = brand_id ? getPositioningLock(brand_id) : null;
  const values_array = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values.split(/[\n,;]/).map((v: string) => v.trim()).filter(Boolean)
      : [];

  const territory = lock?.territory ?? buildBrandTerritory(archetype, brand_name, sector ?? "");

  const result = generateStrategicCompression({
    brand_name,
    archetype,
    sector,
    territory,
    values: values_array,
    tone,
    output_mode: output_mode ?? "client_ready",
  });

  res.json(result);
});

/**
 * POST /api/positioning/compare
 * Compare deux marques sur les dimensions stratégiques clés (Agency Mode).
 */
router.post("/positioning/compare", (req, res) => {
  const { brand_a, brand_b } = req.body;

  if (!brand_a?.brand_id || !brand_b?.brand_id) {
    res.status(400).json({ error: "brand_a.brand_id et brand_b.brand_id requis" });
    return;
  }

  const lock_a = getPositioningLock(brand_a.brand_id);
  const lock_b = getPositioningLock(brand_b.brand_id);

  if (!lock_a || !lock_b) {
    res.status(404).json({
      error: "Positioning lock introuvable pour une ou les deux marques",
      missing: [!lock_a && brand_a.brand_id, !lock_b && brand_b.brand_id].filter(Boolean),
    });
    return;
  }

  const comparison = {
    generated_at: new Date().toISOString(),
    brand_a: {
      brand_id: brand_a.brand_id,
      archetype: lock_a.archetype,
      secondary_archetype: lock_a.secondary_archetype,
      market_position: lock_a.market_map?.axes ?? [],
    },
    brand_b: {
      brand_id: brand_b.brand_id,
      archetype: lock_b.archetype,
      secondary_archetype: lock_b.secondary_archetype,
      market_position: lock_b.market_map?.axes ?? [],
    },
    archetype_overlap: lock_a.archetype === lock_b.archetype,
    differentiation_gap:
      lock_a.archetype !== lock_b.archetype
        ? `Archétypes distincts (${lock_a.archetype} vs ${lock_b.archetype}) — différenciation naturelle forte`
        : `Même archétype dominant (${lock_a.archetype}) — différenciation par l'exécution nécessaire`,
  };

  res.json(comparison);
});

export default router;
