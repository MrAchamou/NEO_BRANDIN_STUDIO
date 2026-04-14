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
    style: "corporate minimalist, clean and stable",
    ambiance: "trusted technology: serious, modern, non-ostentatious",
    symbolConcept: "vectors, controlled trajectories and scientific rigor",
    primaryColor: "#003087",
    secondaryColor: "#6C757D",
    accentColor: "#2F80ED",
  },
  luxury: {
    style: "elegant minimalist, horological precision",
    ambiance: "timeless prestige: elegance, refinement, discretion",
    symbolConcept: "elegance, heritage, artisanal precision",
    primaryColor: "#1A2C3E",
    secondaryColor: "#C5A572",
    accentColor: "#D4AF37",
  },
  streetwear: {
    style: "bold typographic, urban authenticity",
    ambiance: "street credibility: authentic, urban, uncompromising",
    symbolConcept: "urban energy, movement, authenticity",
    primaryColor: "#1A1A1A",
    secondaryColor: "#E63946",
    accentColor: "#F4A261",
  },
  fitness: {
    style: "dynamic energetic, sharp angles",
    ambiance: "performance: motivation, surpassing limits, controlled strength",
    symbolConcept: "dynamic, progression, controlled strength",
    primaryColor: "#1E3A8A",
    secondaryColor: "#EF4444",
    accentColor: "#22C55E",
  },
  cosmetic: {
    style: "soft organic, purity, subtle curves",
    ambiance: "natural beauty: softness, effectiveness, well-being",
    symbolConcept: "purity, radiance, natural transformation",
    primaryColor: "#F5E6D3",
    secondaryColor: "#D4A5A5",
    accentColor: "#A7C7B9",
  },
};

const GOLDEN_EXAMPLE = `Create the logo for Theravectys, a tech corporate brand positioned on innovation, scientific rigor, and reliability (B2B expertise, R&D/engineering environment). The logo must inspire stability, trust, and precision, with a premium, readable, and scalable execution for web/app, official documents, and institutional materials.

**Artistic Direction (style, spirit, atmosphere)**
Corporate minimalist style, clean and stable. Sharp composition, clean geometry, rigorous alignments (grid-based design), controlled contrast. "Trusted technology" atmosphere: serious, modern, non-ostentatious. Avoid any gimmick effects. Final render **flat vector** (no 3D, no textures), clean outlines, controlled angles (subtle mix of straight angles and slightly rounded corners for reliability).

**Recommended Typography (solid sans-serif)**
- Primary font: **IBM Plex Sans** (Google Fonts) — https://fonts.google.com/specimen/IBM+Plex+Sans
  - Recommendation: "Theravectys" in **SemiBold 600** (tracking -1% to 0%), capitalization: "Theravectys" (T uppercase, rest lowercase)
- Alternatives: **Roboto** https://fonts.google.com/specimen/Roboto ; **Lato** https://fonts.google.com/specimen/Lato ; **Inter** https://fonts.google.com/specimen/Inter
- Adjustments: optical kerning enabled, comfortable x-height, maximum readability at 24px width.

**Symbol / Icon (precise description + inspirations)**
Create an abstract symbol to the left of the wordmark, evoking both **vectors**, **controlled trajectories** and **scientific rigor**:
- Icon based on a stylized **"V"** built with 2 geometric segments (uniform thickness), forming a discrete **vectorial arrow** pointing forward (innovation) and a sense of **stability** (wider base, controlled apex).
- Integrate an implicit **micro-grid** via 2–3 nodal points (small circles) aligned on a trajectory, like a clean scientific visualization.
- Style: solid lines, clean angles, no clichéd medical references.
- Symbol size: height = x-height of wordmark × 1.2, vertically centered on the text baseline.
- Symbol/wordmark spacing: airy and proportional, sufficient visual breathing room for immediate reading.

**Color Palette**
- Primary: **#003087** — trust navy blue (60% of usage: background, main icon)
- Secondary: **#6C757D** — neutral corporate gray (30%: secondary text, lines, light backgrounds)
- Accent: **#2F80ED** — tech highlight (10%: nodal points, hover states, highlights)
- Neutrals: #FFFFFF (light background), #F8F9FA (off-white background), #0B1220 (dark background), #1C2B4A (midnight blue)

**4 Required Variations**
1. **Light background (main)**: background #FFFFFF, icon and wordmark in #003087 — web, documents, presentations
2. **Dark background**: background #0B1220, wordmark and icon in #FFFFFF with accent #2F80ED on nodal points — dark mode digital, screens, events
3. **Black monochrome**: background #FFFFFF, entire logo in #1A1A1A — B&W printing, official documents, stamps
4. **Reversed (knockout)**: white #FFFFFF on navy blue background #003087 — institutional use, business cards, official headers

**Technical Specifications**
- Export format: PNG 4000×4000px high resolution (transparent background), Flat Design render mimicking a clean vector file. ⚠️ Post-production note: image generators (Midjourney, DALL-E, SDXL) produce raster files (PNG/JPG) not editable SVGs. Manual vectorization is required in post-production (Adobe Illustrator Live Trace, Inkscape, or Vector Magic) to obtain a truly scalable and editable SVG file.
- Safety zone: white space = height of the capital "T" in the wordmark on all sides
- Minimum size: 80px width digital, 20mm print
- Geometric aspect: perfect alignment, regular and proportional spacing, consistent geometry, balanced composition. ⚠️ Note: this specification is intended for the human designer using this prompt as inspiration — exact pixel values are not interpreted by AI image generators.
- Proportions: width/height ratio of the full logo between 3:1 and 4:1
- Alignment: symbol and wordmark on common baseline, optical vertical centering

**NEGATIVE_PROMPT**
old, obsolete, retro, vintage, messy, tangled cables, confusing interface, visible errors, bugs, casual, informal, too relaxed, slang, watermark, photorealistic mockup, aggressive gradients, 3D, bevel/emboss, textures, noise, glitch, unreadable text, bad kerning, visible JPEG compression, AI artifacts, inconsistent shapes, too-thin non-scalable details, clichéd medical symbols, DNA, syringe, cross, mascot, cartoon, low-res

**TECHNICAL PARAMETERS**
--ar 1:1 --style raw --no watermark --no texture --no gradient --no 3D --v 6`;

function buildSymbolDescription(sector: string, symbolConcept: string): string {
  const base = `Create an abstract symbol to the left of the wordmark, evoking ${symbolConcept}:`;

  if (sector === "tech") {
    return `${base}
- Icon based on a stylized "V" built with 2 geometric segments (uniform thickness), forming a discrete vectorial arrow pointing forward (innovation) and a sense of stability (wider base, controlled apex).
- Integrate an implicit micro-grid via 2–3 nodal points (small circles) aligned on a trajectory, like a clean scientific visualization.
- Style: solid lines, clean angles, no clichéd medical references.
- Symbol size: height = x-height of wordmark × 1.2, vertically centered on the text baseline.
- Symbol/wordmark spacing: airy and proportional, sufficient visual breathing room for immediate reading.`;
  }

  if (sector === "luxury") {
    return `${base}
- Icon based on a stylized monogram evoking heritage and artisanal precision.
- Clean lines, perfect geometry, controlled symmetry.
- Style: fine lines, discreet elegance, no decorative overload.
- Symbol size: height = x-height of wordmark × 1.2, vertically centered on the text baseline.
- Symbol/wordmark spacing: airy and proportional, sufficient visual breathing room for immediate reading.`;
  }

  if (sector === "streetwear") {
    return `${base}
- Icon based on a stylized letter or bold urban pictogram.
- Thick stroke, sharp angles, strong visual presence.
- Style: strong visual impact, typographic, authentic.
- Symbol size: height = x-height of wordmark × 1.2, vertically centered on the text baseline.
- Symbol/wordmark spacing: airy and proportional, sufficient visual breathing room for immediate reading.`;
  }

  if (sector === "fitness") {
    return `${base}
- Icon based on a movement symbol (arrow, wave, dynamic shape).
- Energetic lines, sense of speed and controlled power.
- Style: dynamic, motivating, performance.
- Symbol size: height = x-height of wordmark × 1.2, vertically centered on the text baseline.
- Symbol/wordmark spacing: airy and proportional, sufficient visual breathing room for immediate reading.`;
  }

  if (sector === "cosmetic") {
    return `${base}
- Icon based on an organic shape (droplet, petal, perfect circle).
- Smooth curves, fluidity, sense of purity.
- Style: natural, soothing, subtle elegance.
- Symbol size: height = x-height of wordmark × 1.2, vertically centered on the text baseline.
- Symbol/wordmark spacing: airy and proportional, sufficient visual breathing room for immediate reading.`;
  }

  return `${base}
- Abstract icon adapted to the brand universe.
- Clean, readable, scalable style.
- Symbol size: height = x-height of wordmark × 1.2, vertically centered on the text baseline.
- Symbol/wordmark spacing: airy and proportional, sufficient visual breathing room for immediate reading.`;
}

function buildNegativePromptSuffix(sector: string): string {
  const base =
    "old, obsolete, retro, vintage, messy, tangled cables, confusing interface, visible errors, bugs, casual, informal, too relaxed, slang, watermark, photorealistic mockup, aggressive gradients, 3D, bevel/emboss, textures, noise, glitch, unreadable text, bad kerning, visible JPEG compression, AI artifacts, inconsistent shapes, too-thin non-scalable details, clichéd medical symbols, DNA, syringe, cross, mascot, cartoon, low-res";

  if (sector === "luxury") return `${base}, cheap, low-end, imitation, plastic, excessive shine`;
  if (sector === "streetwear") return `${base}, commercial, corporate, too clean, sterile, institutional`;
  if (sector === "fitness") return `${base}, static, limp, no energy, passive, heavy`;
  if (sector === "cosmetic") return `${base}, aggressive, angular, synthetic, artificial`;
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
    ? `\n⚠️ CLIENT COLORS — ABSOLUTE PRIORITY:\nClient provided: ${brief.brandColors}\nUse EXCLUSIVELY these colors. DO NOT replace them with other hues.`
    : "";

  const valuesText = brief.values.join(", ");
  const v0 = brief.values[0] ?? "stability";
  const v1 = brief.values[1] ?? "trust";
  const v2 = brief.values[2] ?? "precision";

  const symbolDescription = buildSymbolDescription(sector, symbolConcept);
  const negativePrompt = buildNegativePromptSuffix(sector);

  let prompt = GOLDEN_EXAMPLE;

  prompt = prompt.replace(/Theravectys/g, brief.brandName);
  prompt = prompt.replace(/tech corporate/g, `${brief.sector} ${brief.tone}`);
  prompt = prompt.replace(/innovation, scientific rigor, and reliability/g, valuesText);
  prompt = prompt.replace(/stability, trust, and precision/g, `${v0}, ${v1}, ${v2}`);
  prompt = prompt.replace(/Corporate minimalist style, clean and stable/g, `${style} style`);
  prompt = prompt.replace(
    /"Trusted technology" atmosphere: serious, modern, non-ostentatious/g,
    `"${ambiance}" atmosphere`
  );
  prompt = prompt.replace(
    /Create an abstract symbol to the left of the wordmark, evoking both \*\*vectors\*\*, \*\*controlled trajectories\*\* and \*\*scientific rigor\*\*:[\s\S]*?(?=\n\n\*\*Color Palette\*\*)/,
    `${symbolDescription}\n`
  );
  prompt = prompt.replace(/#003087/g, primaryColor);
  prompt = prompt.replace(/#6C757D/g, secondaryColor);
  prompt = prompt.replace(/#2F80ED/g, accentColor);
  prompt = prompt.replace(/trust navy blue/g, `${primaryColor} (primary color)`);
  prompt = prompt.replace(/neutral corporate gray/g, `${secondaryColor} (secondary color)`);
  prompt = prompt.replace(/tech highlight/g, `${brief.sector} highlight`);
  prompt = prompt.replace(
    /background #FFFFFF, icon and wordmark in #003087/g,
    `background #FFFFFF, icon and wordmark in ${primaryColor}`
  );
  prompt = prompt.replace(
    /white #FFFFFF on navy blue background #003087/g,
    `white #FFFFFF on ${primaryColor} background`
  );
  prompt = prompt.replace(
    /old, obsolete, retro, vintage[\s\S]*?low-res/,
    negativePrompt
  );

  if (clientColorsBlock) {
    prompt = prompt.replace(
      /(\*\*Color Palette\*\*)/,
      `**Color Palette**${clientColorsBlock}`
    );
  }

  return prompt;
}
