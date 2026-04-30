/**
 * GOVERNANCE — EU Cosmetic Compliance Agent
 *
 * Détecte et corrige automatiquement les claims interdits selon :
 *   • Regulation (EC) No 1223/2009 — produits cosmétiques
 *   • Commission Regulation (EU) No 655/2013 — critères communs aux claims
 *   • Bonnes pratiques générales (médical, statistiques fabriquées, urgence
 *     fabriquée, faux témoignages, fausses certifications).
 *
 * L'agent s'applique à tous les secteurs en mode général ; les règles
 * cosmétiques EU se renforcent automatiquement quand le secteur est
 * "cosmétique", "skincare" ou "beauté".
 */

import type {
  BrandLock,
  GovernanceFinding,
  GovernanceSeverity,
} from "./types";

// ─── Catalogue de remplacements safe ────────────────────────────────────────────

interface ClaimRule {
  pattern: RegExp;
  category: GovernanceFinding["category"];
  severity: GovernanceSeverity;
  replacement: string;
  hint: string;
  scope: "all" | "cosmetic_eu";
}

const CLAIM_RULES: ClaimRule[] = [
  // ── Cosmétique EU — claims physiologiques / médicaux ──────────────────────
  {
    pattern: /\b(boosts?|stimulates?)\s+(collagen|elastin)\b/gi,
    category: "compliance.claim_forbidden",
    severity: "critical",
    replacement: "supports firmer-looking skin",
    hint: "EU 1223/2009 — physiological action forbidden",
    scope: "cosmetic_eu",
  },
  {
    pattern: /\breduces?\s+wrinkles?\b/gi,
    category: "compliance.claim_forbidden",
    severity: "critical",
    replacement: "helps skin appear smoother",
    hint: "EU 655/2013 — wrinkle reduction is a physiological claim",
    scope: "cosmetic_eu",
  },
  {
    pattern: /\b(fades?|removes?|erases?)\s+(dark\s+spots?|hyperpigmentation|age\s+spots?)\b/gi,
    category: "compliance.claim_forbidden",
    severity: "critical",
    replacement: "helps improve the appearance of uneven tone",
    hint: "EU 655/2013 — pigmentation claim restricted",
    scope: "cosmetic_eu",
  },
  {
    pattern: /\banti[-\s]?aging\b/gi,
    category: "compliance.claim_forbidden",
    severity: "critical",
    replacement: "age-defying look",
    hint: "Anti-aging is a forbidden physiological claim in EU cosmetics",
    scope: "cosmetic_eu",
  },
  {
    pattern: /\bstop(s)?\s+aging\b/gi,
    category: "compliance.claim_forbidden",
    severity: "critical",
    replacement: "supports a youthful-looking complexion",
    hint: "Stopping aging is biologically false and forbidden",
    scope: "cosmetic_eu",
  },
  {
    pattern: /\b(repairs?|heals?|cures?|treats?)\s+(skin|acne|eczema|rosacea|psoriasis)\b/gi,
    category: "compliance.medical_vocab",
    severity: "critical",
    replacement: "helps soothe the look of skin",
    hint: "Medical vocabulary forbidden in EU cosmetics",
    scope: "cosmetic_eu",
  },
  {
    pattern: /\b(dermatologist|clinically)\s+(proven|tested)\b/gi,
    category: "compliance.fake_stat",
    severity: "warning",
    replacement: "tested under expert supervision",
    hint: "“Clinically proven” requires study metadata in EU",
    scope: "all",
  },
  {
    pattern: /\bin\s+(\d+)\s+(days?|weeks?|hours?)\b/gi,
    category: "compliance.temporal_guarantee",
    severity: "warning",
    replacement: "over time",
    hint: "Temporal efficacy guarantees are restricted",
    scope: "cosmetic_eu",
  },
  {
    pattern: /\b(\d{2,3})\s*%\s+of\s+(users|women|customers|people)\b/gi,
    category: "compliance.fake_stat",
    severity: "critical",
    replacement: "many users",
    hint: "Fabricated user statistics are forbidden without verifiable study",
    scope: "all",
  },
  {
    pattern: /\b(guaranteed|guaranteed\s+results|100\s*%\s+(satisfaction|effective))\b/gi,
    category: "compliance.fake_stat",
    severity: "critical",
    replacement: "designed to deliver",
    hint: "Outcome guarantees forbidden",
    scope: "all",
  },
  {
    pattern: /\b(miracle|magic|miraculous)\b/gi,
    category: "compliance.claim_forbidden",
    severity: "warning",
    replacement: "remarkable",
    hint: "Hyperbolic terms misleading — EU 655/2013",
    scope: "all",
  },
  // ── Dark patterns — urgence et stock fabriqués ───────────────────────────
  {
    pattern: /\bonly\s+(\d{1,3})\s+(left|remaining|in\s+stock)\b/gi,
    category: "compliance.fake_urgency",
    severity: "warning",
    replacement: "limited inventory",
    hint: "Real-time stock claims must reflect actual inventory",
    scope: "all",
  },
  {
    pattern: /\b(\d{1,3})\s+people\s+are\s+viewing\s+this\b/gi,
    category: "compliance.fake_urgency",
    severity: "warning",
    replacement: "popular product",
    hint: "Live viewer counters are dark patterns when fabricated",
    scope: "all",
  },
  {
    pattern: /\b(hurry|act\s+fast|last\s+chance|don['’]t\s+miss)\b/gi,
    category: "compliance.fake_urgency",
    severity: "info",
    replacement: "discover",
    hint: "Urgency wording reduced unless growth_mode allows it",
    scope: "all",
  },
];

// ─── Détection certifications inventées ─────────────────────────────────────

const CERT_PATTERN = /\b(ECOCERT|COSMOS|VEGAN\s+SOCIETY|LEAPING\s+BUNNY|CRUELTY[-\s]?FREE|ORGANIC|BIO|FAIRTRADE|ISO\s*\d+|CE\s+CERTIFIED|FDA\s+APPROVED|USDA\s+ORGANIC)\b/gi;

function isCosmeticEU(lock: BrandLock): boolean {
  const sector = lock.brand.sector.toLowerCase();
  return ["cosmétique", "cosmetic", "cosmetics", "skincare", "beauté", "beauty"].includes(sector);
}

// ─── API publique ────────────────────────────────────────────────────────────

export interface ComplianceOutcome {
  content: string;
  findings: GovernanceFinding[];
}

/**
 * Applique les règles de conformité au texte. Modifie le texte (remplacement
 * automatique) et retourne la liste des findings horodatés.
 */
export function runComplianceAgent(input: string, lock: BrandLock): ComplianceOutcome {
  const findings: GovernanceFinding[] = [];
  const cosmeticEU = isCosmeticEU(lock);
  let content = input;

  // ── 1) Règles génériques + EU cosmétique ───────────────────────────────
  for (const rule of CLAIM_RULES) {
    if (rule.scope === "cosmetic_eu" && !cosmeticEU) continue;
    const matches = content.match(rule.pattern);
    if (!matches) continue;
    for (const m of matches) {
      findings.push({
        severity: rule.severity,
        category: rule.category,
        match: m,
        replacement: rule.replacement,
        hint: rule.hint,
      });
    }
    content = content.replace(rule.pattern, rule.replacement);
  }

  // ── 2) Claims explicitement interdits par le brief ─────────────────────
  for (const claim of lock.product.claims_forbidden) {
    if (!claim.trim()) continue;
    const escaped = claim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "gi");
    const matches = content.match(re);
    if (!matches) continue;
    for (const m of matches) {
      findings.push({
        severity: "critical",
        category: "compliance.claim_forbidden",
        match: m,
        replacement: "[claim removed]",
        hint: "Claim explicitly forbidden by brand brief",
      });
    }
    content = content.replace(re, "");
  }

  // ── 3) Certifications inventées (jamais déclarées dans le lock) ────────
  if (lock.product.certifications.length === 0) {
    const found = content.match(CERT_PATTERN);
    if (found) {
      const seen = new Set<string>();
      for (const f of found) {
        const key = f.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          severity: "critical",
          category: "compliance.fake_certification",
          match: f,
          hint: "No certification declared in brand lock — references removed",
        });
      }
      content = content.replace(CERT_PATTERN, "");
    }
  }

  return { content, findings };
}
