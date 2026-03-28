interface BrandBrief {
  brandName: string;
  sector: string;
  tone: string;
  values: string[];
  primaryColorHint?: string;
}

interface ColorEntry {
  hex: string;
  rgb: string;
  meaning: string;
  role: string;
}

interface SecondaryEntry {
  hex: string;
  rgb: string;
  meaning: string;
  harmony: string;
}

interface AccentEntry {
  hex: string;
  rgb: string;
  meaning: string;
}

interface SectorPalette {
  primary: ColorEntry;
  secondary: SecondaryEntry;
  accent: AccentEntry;
  neutrals: Record<"01" | "02" | "03" | "04" | "05", string>;
}

const SECTOR_PALETTES: Record<string, SectorPalette> = {
  tech: {
    primary: { hex: "#003087", rgb: "0,48,135", meaning: "fiabilité, confiance, rigueur scientifique", role: "fonds UI, header, blocs de marque" },
    secondary: { hex: "#6C757D", rgb: "108,117,125", meaning: "neutralité technique, support, sobriété", harmony: "gris neutre complémentaire au bleu profond, apporte équilibre et lisibilité" },
    accent: { hex: "#2F80ED", rgb: "47,128,237", meaning: "énergie contrôlée, action technologique, clarté" },
    neutrals: { "01": "#F8F9FA", "02": "#E9ECEF", "03": "#DEE2E6", "04": "#6C757D", "05": "#212529" },
  },
  luxury: {
    primary: { hex: "#1A2C3E", rgb: "26,44,62", meaning: "prestige, profondeur, élégance intemporelle", role: "fonds premium, en-têtes, éléments d'autorité" },
    secondary: { hex: "#C5A572", rgb: "197,165,114", meaning: "richesse, raffinement, héritage", harmony: "contraste chaud-froid, élégance dorée sur fond profond" },
    accent: { hex: "#D4AF37", rgb: "212,175,55", meaning: "luxe, exclusivité, excellence" },
    neutrals: { "01": "#F5F3F0", "02": "#E8E4DD", "03": "#D4CDBC", "04": "#8B7A6B", "05": "#2C2418" },
  },
  streetwear: {
    primary: { hex: "#1A1A1A", rgb: "26,26,26", meaning: "authenticité, puissance, attitude urbaine", role: "fonds, éléments dominants, identité forte" },
    secondary: { hex: "#E63946", rgb: "230,57,70", meaning: "énergie, audace, rébellion maîtrisée", harmony: "contraste maximal, tension visuelle dynamique" },
    accent: { hex: "#F4A261", rgb: "244,162,97", meaning: "chaleur urbaine, signal fort, singularité" },
    neutrals: { "01": "#F5F5F5", "02": "#E0E0E0", "03": "#BDBDBD", "04": "#757575", "05": "#212121" },
  },
  fitness: {
    primary: { hex: "#1E3A8A", rgb: "30,58,138", meaning: "performance, discipline, puissance maîtrisée", role: "fonds dynamiques, éléments structurants" },
    secondary: { hex: "#EF4444", rgb: "239,68,68", meaning: "énergie, effort, motivation intense", harmony: "complémentaire contrastée, tension action/repos" },
    accent: { hex: "#22C55E", rgb: "34,197,94", meaning: "progression, résultat, vitalité" },
    neutrals: { "01": "#FAFAFA", "02": "#F0F0F0", "03": "#D4D4D4", "04": "#737373", "05": "#0A0A0A" },
  },
  cosmetic: {
    primary: { hex: "#F5E6D3", rgb: "245,230,211", meaning: "douceur, pureté, naturel", role: "fonds apaisants, surfaces principales" },
    secondary: { hex: "#D4A5A5", rgb: "212,165,165", meaning: "douceur rose, bien-être, délicatesse", harmony: "harmonie ton sur ton, continuité apaisante" },
    accent: { hex: "#A7C7B9", rgb: "167,199,185", meaning: "fraîcheur, nature, efficacité douce" },
    neutrals: { "01": "#FFFFFF", "02": "#F9F7F5", "03": "#E8E2DA", "04": "#B8A99A", "05": "#5C4E3D" },
  },
};

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function hexToCmyk(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return "C:0% M:0% Y:0% K:100%";
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return `C:${Math.round(c * 100)}% M:${Math.round(m * 100)}% Y:${Math.round(y * 100)}% K:${Math.round(k * 100)}%`;
}

function getSectorColorDescription(sector: string): string {
  const descriptions: Record<string, string> = {
    tech: "scientific tech (bleu/bleu-vert ou équivalent crédible)",
    luxury: "premium heritage (bleu profond, or, tons nobles)",
    streetwear: "urban authentic (noir profond, rouge audacieux)",
    fitness: "performance energy (bleu électrique, rouge dynamique)",
    cosmetic: "natural elegance (tons doux, organiques)",
  };
  return descriptions[sector] ?? descriptions["tech"];
}

function getToneModifier(tone: string): string {
  const modifiers: Record<string, string> = {
    professionnel: ", avec une approche maîtrisée et experte",
    audacieux: ", avec une touche d'innovation disruptive",
    minimaliste: ", dans une approche épurée et essentielle",
  };
  return modifiers[tone.toLowerCase()] ?? "";
}

function getSeasonalLabel(sector: string): string {
  const labels: Record<string, string> = {
    tech: "Conference / Lab",
    luxury: "Prestige Edition",
    streetwear: "Drop Season",
    fitness: "Competition Mode",
    cosmetic: "Natural Glow",
  };
  return labels[sector] ?? "Brand Extension";
}

export function buildPalettePrompt(brief: BrandBrief): string {
  const sector = brief.sector.toLowerCase();
  const palette = SECTOR_PALETTES[sector] ?? SECTOR_PALETTES["tech"];

  const primary: ColorEntry = brief.primaryColorHint
    ? { ...palette.primary, hex: brief.primaryColorHint, rgb: hexToRgb(brief.primaryColorHint) }
    : palette.primary;

  const { secondary, accent, neutrals } = palette;
  const valuesText = brief.values.join(", ");
  const toneModifier = getToneModifier(brief.tone);
  const colorDesc = getSectorColorDescription(sector);
  const seasonalLabel = getSeasonalLabel(sector);

  return `Génère la palette de couleurs complète pour ${brief.brandName} (secteur ${brief.sector}), ton ${brief.tone}, valeurs: ${valuesText}. Livre une palette "brand-ready" structurée pour UI/UX, web et print, avec usages 60/30/10, neutres, et contrôles d'accessibilité. Style visuel: moderne, précis, premium, sans effet "gadget". ZÉRO élément obsolète, ZÉRO interface confuse, ZÉRO watermark, ZÉRO texte illisible, ZÉRO palette aléatoire non justifiée.

1) Couleur primaire (60% usage)
- Propose 1 couleur primaire "${colorDesc}" avec code HEX + RGB.
- Donne sa signification psychologique (${primary.meaning}${toneModifier}) et son rôle (${primary.role}).
- HEX: ${primary.hex} | RGB: ${primary.rgb}

2) Couleur secondaire (30% usage)
- Propose 1 couleur secondaire complémentaire/harmonique avec code HEX + RGB.
- HEX: ${secondary.hex} | RGB: ${secondary.rgb}
- Explique l'accord colorimétrique: ${secondary.harmony}

3) Couleur accent / CTA (10% usage)
- Propose 1 couleur accent orientée conversion (CTA) avec code HEX + RGB.
- HEX: ${accent.hex} | RGB: ${accent.rgb}
- Décris l'émotion générée: ${accent.meaning}
- Doit ressortir sur la primaire + sur fond blanc.

4) 5 nuances neutres (HEX exacts)
- Neutral-01 (background très clair): ${neutrals["01"]}
- Neutral-02 (surface / cards): ${neutrals["02"]}
- Neutral-03 (bordures / separators): ${neutrals["03"]}
- Neutral-04 (texte secondaire): ${neutrals["04"]}
- Neutral-05 (texte principal / fond sombre): ${neutrals["05"]}

5) Validation WCAG 2.1 AA (calculée)
- Calcule et affiche les contrast ratios (min 4.5:1 pour texte normal, 3.0:1 pour large).
- Utilise la formule: contrastRatio = (L1 + 0.05) / (L2 + 0.05) where L = 0.2126 * R + 0.7152 * G + 0.0722 * B, with RGB values normalized to 0-1 and gamma corrected
- Donne un tableau clair "VALIDES / INVALIDES" pour les paires suivantes:

| Paire | Ratio | Statut |
|-------|-------|--------|
| Texte ${neutrals["05"]} sur blanc | [calculer] | [valider] |
| Texte ${neutrals["04"]} sur blanc | [calculer] | [valider] |
| CTA (${accent.hex}) sur blanc | [calculer] | [valider] |
| Texte #FFFFFF sur primaire (${primary.hex}) | [calculer] | [valider] |
| Texte #FFFFFF sur secondaire (${secondary.hex}) | [calculer] | [valider] |
| Texte #FFFFFF sur CTA (${accent.hex}) | [calculer] | [valider] |
| Texte ${neutrals["04"]} sur ${neutrals["02"]} | [calculer] | [valider] |
| Texte ${neutrals["01"]} sur ${neutrals["05"]} | [calculer] | [valider] |

- Si une paire est invalide: propose un ajustement en itérations (max 3) en lightening/darkening (indiquer X%), en préservant la teinte (hue) ±3° et en limitant la variation de saturation (±10%). Fournis le NOUVEAU HEX + RGB + nouveau ratio.

6) Applications recommandées (règles d'usage)
- Boutons: primary = ${primary.hex}, secondary = ${secondary.hex}, ghost = transparent avec bordure ${neutrals["03"]}
- Hover states: primary darken 10%, secondary lighten 10%
- Liens: ${accent.hex} avec underline on hover
- Fonds: Neutral-01 pour fond principal, Neutral-02 pour cards
- Textes: H1/H2 = ${primary.hex} sur fond clair, body = ${neutrals["05"]}
- Icônes: ${secondary.hex} pour les actions secondaires
- Badges: success = #10B981, info = ${accent.hex}, warning = #F59E0B, error = #EF4444
- Print (CMYK approx): ${hexToCmyk(primary.hex)}, ${hexToCmyk(secondary.hex)}

7) Palette saisonnière / mood board
- Propose 1 mini-variation "${seasonalLabel}" dérivée de la palette principale:
  * ${primary.hex} (20% plus foncé) (primary plus profond)
  * ${accent.hex} (15% plus clair) (accent plus lumineux)
  * ${neutrals["03"]} (neutral intermédiaire)
- Usage: supports de conférence, présentations, documents institutionnels
- Cohérence: conserve l'identité de marque tout en apportant de la profondeur

**TABLEAUX RÉCAPITULATIFS**

| Rôle | HEX | RGB | Usage |
|------|-----|-----|-------|
| Primaire | ${primary.hex} | ${primary.rgb} | 60% — ${primary.role} |
| Secondaire | ${secondary.hex} | ${secondary.rgb} | 30% — textes secondaires, lignes |
| Accent / CTA | ${accent.hex} | ${accent.rgb} | 10% — boutons, liens, highlights |
| Neutral-01 | ${neutrals["01"]} | [RGB] | Fond principal |
| Neutral-02 | ${neutrals["02"]} | [RGB] | Cards / surfaces |
| Neutral-03 | ${neutrals["03"]} | [RGB] | Bordures / séparateurs |
| Neutral-04 | ${neutrals["04"]} | [RGB] | Texte secondaire |
| Neutral-05 | ${neutrals["05"]} | [RGB] | Texte principal / fond sombre |

**JSON FINAL OBLIGATOIRE** (machine-readable):
\`\`\`json
{
  "brand": "${brief.brandName}",
  "sector": "${brief.sector}",
  "palette": {
    "primary": { "hex": "${primary.hex}", "rgb": "${primary.rgb}", "usage": "60%" },
    "secondary": { "hex": "${secondary.hex}", "rgb": "${secondary.rgb}", "usage": "30%" },
    "accent": { "hex": "${accent.hex}", "rgb": "${accent.rgb}", "usage": "10%" },
    "neutrals": {
      "neutral-01": "${neutrals["01"]}",
      "neutral-02": "${neutrals["02"]}",
      "neutral-03": "${neutrals["03"]}",
      "neutral-04": "${neutrals["04"]}",
      "neutral-05": "${neutrals["05"]}"
    }
  },
  "wcag": {
    "standard": "WCAG 2.1 AA",
    "normalTextMinRatio": 4.5,
    "largeTextMinRatio": 3.0
  }
}
\`\`\``;
}
