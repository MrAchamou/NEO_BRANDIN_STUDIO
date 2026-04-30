/**
 * STRATEGIC POSITIONING ENGINE — Strategic Compression Output (Agency Mode)
 *
 * Génère automatiquement les 5 livrables de compression stratégique :
 * 1. One-sentence positioning
 * 2. 3 Brand pillars
 * 3. Anti-positioning statement
 * 4. Manifesto paragraph
 * 5. Narrative tension summary
 *
 * Format agency-ready, client-presentable.
 */

import { type BrandArchetype as Archetype } from "./archetype-engine";
import { type BrandTerritory } from "./territory-builder";

export interface StrategicCompressionInput {
  brand_name: string;
  archetype: Archetype;
  sector?: string;
  territory: BrandTerritory;
  values?: string[];
  tone?: string;
  output_mode?: "internal" | "client_ready";
}

export interface StrategicCompressionOutput {
  brand_name: string;
  generated_at: string;
  output_mode: "internal" | "client_ready";
  one_sentence_positioning: string;
  brand_pillars: [string, string, string];
  anti_positioning: string;
  manifesto: string;
  narrative_tension_summary: string;
  export_block: string;
}

// ── Templates de compression par archétype ───────────────────────────────────
const ARCHETYPE_POSITIONING_TEMPLATES: Record<Archetype, string> = {
  Innocent: "{brand} est la marque qui redonne confiance en {sector} à travers la pureté et la sincérité.",
  Everyman: "{brand} est la marque accessible qui traite chaque client comme un membre de la famille.",
  Hero: "{brand} est la marque qui aide les {sector_audience} à dépasser leurs limites et atteindre l'excellence.",
  Outlaw: "{brand} est la marque qui refuse les règles absurdes du {sector} et crée de nouvelles normes.",
  Explorer: "{brand} est la marque qui emmène les curieux là où aucune autre marque n'a encore osé aller.",
  Creator: "{brand} est la marque qui transforme chaque acte en {sector} en une expression artistique.",
  Ruler: "{brand} est la référence absolue du {sector} — le standard contre lequel tout est mesuré.",
  Magician: "{brand} est la marque qui transforme l'ordinaire en {sector} en quelque chose d'extraordinaire.",
  Lover: "{brand} est la marque du désir, de la beauté et de la connexion émotionnelle profonde.",
  Caregiver: "{brand} est la marque bienveillante qui prend soin de chaque détail pour ceux qui comptent.",
  Jester: "{brand} prouve que le {sector} n'a pas à être sérieux — et que la joie est la meilleure stratégie.",
  Sage: "{brand} est la marque qui élève le niveau du {sector} par la connaissance, la rigueur et la vérité.",
};

const ARCHETYPE_MANIFESTO_PATTERNS: Record<Archetype, string> = {
  Innocent: "Nous croyons que la simplicité est la forme la plus haute d'intelligence. Que la pureté n'est pas naïve, elle est courageuse.",
  Everyman: "Nous croyons que les meilleures choses de la vie sont accessibles à tous. Pas de prétention. Pas de filtres. Juste du vrai.",
  Hero: "Nous refusons la médiocrité. Nous croyons que chaque personne a en elle un potentiel extraordinaire. Notre mission : l'éveiller.",
  Outlaw: "Les règles du jeu ont été écrites par ceux qui ont tout intérêt à ce que rien ne change. Nous sommes là pour les réécrire.",
  Explorer: "Il y a toujours un territoire inexploré. Un angle nouveau. Une vérité cachée. Nous vivons pour la trouver.",
  Creator: "Chaque produit est une œuvre. Chaque décision est artistique. Nous ne fabriquons pas — nous créons.",
  Ruler: "L'excellence n'est pas un objectif. C'est un standard. Le nôtre — et celui que vous méritez.",
  Magician: "La transformation est possible. Pas dans un futur lointain. Maintenant. C'est notre promesse.",
  Lover: "Nous croyons que la beauté n'est pas superficielle — elle est essentielle. Elle connecte, elle inspire, elle élève.",
  Caregiver: "Derrière chaque produit, il y a une personne qui compte. Nous ne l'oublions jamais.",
  Jester: "La vie est trop courte pour prendre le sérieux au sérieux. Nos produits sourient. Et vous aussi.",
  Sage: "Nous ne vendons pas des promesses. Nous construisons des vérités. Fondées sur la recherche, forgées par l'expérience.",
};

const ARCHETYPE_ANTI_POSITIONING: Record<Archetype, string> = {
  Innocent: "Nous ne sommes pas une marque de luxe froide ni un discours scientifique désincorporé.",
  Everyman: "Nous ne cherchons pas à être exclusifs ou élitistes — le prestige n'est pas notre langage.",
  Hero: "Nous ne glorifions pas la douleur gratuite ni l'effort sans but — chaque défi a un sens.",
  Outlaw: "Nous ne sommes pas destructeurs pour le plaisir — nous provocons pour construire quelque chose de meilleur.",
  Explorer: "Nous ne promettons pas l'exotisme factice — notre exploration est authentique et purpose-driven.",
  Creator: "Nous ne faisons pas du design pour le design — chaque élément créatif a une fonction stratégique.",
  Ruler: "Nous ne sommes pas arrogants ni inaccessibles — notre excellence est au service du client.",
  Magician: "Nous ne faisons pas de promesses irréalistes — notre magie est tangible, mesurable, répétable.",
  Lover: "Nous ne manipulons pas le désir — nous le créons authentiquement, sans dark patterns.",
  Caregiver: "Nous ne sommes pas condescendants ni paternalistes — nous respectons l'autonomie de nos clients.",
  Jester: "Nous ne minimisons pas les enjeux — notre légèreté est un choix stratégique, pas une fuite.",
  Sage: "Nous ne sommes pas pédants ni inaccessibles — la connaissance que nous partageons est actionnable.",
};

/**
 * Génère la compression stratégique complète pour une marque.
 */
export function generateStrategicCompression(input: StrategicCompressionInput): StrategicCompressionOutput {
  const { brand_name, archetype, sector, territory, values, tone, output_mode = "client_ready" } = input;

  const sector_label = sector ?? "votre secteur";
  const sector_audience = sector === "fitness" ? "athlètes" : sector === "saas" ? "équipes" : "clients";

  // ── 1. One-sentence positioning ────────────────────────────────────────────
  const template = ARCHETYPE_POSITIONING_TEMPLATES[archetype];
  const one_sentence_positioning = template
    .replace("{brand}", brand_name)
    .replace("{sector}", sector_label)
    .replace("{sector_audience}", sector_audience);

  // ── 2. Brand pillars ──────────────────────────────────────────────────────
  const value_fallbacks = (values ?? []).slice(0, 3);

  const raw_pillars = [
    territory.functional_pillar ?? value_fallbacks[0] ?? "Authenticité",
    territory.emotional_hook ?? value_fallbacks[1] ?? "Excellence",
    territory.cultural_anchor ?? value_fallbacks[2] ?? "Impact",
  ];

  const brand_pillars: [string, string, string] = [
    raw_pillars[0],
    raw_pillars[1],
    raw_pillars[2],
  ];

  // ── 3. Anti-positioning ───────────────────────────────────────────────────
  const anti_positioning = ARCHETYPE_ANTI_POSITIONING[archetype];

  // ── 4. Manifesto ──────────────────────────────────────────────────────────
  const manifesto_base = ARCHETYPE_MANIFESTO_PATTERNS[archetype];
  const manifesto = output_mode === "client_ready"
    ? `${manifesto_base} ${territory.brand_promise.slice(0, 120)}`
    : manifesto_base;

  // ── 5. Narrative tension ──────────────────────────────────────────────────
  const narrative_tension_summary =
    territory.core_tension?.length > 0
      ? territory.core_tension
      : `Tension fondatrice de ${brand_name} : entre ${brand_pillars[0]} et la réalité du marché ${sector_label}.`;

  // ── Export block ──────────────────────────────────────────────────────────
  const export_block = buildExportBlock({
    brand_name,
    one_sentence_positioning,
    brand_pillars,
    anti_positioning,
    manifesto,
    narrative_tension_summary,
    output_mode,
  });

  return {
    brand_name,
    generated_at: new Date().toISOString(),
    output_mode,
    one_sentence_positioning,
    brand_pillars,
    anti_positioning,
    manifesto,
    narrative_tension_summary,
    export_block,
  };
}

function buildExportBlock(params: {
  brand_name: string;
  one_sentence_positioning: string;
  brand_pillars: [string, string, string];
  anti_positioning: string;
  manifesto: string;
  narrative_tension_summary: string;
  output_mode: "internal" | "client_ready";
}): string {
  const lines: string[] = [];

  if (params.output_mode === "client_ready") {
    lines.push(`# Compression Stratégique — ${params.brand_name}`);
    lines.push("");
    lines.push("## Positionnement");
    lines.push(params.one_sentence_positioning);
    lines.push("");
    lines.push("## Les 3 Piliers de Marque");
    params.brand_pillars.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
    lines.push("");
    lines.push("## Ce que nous ne sommes pas");
    lines.push(params.anti_positioning);
    lines.push("");
    lines.push("## Notre Manifeste");
    lines.push(params.manifesto);
    lines.push("");
    lines.push("## Tension Narrative");
    lines.push(params.narrative_tension_summary);
  } else {
    lines.push(`[INTERNAL] ${params.brand_name}`);
    lines.push(`POSITIONING: ${params.one_sentence_positioning}`);
    lines.push(`PILLARS: ${params.brand_pillars.join(" | ")}`);
    lines.push(`ANTI: ${params.anti_positioning}`);
    lines.push(`MANIFESTO: ${params.manifesto}`);
    lines.push(`TENSION: ${params.narrative_tension_summary}`);
  }

  return lines.join("\n");
}
