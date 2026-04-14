interface BrandBrief {
  brandName: string;
  sector: string;
  tone: string;
  values: string[];
  logoStyle?: string;
  brandColors?: string;
}

interface SectorMapping {
  style: string;
  ambiance: string;
  symbolConcept: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const SECTOR_MAPPINGS: Record<string, SectorMapping> = {
  tech: {
    style: "corporate minimaliste, sobre et stable",
    ambiance: "trusted technology: sérieux, moderne, non ostentatoire",
    symbolConcept: "vecteurs, trajectoires contrôlées et rigueur scientifique",
    primaryColor: "#003087",
    secondaryColor: "#6C757D",
    accentColor: "#2F80ED",
  },
  luxury: {
    style: "minimaliste élégant, précision horlogère",
    ambiance: "prestige intemporel: élégance, raffinement, discrétion",
    symbolConcept: "élégance, héritage, précision artisanale",
    primaryColor: "#1A2C3E",
    secondaryColor: "#C5A572",
    accentColor: "#D4AF37",
  },
  streetwear: {
    style: "audacieux typographique, authenticité urbaine",
    ambiance: "street credibility: authentique, urbain, sans compromis",
    symbolConcept: "énergie urbaine, mouvement, authenticité",
    primaryColor: "#1A1A1A",
    secondaryColor: "#E63946",
    accentColor: "#F4A261",
  },
  fitness: {
    style: "dynamique énergique, angles vifs",
    ambiance: "performance: motivation, dépassement, force maîtrisée",
    symbolConcept: "dynamique, progression, force maîtrisée",
    primaryColor: "#1E3A8A",
    secondaryColor: "#EF4444",
    accentColor: "#22C55E",
  },
  cosmetic: {
    style: "doux organique, pureté, rondeurs subtiles",
    ambiance: "beauté naturelle: douceur, efficacité, bien-être",
    symbolConcept: "pureté, éclat, transformation naturelle",
    primaryColor: "#F5E6D3",
    secondaryColor: "#D4A5A5",
    accentColor: "#A7C7B9",
  },
};

const GOLDEN_EXAMPLE = `Crée le logo de Theravectys pour une marque tech corporate positionnée sur l'innovation, la rigueur scientifique et la fiabilité (expertise B2B, environnement R&D/ingénierie). Le logo doit inspirer stabilité, confiance et précision, avec une exécution premium, lisible et scalable pour usages web/app, documents officiels et supports institutionnels.

**Direction artistique (style, esprit, ambiance)**
Style corporate minimaliste, sobre et stable. Composition nette, géométrie propre, alignements rigoureux (grid-based design), contraste maîtrisé. Ambiance "trusted technology": sérieux, moderne, non ostentatoire. Éviter tout effet gadget. Rendu final **flat vector** (pas de 3D, pas de textures), contours propres, angles maîtrisés (mix subtil d'angles droits et coins légèrement arrondis pour la fiabilité).

**Typographie recommandée (sans-serif solide)**
- Police principale: **IBM Plex Sans** (Google Fonts) — https://fonts.google.com/specimen/IBM+Plex+Sans
  - Recommandation: "Theravectys" en **SemiBold 600** (tracking -1% à 0%), capitalisation: "Theravectys" (T majuscule, reste minuscules)
- Alternatives: **Roboto** https://fonts.google.com/specimen/Roboto ; **Lato** https://fonts.google.com/specimen/Lato ; **Inter** https://fonts.google.com/specimen/Inter
- Ajustements: kerning optique activé, hauteur de x confortable, lisibilité maximale à 24px de largeur.

**Symbole / icône (description précise + inspirations)**
Créer un symbole abstrait à gauche du wordmark, évoquant à la fois **vecteurs**, **trajectoires contrôlées** et **rigueur scientifique**:
- Icône basée sur un **"V" stylisé** construit avec 2 segments géométriques (épaisseur uniforme), formant une **flèche vectorielle** discrète vers l'avant (innovation) et une impression de **stabilité** (base plus large, sommet maîtrisé).
- Intégrer une **micro-grille** implicite via 2–3 points nodaux (petits cercles) alignés sur une trajectoire, comme une visualisation scientifique propre.
- Style: lignes pleines, angles propres, aucune référence médicale clichée.
- Taille du symbole: hauteur = hauteur de x du wordmark × 1.2, alignement vertical centré sur la baseline du texte.
- Espacement symbole/wordmark: aéré et proportionnel, respiration visuelle suffisante pour une lecture immédiate.

**Palette chromatique**
- Primaire: **#003087** — bleu marine confiance (60% des usages: fond, icône principale)
- Secondaire: **#6C757D** — gris corporate neutre (30%: textes secondaires, lignes, fonds légers)
- Accent: **#2F80ED** — tech highlight (10%: points nodaux, hover states, highlights)
- Neutres: #FFFFFF (fond clair), #F8F9FA (fond off-white), #0B1220 (fond sombre), #1C2B4A (bleu nuit)

**4 variations requises**
1. **Fond clair (principal)**: fond #FFFFFF, icône et wordmark en #003087 — usage web, documents, présentations
2. **Fond sombre**: fond #0B1220, wordmark et icône en #FFFFFF avec accent #2F80ED sur les points nodaux — usage digital dark mode, écrans, événements
3. **Monochrome noir**: fond #FFFFFF, logo entier en #1A1A1A — impression N&B, documents officiels, tampons
4. **Inversé (knockout)**: blanc #FFFFFF sur fond bleu marine #003087 — usage institutionnel, cartes de visite, en-têtes officiels

**Spécifications techniques**
- Format export: PNG 4000×4000px haute résolution (fond transparent), rendu Flat Design imitant un fichier vectoriel propre et épuré. ⚠️ Note post-production : les générateurs d'images (Midjourney, DALL-E, SDXL) produisent des fichiers matriciels (PNG/JPG) et non des SVG éditables. Une vectorisation manuelle est requise en post-production (Adobe Illustrator Live Trace, Inkscape ou Vector Magic) pour obtenir un fichier SVG réellement scalable et éditable.
- Zone de sécurité: espace blanc = hauteur de la lettre majuscule "T" du wordmark sur tous les côtés
- Taille minimale: 80px de largeur en digital, 20mm en impression
- Aspect géométrique: alignement parfait, espacement régulier et proportionnel, géométrie cohérente, composition équilibrée. ⚠️ Note : ce cahier des charges est destiné au designer humain qui utilisera ce prompt comme inspiration — les valeurs pixel exactes ne sont pas interprétées par les générateurs d'images IA.
- Proportions: ratio largeur/hauteur du logo complet entre 3:1 et 4:1
- Alignement: symbole et wordmark sur baseline commune, centrage vertical optique

**NEGATIVE_PROMPT**
vieux, obsolète, rétro, vintage, désordonné, câbles apparents en désordre, interface confuse, erreurs visibles, bugs, désinvolte, informel, trop décontracté, argot, watermark, mockup photoréaliste, gradients agressifs, 3D, bevel/emboss, textures, bruit, glitch, texte illisible, kerning mauvais, compression JPEG visible, artefacts IA, formes incohérentes, détails trop fins non-scalables, symboles médicaux clichés, ADN, seringue, croix, mascotte, cartoon, low-res

**PARAMÈTRES TECHNIQUES**
--ar 1:1 --style raw --no watermark --no texture --no gradient --no 3D --v 6`;

function buildSymbolDescription(sector: string, symbolConcept: string): string {
  const base = `Créer un symbole abstrait à gauche du wordmark, évoquant ${symbolConcept}:`;

  if (sector === "tech") {
    return `${base}
- Icône basée sur un "V" stylisé construit avec 2 segments géométriques (épaisseur uniforme), formant une flèche vectorielle discrète vers l'avant (innovation) et une impression de stabilité (base plus large, sommet maîtrisé).
- Intégrer une micro-grille implicite via 2–3 points nodaux (petits cercles) alignés sur une trajectoire, comme une visualisation scientifique propre.
- Style: lignes pleines, angles propres, aucune référence médicale clichée.
- Taille du symbole: hauteur = hauteur de x du wordmark × 1.2, alignement vertical centré sur la baseline du texte.
- Espacement symbole/wordmark: aéré et proportionnel, respiration visuelle suffisante pour une lecture immédiate.`;
  }

  if (sector === "luxury") {
    return `${base}
- Icône basée sur un monogramme stylisé évoquant l'héritage et la précision artisanale.
- Lignes épurées, géométrie parfaite, symétrie maîtrisée.
- Style: lignes fines, élégance discrète, sans surcharge décorative.
- Taille du symbole: hauteur = hauteur de x du wordmark × 1.2, alignement vertical centré sur la baseline du texte.
- Espacement symbole/wordmark: aéré et proportionnel, respiration visuelle suffisante pour une lecture immédiate.`;
  }

  if (sector === "streetwear") {
    return `${base}
- Icône basée sur une lettre stylisée ou un pictogramme urbain audacieux.
- Trait épais, angles vifs, présence marquée.
- Style: impact visuel fort, typographique, authenticité.
- Taille du symbole: hauteur = hauteur de x du wordmark × 1.2, alignement vertical centré sur la baseline du texte.
- Espacement symbole/wordmark: aéré et proportionnel, respiration visuelle suffisante pour une lecture immédiate.`;
  }

  if (sector === "fitness") {
    return `${base}
- Icône basée sur un symbole de mouvement (flèche, vague, dynamique).
- Lignes énergiques, sensation de vitesse et de puissance contrôlée.
- Style: dynamique, motivant, performance.
- Taille du symbole: hauteur = hauteur de x du wordmark × 1.2, alignement vertical centré sur la baseline du texte.
- Espacement symbole/wordmark: aéré et proportionnel, respiration visuelle suffisante pour une lecture immédiate.`;
  }

  if (sector === "cosmetic") {
    return `${base}
- Icône basée sur une forme organique (goutte, pétale, cercle parfait).
- Courbes douces, fluidité, sensation de pureté.
- Style: naturel, apaisant, élégance subtile.
- Taille du symbole: hauteur = hauteur de x du wordmark × 1.2, alignement vertical centré sur la baseline du texte.
- Espacement symbole/wordmark: aéré et proportionnel, respiration visuelle suffisante pour une lecture immédiate.`;
  }

  return `${base}
- Icône abstraite adaptée à l'univers de la marque.
- Style épuré, lisible, scalable.
- Taille du symbole: hauteur = hauteur de x du wordmark × 1.2, alignement vertical centré sur la baseline du texte.
- Espacement symbole/wordmark: aéré et proportionnel, respiration visuelle suffisante pour une lecture immédiate.`;
}

function buildNegativePromptSuffix(sector: string): string {
  const base =
    "vieux, obsolète, rétro, vintage, désordonné, câbles apparents en désordre, interface confuse, erreurs visibles, bugs, désinvolte, informel, trop décontracté, argot, watermark, mockup photoréaliste, gradients agressifs, 3D, bevel/emboss, textures, bruit, glitch, texte illisible, kerning mauvais, compression JPEG visible, artefacts IA, formes incohérentes, détails trop fins non-scalables, symboles médicaux clichés, ADN, seringue, croix, mascotte, cartoon, low-res";

  if (sector === "luxury") return `${base}, cheap, bas de gamme, imitation, plastique, brillant excessif`;
  if (sector === "streetwear") return `${base}, commercial, corporate, trop propre, aseptisé, institutionnel`;
  if (sector === "fitness") return `${base}, statique, mou, sans énergie, passif, lourd`;
  if (sector === "cosmetic") return `${base}, agressif, angulaire, synthétique, artificiel`;
  return base;
}

function parseHexColors(colorStr: string): string[] {
  return (colorStr.match(/#[0-9A-Fa-f]{6}/g) ?? []).slice(0, 3);
}

export function buildLogoPrompt(brief: BrandBrief): string {
  const sector = brief.sector.toLowerCase();
  const mapping = SECTOR_MAPPINGS[sector] ?? SECTOR_MAPPINGS["tech"];

  const style = brief.logoStyle ?? mapping.style;
  const { ambiance, symbolConcept } = mapping;

  const clientHexes = brief.brandColors ? parseHexColors(brief.brandColors) : [];
  const primaryColor = clientHexes[0] ?? mapping.primaryColor;
  const secondaryColor = clientHexes[1] ?? mapping.secondaryColor;
  const accentColor = clientHexes[2] ?? mapping.accentColor;

  const clientColorsBlock = brief.brandColors
    ? `\n⚠️ COULEURS CLIENT IMPOSÉES — PRIORITÉ ABSOLUE:\nLe client a fourni: ${brief.brandColors}\nUtilise EXCLUSIVEMENT ces couleurs. NE PAS les remplacer par d'autres teintes.`
    : "";

  const valuesText = brief.values.join(", ");
  const v0 = brief.values[0] ?? "stabilité";
  const v1 = brief.values[1] ?? "confiance";
  const v2 = brief.values[2] ?? "précision";

  const symbolDescription = buildSymbolDescription(sector, symbolConcept);
  const negativePrompt = buildNegativePromptSuffix(sector);

  let prompt = GOLDEN_EXAMPLE;

  prompt = prompt.replace(/Theravectys/g, brief.brandName);
  prompt = prompt.replace(/tech corporate/g, `${brief.sector} ${brief.tone}`);
  prompt = prompt.replace(/l'innovation, la rigueur scientifique et la fiabilité/g, valuesText);
  prompt = prompt.replace(/stabilité, confiance et précision/g, `${v0}, ${v1}, ${v2}`);
  prompt = prompt.replace(/Style corporate minimaliste, sobre et stable/g, `Style ${style}`);
  prompt = prompt.replace(
    /Ambiance "trusted technology": sérieux, moderne, non ostentatoire/g,
    `Ambiance "${ambiance}"`
  );
  prompt = prompt.replace(
    /Créer un symbole abstrait à gauche du wordmark, évoquant à la fois \*\*vecteurs\*\*, \*\*trajectoires contrôlées\*\* et \*\*rigueur scientifique\*\*:[\s\S]*?(?=\n\n\*\*Palette)/,
    `${symbolDescription}\n`
  );
  prompt = prompt.replace(/#003087/g, primaryColor);
  prompt = prompt.replace(/#6C757D/g, secondaryColor);
  prompt = prompt.replace(/#2F80ED/g, accentColor);
  prompt = prompt.replace(/bleu marine confiance/g, `${primaryColor} (couleur primaire)`);
  prompt = prompt.replace(/gris corporate neutre/g, `${secondaryColor} (couleur secondaire)`);
  prompt = prompt.replace(/tech highlight/g, `highlight ${brief.sector}`);
  prompt = prompt.replace(
    /fond #FFFFFF, icône et wordmark en #003087/g,
    `fond #FFFFFF, icône et wordmark en ${primaryColor}`
  );
  prompt = prompt.replace(
    /blanc #FFFFFF sur fond bleu marine #003087/g,
    `blanc #FFFFFF sur fond ${primaryColor}`
  );
  prompt = prompt.replace(
    /vieux, obsolète, rétro, vintage[\s\S]*?low-res/,
    negativePrompt
  );

  if (clientColorsBlock) {
    prompt = prompt.replace(
      /(\*\*Palette chromatique\*\*)/,
      `**Palette chromatique**${clientColorsBlock}`
    );
  }

  return prompt;
}
