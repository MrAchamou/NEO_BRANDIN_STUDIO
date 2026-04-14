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
• Unités : Kelvin s'écrit TOUJOURS avec un K MAJUSCULE (ex : 5600K, 3200K, 6500K — jamais 5600k)
• Terminer chaque prompt avec un bloc [PARAMÈTRES TECHNIQUES] structuré
• Ajouter après [PARAMÈTRES TECHNIQUES] une ligne [SYNTHÈSE CLIP] en anglais pour optimiser la compréhension des modèles SDXL/Stable Diffusion (ex : "product photography, amber glass dropper bottle, macro shot, wood cap texture, 8k, studio lighting, white background")${colorsContext}

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
  logo: `BON EXEMPLE:
"Crée un logo pour [MARQUE], marque [SECTEUR] [TON]. Style: [STYLE]. Typographie: [POLICE] (Google Fonts: [LIEN]). Icône/symbole: [DESCRIPTION PRÉCISE]. Palette: Primaire [HEX], Secondaire [HEX], Accent [HEX]. 4 variations: (1) fond clair [HEX], (2) fond sombre [HEX], (3) monochrome noir, (4) inversé blanc. Espace de protection: 2× hauteur du pictogramme. Format: PNG 2000×2000px + SVG vectoriel. Pas de: effets 3D, dégradés complexes, plus de 3 couleurs."`,

  visual: `BON EXEMPLE:
"Photo produit [MARQUE]: [PRODUIT] positionné sur [SURFACE], éclairage [TYPE] (température [K], direction [ANGLE]°), [OBJECTIF] mm f/[APERTURE], bokeh [INTENSITÉ], couleurs [HEX primaire] dominant, reflets [TYPE], fond [DESCRIPTION], format [DIMENSIONS]px, RAW → export JPEG 96dpi et PNG transparent."`,
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

async function reviewWithGPT(
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

async function reviewWithClaude(
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
