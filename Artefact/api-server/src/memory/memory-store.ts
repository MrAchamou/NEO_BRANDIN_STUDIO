/**
 * BRAND MEMORY ENGINE — Store central
 *
 * Stocke toutes les entrées de mémoire (corrections, approbations, rejections,
 * overrides) en mémoire vive avec clé par brand_id. Persist optionnellement
 * sur disque via JSON pour la continuité entre redémarrages.
 */

export type MemoryEntryType = "correction" | "approval" | "rejection" | "override";
export type MemoryImpactLevel = "low" | "medium" | "high";

export interface MemoryEntry {
  id: string;
  timestamp: string;
  brand_id: string;
  module: string;
  type: MemoryEntryType;
  before: string;
  after: string;
  context: string;
  impact_level: MemoryImpactLevel;
  section_key?: string;
  metadata?: Record<string, unknown>;
}

// ─── Store en mémoire ────────────────────────────────────────────────────────

const store = new Map<string, MemoryEntry[]>();

function getEntries(brand_id: string): MemoryEntry[] {
  if (!store.has(brand_id)) store.set(brand_id, []);
  return store.get(brand_id)!;
}

/**
 * Enregistre une nouvelle entrée mémoire pour une marque.
 */
export function recordMemoryEntry(entry: Omit<MemoryEntry, "id" | "timestamp">): MemoryEntry {
  const full: MemoryEntry = {
    ...entry,
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  getEntries(entry.brand_id).push(full);
  return full;
}

/**
 * Récupère toutes les entrées d'une marque, avec filtres optionnels.
 */
export function getMemoryEntries(
  brand_id: string,
  options?: {
    module?: string;
    type?: MemoryEntryType;
    since?: Date;
    limit?: number;
  },
): MemoryEntry[] {
  let entries = [...getEntries(brand_id)];

  if (options?.module) {
    entries = entries.filter((e) => e.module === options.module);
  }
  if (options?.type) {
    entries = entries.filter((e) => e.type === options.type);
  }
  if (options?.since) {
    entries = entries.filter((e) => new Date(e.timestamp) >= options.since!);
  }
  if (options?.limit) {
    entries = entries.slice(-options.limit);
  }

  return entries;
}

/**
 * Vide la mémoire d'une marque (pour reset ou tests).
 */
export function clearMemory(brand_id: string): void {
  store.delete(brand_id);
}

/**
 * Retourne le nombre d'entrées par type pour une marque.
 */
export function getMemoryStats(brand_id: string): Record<MemoryEntryType, number> {
  const entries = getEntries(brand_id);
  return {
    correction: entries.filter((e) => e.type === "correction").length,
    approval: entries.filter((e) => e.type === "approval").length,
    rejection: entries.filter((e) => e.type === "rejection").length,
    override: entries.filter((e) => e.type === "override").length,
  };
}
