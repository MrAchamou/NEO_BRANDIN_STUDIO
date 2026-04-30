/**
 * STRATEGIC POSITIONING ENGINE — Détection d'archétype de marque
 *
 * Identifie automatiquement l'archétype Jungien dominant d'une marque
 * à partir de son brief, de son secteur, de ses valeurs et de son tone.
 * Résultat stocké dans le positioning lock.
 */

export type BrandArchetype =
  | "Creator"
  | "Sage"
  | "Caregiver"
  | "Explorer"
  | "Ruler"
  | "Rebel"
  | "Lover"
  | "Hero"
  | "Innocent"
  | "Jester"
  | "Everyman"
  | "Magician";

export interface ArchetypeScore {
  archetype: BrandArchetype;
  score: number;
  confidence: "low" | "medium" | "high";
}

export interface ArchetypeDetectionResult {
  primary: BrandArchetype;
  secondary: BrandArchetype | null;
  scores: ArchetypeScore[];
  confidence: "low" | "medium" | "high";
  brand_essence: string;
  narrative_tone: string;
}

// ─── Signaux d'archétype ─────────────────────────────────────────────────────

interface ArchetypeSignals {
  keywords: string[];
  sectors: string[];
  tones: string[];
  values: string[];
  growth_modes: string[];
  weight: number;
}

const ARCHETYPE_SIGNALS: Record<BrandArchetype, ArchetypeSignals> = {
  Creator: {
    keywords: ["créatif", "artisan", "design", "unique", "innovation", "create", "craft", "artisanal", "bespoke"],
    sectors: ["fashion", "cosmetics", "art", "tech"],
    tones: ["créatif", "inspirant", "artistique"],
    values: ["créativité", "authenticité", "expression"],
    growth_modes: ["premium_brand"],
    weight: 1.0,
  },
  Sage: {
    keywords: ["expert", "expertise", "connaissance", "science", "research", "prouvé", "étude", "savoir"],
    sectors: ["saas", "finance", "food"],
    tones: ["expert", "éducatif", "informatif"],
    values: ["savoir", "vérité", "intelligence"],
    growth_modes: ["premium_brand", "balanced_growth"],
    weight: 1.0,
  },
  Caregiver: {
    keywords: ["soin", "protection", "bienveillance", "santé", "care", "nourrir", "protéger", "accompagner"],
    sectors: ["cosmetics", "food", "finance"],
    tones: ["doux", "bienveillant", "rassurant"],
    values: ["bienveillance", "protection", "générosité"],
    growth_modes: ["premium_brand", "balanced_growth"],
    weight: 1.0,
  },
  Explorer: {
    keywords: ["aventure", "découverte", "liberté", "voyage", "explorer", "wild", "adventure", "freedom"],
    sectors: ["fashion", "food"],
    tones: ["aventurier", "libre", "dynamique"],
    values: ["liberté", "découverte", "authenticité"],
    growth_modes: ["balanced_growth", "aggressive_dtc"],
    weight: 1.0,
  },
  Ruler: {
    keywords: ["luxe", "prestige", "excellence", "premium", "luxury", "élite", "référence", "leader"],
    sectors: ["fashion", "finance"],
    tones: ["autoritaire", "raffiné", "exclusif"],
    values: ["excellence", "prestige", "contrôle"],
    growth_modes: ["premium_brand"],
    weight: 1.0,
  },
  Rebel: {
    keywords: ["rebelle", "disruptif", "révolution", "challenger", "anti-conformiste", "rebel", "disrupt", "bold"],
    sectors: ["fashion", "saas"],
    tones: ["provocateur", "audacieux", "irrévérencieux"],
    values: ["liberté", "rébellion", "changement"],
    growth_modes: ["aggressive_dtc"],
    weight: 1.0,
  },
  Lover: {
    keywords: ["amour", "passion", "désir", "sensualité", "beauté", "love", "passion", "sensual", "glamour"],
    sectors: ["cosmetics", "fashion"],
    tones: ["sensuel", "passionné", "romantique"],
    values: ["beauté", "passion", "connexion"],
    growth_modes: ["premium_brand", "balanced_growth"],
    weight: 1.0,
  },
  Hero: {
    keywords: ["performance", "résultats", "force", "efficacité", "champion", "achieve", "results", "power"],
    sectors: ["saas", "food", "fashion"],
    tones: ["dynamique", "motivant", "performant"],
    values: ["performance", "courage", "excellence"],
    growth_modes: ["aggressive_dtc", "balanced_growth"],
    weight: 1.0,
  },
  Innocent: {
    keywords: ["naturel", "pur", "simple", "honnête", "authentique", "pure", "natural", "clean", "transparent"],
    sectors: ["food", "cosmetics"],
    tones: ["simple", "honnête", "optimiste"],
    values: ["pureté", "honnêteté", "simplicité"],
    growth_modes: ["premium_brand"],
    weight: 1.0,
  },
  Jester: {
    keywords: ["fun", "humour", "joyeux", "décalé", "playful", "funny", "entertaining", "bold"],
    sectors: ["food", "saas"],
    tones: ["humoristique", "décalé", "fun"],
    values: ["joie", "humour", "légèreté"],
    growth_modes: ["aggressive_dtc", "balanced_growth"],
    weight: 1.0,
  },
  Everyman: {
    keywords: ["accessible", "pour tous", "quotidien", "pratique", "simple", "everyday", "accessible", "friendly"],
    sectors: ["food", "fashion", "saas"],
    tones: ["chaleureux", "accessible", "pragmatique"],
    values: ["appartenance", "égalité", "praticité"],
    growth_modes: ["balanced_growth", "aggressive_dtc"],
    weight: 1.0,
  },
  Magician: {
    keywords: ["transformation", "magie", "innovation", "révélation", "transcendance", "transform", "magic", "reinvention"],
    sectors: ["cosmetics", "saas", "food"],
    tones: ["mystérieux", "visionnaire", "transformateur"],
    values: ["transformation", "vision", "innovation"],
    growth_modes: ["premium_brand"],
    weight: 1.0,
  },
};

/**
 * Détecte l'archétype dominant d'une marque à partir de son brief.
 */
export function detectArchetype(input: {
  brand_name?: string;
  sector?: string;
  tone?: string;
  values?: string[];
  growth_mode?: string;
  description?: string;
}): ArchetypeDetectionResult {
  const text = [
    input.brand_name ?? "",
    input.tone ?? "",
    (input.values ?? []).join(" "),
    input.description ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const sector = (input.sector ?? "").toLowerCase();
  const growth_mode = input.growth_mode ?? "balanced_growth";

  const scores: ArchetypeScore[] = (
    Object.entries(ARCHETYPE_SIGNALS) as [BrandArchetype, ArchetypeSignals][]
  ).map(([archetype, signals]) => {
    let score = 0;

    for (const kw of signals.keywords) {
      if (text.includes(kw.toLowerCase())) score += 2;
    }
    for (const s of signals.sectors) {
      if (sector.includes(s)) score += 1.5;
    }
    for (const tone of signals.tones) {
      if (text.includes(tone.toLowerCase())) score += 1;
    }
    for (const v of signals.values) {
      if (text.includes(v.toLowerCase())) score += 1;
    }
    if (signals.growth_modes.includes(growth_mode)) score += 1;

    score *= signals.weight;

    const confidence: "low" | "medium" | "high" =
      score >= 6 ? "high" : score >= 3 ? "medium" : "low";

    return { archetype, score, confidence };
  });

  scores.sort((a, b) => b.score - a.score);

  const primary = scores[0]?.archetype ?? "Creator";
  const secondary = scores[1]?.score > 0 ? scores[1].archetype : null;

  const overall_confidence =
    scores[0]?.score >= 6 ? "high" : scores[0]?.score >= 3 ? "medium" : "low";

  const brand_essence = buildBrandEssence(primary);
  const narrative_tone = buildNarrativeTone(primary);

  return {
    primary,
    secondary,
    scores,
    confidence: overall_confidence,
    brand_essence,
    narrative_tone,
  };
}

function buildBrandEssence(archetype: BrandArchetype): string {
  const essences: Record<BrandArchetype, string> = {
    Creator: "Libérer la créativité et donner forme au beau",
    Sage: "Éclairer par la connaissance et l'expertise",
    Caregiver: "Protéger, nourrir et prendre soin",
    Explorer: "Découvrir, s'aventurer, repousser les limites",
    Ruler: "Diriger avec excellence et créer l'ordre",
    Rebel: "Défier les conventions et libérer le possible",
    Lover: "Créer des connexions profondes par la beauté et la passion",
    Hero: "Triompher des défis et inspirer la performance",
    Innocent: "Préserver la pureté, la simplicité et l'authenticité",
    Jester: "Apporter joie, légèreté et plaisir",
    Everyman: "Appartenir, connecter, servir tous",
    Magician: "Transformer la réalité et révéler le possible",
  };
  return essences[archetype];
}

function buildNarrativeTone(archetype: BrandArchetype): string {
  const tones: Record<BrandArchetype, string> = {
    Creator: "Inspirant, esthétique, artisanal",
    Sage: "Informatif, expert, factuel",
    Caregiver: "Chaleureux, rassurant, empathique",
    Explorer: "Aventurier, libre, dynamique",
    Ruler: "Autoritaire, précis, exclusif",
    Rebel: "Provocateur, audacieux, irrévérencieux",
    Lover: "Sensuel, passionné, intime",
    Hero: "Motivant, performant, ambitieux",
    Innocent: "Simple, honnête, optimiste",
    Jester: "Léger, humoristique, engageant",
    Everyman: "Accessible, pragmatique, chaleureux",
    Magician: "Visionnaire, mystérieux, transformateur",
  };
  return tones[archetype];
}
