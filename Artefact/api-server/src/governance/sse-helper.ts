/**
 * GOVERNANCE — Helper d'intégration SSE pour les routes streaming
 *
 * Centralise l'envoi des événements `governance` après chaque section
 * pour garantir un format homogène sur tous les modules.
 */

import type { Response } from "express";
import { applyGovernance, summarizeReport, type ApplyGovernanceOptions } from "./index";

/** Normalise le payload `governance` éventuellement envoyé par le client. */
export function extractBriefInputFromBody(body: any): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;
  // Le frontend peut envoyer soit un objet `governance`, soit `brand_lock`,
  // soit l'ensemble du brief à la racine.
  return body.governance ?? body.brand_lock ?? body;
}

export interface RunGovernancePassOptions extends ApplyGovernanceOptions {
  res: Response;
  sectionKey: string;
}

/**
 * Applique la gouvernance et émet un événement SSE `governance`.
 * Retourne le contenu (potentiellement réécrit) et le résumé.
 */
export function runGovernancePass(
  draft: string,
  options: RunGovernancePassOptions,
): { content: string; summary: ReturnType<typeof summarizeReport>; blocked: boolean } {
  const { res, sectionKey, ...rest } = options;
  const result = applyGovernance(draft, rest);
  const summary = summarizeReport(result.report);

  res.write(
    `data: ${JSON.stringify({
      type: "governance",
      key: sectionKey,
      summary,
      findings: result.report.findings.slice(0, 12),
    })}\n\n`,
  );

  return {
    content: result.content,
    summary,
    blocked: result.report.blocked,
  };
}
