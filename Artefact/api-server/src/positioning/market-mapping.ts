/**
 * STRATEGIC POSITIONING ENGINE — Cartographie de marché
 *
 * Positionne la marque sur des axes stratégiques (Luxe↔Accessible,
 * Technique↔Émotionnel, Minimaliste↔Expressif) et détecte les
 * espaces blancs concurrentiels.
 */

export interface MarketAxis {
  name: string;
  left_pole: string;
  right_pole: string;
  brand_position: number; // -1.0 (gauche) à +1.0 (droite)
  confidence: "low" | "medium" | "high";
}

export interface MarketMapResult {
  axes: MarketAxis[];
  whitespace_detected: boolean;
  whitespace_zones: string[];
  competitive_density: "low" | "medium" | "high";
  strategic_opportunity: string;
}

interface AxisSignals {
  left_keywords: string[];
  right_keywords: string[];
}

const AXIS_DEFINITIONS: { name: string; left_pole: string; right_pole: string; signals: AxisSignals }[] = [
  {
    name: "price_positioning",
    left_pole: "Accessible",
    right_pole: "Luxe",
    signals: {
      left_keywords: ["accessible", "abordable", "économique", "budget", "low-cost", "everyday", "everyone"],
      right_keywords: ["luxe", "premium", "prestige", "exclusif", "high-end", "luxury", "élite", "haut de gamme"],
    },
  },
  {
    name: "communication_style",
    left_pole: "Technique",
    right_pole: "Émotionnel",
    signals: {
      left_keywords: ["technique", "performance", "efficacité", "données", "résultats", "prouvé", "scientifique", "ingrediants"],
      right_keywords: ["émotion", "sensation", "feeling", "expérience", "lifestyle", "âme", "passion", "ressenti"],
    },
  },
  {
    name: "visual_language",
    left_pole: "Minimaliste",
    right_pole: "Expressif",
    signals: {
      left_keywords: ["minimaliste", "épuré", "simple", "clean", "blanc", "neutre", "essentiel", "minimal"],
      right_keywords: ["expressif", "coloré", "bold", "vibrant", "dynamique", "créatif", "richement", "maximaliste"],
    },
  },
  {
    name: "brand_stance",
    left_pole: "Tradition",
    right_pole: "Innovation",
    signals: {
      left_keywords: ["tradition", "heritage", "artisanal", "savoir-faire", "classique", "authentique", "historique"],
      right_keywords: ["innovation", "futur", "tech", "disruption", "nouveau", "révolutionnaire", "inédit", "next-gen"],
    },
  },
];

/**
 * Positionne une marque sur les axes stratégiques à partir de son brief.
 */
export function buildMarketMap(input: {
  sector?: string;
  tone?: string;
  values?: string[];
  growth_mode?: string;
  description?: string;
  price_tier?: "budget" | "mid" | "premium" | "luxury";
}): MarketMapResult {
  const text = [
    input.tone ?? "",
    (input.values ?? []).join(" "),
    input.description ?? "",
    input.sector ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const axes: MarketAxis[] = AXIS_DEFINITIONS.map((axisDef) => {
    const left_score = axisDef.signals.left_keywords.filter((kw) =>
      text.includes(kw.toLowerCase()),
    ).length;
    const right_score = axisDef.signals.right_keywords.filter((kw) =>
      text.includes(kw.toLowerCase()),
    ).length;

    let position = 0;
    if (left_score + right_score > 0) {
      position = (right_score - left_score) / (left_score + right_score);
    }

    // Ajustements sectoriels
    if (axisDef.name === "price_positioning") {
      if (input.price_tier === "luxury" || input.growth_mode === "premium_brand") position = Math.max(position, 0.5);
      if (input.price_tier === "budget") position = Math.min(position, -0.5);
    }

    const total_signals = left_score + right_score;
    const confidence: "low" | "medium" | "high" =
      total_signals >= 4 ? "high" : total_signals >= 2 ? "medium" : "low";

    return {
      name: axisDef.name,
      left_pole: axisDef.left_pole,
      right_pole: axisDef.right_pole,
      brand_position: Math.round(position * 100) / 100,
      confidence,
    };
  });

  // ── Détection d'espaces blancs ──────────────────────────────────────────────
  const whitespace_zones: string[] = [];

  const price_axis = axes.find((a) => a.name === "price_positioning");
  const comm_axis = axes.find((a) => a.name === "communication_style");
  const visual_axis = axes.find((a) => a.name === "visual_language");

  if (price_axis && comm_axis) {
    if (price_axis.brand_position > 0.3 && comm_axis.brand_position < -0.2) {
      whitespace_zones.push("Luxe technique — territoire peu occupé dans ce secteur");
    }
    if (price_axis.brand_position < -0.3 && comm_axis.brand_position > 0.3) {
      whitespace_zones.push("Accessible émotionnel — positionnement différenciant");
    }
  }
  if (visual_axis) {
    if (visual_axis.brand_position < -0.4) {
      whitespace_zones.push("Minimalisme radical — rare et mémorisable dans un marché saturé");
    }
  }

  const competitive_density: "low" | "medium" | "high" =
    whitespace_zones.length >= 2 ? "low" : whitespace_zones.length === 1 ? "medium" : "high";

  const strategic_opportunity =
    whitespace_zones.length > 0
      ? `Territoire identifié : ${whitespace_zones[0]}`
      : "Positionnement central — différenciation à construire via l'exécution créative";

  return {
    axes,
    whitespace_detected: whitespace_zones.length > 0,
    whitespace_zones,
    competitive_density,
    strategic_opportunity,
  };
}
