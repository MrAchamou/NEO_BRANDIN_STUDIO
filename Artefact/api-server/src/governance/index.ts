/**
 * GOVERNANCE — Pipeline orchestrateur
 *
 *   draft (LLM) → complianceAgent → voiceEnforcer → factsValidator → output
 *
 * Une seule fonction publique (`applyGovernance`) à brancher dans toutes les
 * routes API. Si aucun lock n'est fourni, le pipeline est neutre (no-op),
 * pour préserver la compatibilité ascendante.
 */

import { runComplianceAgent } from "./compliance-agent";
import { runVoiceEnforcer } from "./voice-enforcer";
import type {
  BrandLock,
  GovernanceFinding,
  GovernanceReport,
  GovernanceResult,
} from "./types";
import { buildBrandLock, type RawBrandBriefInput } from "./brand-lock";

export * from "./types";
export * from "./brand-lock";
export * from "./growth-modes";
export * from "./compliance-agent";
export * from "./voice-enforcer";
export * from "./profit-engine";

// ─── Pipeline principal ─────────────────────────────────────────────────────

export interface ApplyGovernanceOptions {
  /** Lock prêt à l'emploi (priorité sur `briefInput`). */
  lock?: BrandLock | null;
  /** Sinon, on construit le lock à partir du brief brut. */
  briefInput?: RawBrandBriefInput | null;
  /** Identifie la section pour les logs / stream events. */
  sectionKey?: string;
}

export function applyGovernance(
  draft: string,
  options: ApplyGovernanceOptions = {},
): GovernanceResult {
  const lock = options.lock ?? (options.briefInput ? buildBrandLock(options.briefInput) : null);

  if (!lock) {
    // Pas de lock → pipeline neutre.
    return {
      content: draft,
      report: {
        pass: true,
        mode: "premium_brand",
        findings: [],
        rewrites: 0,
        blocked: false,
      },
    };
  }

  const findings: GovernanceFinding[] = [];

  // ── 1) Compliance (claims, fake stats, fake certs, dark patterns) ──────
  const c = runComplianceAgent(draft, lock);
  findings.push(...c.findings);

  // ── 2) Voice (mots interdits, exclamations, emojis, urgence) ──────────
  const v = runVoiceEnforcer(c.content, lock);
  findings.push(...v.findings);

  // ── 3) Verrou prix : si un prix lock est défini, on signale les autres ─
  if (lock.product.price !== undefined) {
    const priceLocked = lock.product.price;
    const currency = lock.product.currency ?? "EUR";
    // On accepte ce prix exact + son ancien prix éventuel + multiples cohérents pour les bundles.
    const acceptable = new Set<number>([priceLocked]);
    if (lock.product.old_price !== undefined) acceptable.add(lock.product.old_price);
    const priceRegex = /(\d{2,5})(?:[.,](\d{2}))?\s*(€|EUR|USD|\$|GBP|£|FCFA|CHF|AED|DH|CA\$|₦)/gi;
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = priceRegex.exec(v.content)) !== null) {
      const intPart = parseInt(match[1], 10);
      if (!Number.isFinite(intPart)) continue;
      // Ignorer les nombres très grands (objectifs CA mensuels, etc.).
      if (intPart > 5000) continue;
      if (acceptable.has(intPart)) continue;
      // Tolérer les multiples utilisés dans des bundles (×2, ×3) avec remise raisonnable
      if (
        intPart >= priceLocked * 1.5 - 50 &&
        intPart <= priceLocked * 4 + 50
      ) {
        continue;
      }
      const key = `${intPart}|${match[3]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        severity: "warning",
        category: "facts.price_mismatch",
        match: match[0],
        hint: `Locked price is ${priceLocked} ${currency} — this looks like an off-lock price`,
      });
    }
  }

  const blocked = findings.some((f) => f.severity === "critical");
  const report: GovernanceReport = {
    pass: findings.length === 0,
    mode: lock.mode,
    findings,
    rewrites: findings.filter((f) => f.replacement !== undefined).length,
    blocked,
  };

  return { content: v.content, report };
}

// ─── Helpers SSE ──────────────────────────────────────────────────────────────

export function summarizeReport(report: GovernanceReport): {
  pass: boolean;
  mode: string;
  total_findings: number;
  critical: number;
  warning: number;
  info: number;
  rewrites: number;
  categories: string[];
} {
  const critical = report.findings.filter((f) => f.severity === "critical").length;
  const warning = report.findings.filter((f) => f.severity === "warning").length;
  const info = report.findings.filter((f) => f.severity === "info").length;
  const categories = Array.from(new Set(report.findings.map((f) => f.category)));
  return {
    pass: report.pass,
    mode: report.mode,
    total_findings: report.findings.length,
    critical,
    warning,
    info,
    rewrites: report.rewrites,
    categories,
  };
}
