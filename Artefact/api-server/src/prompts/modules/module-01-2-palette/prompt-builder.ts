interface BrandBrief {
  brandName: string;
  sector: string;
  tone: string;
  values: string[];
  primaryColorHint?: string;
  brandColors?: string;
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
    primary: { hex: "#003087", rgb: "0,48,135", meaning: "reliability, trust, scientific rigor", role: "UI backgrounds, header, brand blocks" },
    secondary: { hex: "#6C757D", rgb: "108,117,125", meaning: "technical neutrality, support, sobriety", harmony: "neutral gray complementary to deep blue, brings balance and readability" },
    accent: { hex: "#2F80ED", rgb: "47,128,237", meaning: "controlled energy, technological action, clarity" },
    neutrals: { "01": "#F8F9FA", "02": "#E9ECEF", "03": "#DEE2E6", "04": "#6C757D", "05": "#212529" },
  },
  luxury: {
    primary: { hex: "#1A2C3E", rgb: "26,44,62", meaning: "prestige, depth, timeless elegance", role: "premium backgrounds, headers, authority elements" },
    secondary: { hex: "#C5A572", rgb: "197,165,114", meaning: "richness, refinement, heritage", harmony: "warm-cool contrast, golden elegance on deep background" },
    accent: { hex: "#D4AF37", rgb: "212,175,55", meaning: "luxury, exclusivity, excellence" },
    neutrals: { "01": "#F5F3F0", "02": "#E8E4DD", "03": "#D4CDBC", "04": "#8B7A6B", "05": "#2C2418" },
  },
  streetwear: {
    primary: { hex: "#1A1A1A", rgb: "26,26,26", meaning: "authenticity, power, urban attitude", role: "backgrounds, dominant elements, strong identity" },
    secondary: { hex: "#E63946", rgb: "230,57,70", meaning: "energy, boldness, controlled rebellion", harmony: "maximum contrast, dynamic visual tension" },
    accent: { hex: "#F4A261", rgb: "244,162,97", meaning: "urban warmth, strong signal, singularity" },
    neutrals: { "01": "#F5F5F5", "02": "#E0E0E0", "03": "#BDBDBD", "04": "#757575", "05": "#212121" },
  },
  fitness: {
    primary: { hex: "#1E3A8A", rgb: "30,58,138", meaning: "performance, discipline, controlled power", role: "dynamic backgrounds, structural elements" },
    secondary: { hex: "#EF4444", rgb: "239,68,68", meaning: "energy, effort, intense motivation", harmony: "complementary contrast, action/rest tension" },
    accent: { hex: "#22C55E", rgb: "34,197,94", meaning: "progression, results, vitality" },
    neutrals: { "01": "#FAFAFA", "02": "#F0F0F0", "03": "#D4D4D4", "04": "#737373", "05": "#0A0A0A" },
  },
  cosmetic: {
    primary: { hex: "#F5E6D3", rgb: "245,230,211", meaning: "softness, purity, natural", role: "soothing backgrounds, main surfaces" },
    secondary: { hex: "#D4A5A5", rgb: "212,165,165", meaning: "soft pink, well-being, delicacy", harmony: "tone-on-tone harmony, soothing continuity" },
    accent: { hex: "#A7C7B9", rgb: "167,199,185", meaning: "freshness, nature, gentle effectiveness" },
    neutrals: { "01": "#FFFFFF", "02": "#F9F7F5", "03": "#E8E2DA", "04": "#B8A99A", "05": "#5C4E3D" },
  },
};

function parseHexColors(colorStr: string): string[] {
  return (colorStr.match(/#[0-9A-Fa-f]{6}/g) ?? []).slice(0, 3);
}

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
    tech: "scientific tech (deep blue/blue-green or credible equivalent)",
    luxury: "premium heritage (deep blue, gold, noble tones)",
    streetwear: "urban authentic (deep black, bold red)",
    fitness: "performance energy (electric blue, dynamic red)",
    cosmetic: "natural elegance (soft, organic tones)",
  };
  return descriptions[sector] ?? descriptions["tech"];
}

function getToneModifier(tone: string): string {
  const modifiers: Record<string, string> = {
    professionnel: ", with a controlled and expert approach",
    audacieux: ", with a touch of disruptive innovation",
    minimaliste: ", in a clean and essential approach",
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

  const clientHexes = brief.brandColors ? parseHexColors(brief.brandColors) : [];

  const primary: ColorEntry = clientHexes[0]
    ? { ...palette.primary, hex: clientHexes[0], rgb: hexToRgb(clientHexes[0]) }
    : brief.primaryColorHint
    ? { ...palette.primary, hex: brief.primaryColorHint, rgb: hexToRgb(brief.primaryColorHint) }
    : palette.primary;

  const secondary: SecondaryEntry = clientHexes[1]
    ? { ...palette.secondary, hex: clientHexes[1], rgb: hexToRgb(clientHexes[1]) }
    : palette.secondary;

  const accent: AccentEntry = clientHexes[2]
    ? { ...palette.accent, hex: clientHexes[2], rgb: hexToRgb(clientHexes[2]) }
    : palette.accent;

  const { neutrals } = palette;

  const clientColorsInstruction = brief.brandColors
    ? `⚠️ ABSOLUTE RULE — CLIENT-IMPOSED COLORS:\nThe client has defined these colors for their brand: ${brief.brandColors}\nThese colors are SACRED and IMMUTABLE. You must:\n1. Use them EXACTLY as the base (primary, secondary, accent) — never replace them\n2. Build the neutrals, WCAG values, and hover states AROUND these colors\n3. Ignore any automatic sector-based color suggestion\nColor auto-detection is DISABLED.\n\n`
    : "";
  const valuesText = brief.values.join(", ");
  const toneModifier = getToneModifier(brief.tone);
  const colorDesc = getSectorColorDescription(sector);
  const seasonalLabel = getSeasonalLabel(sector);

  return `${clientColorsInstruction}Generate the complete color palette for ${brief.brandName} (sector: ${brief.sector}), tone: ${brief.tone}, values: ${valuesText}. Deliver a "brand-ready" structured palette for UI/UX, web, and print, with 60/30/10 usage distribution, neutrals, and accessibility checks. Visual style: modern, precise, premium, no "gimmick" effects. ZERO obsolete elements, ZERO confusing interface, ZERO watermark, ZERO unreadable text, ZERO unjustified random palette.

1) Primary Color (60% usage)
- Propose 1 primary "${colorDesc}" color with HEX + RGB code.
- Provide its psychological meaning (${primary.meaning}${toneModifier}) and role (${primary.role}).
- HEX: ${primary.hex} | RGB: ${primary.rgb}

2) Secondary Color (30% usage)
- Propose 1 complementary/harmonic secondary color with HEX + RGB code.
- HEX: ${secondary.hex} | RGB: ${secondary.rgb}
- Explain the color harmony: ${secondary.harmony}

3) Accent / CTA Color (10% usage)
- Propose 1 conversion-oriented accent color (CTA) with HEX + RGB code.
- HEX: ${accent.hex} | RGB: ${accent.rgb}
- Describe the emotion generated: ${accent.meaning}
- Must stand out on the primary color + on white background.

4) 5 Neutral Shades (exact HEX)
- Neutral-01 (very light background): ${neutrals["01"]}
- Neutral-02 (surface / cards): ${neutrals["02"]}
- Neutral-03 (borders / separators): ${neutrals["03"]}
- Neutral-04 (secondary text): ${neutrals["04"]}
- Neutral-05 (primary text / dark background): ${neutrals["05"]}

5) WCAG 2.1 AA Validation (calculated)
- Calculate and display contrast ratios (min 4.5:1 for normal text, 3.0:1 for large text).
- Use the formula: contrastRatio = (L1 + 0.05) / (L2 + 0.05) where L = 0.2126 * R + 0.7152 * G + 0.0722 * B, with RGB values normalized to 0-1 and gamma corrected
- Provide a clear "VALID / INVALID" table for the following pairs:

| Pair | Ratio | Status |
|------|-------|--------|
| Text ${neutrals["05"]} on white | [calculate] | [validate] |
| Text ${neutrals["04"]} on white | [calculate] | [validate] |
| CTA (${accent.hex}) on white | [calculate] | [validate] |
| Text #FFFFFF on primary (${primary.hex}) | [calculate] | [validate] |
| Text #FFFFFF on secondary (${secondary.hex}) | [calculate] | [validate] |
| Text #FFFFFF on CTA (${accent.hex}) | [calculate] | [validate] |
| Text ${neutrals["04"]} on ${neutrals["02"]} | [calculate] | [validate] |
| Text ${neutrals["01"]} on ${neutrals["05"]} | [calculate] | [validate] |

- If a pair is invalid: propose an adjustment in iterations (max 3) by lightening/darkening (indicate X%), preserving the hue ±3° and limiting saturation variation (±10%). Provide the NEW HEX + RGB + new ratio.

6) Recommended Applications (usage rules)
- Buttons: primary = ${primary.hex}, secondary = ${secondary.hex}, ghost = transparent with ${neutrals["03"]} border
- Hover states: primary darken 10%, secondary lighten 10%
- Links: ${accent.hex} with underline on hover
- Backgrounds: Neutral-01 for main background, Neutral-02 for cards
- Text: H1/H2 = ${primary.hex} on light background, body = ${neutrals["05"]}
- Icons: ${secondary.hex} for secondary actions
- Badges: success = #10B981, info = ${accent.hex}, warning = #F59E0B, error = #EF4444
- Print (CMYK approx): ${hexToCmyk(primary.hex)}, ${hexToCmyk(secondary.hex)}

7) Seasonal Palette / Mood Board
- Propose 1 "${seasonalLabel}" mini-variation derived from the main palette:
  * ${primary.hex} (20% darker) (deeper primary)
  * ${accent.hex} (15% lighter) (brighter accent)
  * ${neutrals["03"]} (intermediate neutral)
- Usage: conference materials, presentations, institutional documents
- Consistency: preserves brand identity while adding depth

**SUMMARY TABLES**

| Role | HEX | RGB | Usage |
|------|-----|-----|-------|
| Primary | ${primary.hex} | ${primary.rgb} | 60% — ${primary.role} |
| Secondary | ${secondary.hex} | ${secondary.rgb} | 30% — secondary text, lines |
| Accent / CTA | ${accent.hex} | ${accent.rgb} | 10% — buttons, links, highlights |
| Neutral-01 | ${neutrals["01"]} | [RGB] | Main background |
| Neutral-02 | ${neutrals["02"]} | [RGB] | Cards / surfaces |
| Neutral-03 | ${neutrals["03"]} | [RGB] | Borders / separators |
| Neutral-04 | ${neutrals["04"]} | [RGB] | Secondary text |
| Neutral-05 | ${neutrals["05"]} | [RGB] | Primary text / dark background |

**MANDATORY FINAL JSON** (machine-readable):
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
