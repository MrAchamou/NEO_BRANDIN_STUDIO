/**
 * ROUTES — AI Engine Configuration (v3.x Dual AI Mode)
 *
 * Expose le statut du moteur AI courant (Replit Managed par défaut /
 * Professional OpenRouter en BYOK) et la validation d'une clé OpenRouter.
 *
 * Sécurité :
 *  - Aucune clé n'est stockée côté serveur.
 *  - Les clés ne sont jamais loggées (cf. logger.ts redact paths).
 *  - La validation se fait via un ping read-only sur /auth/key.
 */

import { Router } from "express";
import {
  OPENROUTER_MODELS,
  aiContextFromRequest,
  describeContext,
  validateOpenRouterKey,
} from "../lib/model-router";

const router = Router();

/**
 * GET /api/ai-engine/config
 * Retourne le mode actif pour CETTE requête (basé sur les headers BYOK)
 * + la liste des modèles OpenRouter disponibles.
 */
router.get("/ai-engine/config", (req, res) => {
  const ctx = aiContextFromRequest(req);

  res.json({
    active: describeContext(ctx),
    available_models: OPENROUTER_MODELS,
    modes: [
      {
        id: "replit_managed",
        label: "Replit Managed",
        description:
          "Modèles AI gérés par AI BRAND OS via l'infrastructure Replit. Aucune configuration nécessaire.",
        requires_key: false,
      },
      {
        id: "professional_openrouter",
        label: "Professional (OpenRouter)",
        description:
          "Branchez votre clé OpenRouter pour choisir librement le modèle (GPT-4o, Claude Opus, Sonnet, Mistral Large…). Clé BYOK : jamais stockée côté serveur.",
        requires_key: true,
      },
    ],
    governance_note:
      "La gouvernance (brand lock, sector engine, compliance, voice, claims, pricing, WCAG) est appliquée quel que soit le moteur AI choisi.",
  });
});

/**
 * POST /api/ai-engine/validate
 * Body : { key: string }
 * Vérifie qu'une clé OpenRouter est valide (ping /auth/key).
 * La clé n'est ni stockée ni loggée.
 */
router.post("/ai-engine/validate", async (req, res) => {
  const key = typeof req.body?.key === "string" ? req.body.key.trim() : "";

  if (!key) {
    res.status(400).json({ valid: false, reason: "key requis" });
    return;
  }

  const result = await validateOpenRouterKey(key);

  if (!result.valid) {
    res.status(401).json(result);
    return;
  }

  res.json(result);
});

export default router;
