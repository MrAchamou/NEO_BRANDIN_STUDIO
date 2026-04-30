/**
 * GOVERNANCE — Brand Voice Enforcer
 *
 * Empêche le tone drift (langage DTC agressif, urgence non autorisée,
 * exclamations excessives, emojis). Calibré par le mode de croissance et
 * par les mots interdits déclarés dans le brief.
 */

import type { BrandLock, GovernanceFinding } from "./types";

const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

export interface VoiceOutcome {
  content: string;
  findings: GovernanceFinding[];
}

export function runVoiceEnforcer(input: string, lock: BrandLock): VoiceOutcome {
  const findings: GovernanceFinding[] = [];
  let content = input;

  // ── 1) Mots interdits ──────────────────────────────────────────────────
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
        hint: `Forbidden by ${lock.mode} voice profile`,
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
      match: `${excl.length} exclamation marks (max ${lock.voice.max_exclamation_marks})`,
      hint: `Exceeded ${lock.mode} voice profile`,
    });
    // Lissage : on remplace les exclamations supplémentaires par un point
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
        match: `${found.length} emoji(s) removed`,
        hint: `${lock.mode} voice profile disallows emojis`,
      });
      content = content.replace(EMOJI_REGEX, "");
    }
  }

  // ── 4) Urgence — si interdite, scrub des patterns d'urgence chiffrés ──
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
          hint: `Urgency pattern blocked by ${lock.mode} mode`,
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
