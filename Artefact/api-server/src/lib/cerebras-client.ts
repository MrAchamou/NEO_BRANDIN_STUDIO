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

export function getRotationState(): { currentIndex: number; totalKeys: number } {
  const pool = getClientPool();
  return { currentIndex: rotationIndex, totalKeys: pool.length };
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

// ─── Test d'une clé individuelle ─────────────────────────────────────────────

export async function testCerebrasKey(keyIndex: number): Promise<{
  index: number;
  status: "ok" | "rate_limit" | "error";
  latencyMs?: number;
  error?: string;
}> {
  const pool = getClientPool();
  if (keyIndex >= pool.length) {
    return { index: keyIndex, status: "error", error: "Index hors limites" };
  }

  const start = Date.now();
  try {
    await pool[keyIndex].chat.completions.create({
      model: CEREBRAS_MODEL_FAST,
      messages: [{ role: "user", content: "1+1=" }],
      max_tokens: 5,
    });
    return { index: keyIndex, status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    if (isRateLimitOrQueue(err)) {
      return { index: keyIndex, status: "rate_limit", latencyMs: Date.now() - start };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { index: keyIndex, status: "error", latencyMs: Date.now() - start, error: message };
  }
}

// ─── Fonctions de création avec retry automatique ────────────────────────────

/**
 * Crée un appel de complétion normal (non-streaming) avec retry sur toutes les clés.
 * Si toutes les clés sont saturées, utilise le modèle rapide de secours.
 */
export async function cerebrasCreate(
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  label?: string
): Promise<OpenAI.Chat.ChatCompletion> {
  const pool = getClientPool();
  const startIndex = rotationIndex;

  for (let i = 0; i < pool.length; i++) {
    const idx = (startIndex + i) % pool.length;
    rotationIndex = (idx + 1) % pool.length;
    const keyNum = idx + 1;
    try {
      const result = await pool[idx].chat.completions.create(params);
      console.log(`[Cerebras] ✓ ${label ?? "create"} → clé #${keyNum}/${pool.length}`);
      return result;
    } catch (err) {
      if (isRateLimitOrQueue(err) && i < pool.length - 1) {
        console.log(`[Cerebras] ⏳ clé #${keyNum} saturée → essai clé #${((idx + 1) % pool.length) + 1}`);
        continue;
      }
      if (isRateLimitOrQueue(err) && params.model !== CEREBRAS_MODEL_FAST) {
        const fallbackIdx = (idx + 1) % pool.length;
        console.log(`[Cerebras] ⚡ fallback rapide → clé #${fallbackIdx + 1} (${CEREBRAS_MODEL_FAST})`);
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
 *
 * La rotation avance d'une clé à chaque appel réussi — ainsi chaque section
 * d'une génération multi-sections utilise une clé différente, contournant
 * les cooldowns par clé.
 */
export async function cerebrasStream(
  params: Omit<OpenAI.Chat.ChatCompletionCreateParamsStreaming, "stream">,
  label?: string
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
  const pool = getClientPool();
  const startIndex = rotationIndex;

  for (let i = 0; i < pool.length; i++) {
    const idx = (startIndex + i) % pool.length;
    rotationIndex = (idx + 1) % pool.length;
    const keyNum = idx + 1;
    try {
      const stream = await pool[idx].chat.completions.create({ ...params, stream: true });
      console.log(`[Cerebras] ✓ ${label ?? "stream"} → clé #${keyNum}/${pool.length} (next: #${rotationIndex + 1})`);
      return stream;
    } catch (err) {
      if (isRateLimitOrQueue(err) && i < pool.length - 1) {
        console.log(`[Cerebras] ⏳ clé #${keyNum} saturée → essai clé #${((idx + 1) % pool.length) + 1}`);
        continue;
      }
      if (isRateLimitOrQueue(err) && params.model !== CEREBRAS_MODEL_FAST) {
        const fallbackIdx = (idx + 1) % pool.length;
        console.log(`[Cerebras] ⚡ fallback rapide → clé #${fallbackIdx + 1} (${CEREBRAS_MODEL_FAST})`);
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
