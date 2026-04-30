/**
 * GOVERNANCE — Sector-Aware Compliance Agent
 *
 * Détecte et corrige automatiquement les claims interdits. Les règles sont
 * regroupées en « packs » (cosmetic_eu_physiological, medical_vocab, …) que
 * le profil sectoriel active dynamiquement via `claim_packs`.
 *
 * Avant v2.1, ces règles étaient déclenchées par un test hardcodé sur le mot
 * « cosmétique ». Elles sont désormais entièrement config-driven : ajouter un
 * secteur = ajouter un JSON et lister les packs à activer.
 */

import type {
  BrandLock,
  GovernanceFinding,
  GovernanceCategory,
  GovernanceSeverity,
} from "./types";
import type { ClaimPack } from "./sector-engine";

// ─── Catalogue de remplacements ─────────────────────────────────────────────

interface ClaimRule {
  pattern: RegExp;
  category: GovernanceCategory;
  severity: GovernanceSeverity;
  replacement: string;
  hint: string;
  pack: ClaimPack;
}

const CLAIM_RULES: ClaimRule[] = [
  // ── Cosmétique EU — claims physiologiques / médicaux ──────────────────────
  {
    pattern: /\b(boosts?|stimulates?)\s+(collagen|elastin)\b/gi,
    category: "compliance.claim_forbidden",
    severity: "critical",
    replacement: "supports firmer-looking skin",
    hint: "EU 1223/2009 — physiological action forbidden",
    pack: "cosmetic_eu_physiological",
  },
  {
    pattern: /\breduces?\s+wrinkles?\b/gi,
    category: "compliance.claim_forbidden",
    severity: "critical",
    replacement: "helps skin appear smoother",
    hint: "EU 655/2013 — wrinkle reduction is a physiological claim",
    pack: "cosmetic_eu_physiological",
  },
  {
    pattern: /\b(fades?|removes?|erases?)\s+(dark\s+spots?|hyperpigmentation|age\s+spots?)\b/gi,
    category: "compliance.claim_forbidden",
    severity: "critical",
    replacement: "helps improve the appearance of uneven tone",
    hint: "EU 655/2013 — pigmentation claim restricted",
    pack: "cosmetic_eu_physiological",
  },
  {
    pattern: /\banti[-\s]?(aging|âge|age)\b/gi,
    category: "compliance.claim_forbidden",
    severity: "critical",
    replacement: "age-defying look",
    hint: "Anti-aging is a forbidden physiological claim in EU cosmetics",
    pack: "cosmetic_eu_physiological",
  },
  {
    pattern: /\bstop(s)?\s+aging\b/gi,
    category: "compliance.claim_forbidden",
    severity: "critical",
    replacement: "supports a youthful-looking complexion",
    hint: "Stopping aging is biologically false and forbidden",
    pack: "cosmetic_eu_physiological",
  },

  // ── Vocabulaire médical générique ─────────────────────────────────────────
  {
    pattern: /\b(repairs?|heals?|cures?|treats?|guérit|soigne|traite)\s+(skin|acne|eczema|rosacea|psoriasis|peau|ac?né)\b/gi,
    category: "compliance.medical_vocab",
    severity: "critical",
    replacement: "helps soothe the look of skin",
    hint: "Medical vocabulary forbidden when medical_claims_allowed=false",
    pack: "medical_vocab",
  },
  {
    pattern: /\b(doctor|médecin|dermatologist|dermatologue)[-\s]?(approved|recommended|prescribed)\b/gi,
    category: "compliance.medical_vocab",
    severity: "critical",
    replacement: "expert-recommended",
    hint: "Endorsement médical interdit sans preuve réglementaire",
    pack: "medical_vocab",
  },

  // ── Health claims (compléments, food, wellness) ──────────────────────────
  {
    pattern: /\b(boosts?|renforce|strengthens?)\s+(immunity|immune\s+system|immunité)\b/gi,
    category: "compliance.health_claim",
    severity: "critical",
    replacement: "contributes to overall wellbeing",
    hint: "Health claim non autorisé sans validation réglementaire",
    pack: "health_claims",
  },
  {
    pattern: /\b(prevents?|cures?|fights?|prévient|combat)\s+(disease|illness|cancer|covid|flu|maladie)\b/gi,
    category: "compliance.health_claim",
    severity: "critical",
    replacement: "supports general wellness",
    hint: "Allégation thérapeutique interdite",
    pack: "health_claims",
  },

  // ── EFSA / food spécifiques UE ───────────────────────────────────────────
  {
    pattern: /\b(detox|détoxifie|cleanses?\s+the\s+body|purifie\s+l['’]organisme)\b/gi,
    category: "compliance.efsa_violation",
    severity: "critical",
    replacement: "soutient le bien-être au quotidien",
    hint: "EFSA — claims detox non autorisés (Règlement 1924/2006)",
    pack: "food_eu_efsa",
  },
  {
    pattern: /\b(burns?\s+fat|brûle\s+les\s+graisses|fat[-\s]burning)\b/gi,
    category: "compliance.efsa_violation",
    severity: "critical",
    replacement: "s'inscrit dans une routine équilibrée",
    hint: "EFSA — claim minceur non validé interdit",
    pack: "food_eu_efsa",
  },
  {
    pattern: /\b(lose\s+\d+\s+(kg|lbs|pounds)|perdez\s+\d+\s+kg)\b/gi,
    category: "compliance.efsa_violation",
    severity: "critical",
    replacement: "accompagne vos objectifs",
    hint: "EFSA — promesse chiffrée de perte de poids interdite",
    pack: "food_eu_efsa",
  },

  // ── Promesses financières (finance, fintech, crypto) ─────────────────────
  {
    pattern: /\b(guaranteed?|garanti)\s+(returns?|profits?|income|rendements?|gains?)\b/gi,
    category: "compliance.financial_promise",
    severity: "critical",
    replacement: "potential performance",
    hint: "AMF / MiFID — aucune garantie de rendement n'est autorisée",
    pack: "financial_guarantees",
  },
  {
    pattern: /\b(risk[-\s]?free|sans\s+risque|no\s+risk|zéro\s+risque)\b/gi,
    category: "compliance.financial_promise",
    severity: "critical",
    replacement: "avec un profil de risque maîtrisé",
    hint: "Toute communication financière doit mentionner un risque de perte",
    pack: "financial_guarantees",
  },
  {
    pattern: /\b(double\s+your\s+(money|capital)|doublez\s+votre\s+(capital|argent))\b/gi,
    category: "compliance.financial_promise",
    severity: "critical",
    replacement: "viser une performance long terme",
    hint: "Promesse irréaliste interdite (AMF)",
    pack: "financial_guarantees",
  },
  {
    pattern: /\b(get\s+rich(\s+quick)?|devenez?\s+riche(\s+rapidement)?)\b/gi,
    category: "compliance.financial_promise",
    severity: "critical",
    replacement: "construire votre stratégie patrimoniale",
    hint: "Slogan d'enrichissement rapide interdit",
    pack: "financial_guarantees",
  },

  // ── Stats fabriquées (universel) ─────────────────────────────────────────
  {
    pattern: /\b(dermatologist|clinically|cliniquement)\s+(proven|tested|prouvé|testé)\b/gi,
    category: "compliance.fake_stat",
    severity: "warning",
    replacement: "tested under expert supervision",
    hint: "« Cliniquement prouvé » exige des métadonnées d'étude",
    pack: "fake_stats",
  },
  {
    pattern: /\b(\d{2,3})\s*%\s+of\s+(users|women|customers|people|utilisateurs|femmes|clients)\b/gi,
    category: "compliance.fake_stat",
    severity: "critical",
    replacement: "many users",
    hint: "Statistiques utilisateurs fabriquées interdites sans étude vérifiable",
    pack: "fake_stats",
  },
  {
    pattern: /\b(guaranteed\s+results|résultats\s+garantis|100\s*%\s+(satisfaction|effective|efficace))\b/gi,
    category: "compliance.fake_stat",
    severity: "critical",
    replacement: "designed to deliver",
    hint: "Garanties de résultat interdites",
    pack: "fake_stats",
  },

  // ── Hyperboles ───────────────────────────────────────────────────────────
  {
    pattern: /\b(miracle|magic|miraculous|miraculeux|magique)\b/gi,
    category: "compliance.claim_forbidden",
    severity: "warning",
    replacement: "remarkable",
    hint: "Termes hyperboliques trompeurs (EU 655/2013 / DGCCRF)",
    pack: "hyperbolic",
  },

  // ── Garanties temporelles ────────────────────────────────────────────────
  {
    pattern: /\bin\s+(\d+)\s+(days?|weeks?|hours?|jours?|semaines?|heures?)\b/gi,
    category: "compliance.temporal_guarantee",
    severity: "warning",
    replacement: "over time",
    hint: "Garanties temporelles d'efficacité restreintes",
    pack: "temporal_guarantees",
  },

  // ── Dark patterns d'urgence ──────────────────────────────────────────────
  {
    pattern: /\bonly\s+(\d{1,3})\s+(left|remaining|in\s+stock)\b/gi,
    category: "compliance.fake_urgency",
    severity: "warning",
    replacement: "limited inventory",
    hint: "Stock temps réel doit refléter l'inventaire réel",
    pack: "urgency_dark_patterns",
  },
  {
    pattern: /\b(\d{1,3})\s+people\s+are\s+viewing\s+this\b/gi,
    category: "compliance.fake_urgency",
    severity: "warning",
    replacement: "popular product",
    hint: "Compteurs de visiteurs en direct sont des dark patterns s'ils sont fabriqués",
    pack: "urgency_dark_patterns",
  },
  {
    pattern: /\b(hurry|act\s+fast|last\s+chance|don['’]t\s+miss|dépêchez|dernière\s+chance)\b/gi,
    category: "compliance.fake_urgency",
    severity: "info",
    replacement: "discover",
    hint: "Urgence atténuée selon profil sectoriel",
    pack: "urgency_dark_patterns",
  },
];

// ─── Détection certifications inventées ─────────────────────────────────────

const CERT_PATTERN = /\b(ECOCERT|COSMOS|VEGAN\s+SOCIETY|LEAPING\s+BUNNY|CRUELTY[-\s]?FREE|ORGANIC|BIO|FAIRTRADE|ISO\s*\d+|CE\s+CERTIFIED|FDA\s+APPROVED|USDA\s+ORGANIC|AB\s+AGRICULTURE\s+BIOLOGIQUE)\b/gi;

// ─── API publique ────────────────────────────────────────────────────────────

export interface ComplianceOutcome {
  content: string;
  findings: GovernanceFinding[];
}

/**
 * Applique les règles de conformité au texte selon le profil sectoriel embarqué
 * dans le `BrandLock`. Les packs à activer sont déclarés dans `lock.sector_profile.claim_packs`.
 */
export function runComplianceAgent(input: string, lock: BrandLock): ComplianceOutcome {
  const findings: GovernanceFinding[] = [];
  let content = input;
  const profile = lock.sector_profile;
  const enabledPacks = new Set<ClaimPack>(profile.claim_packs);

  // Auto-activation : un flag à false force l'activation du pack correspondant,
  // même si l'auteur du JSON l'a oublié.
  if (!profile.medical_claims_allowed) enabledPacks.add("medical_vocab");
  if (!profile.health_claims_allowed) enabledPacks.add("health_claims");
  if (!profile.financial_promises_allowed) enabledPacks.add("financial_guarantees");
  if (!profile.urgency_policy.allowed) enabledPacks.add("urgency_dark_patterns");

  // ── 1) Règles activées par le profil ───────────────────────────────────
  for (const rule of CLAIM_RULES) {
    if (!enabledPacks.has(rule.pack)) continue;
    const matches = content.match(rule.pattern);
    if (!matches) continue;
    for (const m of matches) {
      findings.push({
        severity: rule.severity,
        category: rule.category,
        match: m,
        replacement: rule.replacement,
        hint: `[${rule.pack}] ${rule.hint}`,
      });
    }
    content = content.replace(rule.pattern, rule.replacement);
  }

  // ── 2) Mots interdits sectoriels (du JSON) ─────────────────────────────
  for (const word of profile.forbidden_words) {
    if (!word.trim()) continue;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = content.match(re);
    if (!matches) continue;
    for (const m of matches) {
      findings.push({
        severity: "critical",
        category: "compliance.sector_forbidden_word",
        match: m,
        hint: `Mot interdit par le profil ${profile.id}`,
      });
    }
    content = content.replace(re, "");
  }

  // ── 3) Claims explicitement interdits par le brief ─────────────────────
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
        hint: "Claim explicitement interdit dans le brief",
      });
    }
    content = content.replace(re, "");
  }

  // ── 4) Certifications inventées (jamais déclarées dans le lock) ────────
  if (
    profile.requires_claim_validation &&
    lock.product.certifications.length === 0
  ) {
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
          hint: "Aucune certification déclarée dans le lock — référence supprimée",
        });
      }
      content = content.replace(CERT_PATTERN, "");
    }
  }

  return { content, findings };
}
