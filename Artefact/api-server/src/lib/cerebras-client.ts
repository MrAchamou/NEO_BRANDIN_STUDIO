/**
 * Cerebras API Client — Rotation intelligente sur 6 clés API
 *
 * Logique de rotation: chaque appel de génération utilise la clé suivante
 * dans la séquence circulaire (1→2→3→4→5→6→1→...) pour contourner
 * les limites de taux (cooldown) par clé.
 *
 * Retry automatique: si une clé est en file d'attente (429/queue_exceeded),
 * le client essaie automatiquement la clé suivante avant d'abandonner.
 */

import OpenAI from "openai";

export const CEREBRAS_MODEL = "qwen-3-235b-a22b-instruct-2507";
export const CEREBRAS_MODEL_FAST = "llama3.1-8b";
const CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1";

// ─── Chargement des clés depuis les variables d'environnement ─────────────────

function loadKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const key = process.env[`CEREBRAS_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  if (keys.length === 0) {
    throw new Error(
      "Aucune clé API Cerebras trouvée. Vérifie les secrets CEREBRAS_API_KEY_1 à CEREBRAS_API_KEY_6."
    );
  }
  return keys;
}

// ─── Pool de clients (un par clé) ────────────────────────────────────────────

let clientPool: OpenAI[] | null = null;
let rotationIndex = 0;

function getClientPool(): OpenAI[] {
  if (!clientPool) {
    const keys = loadKeys();
    clientPool = keys.map(
      (apiKey) =>
        new OpenAI({
          apiKey,
          baseURL: CEREBRAS_BASE_URL,
        })
    );
  }
  return clientPool;
}

function isRateLimitOrQueue(err: unknown): boolean {
  if (err instanceof OpenAI.APIError) {
    return err.status === 429;
  }
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    return e["code"] === "queue_exceeded" || e["status"] === 429;
  }
  return false;
}

// ─── Fonctions de création avec retry automatique ────────────────────────────

/**
 * Crée un appel de complétion normal (non-streaming) avec retry sur toutes les clés.
 * Si toutes les clés sont saturées, utilise le modèle rapide de secours.
 */
export async function cerebrasCreate(
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming
): Promise<OpenAI.Chat.ChatCompletion> {
  const pool = getClientPool();
  const startIndex = rotationIndex;

  for (let i = 0; i < pool.length; i++) {
    const idx = (startIndex + i) % pool.length;
    rotationIndex = (idx + 1) % pool.length;
    try {
      return await pool[idx].chat.completions.create(params);
    } catch (err) {
      if (isRateLimitOrQueue(err) && i < pool.length - 1) {
        continue;
      }
      // Dernier recours: modèle rapide sur la clé suivante
      if (isRateLimitOrQueue(err) && params.model !== CEREBRAS_MODEL_FAST) {
        const fallbackIdx = (idx + 1) % pool.length;
        return pool[fallbackIdx].chat.completions.create({
          ...params,
          model: CEREBRAS_MODEL_FAST,
        });
      }
      throw err;
    }
  }
  throw new Error("Toutes les clés Cerebras sont saturées.");
}

/**
 * Crée un appel de complétion en streaming avec retry sur toutes les clés.
 * Si toutes les clés sont saturées, utilise le modèle rapide de secours.
 */
export async function cerebrasStream(
  params: Omit<OpenAI.Chat.ChatCompletionCreateParamsStreaming, "stream">
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
  const pool = getClientPool();
  const startIndex = rotationIndex;

  for (let i = 0; i < pool.length; i++) {
    const idx = (startIndex + i) % pool.length;
    rotationIndex = (idx + 1) % pool.length;
    try {
      return await pool[idx].chat.completions.create({ ...params, stream: true });
    } catch (err) {
      if (isRateLimitOrQueue(err) && i < pool.length - 1) {
        continue;
      }
      // Dernier recours: modèle rapide sur la clé suivante
      if (isRateLimitOrQueue(err) && params.model !== CEREBRAS_MODEL_FAST) {
        const fallbackIdx = (idx + 1) % pool.length;
        return pool[fallbackIdx].chat.completions.create({
          ...params,
          model: CEREBRAS_MODEL_FAST,
          stream: true,
        });
      }
      throw err;
    }
  }
  throw new Error("Toutes les clés Cerebras sont saturées.");
}

/**
 * Retourne le prochain client Cerebras dans la rotation circulaire.
 * Chaque appel avance l'index d'une position.
 */
export function getNextCerebrasClient(): OpenAI {
  const pool = getClientPool();
  const client = pool[rotationIndex % pool.length];
  rotationIndex = (rotationIndex + 1) % pool.length;
  return client;
}

/**
 * Proxy compatible avec l'interface OpenAI standard (usage legacy).
 * Préférer cerebrasStream() / cerebrasCreate() pour la gestion des erreurs.
 */
export const cerebrasAI = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getNextCerebrasClient();
    const value = client[prop as keyof OpenAI];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
