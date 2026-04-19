/**
 * Claude Client — Final Auditor (Replit AI Integration)
 * Utilise les clés Replit par défaut, pas de clé personnelle nécessaire.
 *
 * Modèle : claude-sonnet-4-6 (meilleur ratio qualité/vitesse pour la review)
 * Rôle   : auditer la version optimisée par GPT et compléter les angles oubliés
 */

import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-sonnet-4-6";

let claudeClientInstance: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!claudeClientInstance) {
    const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
    const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;

    if (!apiKey) {
      throw new Error(
        "AI_INTEGRATIONS_ANTHROPIC_API_KEY manquant — intégration Anthropic Replit non activée."
      );
    }

    claudeClientInstance = new Anthropic({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
  }
  return claudeClientInstance;
}
