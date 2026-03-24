// Core Logic for Prompt Generation (No API required)

export interface BrandBrief {
  brand_name: string;
  sector: string;
  tone: string;
  values: string;
  style_pref?: string;
}

export interface PromptResult {
  agent: string;
  prompt: string;
  parameters: Record<string, any>;
}

export interface GenerationResult {
  generated_at: string;
  version: string;
  brand: BrandBrief & { parsed_values: string[] };
  modules: {
    brand_identity: {
      logo: PromptResult;
      palette: PromptResult;
      typography: PromptResult;
      guidelines: PromptResult;
    };
  };
}

const LOGO_PROMPTS: Record<string, string> = {
  "luxe": `Crée un logo pour une marque de luxe.
Style: Élégant, raffiné, intemporel.
Typographie: Sérif fine (Playfair Display, Didot, ou équivalent).
Symbole: Couronne, pierre précieuse stylisée, ou lettre majuscule ornée.
Palette: Or (#D4AF37), noir profond (#1A1A1A), blanc cassé (#F5F5F5).
Variations: 4 versions (sur fond clair, sur fond sombre, monochrome, inversé).
Format: PNG et SVG vectoriel.`,

  "minimal": `Crée un logo minimaliste.
Style: Épuré, simple, moderne.
Typographie: Sans-serif géométrique (Inter, Montserrat).
Symbole: Forme géométrique simple, espace négatif, ou logotype pur.
Palette: Noir, blanc, gris (#333333).
Variations: 4 versions.
Format: PNG et SVG vectoriel.`,

  "street": `Crée un logo streetwear/urbain.
Style: Audacieux, brut, underground.
Typographie: Gras, condensé, ou style graffiti/gothique.
Symbole: Écusson, mascotte, ou lettrage destructuré.
Palette: Noir, blanc, rouge vif ou néon.
Variations: 4 versions.
Format: PNG et SVG vectoriel.`,

  "tech": `Crée un logo pour une entreprise tech.
Style: Innovant, précis, digital.
Typographie: Sans-serif technique (Roboto Mono, Space Grotesk).
Symbole: Pixel, code, onde, circuit, hexagone.
Palette: Bleu électrique, cyan, gris foncé.
Variations: 4 versions.
Format: PNG et SVG vectoriel.`,

  "artisanal": `Crée un logo de style artisanal/fait-main.
Style: Authentique, chaleureux, rustique.
Typographie: Manuscrite (script) ou sérif texturée.
Symbole: Outil, tampon, illustration au trait (line-art).
Palette: Terre cuite, beige, vert olive, charbon.
Variations: 4 versions.
Format: PNG et SVG vectoriel.`,

  "vintage": `Crée un logo de style rétro/vintage.
Style: Nostalgique, héritage, classique.
Typographie: Sérif épaisse ou script rétro.
Symbole: Badge, ruban, illustration vintage.
Palette: Sépia, bordeaux, bleu marine, moutarde.
Variations: 4 versions.
Format: PNG et SVG vectoriel.`,

  "playful": `Crée un logo ludique et amusant.
Style: Arrondi, dynamique, joyeux.
Typographie: Rounded sans-serif, bouncy.
Symbole: Sourire, étoile, nuage, forme organique.
Palette: Couleurs vives et joyeuses.
Variations: 4 versions.
Format: PNG et SVG vectoriel.`,

  "corporate": `Crée un logo corporate professionnel.
Style: Sobre, stable, confiance.
Typographie: Sans-serif solide (Roboto, Lato).
Symbole: Abstrait, géométrique, initiales.
Palette: Bleu marine, gris, blanc.
Variations: 4 versions.
Format: PNG et SVG vectoriel.`,

  "nature": `Crée un logo inspiré de la nature.
Style: Organique, fluide, apaisant.
Typographie: Douce, arrondie, organique.
Symbole: Feuille, arbre, montagne, vague.
Palette: Vert, marron, bleu ciel, beige.
Variations: 4 versions.
Format: PNG et SVG vectoriel.`,

  "editorial": `Crée un logo editorial/magazine.
Style: Raffiné, élégant, intemporel.
Typographie: Sérif élégant (Cormorant Garamond).
Symbole: Lettrine, trait fin, composition équilibrée.
Palette: Noir, blanc, or.
Variations: 4 versions.
Format: PNG et SVG vectoriel.`,

  "futuristic": `Crée un logo futuriste et innovant.
Style: Néon, dégradés dynamiques, formes fluides.
Typographie: Angulaire, expérimentale.
Symbole: Forme abstraite, lumière, mouvement.
Palette: Violet, cyan, magenta, dégradés.
Variations: 4 versions.
Format: PNG et SVG vectoriel.`,

  "ethnic": `Crée un logo avec motifs ethniques/culturels.
Style: Coloré, expressif, authentique.
Typographie: Expressive, décorative.
Symbole: Motifs traditionnels, tissus, artisanat.
Palette: Rouge, orange, or, terre.
Variations: 4 versions.
Format: PNG et SVG vectoriel.`
};

const PALETTE_PROMPT = `Génère une palette de couleurs professionnelle pour la marque:

1. COULEUR PRIMAIRE (dominante, 60% d'usage):
   - Couleur principale de la marque
   - Utilisation: logo, CTA, éléments majeurs

2. COULEUR SECONDAIRE (complément, 30% d'usage):
   - Complément harmonieux de la primaire
   - Utilisation: éléments de support, arrière-plans

3. COULEUR D'ACCENT (call to action, 10% d'usage):
   - Couleur contrastante pour attirer l'attention
   - Utilisation: boutons, offres, notifications

4. PALETTE NEUTRE (5 nuances):
   - Blanc (#FFFFFF)
   - Gris clair (#F5F5F5)
   - Gris moyen (#E0E0E0)
   - Gris foncé (#333333)
   - Noir (#000000)

5. RAPPORT WCAG 2.1 AA:
   - Vérifier le contraste pour chaque combinaison
   - Indiquer les paires valides/invalides

Format: HEX et RGB pour chaque couleur.`;

const TYPOGRAPHY_PROMPT = `Génère un système typographique complet:

1. POLICE TITRES (h1, h2, h3):
   - Nom de la police
   - Lien Google Fonts
   - Hiérarchie: h1 (48px), h2 (36px), h3 (24px)
   - Graisses: Bold, SemiBold

2. POLICE CORPS (body, paragraphes):
   - Nom de la police
   - Lien Google Fonts
   - Taille: 16px
   - Hauteur de ligne: 1.5
   - Graisses: Regular, Medium

3. POLICE ACCENT (CTA, boutons, captions):
   - Nom de la police
   - Lien Google Fonts
   - Taille: 14px (caption), 16px (button)
   - Graisses: Medium, Bold

4. FALLBACK WEB-SAFE:
   - Pour chaque police, proposer 2 fallbacks

5. CODE CSS:
   - Variables CSS pour toutes les polices
   - Classes utilitaires (.heading, .body, .caption)`;

const GUIDELINES_PROMPT = `Génère une charte graphique avec les règles d'usage suivantes:

R01 — USAGE DU LOGO
Règle: Le logo doit toujours être présenté dans l'une des 4 variations autorisées. Ne jamais déformer, recolorer ou ajouter d'effets.
Do's: Utiliser les fichiers fournis, respecter les proportions
Don'ts: Déformer, changer les couleurs, ajouter des ombres

R02 — ESPACE MINIMAL
Règle: L'espace de protection autour du logo = hauteur du 'O' du logotype.
Do's: Laisser cet espace libre
Don'ts: Placer du texte ou des éléments dans cet espace

R03 — TAILLE MINIMALE
Règle: Impression: 15mm minimum. Digital: 32px minimum.
Do's: Utiliser version monochrome en dessous
Don'ts: Utiliser logo complexe en petit format

R04 — COULEUR PRIMAIRE
Règle: Usage réservé aux éléments principaux (CTA, titres majeurs).
Do's: Dominante sur les éléments importants
Don'ts: Utiliser comme couleur de fond générale

R05 — COULEUR SECONDAIRE
Règle: Usage pour les éléments de support.
Do's: Arrière-plans, bordures, éléments décoratifs
Don'ts: Éclipser la couleur primaire

R06 — ACCESSIBILITÉ
Règle: Ratio de contraste ≥ 4.5:1 pour tout texte sur fond coloré.
Do's: Vérifier avec outils WCAG
Don'ts: Utiliser des combinaisons non contrastées

R07 — TYPOGRAPHIE TITRES
Règle: Usage exclusif pour h1, h2, h3.
Do's: Respecter la hiérarchie
Don'ts: Utiliser pour les paragraphes

R08 — TYPOGRAPHIE CORPS
Règle: Usage pour textes longs, paragraphes.
Do's: Maintenir une hauteur de ligne confortable
Don'ts: Utiliser pour les titres

R09 — TON ET VOIX
Règle: Le ton de marque s'applique à toute communication.
Do's: Adapter le vocabulaire au persona
Don'ts: Changer de ton selon le canal

R10 — VALEURS DE MARQUE
Règle: Toute communication doit incarner les valeurs fondamentales.
Do's: Illustrer les valeurs dans les visuels
Don'ts: Contredire les valeurs dans les messages

Pour chaque règle, fournir:
- ID unique (R01 à R10)
- Description détaillée
- Do's et Don'ts
- Conséquence en cas de non-respect`;

function detectStyle(sector: string): string {
  const mapping: Record<string, string> = {
    "bijou": "luxe",
    "luxe": "luxe",
    "mode": "editorial",
    "streetwear": "street",
    "cosmétique": "minimal",
    "skincare": "nature",
    "tech": "tech",
    "fitness": "playful",
    "décoration": "artisanal",
    "maroquinerie": "luxe",
    "gadgets": "futuristic",
    "montres": "luxe"
  };
  return mapping[sector.toLowerCase()] || "minimal";
}

function getLogoPrompt(style: string, brand_name: string, sector: string, tone: string, values: string[]): string {
  const base = LOGO_PROMPTS[style] || LOGO_PROMPTS["minimal"];
  
  return `Marque: ${brand_name}
Secteur: ${sector}
Ton: ${tone}
Valeurs: ${values.join(', ')}

Instructions supplémentaires:
- Le logo doit refléter les valeurs de la marque
- Le style doit correspondre au secteur d'activité
- Adapter la typographie et les couleurs au ton

${base}`;
}

function enhancePrompt(basePrompt: string, brand_name: string, sector: string, tone: string): string {
  return `Contexte Marque: ${brand_name} (Secteur: ${sector} | Ton: ${tone})\n\n${basePrompt}`;
}

export function generatePrompts(brief: BrandBrief): GenerationResult {
  const parsedValues = brief.values.split(',').map(v => v.trim()).filter(Boolean);
  const stylePref = brief.style_pref && brief.style_pref !== 'auto-detect' 
    ? brief.style_pref 
    : detectStyle(brief.sector);

  const logoPrompt = getLogoPrompt(stylePref, brief.brand_name, brief.sector, brief.tone, parsedValues);
  const palettePrompt = enhancePrompt(PALETTE_PROMPT, brief.brand_name, brief.sector, brief.tone);
  const typographyPrompt = enhancePrompt(TYPOGRAPHY_PROMPT, brief.brand_name, brief.sector, brief.tone);
  const guidelinesPrompt = enhancePrompt(GUIDELINES_PROMPT, brief.brand_name, brief.sector, brief.tone);

  return {
    generated_at: new Date().toISOString(),
    version: "1.0.0",
    brand: {
      ...brief,
      parsed_values: parsedValues
    },
    modules: {
      brand_identity: {
        logo: {
          agent: "Brand Design Agent / Product Display Agent",
          prompt: logoPrompt,
          parameters: {
            style: stylePref,
            variations: 4,
            formats: ["png", "svg"],
            dimensions: "2000x2000"
          }
        },
        palette: {
          agent: "Brand Design Agent",
          prompt: palettePrompt,
          parameters: {
            colors: ["primary", "secondary", "accent", "neutrals"],
            format: ["hex", "rgb"],
            wcag: true
          }
        },
        typography: {
          agent: "Brand Design Agent",
          prompt: typographyPrompt,
          parameters: {
            fonts: ["heading", "body", "accent"],
            format: ["google_fonts", "css"],
            fallbacks: true
          }
        },
        guidelines: {
          agent: "Brand Design Agent (PDF generation)",
          prompt: guidelinesPrompt,
          parameters: {
            rules: Array.from({length: 10}, (_, i) => `R${(i + 1).toString().padStart(2, '0')}`),
            format: "pdf",
            do_donts: true
          }
        }
      }
    }
  };
}

export function generateTxtExport(result: GenerationResult): string {
  const date = new Date(result.generated_at).toLocaleString('fr-FR');
  const b = result.brand;
  
  return `================================================================================
PROMPTS POUR ROBONEO.COM
Marque: ${b.brand_name} | Générée le: ${date}
================================================================================

--- MOD-01.1 — LOGO GENERATOR ---
Agent: ${result.modules.brand_identity.logo.agent}

${result.modules.brand_identity.logo.prompt}

--- MOD-01.2 — PALETTE GENERATOR ---
Agent: ${result.modules.brand_identity.palette.agent}

${result.modules.brand_identity.palette.prompt}

--- MOD-01.3 — TYPOGRAPHY SYSTEM ---
Agent: ${result.modules.brand_identity.typography.agent}

${result.modules.brand_identity.typography.prompt}

--- MOD-01.4 — BRAND GUIDELINES ---
Agent: ${result.modules.brand_identity.guidelines.agent}

${result.modules.brand_identity.guidelines.prompt}
`;
}
