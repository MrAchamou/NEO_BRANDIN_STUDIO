/**
 * GOVERNANCE PIPELINE — Agency Output Formatter (v3.x)
 *
 * Transforme les outputs internes du pipeline en livrables client-ready.
 * Modes : "internal" (diagnostic complet) ou "client_ready" (présentation agence).
 *
 * Si output_mode = "client_ready" :
 * - Supprime les diagnostics internes
 * - Ajoute le cadrage stratégique
 * - Ajoute le formatage professionnel
 * - Ajoute les scores de confiance
 * - Ajoute les résumés de rationale
 */

import { type GovernanceReport, type GovernanceFinding } from "./types";

export type OutputMode = "internal" | "client_ready";

export interface AgencyFormattedOutput {
  output_mode: OutputMode;
  brand_id?: string;
  generated_at: string;
  strategic_header?: {
    brand_position: string;
    archetype?: string;
    sector_compliance: string;
    confidence_level: string;
  };
  compliance_summary: string;
  findings_count: number;
  rewrites_count: number;
  pass: boolean;
  strategic_rationale?: string;
  agency_footer?: string;
  findings_client?: Array<{
    category: string;
    severity: string;
    note: string;
  }>;
}

/**
 * Formate un GovernanceReport pour livraison agence.
 */
export function formatForAgency(
  report: GovernanceReport,
  output_mode: OutputMode = "client_ready",
): AgencyFormattedOutput {
  const flag_count = report.findings.filter((f) => f.severity !== "info").length;

  let strategic_header: AgencyFormattedOutput["strategic_header"] | undefined;
  let strategic_rationale: string | undefined;
  let agency_footer: string | undefined;
  let findings_client: AgencyFormattedOutput["findings_client"] | undefined;

  if (output_mode === "client_ready") {
    const archetype = report.v3?.archetype;
    const territory = report.v3?.territory;

    strategic_header = {
      brand_position: territory?.brand_promise?.slice(0, 100) ?? "Positionnement en cours de calibrage",
      archetype,
      sector_compliance: report.sector
        ? `Conforme — ${report.sector}`
        : report.sector_profile_id !== "generic"
          ? `Conforme — ${report.sector_profile_id}`
          : "Règles générales appliquées",
      confidence_level: flag_count === 0 ? "Élevé" : flag_count < 3 ? "Modéré" : "Sous réserve",
    };

    strategic_rationale = buildStrategicRationale(report, archetype);
    agency_footer = `Généré par AI BRAND OS v3.x — ${new Date().toLocaleDateString("fr-FR")} — Confidentiel`;

    // Transformer les findings en format client (sans jargon interne)
    findings_client = report.findings
      .filter((f) => f.severity !== "info")
      .map((f) => ({
        category: formatCategoryLabel(f.category),
        severity: f.severity === "critical" ? "Critique" : f.severity === "warning" ? "Attention" : "Info",
        note: f.hint ?? `Ajustement appliqué automatiquement`,
      }));
  }

  return {
    output_mode,
    brand_id: report.brand_id,
    generated_at: new Date().toISOString(),
    strategic_header,
    compliance_summary: buildComplianceSummary(report, flag_count),
    findings_count: flag_count,
    rewrites_count: report.rewrites,
    pass: report.pass,
    strategic_rationale,
    agency_footer,
    findings_client: output_mode === "client_ready" ? findings_client : undefined,
  };
}

function formatCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    "compliance.claim_forbidden": "Claim non autorisé",
    "compliance.medical_vocab": "Vocabulaire médical",
    "compliance.health_claim": "Allégation santé",
    "compliance.financial_promise": "Promesse financière",
    "compliance.fake_stat": "Statistique non vérifiable",
    "compliance.fake_urgency": "Urgence artificielle",
    "compliance.fake_certification": "Certification inventée",
    "compliance.temporal_guarantee": "Garantie temporelle",
    "voice.forbidden_word": "Mot interdit",
    "voice.exclamation_overload": "Exclamations excessives",
    "voice.emoji_used": "Emoji non autorisé",
    "voice.urgency_blocked": "Urgence bloquée",
    "facts.price_mismatch": "Prix incohérent",
    "facts.fabricated_number": "Chiffre inventé",
    "wcag.contrast_low": "Contraste insuffisant (WCAG)",
  };
  return map[category] ?? category.replace(/\./g, " — ").replace(/_/g, " ");
}

function buildComplianceSummary(report: GovernanceReport, flag_count: number): string {
  if (!report.blocked && flag_count === 0) {
    return "✅ Contenu entièrement conforme — aucun flag de gouvernance";
  }
  if (report.blocked) {
    return `🚫 Contenu bloqué — ${flag_count} violation(s) critique(s) détectée(s)`;
  }
  return `⚠️ ${flag_count} point(s) de conformité ajusté(s) automatiquement (${report.rewrites} réécriture(s))`;
}

function buildStrategicRationale(report: GovernanceReport, archetype?: string): string {
  const parts: string[] = [];

  if (archetype) parts.push(`Archétype : ${archetype}`);
  if (report.sector ?? report.sector_profile_id) {
    parts.push(`Gouvernance : ${report.sector ?? report.sector_profile_id}`);
  }
  if (report.v3?.growth_recommendation?.action) {
    parts.push(`Signal croissance : ${report.v3.growth_recommendation.action}`);
  }

  return parts.length > 0
    ? parts.join(" | ")
    : "Analyse stratégique complète disponible via le rapport complet";
}
