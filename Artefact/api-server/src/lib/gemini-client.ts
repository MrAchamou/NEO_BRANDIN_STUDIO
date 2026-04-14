/**
 * Gemini API Client — Mode Ultra-Qualité
 * Rotation intelligente sur 5 clés API
 *
 * Utilise l'endpoint OpenAI-compatible de Google Gemini pour une intégration
 * transparente avec le reste du codebase.
 *
 * Rotation: chaque appel ultra-qualité utilise la clé suivante dans la
 * séquence circulaire (1→2→3→4→5→1→...) pour contourner les cooldowns.
 */

import OpenAI from "openai";

export const GEMINI_MODEL = "gemini-2.0-flash";
export const GEMINI_MODEL_PRO = "gemini-2.5-pro-exp-03-25";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

// ─── Chargement des clés depuis les variables d'environnement ─────────────────

function loadGeminiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  if (keys.length === 0) {
    throw new Error(
      "Aucune clé API Gemini trouvée. Vérifie les secrets GEMINI_API_KEY_1 à GEMINI_API_KEY_5."
    );
  }
  return keys;
}

// ─── Pool de clients (un par clé) ────────────────────────────────────────────

let geminiClientPool: OpenAI[] | null = null;
let geminiRotationIndex = 0;

function getGeminiClientPool(): OpenAI[] {
  if (!geminiClientPool) {
    const keys = loadGeminiKeys();
    geminiClientPool = keys.map(
      (apiKey) =>
        new OpenAI({
          apiKey,
          baseURL: GEMINI_BASE_URL,
        })
    );
  }
  return geminiClientPool;
}

/**
 * Retourne le prochain client Gemini dans la rotation circulaire.
 * Chaque appel avance l'index d'une position.
 */
export function getNextGeminiClient(): OpenAI {
  const pool = getGeminiClientPool();
  const client = pool[geminiRotationIndex % pool.length];
  geminiRotationIndex = (geminiRotationIndex + 1) % pool.length;
  return client;
}

/**
 * Proxy compatible avec l'interface OpenAI standard.
 * Chaque accès à une propriété (ex: .chat) déclenche la rotation vers la clé suivante.
 * Utilisation identique aux objets `openai` et `cerebrasAI`.
 */
export const geminiAI = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getNextGeminiClient();
    const value = client[prop as keyof OpenAI];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
