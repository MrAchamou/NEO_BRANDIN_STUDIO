/**
 * BRAND MEMORY ENGINE — Journal des corrections
 *
 * Capture et indexe toutes les corrections humaines appliquées sur les
 * outputs générés. Permet au système d'apprendre des préférences utilisateur.
 */

import { recordMemoryEntry, getMemoryEntries } from "./memory-store";
import type { MemoryImpactLevel } from "./memory-store";

export interface CorrectionLogEntry {
  brand_id: string;
  module: string;
  section_key?: string;
  before: string;
  after: string;
  context?: string;
  impact_level?: MemoryImpactLevel;
}

/**
 * Log une correction humaine : l'utilisateur a modifié un output généré.
 */
export function logCorrection(entry: CorrectionLogEntry) {
  return recordMemoryEntry({
    brand_id: entry.brand_id,
    module: entry.module,
    type: "correction",
    before: entry.before,
    after: entry.after,
    context: entry.context ?? "",
    impact_level: entry.impact_level ?? detectImpact(entry.before, entry.after),
    section_key: entry.section_key,
  });
}

/**
 * Log une approbation : l'utilisateur a validé un output sans modification.
 */
export function logApproval(brand_id: string, module: string, content: string, section_key?: string) {
  return recordMemoryEntry({
    brand_id,
    module,
    type: "approval",
    before: content,
    after: content,
    context: "User approved output without changes",
    impact_level: "low",
    section_key,
  });
}

/**
 * Log un rejet : l'utilisateur a refusé un output généré.
 */
export function logRejection(
  brand_id: string,
  module: string,
  content: string,
  reason?: string,
  section_key?: string,
) {
  return recordMemoryEntry({
    brand_id,
    module,
    type: "rejection",
    before: content,
    after: "",
    context: reason ?? "User rejected output",
    impact_level: "high",
    section_key,
  });
}

/**
 * Log un override de gouvernance : l'utilisateur a contourné une règle.
 */
export function logGovernanceOverride(
  brand_id: string,
  module: string,
  rule_category: string,
  original: string,
  overridden_to: string,
) {
  return recordMemoryEntry({
    brand_id,
    module,
    type: "override",
    before: original,
    after: overridden_to,
    context: `Governance rule overridden: ${rule_category}`,
    impact_level: "high",
  });
}

/**
 * Récupère les corrections d'une marque pour un module donné.
 */
export function getCorrectionsForModule(brand_id: string, module: string) {
  return getMemoryEntries(brand_id, { module, type: "correction" });
}

/**
 * Détecte le niveau d'impact d'une correction selon l'ampleur du changement.
 */
function detectImpact(before: string, after: string): MemoryImpactLevel {
  if (!before || !after) return "high";
  const ratio = Math.abs(before.length - after.length) / Math.max(before.length, 1);
  if (ratio > 0.5) return "high";
  if (ratio > 0.2) return "medium";
  return "low";
}

/**
 * Résume les patterns de correction pour une marque (pour le profile builder).
 */
export function summarizeCorrectionPatterns(brand_id: string): {
  total_corrections: number;
  modules_corrected: string[];
  high_impact_count: number;
  rejection_rate: number;
} {
  const corrections = getMemoryEntries(brand_id, { type: "correction" });
  const rejections = getMemoryEntries(brand_id, { type: "rejection" });
  const approvals = getMemoryEntries(brand_id, { type: "approval" });

  const total_actions = corrections.length + rejections.length + approvals.length;

  return {
    total_corrections: corrections.length,
    modules_corrected: [...new Set(corrections.map((c) => c.module))],
    high_impact_count: corrections.filter((c) => c.impact_level === "high").length,
    rejection_rate: total_actions > 0 ? rejections.length / total_actions : 0,
  };
}
