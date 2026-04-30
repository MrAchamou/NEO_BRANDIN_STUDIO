/**
 * STRATEGIC POSITIONING ENGINE — Verrou de positionnement
 *
 * Stocke et expose le positionnement stratégique validé d'une marque.
 * Toutes les générations de modules doivent s'y aligner.
 * Si un output contredit le positionnement, il est signalé ou bloqué.
 */

import type { BrandArchetype } from "./archetype-engine";
import type { BrandTerritory } from "./territory-builder";
import type { MarketMapResult } from "./market-mapping";

export interface PositioningLock {
  brand_id: string;
  archetype: BrandArchetype;
  secondary_archetype: BrandArchetype | null;
  territory: BrandTerritory;
  market_map: MarketMapResult;
  locked_at: string;
  version: number;
}

export interface PositioningConflict {
  module: string;
  conflict_type: "anti_positioning_violation" | "tone_mismatch" | "archetype_contradiction";
  detected_text: string;
  reason: string;
  severity: "warning" | "critical";
}

// ─── Store en mémoire ────────────────────────────────────────────────────────

const lockStore = new Map<string, PositioningLock>();

/**
 * Sauvegarde ou met à jour le verrou de positionnement d'une marque.
 */
export function setPositioningLock(
  brand_id: string,
  lock: Omit<PositioningLock, "brand_id" | "locked_at" | "version">,
): PositioningLock {
  const existing = lockStore.get(brand_id);
  const full: PositioningLock = {
    ...lock,
    brand_id,
    locked_at: new Date().toISOString(),
    version: (existing?.version ?? 0) + 1,
  };
  lockStore.set(brand_id, full);
  return full;
}

/**
 * Récupère le verrou de positionnement d'une marque.
 */
export function getPositioningLock(brand_id: string): PositioningLock | null {
  return lockStore.get(brand_id) ?? null;
}

/**
 * Supprime le verrou de positionnement (reset).
 */
export function clearPositioningLock(brand_id: string): void {
  lockStore.delete(brand_id);
}

/**
 * Vérifie si un texte généré est en cohérence avec le positionnement.
 * Retourne les conflits détectés.
 */
export function checkPositioningAlignment(
  brand_id: string,
  module: string,
  generated_text: string,
): PositioningConflict[] {
  const lock = lockStore.get(brand_id);
  if (!lock) return [];

  const conflicts: PositioningConflict[] = [];
  const text_lower = generated_text.toLowerCase();

  // ── Vérification anti-positionnement ─────────────────────────────────────
  const anti = lock.territory.anti_positioning.toLowerCase();
  // Extrait les mots-clés de l'anti-positionnement pour détecter les violations
  const anti_keywords = extractKeyPhrases(anti);

  for (const phrase of anti_keywords) {
    if (phrase.length > 4 && text_lower.includes(phrase)) {
      conflicts.push({
        module,
        conflict_type: "anti_positioning_violation",
        detected_text: phrase,
        reason: `Contredit l'anti-positionnement : "${lock.territory.anti_positioning}"`,
        severity: "warning",
      });
    }
  }

  // ── Vérification grossière de cohérence d'archétype ──────────────────────
  if (lock.archetype === "Innocent") {
    const aggressive_patterns = ["disruptif", "révolution", "rebelle", "challenger", "bold"];
    for (const pattern of aggressive_patterns) {
      if (text_lower.includes(pattern)) {
        conflicts.push({
          module,
          conflict_type: "archetype_contradiction",
          detected_text: pattern,
          reason: `Ton "${pattern}" incompatible avec l'archétype ${lock.archetype} (Innocent)`,
          severity: "warning",
        });
      }
    }
  }

  if (lock.archetype === "Rebel") {
    const conformist_patterns = ["tradition", "classique", "historique", "institutionnel"];
    for (const pattern of conformist_patterns) {
      if (text_lower.includes(pattern)) {
        conflicts.push({
          module,
          conflict_type: "archetype_contradiction",
          detected_text: pattern,
          reason: `Ton "${pattern}" incompatible avec l'archétype ${lock.archetype} (Rebel)`,
          severity: "warning",
        });
      }
    }
  }

  return conflicts;
}

/**
 * Sérialise le verrou de positionnement pour injection en system prompt.
 */
export function positioningLockToPromptBlock(lock: PositioningLock): string {
  return [
    "═══ POSITIONING LOCK ═══",
    `• Archétype primaire : ${lock.archetype}${lock.secondary_archetype ? ` | Secondaire : ${lock.secondary_archetype}` : ""}`,
    `• Tension fondatrice : ${lock.territory.core_tension}`,
    `• Promesse : ${lock.territory.brand_promise}`,
    `• Anti-positionnement : ${lock.territory.anti_positioning}`,
    `• Territoire blanc : ${lock.market_map.strategic_opportunity}`,
    `RÈGLE : Tout output doit s'aligner sur cet archétype et cette promesse. Jamais en contradiction.`,
  ].join("\n");
}

function extractKeyPhrases(text: string): string[] {
  return text
    .split(/[\.\,\!\?\;\:]/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 4)
    .slice(0, 5);
}
