/**
 * STRATEGIC POSITIONING ENGINE — Constructeur de territoire narratif
 *
 * Produit le territoire de marque complet : tension fondatrice, promesse,
 * hook émotionnel, pilier fonctionnel, ancre culturelle et anti-positionnement.
 */

import type { BrandArchetype } from "./archetype-engine";

export interface BrandTerritory {
  core_tension: string;
  brand_promise: string;
  emotional_hook: string;
  functional_pillar: string;
  cultural_anchor: string;
  anti_positioning: string;
  tagline_direction: string;
}

interface TerritoryTemplate {
  core_tension: (brand: string, sector: string) => string;
  brand_promise: (brand: string) => string;
  emotional_hook: string;
  functional_pillar: (sector: string) => string;
  cultural_anchor: string;
  anti_positioning: string;
  tagline_direction: string;
}

const ARCHETYPE_TERRITORIES: Record<BrandArchetype, TerritoryTemplate> = {
  Creator: {
    core_tension: (brand, _) => `Entre ce qui existe et ce qui n'a pas encore été imaginé — ${brand} ouvre le territoire du possible.`,
    brand_promise: (brand) => `${brand} transforme chaque interaction en une opportunité d'expression unique.`,
    emotional_hook: "La fierté de posséder quelque chose qui n'appartient qu'à soi.",
    functional_pillar: (_) => "Un savoir-faire artisanal traduit en produit d'une précision irréprochable.",
    cultural_anchor: "L'art comme langage universel, la créativité comme acte de résistance.",
    anti_positioning: "Ni industriel, ni générique. Jamais une copie — toujours un original.",
    tagline_direction: "Quelque chose a été créé. Il ne reste plus qu'à le vivre.",
  },
  Sage: {
    core_tension: (brand, _) => `Dans un monde de bruit, ${brand} est la voix qui éclaire.`,
    brand_promise: (brand) => `${brand} donne accès à la connaissance qui compte vraiment.`,
    emotional_hook: "La confiance que procure un savoir vérifiable.",
    functional_pillar: (_) => "Des données, des preuves, une expertise indiscutable.",
    cultural_anchor: "La vérité comme valeur fondatrice dans un monde de raccourcis.",
    anti_positioning: "Pas de promesses creuses. Pas de tendances. Que des faits.",
    tagline_direction: "Ce que vous savez change tout.",
  },
  Caregiver: {
    core_tension: (brand, _) => `Entre le monde qui bouscule et le refuge que ${brand} construit.`,
    brand_promise: (brand) => `${brand} veille, protège et nourrit — comme personne d'autre.`,
    emotional_hook: "La sécurité d'être entre de bonnes mains.",
    functional_pillar: (_) => "Des formules pensées pour la douceur, la protection, le long terme.",
    cultural_anchor: "Prendre soin de soi est un acte de respect envers les autres.",
    anti_positioning: "Pas de performance à tout prix. L'efficacité au service du bien-être.",
    tagline_direction: "Parce que vous méritez d'être pris en soin.",
  },
  Explorer: {
    core_tension: (brand, _) => `Entre la carte connue et le territoire qui reste à découvrir — ${brand} choisit l'inconnu.`,
    brand_promise: (brand) => `${brand} équipe chaque aventure, réelle ou intérieure.`,
    emotional_hook: "L'adrénaline de la première fois. La liberté sans barrière.",
    functional_pillar: (_) => "Conçu pour performer dans toutes les conditions, partout dans le monde.",
    cultural_anchor: "Les frontières sont des conventions. L'exploration est un état d'esprit.",
    anti_positioning: "Pas de confort superficiel. Pas de routine. Toujours au-delà.",
    tagline_direction: "L'horizon ne recule que si vous vous arrêtez.",
  },
  Ruler: {
    core_tension: (brand, _) => `Entre l'excellence qui se mérite et le compromis que le monde accepte — ${brand} choisit l'excellence.`,
    brand_promise: (brand) => `${brand} est la référence que les autres s'efforcent d'égaler.`,
    emotional_hook: "Le sentiment d'appartenir à une élite discrète et exigeante.",
    functional_pillar: (_) => "La précision, la durabilité et l'autorité dans chaque détail.",
    cultural_anchor: "Le pouvoir véritable ne se montre pas. Il se ressent.",
    anti_positioning: "Pas pour tout le monde. Pas pour tout de suite. Seulement pour ceux qui comprennent.",
    tagline_direction: "La différence entre le bon et le référent.",
  },
  Rebel: {
    core_tension: (brand, _) => `Entre les règles établies et le monde qu'il faudrait créer — ${brand} choisit la rupture.`,
    brand_promise: (brand) => `${brand} est pour ceux qui refusent de jouer selon les règles de quelqu'un d'autre.`,
    emotional_hook: "La satisfaction de dire non à la norme et oui à soi-même.",
    functional_pillar: (_) => "Un produit pensé pour casser les conventions, pas pour les prolonger.",
    cultural_anchor: "La rébellion n'est pas une posture. C'est une nécessité créatrice.",
    anti_positioning: "Pas sage, pas classique, pas formaté. Jamais.",
    tagline_direction: "Les règles sont faites pour ceux qui n'ont rien à dire.",
  },
  Lover: {
    core_tension: (brand, _) => `Entre la routine du quotidien et l'intensité d'un instant — ${brand} cultive l'intensité.`,
    brand_promise: (brand) => `${brand} transforme chaque moment en une expérience qui marque.`,
    emotional_hook: "Le frisson du désir. La profondeur d'une connexion vraie.",
    functional_pillar: (_) => "Des formules, des textures, des détails pensés pour émouvoir les sens.",
    cultural_anchor: "La beauté n'est pas superficielle. Elle est le langage de l'âme.",
    anti_positioning: "Pas fonctionnel d'abord. L'expérience prime sur le résultat.",
    tagline_direction: "Ce que vous ressentez est la vérité.",
  },
  Hero: {
    core_tension: (brand, _) => `Entre les obstacles qui freinent et la performance que ${brand} libère.`,
    brand_promise: (brand) => `${brand} équipe ceux qui refusent la médiocrité.`,
    emotional_hook: "La fierté de se dépasser. La certitude d'avoir tout donné.",
    functional_pillar: (_) => "Des résultats mesurables. Une efficacité prouvée. Aucun compromis.",
    cultural_anchor: "La performance est un choix. Chaque jour. Sans excuses.",
    anti_positioning: "Pas de douceur. Pas de facilité. Que de la progression.",
    tagline_direction: "Vous êtes à une décision du prochain niveau.",
  },
  Innocent: {
    core_tension: (brand, _) => `Entre le monde qui complique et ${brand} qui simplifie.`,
    brand_promise: (brand) => `${brand} prouve que ce qui est pur est aussi ce qui est puissant.`,
    emotional_hook: "La paix d'esprit de savoir que c'est bon, vrai, et honnête.",
    functional_pillar: (_) => "Des ingrédients propres, des processus transparents, rien à cacher.",
    cultural_anchor: "La simplicité est la sophistication ultime.",
    anti_positioning: "Pas de chimie inutile. Pas de marketing vide. Que du vrai.",
    tagline_direction: "Quand c'est bon, il n'y a rien à ajouter.",
  },
  Jester: {
    core_tension: (brand, _) => `Entre un monde qui se prend trop au sérieux et ${brand} qui ose rire.`,
    brand_promise: (brand) => `${brand} prouve que le plaisir est la meilleure stratégie.`,
    emotional_hook: "Le sourire spontané. La légèreté qu'on n'attendait pas.",
    functional_pillar: (_) => "Un produit qui fonctionne, mais qui surtout fait du bien au moral.",
    cultural_anchor: "L'humour est une intelligence. La joie, une nécessité.",
    anti_positioning: "Pas solennel, pas institutionnel. Jamais ennuyeux.",
    tagline_direction: "La vie est trop courte pour les marques sans caractère.",
  },
  Everyman: {
    core_tension: (brand, _) => `Entre les marques pour les quelques-uns et ${brand} qui est pour tout le monde.`,
    brand_promise: (brand) => `${brand} croit que la qualité ne devrait jamais être un privilège.`,
    emotional_hook: "Le sentiment d'être compris, respecté, et bien servi.",
    functional_pillar: (_) => "Un rapport qualité/valeur qui ne trahit jamais la confiance.",
    cultural_anchor: "Le quotidien mérite mieux que du médiocre.",
    anti_positioning: "Pas élitiste, pas inaccessible. Pour les gens réels.",
    tagline_direction: "Fait pour vous. Vraiment.",
  },
  Magician: {
    core_tension: (brand, _) => `Entre ce que vous êtes et ce que ${brand} peut vous aider à devenir.`,
    brand_promise: (brand) => `${brand} catalyse des transformations que vous n'auriez pas cru possibles.`,
    emotional_hook: "L'émerveillement du changement. La magie de la révélation.",
    functional_pillar: (_) => "Une technologie ou une formule qui transcende les attentes.",
    cultural_anchor: "Toute transformation commence par une vision que les autres ne partagent pas encore.",
    anti_positioning: "Pas incrémental, pas évolutif. Transformationnel ou rien.",
    tagline_direction: "Vous ne serez plus jamais le même.",
  },
};

/**
 * Construit le territoire narratif complet d'une marque.
 */
export function buildBrandTerritory(
  archetype: BrandArchetype,
  brand_name: string,
  sector: string,
): BrandTerritory {
  const template = ARCHETYPE_TERRITORIES[archetype];

  return {
    core_tension: template.core_tension(brand_name, sector),
    brand_promise: template.brand_promise(brand_name),
    emotional_hook: template.emotional_hook,
    functional_pillar: template.functional_pillar(sector),
    cultural_anchor: template.cultural_anchor,
    anti_positioning: template.anti_positioning,
    tagline_direction: template.tagline_direction,
  };
}

/**
 * Sérialise le territoire narratif pour injection en system prompt.
 */
export function brandTerritoryToPromptBlock(territory: BrandTerritory): string {
  return [
    "═══ STRATEGIC POSITIONING LAYER ═══",
    `• Tension fondatrice : ${territory.core_tension}`,
    `• Promesse de marque : ${territory.brand_promise}`,
    `• Hook émotionnel : ${territory.emotional_hook}`,
    `• Pilier fonctionnel : ${territory.functional_pillar}`,
    `• Ancre culturelle : ${territory.cultural_anchor}`,
    `• Anti-positionnement : ${territory.anti_positioning}`,
    `• Direction tagline : ${territory.tagline_direction}`,
  ].join("\n");
}
