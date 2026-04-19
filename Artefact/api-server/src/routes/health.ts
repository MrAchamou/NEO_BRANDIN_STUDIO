import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { testCerebrasKey, getRotationState, CEREBRAS_MODEL } from "../lib/cerebras-client";
import { testGeminiKey, getGeminiRotationState, GEMINI_MODEL } from "../lib/gemini-client";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// ─── Diagnostic Cerebras ──────────────────────────────────────────────────────
// GET /api/healthz/cerebras
// Teste chaque clé en parallèle et retourne l'état complet du pool de rotation.

router.get("/healthz/cerebras", async (_req, res) => {
  let currentIndex = 0;
  let totalKeys = 0;
  try {
    ({ currentIndex, totalKeys } = getRotationState());
  } catch (err) {
    res.status(503).json({
      model: CEREBRAS_MODEL,
      rotation: { nextKeyIndex: 0, nextKeyNumber: 0, totalKeys: 0 },
      summary: {
        available: 0,
        rate_limited: 0,
        errors: 1,
        health: "missing_keys",
      },
      keys: [],
      error: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  const results = await Promise.all(
    Array.from({ length: totalKeys }, (_, i) => testCerebrasKey(i))
  );

  const available = results.filter((r) => r.status === "ok").length;
  const rateLimited = results.filter((r) => r.status === "rate_limit").length;
  const errors = results.filter((r) => r.status === "error").length;

  res.json({
    model: CEREBRAS_MODEL,
    rotation: {
      nextKeyIndex: currentIndex,
      nextKeyNumber: currentIndex + 1,
      totalKeys,
    },
    summary: {
      available,
      rate_limited: rateLimited,
      errors,
      health: available > 0 ? "operational" : "degraded",
    },
    keys: results.map((r) => ({
      key: `#${r.index + 1}`,
      status: r.status,
      latencyMs: r.latencyMs,
      ...(r.error ? { error: r.error } : {}),
    })),
  });
});

router.get("/healthz/gemini", async (_req, res) => {
  let currentIndex = 0;
  let totalKeys = 0;
  try {
    ({ currentIndex, totalKeys } = getGeminiRotationState());
  } catch (err) {
    res.status(503).json({
      model: GEMINI_MODEL,
      rotation: { nextKeyIndex: 0, nextKeyNumber: 0, totalKeys: 0 },
      summary: {
        available: 0,
        rate_limited: 0,
        errors: 1,
        health: "missing_keys",
      },
      keys: [],
      error: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  const results = await Promise.all(
    Array.from({ length: totalKeys }, (_, i) => testGeminiKey(i))
  );

  const available = results.filter((r) => r.status === "ok").length;
  const rateLimited = results.filter((r) => r.status === "rate_limit").length;
  const errors = results.filter((r) => r.status === "error").length;

  res.json({
    model: GEMINI_MODEL,
    rotation: {
      nextKeyIndex: currentIndex,
      nextKeyNumber: currentIndex + 1,
      totalKeys,
    },
    summary: {
      available,
      rate_limited: rateLimited,
      errors,
      health: available > 0 ? "operational" : "degraded",
    },
    keys: results.map((r) => ({
      key: `#${r.index + 1}`,
      status: r.status,
      latencyMs: r.latencyMs,
      ...(r.error ? { error: r.error } : {}),
    })),
  });
});

export default router;
