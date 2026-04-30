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

export default router;
