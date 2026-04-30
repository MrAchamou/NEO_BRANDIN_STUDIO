/**
 * AI ENGINE — Frontend client (BYOK)
 *
 * Stocke la config dual-mode côté navigateur uniquement (sessionStorage par
 * défaut pour ne PAS persister la clé entre sessions).
 *
 * - Mode "replit_managed" : aucune clé requise, headers vides.
 * - Mode "professional_openrouter" : la clé est conservée localement et
 *   envoyée à chaque requête via les en-têtes BYOK X-AI-Mode / X-AI-Model /
 *   X-OpenRouter-Key. Le serveur ne la stocke jamais.
 */

export type AIMode = "replit_managed" | "professional_openrouter";

export interface AIEngineConfig {
  mode: AIMode;
  /** Modèle OpenRouter sélectionné (slug). Vide en mode managed. */
  model: string;
  /** Clé OpenRouter brute. Présente uniquement en mode pro. */
  key: string;
  /** Label lisible du modèle pour l'UI. */
  modelLabel?: string;
}

export const OPENROUTER_MODELS: Array<{ id: string; label: string }> = [
  { id: "openai/gpt-4o", label: "GPT-4o" },
  { id: "anthropic/claude-3-opus", label: "Claude 3 Opus" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude Sonnet" },
  { id: "mistralai/mistral-large", label: "Mistral Large" },
];

const STORAGE_KEY = "ai-brand-os::engine-config::v1";

const DEFAULT_CONFIG: AIEngineConfig = {
  mode: "replit_managed",
  model: "",
  key: "",
};

// ─── Storage ─────────────────────────────────────────────────────────────────

function safeStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function loadEngineConfig(): AIEngineConfig {
  const store = safeStorage();
  if (!store) return DEFAULT_CONFIG;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AIEngineConfig>;
    if (parsed.mode === "professional_openrouter" && parsed.key) {
      return {
        mode: "professional_openrouter",
        model: parsed.model || OPENROUTER_MODELS[0].id,
        key: parsed.key,
        modelLabel: parsed.modelLabel,
      };
    }
    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveEngineConfig(config: AIEngineConfig): void {
  const store = safeStorage();
  if (!store) return;
  if (config.mode === "replit_managed") {
    store.removeItem(STORAGE_KEY);
    notifyChange();
    return;
  }
  store.setItem(STORAGE_KEY, JSON.stringify(config));
  notifyChange();
}

export function clearEngineConfig(): void {
  const store = safeStorage();
  store?.removeItem(STORAGE_KEY);
  notifyChange();
}

// ─── Headers BYOK pour les requêtes ──────────────────────────────────────────

export function getEngineHeaders(): Record<string, string> {
  const cfg = loadEngineConfig();
  const headers: Record<string, string> = {};

  // i18n — output language for AI-generated content (read from localStorage
  // directly to avoid circular imports with @/i18n)
  try {
    const store = typeof window !== "undefined" ? window.localStorage : null;
    if (store) {
      const uiLang = store.getItem("aibrandos.ui_lang");
      const outLang = store.getItem("aibrandos.output_lang") || uiLang;
      if (outLang) headers["X-Output-Lang"] = outLang;
      if (uiLang) headers["X-UI-Lang"] = uiLang;
    }
  } catch {
    // localStorage unavailable — backend will fall back to default (FR)
  }

  if (cfg.mode === "professional_openrouter" && cfg.key) {
    headers["X-AI-Mode"] = "professional_openrouter";
    headers["X-AI-Model"] = cfg.model || OPENROUTER_MODELS[0].id;
    headers["X-OpenRouter-Key"] = cfg.key;
  }
  return headers;
}

// ─── Validation côté serveur ─────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface ValidateResult {
  valid: boolean;
  reason?: string;
  credit_left?: number | null;
}

export async function validateOpenRouterKey(
  key: string,
): Promise<ValidateResult> {
  try {
    const r = await fetch(`${API}/api/ai-engine/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const body = (await r.json().catch(() => ({}))) as ValidateResult;
    if (!r.ok) {
      return {
        valid: false,
        reason: body.reason ?? `Validation refusée (HTTP ${r.status})`,
      };
    }
    return body;
  } catch (err) {
    return {
      valid: false,
      reason:
        err instanceof Error ? `Réseau : ${err.message}` : "Erreur réseau",
    };
  }
}

// ─── Évènement de changement (pour refresh du badge dans l'UI) ───────────────

const EVENT_NAME = "ai-engine:change";

function notifyChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function onEngineChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, cb);
  return () => window.removeEventListener(EVENT_NAME, cb);
}

// ─── Fetch wrapper qui injecte les headers BYOK automatiquement ──────────────

export function aiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const engineHeaders = getEngineHeaders();
  const merged: HeadersInit = {
    ...(init.headers ?? {}),
    ...engineHeaders,
  };
  return fetch(input, { ...init, headers: merged });
}
