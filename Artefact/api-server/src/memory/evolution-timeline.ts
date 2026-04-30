/**
 * BRAND MEMORY ENGINE — Client Evolution Timeline (Agency Mode)
 *
 * Génère une timeline lisible de l'évolution stratégique d'une marque
 * à partir de sa mémoire. Format client-ready.
 */

import { getMemoryEntries } from "./memory-store";
import { getDecisions } from "./decision-history";
import { getMemoryProfile } from "./memory-profile-builder";

export interface EvolutionEvent {
  date: string;
  type: "tone_shift" | "growth_change" | "correction" | "positioning" | "approval_peak" | "rejection_peak";
  title: string;
  detail: string;
  impact: "low" | "medium" | "high";
}

export interface BrandEvolutionSummary {
  brand_id: string;
  generated_at: string;
  total_interactions: number;
  active_since: string | null;
  events: EvolutionEvent[];
  narrative_summary: string;
  profile_shifts: {
    dimension: string;
    observation: string;
  }[];
  stability_score: number;
  export_markdown: string;
}

/**
 * Génère la timeline d'évolution stratégique complète d'une marque.
 */
export function generateEvolutionTimeline(brand_id: string): BrandEvolutionSummary {
  const entries = getMemoryEntries(brand_id);
  const decisions = getDecisions(brand_id, undefined, 100);
  const profile = getMemoryProfile(brand_id);

  const events: EvolutionEvent[] = [];

  // ── Décisions stratégiques ────────────────────────────────────────────────
  for (const d of decisions) {
    let type: EvolutionEvent["type"] = "correction";
    if (d.category === "tone") type = "tone_shift";
    else if (d.category === "growth_mode") type = "growth_change";
    else if (d.category === "positioning") type = "positioning";

    events.push({
      date: d.timestamp.slice(0, 10),
      type,
      title: `${d.category} : ${d.from_value} → ${d.to_value}`,
      detail: d.rationale ?? "Décision stratégique enregistrée",
      impact: "medium",
    });
  }

  // ── Corrections high-impact ───────────────────────────────────────────────
  const high_corrections = entries.filter((e) => e.type === "correction" && e.impact_level === "high");
  for (const c of high_corrections) {
    events.push({
      date: c.timestamp.slice(0, 10),
      type: "correction",
      title: `Correction majeure — ${c.module}`,
      detail: `"${c.before.slice(0, 60)}…" → "${c.after.slice(0, 60)}…"`,
      impact: "high",
    });
  }

  // ── Trier par date ────────────────────────────────────────────────────────
  events.sort((a, b) => a.date.localeCompare(b.date));

  // ── Shifts de profil ──────────────────────────────────────────────────────
  const profile_shifts: BrandEvolutionSummary["profile_shifts"] = [];

  const tone_decisions = decisions.filter((d) => d.category === "tone");
  if (tone_decisions.length > 0) {
    const first = tone_decisions[0];
    const last = tone_decisions[tone_decisions.length - 1];
    profile_shifts.push({
      dimension: "Ton",
      observation:
        tone_decisions.length > 1
          ? `Ton évolué de ${first.from_value} → ${last.to_value} (${tone_decisions.length} ajustements)`
          : `Ton ajusté : ${first.from_value} → ${first.to_value}`,
    });
  }

  if (profile.growth_risk_appetite !== "conservative") {
    profile_shifts.push({
      dimension: "Appétit au risque",
      observation: `Appétit au risque passage de conservateur → ${profile.growth_risk_appetite}`,
    });
  }

  if (profile.creative_complexity !== "experimental") {
    profile_shifts.push({
      dimension: "Complexité créative",
      observation: `Préférence créative : ${profile.creative_complexity}`,
    });
  }

  if (profile.urgency_tolerance) {
    profile_shifts.push({
      dimension: "Tolérance urgence",
      observation: "Tolérance aux mécaniques d'urgence activée",
    });
  }

  // ── Stabilité ──────────────────────────────────────────────────────────────
  const total = entries.length + decisions.length;
  const approvals = entries.filter((e) => e.type === "approval").length;
  const rejections = entries.filter((e) => e.type === "rejection").length;
  const approval_rate = total > 0 ? approvals / (approvals + rejections + 1) : 0.5;
  const stability_score = Math.round(Math.min(approval_rate * 10 + (1 - (decisions.length / 20)) * 10, 10) * 10) / 10;

  // ── Narration ─────────────────────────────────────────────────────────────
  const active_since = entries.length > 0 ? entries[0].timestamp.slice(0, 10) : null;
  const narrative_summary = buildNarrative(brand_id, profile_shifts, stability_score, total, active_since);

  const export_markdown = buildMarkdownExport(brand_id, events, profile_shifts, narrative_summary, stability_score);

  return {
    brand_id,
    generated_at: new Date().toISOString(),
    total_interactions: total,
    active_since,
    events: events.slice(-20),
    narrative_summary,
    profile_shifts,
    stability_score,
    export_markdown,
  };
}

function buildNarrative(
  brand_id: string,
  shifts: BrandEvolutionSummary["profile_shifts"],
  stability: number,
  total: number,
  since: string | null,
): string {
  if (total === 0) {
    return `La marque ${brand_id} n'a pas encore d'historique stratégique enregistré.`;
  }

  const parts: string[] = [];
  parts.push(`La marque ${brand_id} est active depuis le ${since ?? "récemment"} (${total} interactions enregistrées).`);

  if (shifts.length > 0) {
    parts.push(shifts.map((s) => s.observation).join(". ") + ".");
  }

  if (stability >= 8) {
    parts.push("La marque présente une stabilité stratégique élevée.");
  } else if (stability >= 5) {
    parts.push("La marque est en phase d'ajustement stratégique.");
  } else {
    parts.push("La marque traverse une période de repositionnement actif.");
  }

  return parts.join(" ");
}

function buildMarkdownExport(
  brand_id: string,
  events: EvolutionEvent[],
  shifts: BrandEvolutionSummary["profile_shifts"],
  narrative: string,
  stability: number,
): string {
  const lines: string[] = [
    `# Brand Evolution Report — ${brand_id}`,
    `*Généré le ${new Date().toLocaleDateString("fr-FR")}*`,
    "",
    "## Résumé stratégique",
    narrative,
    "",
    `**Score de stabilité : ${stability}/10**`,
    "",
    "## Évolutions clés",
    ...shifts.map((s) => `- **${s.dimension}** : ${s.observation}`),
    "",
    "## Timeline",
    ...events.map((e) => `- [${e.date}] **${e.title}** — ${e.detail}`),
  ];
  return lines.join("\n");
}
