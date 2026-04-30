/**
 * GOVERNANCE — Sector-Aware Brand Voice Enforcer
 *
 * Empêche le tone drift (langage DTC agressif, urgence non autorisée,
 * exclamations excessives, emojis). Les contraintes sont l'intersection :
 *
 *   limite la plus stricte entre :
 *     • le mode de croissance (premium / balanced / aggressive)
 *     • le profil sectoriel (cosmetics_eu / finance_eu / saas / …)
 *
 * Autrement dit : le profil sectoriel ne peut que durcir les règles, jamais
 * les assouplir au-delà du growth_mode.
 */

import type { BrandLock, GovernanceFinding } from "./types";

const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

const AGGRESSIVE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b(BUY\s+NOW|GRAB\s+IT|GET\s+IT\s+NOW)\b/g, replacement: "Discover" },
  { pattern: /\b(MASSIVE|HUGE|INSANE|CRAZY|WILD)\s+(deal|discount|offer|sale)\b/gi, replacement: "notable offer" },
  { pattern: /\b(YOU\s+MUST|YOU\s+NEED\s+TO|YOU\s+HAVE\s+TO)\s+(buy|get|order)\b/gi, replacement: "you may consider to discover" },
];

export interface VoiceOutcome {
  content: string;
  findings: GovernanceFinding[];
}

export function runVoiceEnforcer(input: string, lock: BrandLock): VoiceOutcome {
  const findings: GovernanceFinding[] = [];
  let content = input;

  // ── 1) Mots interdits (déjà fusionnés dans lock.voice via brand-lock) ──
  for (const word of lock.voice.forbidden_words) {
    if (!word.trim()) continue;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = content.match(re);
    if (!matches) continue;
    for (const m of matches) {
      findings.push({
        severity: lock.voice.urgency_allowed ? "info" : "warning",
        category: "voice.forbidden_word",
        match: m,
        hint: `Interdit par le profil ${lock.mode} / ${lock.sector_profile.id}`,
      });
    }
    content = content.replace(re, "");
  }

  // ── 2) Exclamations excessives ─────────────────────────────────────────
  const excl = content.match(/!/g);
  if (excl && excl.length > lock.voice.max_exclamation_marks) {
    findings.push({
      severity: "warning",
      category: "voice.exclamation_overload",
      match: `${excl.length} exclamations (max ${lock.voice.max_exclamation_marks})`,
      hint: `Limite imposée par ${lock.mode} / ${lock.sector_profile.id}`,
    });
    let kept = 0;
    content = content.replace(/!/g, () => {
      kept += 1;
      return kept <= lock.voice.max_exclamation_marks ? "!" : ".";
    });
  }

  // ── 3) Emojis ──────────────────────────────────────────────────────────
  if (!lock.voice.emojis_allowed) {
    const found = content.match(EMOJI_REGEX);
    if (found) {
      findings.push({
        severity: "info",
        category: "voice.emoji_used",
        match: `${found.length} emoji(s) supprimé(s)`,
        hint: `Profil ${lock.sector_profile.id} interdit les emojis`,
      });
      content = content.replace(EMOJI_REGEX, "");
    }
  }

  // ── 4) Niveau d'agressivité — si "low", on lisse les patterns DTC ───────
  if ((lock.voice.aggressiveness_level ?? "medium") === "low") {
    for (const { pattern, replacement } of AGGRESSIVE_PATTERNS) {
      const matches = content.match(pattern);
      if (!matches) continue;
      for (const m of matches) {
        findings.push({
          severity: "warning",
          category: "voice.aggressiveness_too_high",
          match: m,
          replacement,
          hint: `Niveau d'agressivité "low" exigé par ${lock.sector_profile.id}`,
        });
      }
      content = content.replace(pattern, replacement);
    }
  }

  // ── 5) Urgence — si interdite, scrub des patterns d'urgence chiffrés ──
  if (!lock.voice.urgency_allowed) {
    const urgencyPatterns = [
      /\b(only)\s+\d+\s+(left|remaining|in\s+stock|available)\b/gi,
      /\b(hurry|act\s+fast|last\s+chance|don['’]t\s+miss(\s+out)?)\b/gi,
      /\b(\d+)\s+people\s+(are\s+)?(viewing|watching|browsing)\b/gi,
      /\b(sold\s+out\s+soon|selling\s+fast|going\s+fast)\b/gi,
      /\b(\d{1,2})\s*:\s*(\d{2})\s*:\s*(\d{2})\b/g, // countdowns 00:00:00
    ];
    for (const p of urgencyPatterns) {
      const m = content.match(p);
      if (!m) continue;
      for (const hit of m) {
        findings.push({
          severity: "warning",
          category: "voice.urgency_blocked",
          match: hit,
          hint: `Urgence bloquée par le mode ${lock.mode} / profil ${lock.sector_profile.id}`,
        });
      }
      content = content.replace(p, "");
    }
  }

  // Nettoyage des doubles espaces / espaces avant ponctuation issus des suppressions
  content = content
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+\)/g, "")
    .replace(/\[\s*\]/g, "");

  return { content, findings };
}
