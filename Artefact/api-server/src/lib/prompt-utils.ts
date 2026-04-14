/**
 * Shared prompt utilities for all RoboNeo generation routes.
 * Implements: Chain-of-Thought, Few-Shot Calibration, Negative Prompts, Quality Review
 */

import { getClaudeClient, CLAUDE_MODEL } from "./anthropic-client";
import { getGptReviewClient, GPT_MODEL } from "./openai-review-client";
import { geminiAI, GEMINI_MODEL_PRO } from "./gemini-client";

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
  colors?: string;
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

  const colorsContext = brief.colors
    ? `\n\n⚠️ RÈGLE ABSOLUE — COULEURS CLIENT SACRÉES ⚠️\nLe client a défini ces couleurs pour sa marque: ${brief.colors}\nCes couleurs sont IMMUABLES et ont PRIORITÉ ABSOLUE sur toute palette sectorielle.\nTu DOIS les utiliser telles quelles dans tous les visuels et prompts générés.\nL'auto-détection de couleurs par secteur est DÉSACTIVÉE pour cette session.`
    : "";

  return `Tu es un expert senior en création de prompts créatifs pour RoboNeo.com — la plateforme d'IA générative pour créer des assets de marque professionnels.

═══ IDENTITÉ DE LA MARQUE ═══
• Nom: ${brief.brand_name}
• Secteur: ${brief.sector}
• Ton de communication: ${brief.tone}
• Valeurs fondamentales: ${valuesStr}${demographicContext}${competitorContext}${forbiddenContext}

═══ MODULE EN COURS ═══
${moduleLabel}

═══ WORKING METHOD (CHAIN-OF-THOUGHT) ═══
Before writing each prompt, you must:
1. ANALYZE: Identify the brand's exact positioning in its sector
2. DIFFERENTIATE: Find what distinguishes ${brief.brand_name} from its competitors
3. CALIBRATE: Adjust technical precision to match the target AI generation tool
4. WRITE: Produce a directly usable prompt, dense with brand-specific technical details

═══ QUALITY CALIBRATION (FEW-SHOT) ═══
INSUFFICIENT prompt (do NOT imitate):
✗ "Create a product photo for a watch. Luxury style. White background."

EXCELLENCE prompt (expected level):
✓ "${brief.brand_name} luxury watch, ultra-realistic product photography: timepiece centered on white Calacatta marble base with gold accents, 3-point studio lighting setup (key light 45° left at 5600K, soft fill right, warm golden rim backlight), 85mm f/1.8 shallow depth of field, realistic reflections on stainless steel case, dial visible at 10:10 position, deep black gradient background (#0A0A0A to #1C1C1C), subtle anamorphic lens flare upper-right corner, 3000x3000px, 300dpi, PNG transparent export -- [TECHNICAL PARAMETERS] --ar 1:1 --style raw --no watermark --v 6 -- [CLIP SYNTHESIS] luxury watch product photography, marble base, 3-point studio lighting, bokeh, anamorphic flare, 8k"

═══ MANDATORY REQUIREMENTS ═══
• Always mention "${brief.brand_name}" explicitly in every prompt
• Include HEX color codes, pixel dimensions, and precise technical specifications
• Adapt each prompt to sector "${brief.sector}" and tone "${brief.tone}"
• Write ALL generated prompts EXCLUSIVELY IN ENGLISH — native vocabulary of AI generation models (Midjourney, DALL-E 3, Stable Diffusion XL, Runway Gen-3, Pika, Kling, Suno, Udio, ElevenLabs)
• Technical parameters use native model syntax: f/1.8, ISO 100, 85mm, 5600K, --ar 16:9 --style raw --v 6
• Temperature in Kelvin always with uppercase K (5600K, 3200K — never 5600k)
• End each prompt with a [TECHNICAL PARAMETERS] block using native model parameter syntax
• Add a [CLIP SYNTHESIS] line after [TECHNICAL PARAMETERS] with the most critical keywords for SDXL/Stable Diffusion (e.g., "product photography, amber glass dropper bottle, macro shot, 8k, studio lighting, white background")${colorsContext}

⚠️ RÈGLE ABSOLUE — ANTI-HALLUCINATION DONNÉES FACTUELLES ⚠️
Tu ne dois JAMAIS inventer ni supposer:
• Des dates (date de fondation, année de création, millésimes, anniversaires)
• Des statistiques (pourcentages, chiffres de vente, données de performance, résultats d'études)
• Des prix, tarifs ou informations financières non fournis
• Des certifications, labels ou récompenses non mentionnés dans le brief
• Toute information factuelle absente du brief client
Si une donnée n'est pas explicitement fournie dans le brief, OMETS-LA totalement. N'invente rien, n'assume rien. Utilise uniquement ce qui est dans le brief.`;
}

// ─── Few-Shot Examples by Module ─────────────────────────────────────────────

export const FEWSHOT_EXAMPLES: Record<string, string> = {
  logo: `GOOD EXAMPLE:
"Create a logo for [BRAND], a [SECTOR] [TONE] brand. Style: [STYLE]. Typography: [FONT] (Google Fonts: [URL]). Icon/symbol: [PRECISE DESCRIPTION]. Palette: Primary [HEX], Secondary [HEX], Accent [HEX]. 4 variations: (1) light background [HEX], (2) dark background [HEX], (3) black monochrome, (4) reversed white. Safety zone: 2× pictogram height. Format: PNG 2000×2000px + SVG vector. No: 3D effects, complex gradients, more than 3 colors. --ar 1:1 --style raw --no watermark --v 6"`,

  visual: `GOOD EXAMPLE:
"[BRAND] product photography: [PRODUCT] positioned on [SURFACE], [TYPE] lighting (temperature [K], direction [ANGLE]°), [FOCAL LENGTH]mm f/[APERTURE], [INTENSITY] bokeh, [PRIMARY HEX] colors dominant, [TYPE] reflections, [DESCRIPTION] background, [DIMENSIONS]px format, RAW → JPEG 96dpi and PNG transparent export. --ar 1:1 --style raw --v 6"`,
};

// ─── Quality Review — Débat GPT vs Claude (Mode Ultra-Qualité) ───────────────
//
// Deux agents IA indépendants évaluent chaque prompt en parallèle :
//   • GPT-5.2  (via Replit OpenAI)    → Agent "Challenger" : technique, précis
//   • Claude Sonnet 4-6 (via Replit)  → Agent "Critique"   : nuance, voix de marque
//
// L'agent le plus exigeant (score le plus bas) remporte le débat :
// sa version raffinée est plus agressive → plus de valeur pour l'utilisateur.
// Les améliorations des deux agents sont fusionnées pour un retour complet.

export interface ReviewResult {
  score: number;
  refined: string;
  improvements: string[];
  gpt_score: number;
  claude_score: number;
  winner: "gpt" | "claude" | "tie";
}

function buildReviewPrompt(
  content: string,
  brief: EnhancedBrief,
  sectionKey: string,
  agentRole: string
): string {
  const valuesStr = Array.isArray(brief.values) ? brief.values.join(", ") : brief.values;
  const competitorsStr = brief.competitors
    ? `\nConcurrents à différencier : ${brief.competitors}`
    : "";
  const forbiddenStr = brief.forbidden_keywords
    ? `\nMots/concepts INTERDITS : ${brief.forbidden_keywords}`
    : "";
  const colorsStr = brief.colors
    ? `\nCouleurs de la marque : ${brief.colors}`
    : "";
  const targetStr = (brief.target_demographic || brief.target_audience)
    ? `\nCible : ${brief.target_demographic || brief.target_audience}`
    : "";

  return `Tu es ${agentRole} pour RoboNeo.com — plateforme de génération de prompts IA pour des marques professionnelles.

═══ BRIEF DE LA MARQUE ════════════════════════════════════════
Marque        : ${brief.brand_name}
Secteur       : ${brief.sector}
Ton / Voix    : ${brief.tone}
Valeurs       : ${valuesStr}${targetStr}${competitorsStr}${colorsStr}${forbiddenStr}
Module évalué : ${sectionKey}
═══════════════════════════════════════════════════════════════

PROMPT À ÉVALUER :
"""
${content}
"""

CRITÈRES D'ÉVALUATION (note /10 — sois STRICT, exige 9-10/10 pour valider) :
1. Ancrage marque   — "${brief.brand_name}" est nommé, le secteur "${brief.sector}" transparaît dans chaque détail
2. Précision tech   — codes HEX, dimensions px, f/stop, ISO, BPM, ms : toutes les valeurs sont exactes
3. Prêt à l'emploi — 0 modification nécessaire, prompt directement utilisable dans RoboNeo
4. Richesse créative — chaque élément visuel/sonore/copy est décrit avec précision chirurgicale
5. Voix de marque  — ton "${brief.tone}" tenu du début à la fin, aucun mot interdit${forbiddenStr ? ` (${brief.forbidden_keywords})` : ""}

RÈGLES D'AMÉLIORATION :
• Score < 9 → générer une version améliorée qui atteint 9-10/10
• Ajouter les HEX manquants, remplacer toute valeur vague par une valeur exacte
• Ne JAMAIS inventer de données absentes du brief (dates, certifications, stats)
• Maintenir la structure — améliorer la précision et la richesse, ne pas raccourcir

Réponds en JSON strictement valide (sans bloc markdown) :
{
  "score": <note moyenne sur 10, 1 décimale>,
  "improvements": ["point précis 1", "point précis 2", "point précis 3"],
  "refined_prompt": "<version améliorée complète si score < 9, sinon copie exacte de l'original>"
}`;
}

export async function reviewWithGPT(
  content: string,
  brief: EnhancedBrief,
  sectionKey: string
): Promise<{ score: number; refined: string; improvements: string[] }> {
  try {
    const gpt = getGptReviewClient();
    const prompt = buildReviewPrompt(
      content, brief, sectionKey,
      "un expert en précision technique et cohérence IA (Agent GPT — Challenger)"
    );
    const response = await gpt.chat.completions.create({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
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

export async function reviewWithClaude(
  content: string,
  brief: EnhancedBrief,
  sectionKey: string
): Promise<{ score: number; refined: string; improvements: string[] }> {
  try {
    const claude = getClaudeClient();
    const prompt = buildReviewPrompt(
      content, brief, sectionKey,
      "un expert en voix de marque, nuance créative et cohérence stratégique (Agent Claude — Critique)"
    );
    const message = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const block = message.content[0];
    const text = block.type === "text" ? block.text : "{}";
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

export async function reviewPromptQuality(
  content: string,
  brief: EnhancedBrief,
  sectionKey: string
): Promise<ReviewResult> {
  // Les deux agents tournent en parallèle — aucun ne voit l'évaluation de l'autre
  const [gptResult, claudeResult] = await Promise.all([
    reviewWithGPT(content, brief, sectionKey),
    reviewWithClaude(content, brief, sectionKey),
  ]);

  console.log(
    `[Review] ${sectionKey} → GPT: ${gptResult.score}/10 | Claude: ${claudeResult.score}/10`
  );

  // L'agent le plus exigeant (score bas) remporte le débat —
  // sa version raffinée corrige davantage de problèmes
  let winner: "gpt" | "claude" | "tie";
  let winnerResult: typeof gptResult;

  if (gptResult.score < claudeResult.score) {
    winner = "gpt";
    winnerResult = gptResult;
  } else if (claudeResult.score < gptResult.score) {
    winner = "claude";
    winnerResult = claudeResult;
  } else {
    winner = "tie";
    // En cas d'égalité, on préfère Claude pour la voix de marque
    winnerResult = claudeResult;
  }

  // Fusionner les améliorations des deux agents (dédupliquer)
  const allImprovements = [
    ...gptResult.improvements.map((i) => `[GPT] ${i}`),
    ...claudeResult.improvements.map((i) => `[Claude] ${i}`),
  ].slice(0, 6);

  const avgScore = Math.round(((gptResult.score + claudeResult.score) / 2) * 10) / 10;

  return {
    score: avgScore,
    refined: winnerResult.refined,
    improvements: allImprovements,
    gpt_score: gptResult.score,
    claude_score: claudeResult.score,
    winner,
  };
}

// ─── Persona Variants (Mode Ultra-Qualité — Gemini) ───────────────────────────
//
// Utilise Gemini pour générer des variantes persona de haute qualité,
// avec une compréhension plus fine des nuances marketing.

export async function generatePersonaVariants(
  basePrompt: string,
  brief: EnhancedBrief
): Promise<{ persona: string; variant: string }[]> {
  const response = await geminiAI.chat.completions.create({
    model: GEMINI_MODEL_PRO,
    messages: [
      {
        role: "system",
        content: `Tu es expert senior en segmentation marketing et copywriting pour la marque ${brief.brand_name} (secteur: ${brief.sector}, ton: ${brief.tone}).
Tu génères des variantes de prompts qui sont précisément calibrées pour chaque persona — angle émotionnel distinct, vocabulaire adapté, bénéfices mis en avant différemment.`,
      },
      {
        role: "user",
        content: `À partir de ce prompt de base:
"""
${basePrompt}
"""

Génère 3 variantes calibrées pour 3 personas différents et distincts.
Pour chaque variante: adapte le ton, les mots-clés, l'angle émotionnel, et les bénéfices mis en avant.
Chaque variante doit être substantiellement différente des autres, pas seulement des synonymes.

Réponds en JSON uniquement: [{"persona": "description précise du persona", "variant": "prompt complet adapté"}]`,
      },
    ],
    max_tokens: 4096,
  });

  try {
    const text = response.choices[0]?.message?.content ?? "[]";
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}
