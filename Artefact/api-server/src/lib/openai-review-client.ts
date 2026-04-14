/**
 * GPT Review Client — Agent Challenger (Replit AI Integration)
 * Utilise les clés Replit par défaut, pas de clé OpenAI personnelle nécessaire.
 *
 * Modèle : gpt-5.2 (modèle phare OpenAI via Replit)
 * Rôle   : évaluer et raffiner les prompts générés par Cerebras,
 *           en débat contradictoire avec Claude
 *
 * Note: Ce client est DISTINCT du client Cerebras (qui utilise aussi l'interface OpenAI).
 * Celui-ci pointe vers l'API OpenAI officielle via l'intégration Replit.
 */

import OpenAI from "openai";

export const GPT_MODEL = "gpt-5-mini";

let gptReviewClientInstance: OpenAI | null = null;

export function getGptReviewClient(): OpenAI {
  if (!gptReviewClientInstance) {
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

    if (!apiKey) {
      throw new Error(
        "AI_INTEGRATIONS_OPENAI_API_KEY manquant — intégration OpenAI Replit non activée."
      );
    }

    gptReviewClientInstance = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
  }
  return gptReviewClientInstance;
}
