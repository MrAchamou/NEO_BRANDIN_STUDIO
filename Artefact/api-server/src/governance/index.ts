/**
 * GOVERNANCE — Pipeline orchestrateur (v2.1 — Sector-Aware)
 *
 *   draft (LLM)
 *     → applyBrandLock         (price coherence)
 *     → applySectorCompliance  (claim packs activés par le profil)
 *     → enforceTone            (voice-enforcer sectoriel)
 *     → validatePricing        (price lock universel)
 *     → validateClaims         (claims_forbidden + certs inventées)
 *     → validateUrgency        (sector.urgency_policy)
 *     → validateWcag           (si profile.requires_wcag_validation)
 *     → output
 *
 * Une seule fonction publique (`applyGovernance`) à brancher dans toutes les
 * routes API. Si aucun lock n'est fourni, le pipeline est neutre (no-op),
 * pour préserver la compatibilité ascendante.
 */

import { runComplianceAgent } from "./compliance-agent";
import { runVoiceEnforcer } from "./voice-enforcer";
import { runWcagValidator } from "./wcag-validator";
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
export * from "./sector-engine";
export * from "./wcag-validator";

// ─── Pipeline principal ─────────────────────────────────────────────────────

export interface ApplyGovernanceOptions {
  /** Lock prêt à l'emploi (priorité sur `briefInput`). */
  lock?: BrandLock | null;
  /** Sinon, on construit le lock à partir du brief brut. */
  briefInput?: RawBrandBriefInput | null;
  /** Identifie la section pour les logs / stream events. */
  sectionKey?: string;
  /** Active la validation WCAG (auto si module 01 ou si profile.requires_wcag). */
  validateWcag?: boolean;
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
        sector_profile_id: "default",
        sector_profile_matched: false,
        findings: [],
        rewrites: 0,
        blocked: false,
      },
    };
  }

  const findings: GovernanceFinding[] = [];

  // ── 0) Avertir si le profil sectoriel n'a pas matché ─────────────────────
  if (!lock.sector_profile_matched) {
    findings.push({
      severity: "info",
      category: "sector.profile_missing",
      match: `${lock.brand.sector || "?"} × ${lock.brand.region || "?"}`,
      hint: "Profil sectoriel non trouvé — fallback générique appliqué (créez un fichier JSON dans /config/sectors/ pour activer les règles dédiées).",
    });
  }

  // ── 1) Compliance (claim packs sectoriels) ────────────────────────────
  const c = runComplianceAgent(draft, lock);
  findings.push(...c.findings);

  // ── 2) Voice (mots interdits, exclamations, emojis, urgence, agressivité)
  const v = runVoiceEnforcer(c.content, lock);
  findings.push(...v.findings);

  // ── 3) Verrou prix : universel quand requires_price_lock=true ─────────
  if (lock.sector_profile.requires_price_lock && lock.product.price !== undefined) {
    const priceLocked = lock.product.price;
    const currency = lock.product.currency ?? "EUR";
    const acceptable = new Set<number>([priceLocked]);
    if (lock.product.old_price !== undefined) acceptable.add(lock.product.old_price);
    const priceRegex = /(\d{2,5})(?:[.,](\d{2}))?\s*(€|EUR|USD|\$|GBP|£|FCFA|CHF|AED|DH|CA\$|₦)/gi;
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = priceRegex.exec(v.content)) !== null) {
      const intPart = parseInt(match[1], 10);
      if (!Number.isFinite(intPart)) continue;
      if (intPart > 5000) continue;
      if (acceptable.has(intPart)) continue;
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

  // ── 4) WCAG palette (si demandé par le profil ou par le caller) ───────
  const shouldValidateWcag =
    options.validateWcag ?? lock.sector_profile.requires_wcag_validation;
  if (shouldValidateWcag) {
    const w = runWcagValidator({
      primary: lock.colors.primary,
      secondary: lock.colors.secondary,
      accent: lock.colors.accent,
      background: lock.colors.background,
    });
    findings.push(...w.findings);
  }

  // ── 5) Disclaimers obligatoires : signaler s'ils sont absents ─────────
  for (const disclaimer of lock.sector_profile.mandatory_disclaimers) {
    const fragment = disclaimer.split(" ").slice(0, 4).join(" ").toLowerCase();
    if (!fragment) continue;
    if (!v.content.toLowerCase().includes(fragment)) {
      findings.push({
        severity: "info",
        category: "sector.disclaimer_missing",
        match: disclaimer,
        hint: `Disclaimer recommandé par le profil ${lock.sector_profile.id} — à inclure dans la version finale.`,
      });
    }
  }

  const blocked = findings.some((f) => f.severity === "critical");
  const report: GovernanceReport = {
    pass: findings.length === 0,
    mode: lock.mode,
    sector_profile_id: lock.sector_profile.id,
    sector_profile_matched: lock.sector_profile_matched,
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
  sector_profile_id: string;
  sector_profile_matched: boolean;
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
    sector_profile_id: report.sector_profile_id,
    sector_profile_matched: report.sector_profile_matched,
    total_findings: report.findings.length,
    critical,
    warning,
    info,
    rewrites: report.rewrites,
    categories,
  };
}
