/**
 * Shared prompt utilities for all RoboNeo generation routes.
 * Implements: Chain-of-Thought, Few-Shot Calibration, Negative Prompts, Quality Review
 */

import { openai } from "@workspace/integrations-openai-ai-server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnhancedBrief {
  brand_name: string;
  sector: string;
  tone: string;
  values: string | string[];
  product_name?: string;
  product_description?: string;
  benefits?: string;
  target_audience?: string;
  target_demographic?: string;
  competitors?: string;
  forbidden_keywords?: string;
  primary_color?: string;
  price?: string;
}

// ─── Negative Prompt Engine ──────────────────────────────────────────────────

const SECTOR_NEGATIVES: Record<string, string[]> = {
  bijou: ["plastique", "grossier", "bon marché", "clip art", "pixelisé", "amateur", "déformé", "flou", "stock photo générique"],
  luxe: ["cheap", "low cost", "criard", "vulgaire", "surchargé", "clinquant", "faux luxe", "tape-à-l'œil"],
  cosmétique: ["agressif", "chimique", "toxique", "avant/après irréaliste", "visage déformé", "peau étrange"],
  mode: ["démodé", "cheap", "mal coupé", "couleurs criardes", "froissé", "mal ajusté", "générique"],
  tech: ["vieux", "obsolète", "câbles apparents en désordre", "interface confuse", "erreurs visibles", "bugs"],
  fitness: ["sédentaire", "mou", "blessures visibles", "mauvaise posture", "surpoids", "décourageant"],
  décoration: ["désordre", "mal agencé", "couleurs qui clashent", "impersonnel", "générique", "ikea-like"],
  maroquinerie: ["plastique", "faux cuir évident", "coutures grossières", "déformé", "brûlé"],
};

const TONE_NEGATIVES: Record<string, string[]> = {
  luxe: ["familier", "argot", "emoji", "informal", "promotionnel criard", "SOLDES", "PROMO"],
  minimaliste: ["chargé", "surchargé", "trop coloré", "trop d'éléments", "complexe"],
  chaleureux: ["froid", "distant", "corporatif", "robotique", "impersonnel"],
  professionnel: ["désinvolte", "informel", "trop décontracté", "argot"],
  streetwear: ["preppy", "corporate", "trop sage", "ennuyeux", "vieux"],
  écologique: ["plastique", "pollution visible", "artificiel", "chimique", "industriel"],
};

export function buildNegativePrompt(sector: string, tone: string): string {
  const sectorNegs = SECTOR_NEGATIVES[sector.toLowerCase()] ?? ["générique", "amateur", "pixelisé"];
  const toneNegs = TONE_NEGATIVES[tone.toLowerCase()] ?? [];
  const universal = ["watermark", "texte illisible", "compression JPEG visible", "artefacts IA", "membres supplémentaires", "anatomie incorrecte"];

  const all = [...new Set([...sectorNegs, ...toneNegs, ...universal])];
  return `Éléments à ÉVITER ABSOLUMENT: ${all.join(", ")}.`;
}

// ─── Chain-of-Thought System Prompt ──────────────────────────────────────────

export function buildSystemPrompt(brief: EnhancedBrief, moduleLabel: string): string {
  const valuesStr = Array.isArray(brief.values)
    ? brief.values.join(", ")
    : brief.values;

  const competitorContext = brief.competitors
    ? `\nConcurrents directs: ${brief.competitors} — se différencier d'eux est essentiel.`
    : "";

  const demographicContext = brief.target_demographic
    ? `\nDémographie cible précise: ${brief.target_demographic}`
    : "";

  const forbiddenContext = brief.forbidden_keywords
    ? `\nMots-clés et éléments INTERDITS: ${brief.forbidden_keywords} — ne jamais les inclure.`
    : "";

  return `Tu es un expert senior en création de prompts créatifs pour RoboNeo.com — la plateforme d'IA générative pour créer des assets de marque professionnels.

═══ IDENTITÉ DE LA MARQUE ═══
• Nom: ${brief.brand_name}
• Secteur: ${brief.sector}
• Ton de communication: ${brief.tone}
• Valeurs fondamentales: ${valuesStr}${demographicContext}${competitorContext}${forbiddenContext}

═══ MODULE EN COURS ═══
${moduleLabel}

═══ MÉTHODE DE TRAVAIL (CHAIN-OF-THOUGHT) ═══
Avant de rédiger chaque prompt, tu dois:
1. ANALYSER: Identifier le positionnement exact de la marque dans son secteur
2. DIFFÉRENCIER: Trouver ce qui distingue ${brief.brand_name} de ses concurrents
3. CALIBRER: Ajuster le niveau de précision technique aux outils RoboNeo
4. RÉDIGER: Écrire un prompt directement utilisable, riche en détails spécifiques à la marque

═══ CALIBRATION QUALITÉ (FEW-SHOT) ═══
Exemple de prompt INSUFFISANT (à ne pas imiter):
✗ "Crée une photo de produit pour une montre. Style luxe. Fond blanc."

Exemple de prompt EXCELLENCE (niveau attendu):
✓ "Crée une photo produit ultra-réaliste pour ${brief.brand_name}: montre positionnée sur un socle de marbre blanc Calacatta avec dorures, éclairage 3-points (lumière principale 45° gauche, fill light droit, backlight doré), bokeh 85mm f/1.8, reflets réalistes sur le boîtier, cadran visible à 10h10, fond gradient noir profond (#0A0A0A → #1C1C1C), anamorphic lens flare léger en coin supérieur droit. Format 3000x3000px, 300dpi, export PNG transparent."

═══ EXIGENCES OBLIGATOIRES ═══
• Chaque prompt doit mentionner "${brief.brand_name}" explicitement
• Inclure des codes HEX, dimensions, et spécifications techniques précises
• Adapter chaque prompt au secteur "${brief.sector}" et au ton "${brief.tone}"
• Rédiger en français, avec terminologie technique anglaise pour les paramètres IA
• Terminer chaque prompt avec un bloc [PARAMÈTRES TECHNIQUES] structuré`;
}

// ─── Few-Shot Examples by Module ─────────────────────────────────────────────

export const FEWSHOT_EXAMPLES: Record<string, string> = {
  logo: `BON EXEMPLE:
"Crée un logo pour [MARQUE], marque [SECTEUR] [TON]. Style: [STYLE]. Typographie: [POLICE] (Google Fonts: [LIEN]). Icône/symbole: [DESCRIPTION PRÉCISE]. Palette: Primaire [HEX], Secondaire [HEX], Accent [HEX]. 4 variations: (1) fond clair [HEX], (2) fond sombre [HEX], (3) monochrome noir, (4) inversé blanc. Espace de protection: 2× hauteur du pictogramme. Format: PNG 2000×2000px + SVG vectoriel. Pas de: effets 3D, dégradés complexes, plus de 3 couleurs."`,

  visual: `BON EXEMPLE:
"Photo produit [MARQUE]: [PRODUIT] positionné sur [SURFACE], éclairage [TYPE] (température [K], direction [ANGLE]°), [OBJECTIF] mm f/[APERTURE], bokeh [INTENSITÉ], couleurs [HEX primaire] dominant, reflets [TYPE], fond [DESCRIPTION], format [DIMENSIONS]px, RAW → export JPEG 96dpi et PNG transparent."`,
};

// ─── Quality Review ───────────────────────────────────────────────────────────

export async function reviewPromptQuality(
  content: string,
  brief: EnhancedBrief,
  sectionKey: string
): Promise<{ score: number; refined: string; improvements: string[] }> {
  const reviewPrompt = `Tu es un expert QA pour des prompts créatifs IA destinés à RoboNeo.com.

Évalue ce prompt (section: ${sectionKey}) pour la marque "${brief.brand_name}" (secteur: ${brief.sector}, ton: ${brief.tone}):

"""
${content}
"""

CRITÈRES D'ÉVALUATION (note /10 chacun):
1. Spécificité à la marque (nom mentionné, secteur reflété)
2. Précision technique (HEX, dimensions, paramètres IA)
3. Utilisabilité directe dans RoboNeo (0 modification nécessaire)
4. Richesse des détails visuels/créatifs
5. Cohérence avec le ton "${brief.tone}"

Réponds en JSON valide uniquement:
{
  "score": <moyenne sur 10>,
  "improvements": ["amélioration 1", "amélioration 2"],
  "refined_prompt": "<version améliorée du prompt si score < 8, sinon copie l'original>"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [{ role: "user", content: reviewPrompt }],
      max_completion_tokens: 2048,
    });

    const text = response.choices[0]?.message?.content ?? "{}";
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      score: parsed.score ?? 7,
      refined: parsed.refined_prompt ?? content,
      improvements: parsed.improvements ?? [],
    };
  } catch {
    return { score: 7, refined: content, improvements: [] };
  }
}

// ─── Persona Variants ─────────────────────────────────────────────────────────

export async function generatePersonaVariants(
  basePrompt: string,
  brief: EnhancedBrief
): Promise<{ persona: string; variant: string }[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `Tu es expert en segmentation marketing pour la marque ${brief.brand_name} (secteur: ${brief.sector}).`,
      },
      {
        role: "user",
        content: `À partir de ce prompt de base:
"""
${basePrompt}
"""

Génère 3 variantes calibrées pour 3 personas différents (adapte le ton, les mots-clés, l'angle émotionnel).
Réponds en JSON: [{"persona": "nom du persona", "variant": "prompt adapté"}]`,
      },
    ],
    max_completion_tokens: 2048,
  });

  try {
    const text = response.choices[0]?.message?.content ?? "[]";
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}
