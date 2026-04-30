/**
 * MODEL ROUTER — AI BRAND OS v3.x
 *
 * Couche d'orchestration AI qui route les requêtes de génération soit vers
 * l'infrastructure Replit native (clients OpenAI/Anthropic gérés serveur),
 * soit vers OpenRouter en mode professionnel (clé apportée par l'utilisateur,
 * BYOK — jamais persistée côté serveur).
 *
 * Règle de gouvernance : la pipeline (brandLock, sectorEngine, compliance,
 * voice, claims, pricing, wcag) est appliquée APRÈS la génération, quel que
 * soit le moteur. Ce module ne touche QUE la source de génération.
 */

import OpenAI from "openai";
import type { Request } from "express";

// ─── Types publics ────────────────────────────────────────────────────────────

export type AIMode = "replit_managed" | "professional_openrouter";

export interface AIEngineContext {
  mode: AIMode;
  /** Modèle effectif utilisé (peut être un alias OpenRouter en mode pro). */
  model: string;
  /** Client OpenAI-compatible (OpenRouter expose la même API qu'OpenAI). */
  client: OpenAI;
  /** Label lisible pour les logs/UI sans fuite de clé. */
  label: string;
}

// ─── Modèles supportés en mode professionnel ─────────────────────────────────

/**
 * Liste blanche des modèles OpenRouter exposés dans l'UI.
 * Les `id` correspondent aux slugs OpenRouter officiels.
 * Tout modèle hors liste passe par "custom".
 */
export const OPENROUTER_MODELS = [
  { id: "openai/gpt-4o", label: "GPT-4o" },
  { id: "anthropic/claude-3-opus", label: "Claude 3 Opus" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude Sonnet" },
  { id: "mistralai/mistral-large", label: "Mistral Large" },
] as const;

export type OpenRouterModelId = (typeof OPENROUTER_MODELS)[number]["id"];

const DEFAULT_REPLIT_MODEL = "gpt-5";

// ─── Détection du mode depuis la requête ──────────────────────────────────────

/**
 * Lit les headers BYOK envoyés par le frontend en mode professionnel.
 * - X-AI-Mode: "professional_openrouter" | "replit_managed"
 * - X-OpenRouter-Key: <clé brute> (jamais stockée côté serveur, jamais loggée)
 * - X-AI-Model: <slug modèle> (optionnel)
 */
function readEngineHeaders(req: Request): {
  mode: AIMode;
  key: string | null;
  model: string | null;
} {
  const rawMode = String(req.header("X-AI-Mode") ?? "").toLowerCase().trim();
  const key = (req.header("X-OpenRouter-Key") ?? "").trim() || null;
  const model = (req.header("X-AI-Model") ?? "").trim() || null;

  const mode: AIMode =
    rawMode === "professional_openrouter" && key
      ? "professional_openrouter"
      : "replit_managed";

  return { mode, key, model };
}

// ─── Construction du client AI selon le mode ──────────────────────────────────

/**
 * Retourne un contexte AI prêt à l'emploi pour la requête courante.
 * Fallback gracieux : si la clé OpenRouter est absente/invalide en cours de
 * route, l'appelant peut catch et re-router via `buildReplitContext()`.
 */
export function aiContextFromRequest(req: Request): AIEngineContext {
  const { mode, key, model } = readEngineHeaders(req);

  if (mode === "professional_openrouter" && key) {
    const effectiveModel = model || OPENROUTER_MODELS[0].id;
    const modelLabel =
      OPENROUTER_MODELS.find((m) => m.id === effectiveModel)?.label ??
      effectiveModel;

    return {
      mode: "professional_openrouter",
      model: effectiveModel,
      label: `Professional · ${modelLabel}`,
      client: new OpenAI({
        apiKey: key,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://aibrandos.replit.app",
          "X-Title": "AI BRAND OS",
        },
      }),
    };
  }

  return buildReplitContext();
}

/**
 * Contexte par défaut — clients managés Replit (clé serveur).
 */
export function buildReplitContext(): AIEngineContext {
  const apiKey =
    process.env["OPENAI_API_KEY"] ?? process.env["REPLIT_OPENAI_API_KEY"] ?? "";

  return {
    mode: "replit_managed",
    model: DEFAULT_REPLIT_MODEL,
    label: "Replit Managed",
    client: new OpenAI({ apiKey }),
  };
}

// ─── Validation de clé OpenRouter ─────────────────────────────────────────────

export interface OpenRouterValidation {
  valid: boolean;
  reason?: string;
  /** Crédit restant si l'API le retourne. */
  credit_left?: number | null;
  /** Limite quotidienne / mensuelle si exposée. */
  rate_limit?: unknown;
}

/**
 * Pingue l'endpoint d'auth OpenRouter pour vérifier qu'une clé est valide.
 * Ne logge jamais la clé. Renvoie un objet sérialisable pour l'UI.
 */
export async function validateOpenRouterKey(
  key: string,
): Promise<OpenRouterValidation> {
  if (!key || key.length < 8) {
    return { valid: false, reason: "Clé manquante ou trop courte" };
  }

  try {
    const r = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!r.ok) {
      return {
        valid: false,
        reason: `OpenRouter a refusé la clé (HTTP ${r.status})`,
      };
    }

    const body = (await r.json()) as {
      data?: { limit_remaining?: number | null; rate_limit?: unknown };
    };

    return {
      valid: true,
      credit_left: body?.data?.limit_remaining ?? null,
      rate_limit: body?.data?.rate_limit ?? null,
    };
  } catch (err) {
    return {
      valid: false,
      reason:
        err instanceof Error
          ? `Impossible de joindre OpenRouter : ${err.message}`
          : "Erreur réseau OpenRouter",
    };
  }
}

// ─── Helper de log sûr ────────────────────────────────────────────────────────

/**
 * Description publique de la configuration courante, sans aucune fuite de clé.
 */
export function describeContext(ctx: AIEngineContext): {
  mode: AIMode;
  model: string;
  label: string;
} {
  return { mode: ctx.mode, model: ctx.model, label: ctx.label };
}
