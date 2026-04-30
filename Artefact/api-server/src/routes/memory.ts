/**
 * ROUTES — Brand Memory Engine (v3.0)
 *
 * Expose les endpoints pour interagir avec la mémoire de marque :
 * log des corrections, profil mémoire, stats.
 */

import { Router } from "express";
import { logCorrection, logApproval, logRejection, logGovernanceOverride, summarizeCorrectionPatterns } from "../memory/correction-log";
import { recordDecision, getDecisions, summarizeDecisionHistory } from "../memory/decision-history";
import { getMemoryProfile, invalidateMemoryProfile } from "../memory/memory-profile-builder";
import { getMemoryStats, clearMemory } from "../memory/memory-store";
import { detectBrandDrift } from "../memory/drift-detector";
import { generateEvolutionTimeline } from "../memory/evolution-timeline";

const router = Router();

/**
 * GET /api/memory/profile/:brand_id
 * Retourne le profil mémoire dynamique d'une marque.
 */
router.get("/memory/profile/:brand_id", (req, res) => {
  const { brand_id } = req.params;
  const profile = getMemoryProfile(brand_id);
  res.json({ profile });
});

/**
 * GET /api/memory/stats/:brand_id
 * Retourne les stats d'interactions mémoire d'une marque.
 */
router.get("/memory/stats/:brand_id", (req, res) => {
  const { brand_id } = req.params;
  const stats = getMemoryStats(brand_id);
  const correction_summary = summarizeCorrectionPatterns(brand_id);
  const decision_summary = summarizeDecisionHistory(brand_id);
  const decisions = getDecisions(brand_id, undefined, 10);

  res.json({ stats, correction_summary, decision_summary, recent_decisions: decisions });
});

/**
 * POST /api/memory/correction
 * Log une correction humaine sur un output généré.
 */
router.post("/memory/correction", (req, res) => {
  const { brand_id, module, section_key, before, after, context, impact_level } = req.body;

  if (!brand_id || !module || !before || !after) {
    res.status(400).json({ error: "brand_id, module, before, after requis" });
    return;
  }

  const entry = logCorrection({ brand_id, module, section_key, before, after, context, impact_level });
  invalidateMemoryProfile(brand_id);
  res.json({ success: true, entry });
});

/**
 * POST /api/memory/approval
 * Log une approbation d'output.
 */
router.post("/memory/approval", (req, res) => {
  const { brand_id, module, content, section_key } = req.body;
  if (!brand_id || !module || !content) {
    res.status(400).json({ error: "brand_id, module, content requis" });
    return;
  }
  const entry = logApproval(brand_id, module, content, section_key);
  invalidateMemoryProfile(brand_id);
  res.json({ success: true, entry });
});

/**
 * POST /api/memory/rejection
 * Log un rejet d'output.
 */
router.post("/memory/rejection", (req, res) => {
  const { brand_id, module, content, reason, section_key } = req.body;
  if (!brand_id || !module || !content) {
    res.status(400).json({ error: "brand_id, module, content requis" });
    return;
  }
  const entry = logRejection(brand_id, module, content, reason, section_key);
  invalidateMemoryProfile(brand_id);
  res.json({ success: true, entry });
});

/**
 * POST /api/memory/override
 * Log un override de règle de gouvernance.
 */
router.post("/memory/override", (req, res) => {
  const { brand_id, module, rule_category, original, overridden_to } = req.body;
  if (!brand_id || !module || !rule_category || !original || !overridden_to) {
    res.status(400).json({ error: "Tous les champs requis" });
    return;
  }
  const entry = logGovernanceOverride(brand_id, module, rule_category, original, overridden_to);
  invalidateMemoryProfile(brand_id);
  res.json({ success: true, entry });
});

/**
 * POST /api/memory/decision
 * Enregistre une décision stratégique (changement de tone, growth_mode, etc.).
 */
router.post("/memory/decision", (req, res) => {
  const { brand_id, category, from_value, to_value, rationale } = req.body;
  if (!brand_id || !category || !from_value || !to_value) {
    res.status(400).json({ error: "brand_id, category, from_value, to_value requis" });
    return;
  }
  const decision = recordDecision(brand_id, category, from_value, to_value, rationale);
  invalidateMemoryProfile(brand_id);
  res.json({ success: true, decision });
});

/**
 * DELETE /api/memory/:brand_id
 * Réinitialise la mémoire d'une marque.
 */
router.delete("/memory/:brand_id", (req, res) => {
  const { brand_id } = req.params;
  clearMemory(brand_id);
  invalidateMemoryProfile(brand_id);
  res.json({ success: true, message: `Mémoire de ${brand_id} réinitialisée` });
});

/**
 * GET /api/memory/drift/:brand_id
 * Détecte la dérive stratégique d'une marque (Agency Mode).
 */
router.get("/memory/drift/:brand_id", (req, res) => {
  const { brand_id } = req.params;
  const drift = detectBrandDrift(brand_id);
  res.json(drift);
});

/**
 * GET /api/memory/timeline/:brand_id
 * Génère la timeline d'évolution stratégique — format client-ready.
 */
router.get("/memory/timeline/:brand_id", (req, res) => {
  const { brand_id } = req.params;
  const timeline = generateEvolutionTimeline(brand_id);
  res.json(timeline);
});

export default router;
