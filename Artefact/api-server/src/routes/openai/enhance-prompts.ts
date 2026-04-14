import { Router, type IRouter } from "express";
import { cerebrasStream, CEREBRAS_MODEL } from "../../lib/cerebras-client";
import { EnhancePromptsBody } from "@workspace/api-zod";
import { buildSystemPrompt, buildNegativePrompt, reviewWithGPT, reviewWithClaude, type EnhancedBrief } from "../../lib/prompt-utils";
import { buildLogoPrompt } from "../../prompts/modules/module-01-1-logo/prompt-builder";
import { buildPalettePrompt } from "../../prompts/modules/module-01-2-palette/prompt-builder";
import * as zod from "zod";

const router: IRouter = Router();

function estimateTokenCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.ceil(trimmed.length / 4));
}

// ─── Extended schema (accepts new optional quality fields) ────────────────────

const ExtendedBody = EnhancePromptsBody.extend({
  target_demographic: zod.string().nullish(),
  competitors: zod.string().nullish(),
  forbidden_keywords: zod.string().nullish(),
  enable_review: zod.boolean().nullish(),
  colors: zod.string().nullish(),
});

// ─── Style mappings (enriched) ───────────────────────────────────────────────

const LOGO_STYLE_MAP: Record<string, string> = {
  bijou: "luxe", luxe: "luxe", maroquinerie: "luxe", montres: "luxe", parfum: "luxe",
  mode: "editorial", couture: "editorial",
  streetwear: "street",
  cosmétique: "minimal", skincare: "nature", beauté: "minimal",
  tech: "tech", gadgets: "futuristic", saas: "tech",
  fitness: "playful", sport: "playful",
  décoration: "artisanal", maison: "artisanal",
  alimentaire: "artisanal", bio: "nature",
  corporate: "corporate", finance: "corporate",
};

const TONE_STYLE_OVERRIDE: Record<string, string> = {
  luxe: "luxe", premium: "luxe",
  minimaliste: "minimal",
  écologique: "nature",
  streetwear: "street", audacieux: "street",
  professionnel: "corporate",
};

const LOGO_STYLE_DESCRIPTIONS: Record<string, string> = {
  luxe: "Élégant, raffiné, intemporel. Typographie sérif fine (Playfair Display, Didot, Cormorant). Symbole: couronne, pierre précieuse, monogramme orné. Palette: or (#D4AF37), noir profond (#1A1A1A), blanc cassé (#FAFAFA).",
  minimal: "Épuré, géométrique, aéré. Typographie sans-serif fine (Inter, DM Sans). Symbole géométrique simple ou logotype seul. Palette monochrome, max 2 couleurs.",
  street: "Dynamique, gras, impactant. Typographie sans-serif extra-bold (Monument Grotesk, Druk). Palette: noir, blanc + 1 couleur vive ou néon.",
  tech: "Angulaire, précis, innovant. Typographie sans-serif géométrique (Roboto Mono, Space Grotesk). Symbole: circuit, onde, hexagone, pixel. Palette: bleu électrique (#0066FF), cyan (#00D4FF), gris foncé (#1E1E1E).",
  artisanal: "Organique, texturé, chaleureux. Typographie manuscrite ou sérif texturée. Symboles naturels, line-art. Palette: terre cuite, beige, vert sauge, charbon.",
  vintage: "Badge, blason, contour épais. Typographie sérif vintage. Palette: sépia, bordeaux (#6B1A1A), vert olive, moutarde (#D4A017).",
  playful: "Arrondi, dynamique, joyeux. Typographie rounded sans-serif (Nunito, Poppins). Palette vive, max 4 couleurs harmonieuses.",
  corporate: "Sobre, stable, confiance. Typographie sans-serif solide (Roboto, Lato, IBM Plex). Palette: bleu marine (#003087), gris (#6C757D), blanc.",
  nature: "Organique, fluide, apaisant. Symboles naturels: feuille, arbre, vague. Typographie douce et arrondie. Palette: vert forêt (#2D6A4F), beige sable, bleu ciel doux.",
  editorial: "Raffiné, élégant, haute couture. Typographie sérif élégant (Cormorant Garamond, Freight Display). Palette: noir, blanc, or ou ivoire.",
  futuristic: "Néon, dégradés dynamiques, formes fluides. Typographie angulaire. Palette: violet (#8B5CF6), cyan (#06B6D4), magenta (#EC4899).",
  ethnic: "Coloré, expressif, authentique. Motifs traditionnels, richesse décorative. Palette chaude: rouge, orange, or, terre.",
};

router.post("/openai/enhance-prompts", async (req, res) => {
  const parsed = ExtendedBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
    return;
  }

  const {
    brand_name, sector, tone, values, style_pref,
    target_demographic, competitors, forbidden_keywords,
    enable_review, colors,
  } = parsed.data;

  // ── Style detection (ton overrides secteur si cohérent) ──────────────────
  const toneStyle = TONE_STYLE_OVERRIDE[tone.toLowerCase()];
  const style = style_pref || toneStyle || LOGO_STYLE_MAP[sector.toLowerCase()] || "minimal";
  const styleDesc = LOGO_STYLE_DESCRIPTIONS[style] || LOGO_STYLE_DESCRIPTIONS["minimal"];
  const valuesStr = values.join(", ");

  const brief: EnhancedBrief = {
    brand_name, sector, tone, values,
    target_demographic: target_demographic ?? undefined,
    competitors: competitors ?? undefined,
    forbidden_keywords: forbidden_keywords ?? undefined,
    colors: colors ?? undefined,
  };

  const negativeBlock = buildNegativePrompt(sector, tone);
  const moduleLabel = "MODULE 01 — Brand Identity (Logo, Palette, Typographie, Charte Graphique)";
  const systemPrompt = buildSystemPrompt(brief, moduleLabel);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const generationStartedAt = Date.now();
  let totalQwenMs = 0;
  let totalQwenTokens = 0;
  const gptScores: number[] = [];
  const claudeScores: number[] = [];
  const winnerCounts = { gpt: 0, claude: 0, tie: 0 };

  const logoOptimizedPrompt = buildLogoPrompt({
    brandName: brand_name,
    sector,
    tone,
    values,
    logoStyle: style_pref ?? undefined,
    brandColors: colors ?? undefined,
  });

  const paletteOptimizedPrompt = buildPalettePrompt({
    brandName: brand_name,
    sector,
    tone,
    values,
    brandColors: colors ?? undefined,
  });

  const sections = [
    {
      key: "logo",
      agent: "Brand Design Agent / Product Display Agent",
      systemPrompt: `You are an expert in logo generation prompts for RoboNeo.com. From the reference structure provided (golden example adapted to the brand), generate an ULTRA-PRECISE prompt, structured and ready for use in image generation tools (Midjourney, DALL-E 3, Stable Diffusion XL). Respect EXACTLY the 8 sections: Artistic Direction, Recommended Typography, Symbol/Icon, Color Palette, 4 required variations, Technical Specifications, NEGATIVE_PROMPT, TECHNICAL PARAMETERS. Do NOT summarize or shorten — each section must be as detailed as the reference model. Write the entire prompt EXCLUSIVELY IN ENGLISH.`,
      userPrompt: logoOptimizedPrompt,
    },
    {
      key: "palette",
      agent: "Brand Design Agent",
      systemPrompt: `You are an expert in design systems and color accessibility. From the reference structure provided, generate a complete, structured color palette with WCAG tables and JSON. Respect EXACTLY the 7 sections + summary tables + final JSON. Calculate contrast ratios precisely using the WCAG 2.1 formula. Do NOT summarize or shorten — fill each section as precisely as the reference model. Write all content EXCLUSIVELY IN ENGLISH.`,
      userPrompt: paletteOptimizedPrompt,
    },
    {
      key: "typography",
      agent: "Brand Design Agent",
      userPrompt: `MODULE 01.3 — TYPOGRAPHY SYSTEM

Generate an ULTRA-PRECISE RoboNeo prompt for the typography system of ${brand_name}.

PROMPT STRUCTURE TO GENERATE:
1. Heading font (h1/h2/h3): name + Google Fonts URL + weights + sizes (h1: 48px, h2: 36px, h3: 24px)
2. Body font (paragraphs): name + URL + 16px + line-height 1.5 + weights
3. Accent font (CTA/buttons/captions): name + URL + sizes + weights
4. 2 web-safe fallbacks per font
5. CSS variables (--font-heading, --font-body, --font-accent)
6. Utility classes (.heading-xl, .heading-lg, .body-md, .caption, .cta)
7. Recommended pairings (which font on which background color)

ABSOLUTE RULES — TYPOGRAPHIC COLORS:
• All text colors MUST be exact HEX codes (e.g., #1A1A1A, #555555, #FFFFFF)
• FORBIDDEN: CSS opacity to define a color (rgba(0,0,0,0.7), opacity: 0.6, color: inherit)
• Primary text: pure HEX — e.g., #1A1A1A (never black with opacity)
• Secondary text: calculated pure HEX — e.g., #6B7280 (never gray with opacity)
• Disabled text: pure HEX — e.g., #9CA3AF (never rgba)
• WCAG 2.1 AA ratio calculated on the real HEX value, not on an approximate opacity

LANGUAGE RULE: Write this entire prompt EXCLUSIVELY IN ENGLISH.

${negativeBlock}

Start directly with: "Generate the complete typography system for ${brand_name}..."`,
    },
    {
      key: "guidelines",
      agent: "Brand Design Agent (Brand Guidelines Content)",
      userPrompt: `MODULE 01.4 — BRAND GUIDELINES

⚠️ NOTE TECHNIQUE IMPORTANTE : Un LLM génère du TEXTE structuré, pas un fichier binaire PDF. Ce prompt produit le contenu textuel et structuré d'une charte graphique, destiné à être mis en page par un outil de publication (Canva, Adobe InDesign, Figma, ou un script de génération PDF). Le fichier PDF final sera créé en post-production à partir de ce contenu.

Génère un prompt RoboNeo ULTRA-PRÉCIS pour rédiger le CONTENU TEXTUEL STRUCTURÉ de la charte graphique de ${brand_name} (le contenu servira de base à la génération PDF en post-production).

STRUCTURE DU PROMPT À GÉNÉRER:
10 règles graphiques obligatoires (R01 à R10):
R01 — Usage du logo (4 variations, règles de placement)
R02 — Espace de protection minimal (calcul basé sur dimensions logo)
R03 — Taille minimale (impression 15mm, digital 32px)
R04 — Couleur primaire (usage réservé, interdictions)
R05 — Couleur secondaire (support, complémentarité)
R06 — Accessibilité WCAG 2.1 AA (ratio ≥ 4.5:1)
R07 — Typographie titres (hiérarchie stricte)
R08 — Typographie corps (lisibilité, interligne)
R09 — Ton et voix de marque (vocabulaire, style rédactionnel)
R10 — Valeurs de marque (incarnation dans les visuels)

Pour chaque règle: description précise + Do's (3 exemples) + Don'ts (3 exemples) + conséquences.

${negativeBlock}

Commence directement par: "Rédige le contenu structuré de la charte graphique pour ${brand_name}..."`,
    },
  ];

  for (const section of sections) {
    try {
      res.write(`data: ${JSON.stringify({ type: "section_start", key: section.key })}\n\n`);

      let fullContent = "";
      const qwenStartedAt = Date.now();

      const activeSystemPrompt = (section as { systemPrompt?: string }).systemPrompt ?? systemPrompt;

      const stream = await cerebrasStream({
        model: CEREBRAS_MODEL,
        max_tokens: 8192,
        messages: [
          { role: "system", content: activeSystemPrompt },
          { role: "user", content: section.userPrompt },
        ],
      }, section.key);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullContent += content;
          res.write(`data: ${JSON.stringify({ type: "chunk", key: section.key, content })}\n\n`);
        }
      }

      const qwenMs = Date.now() - qwenStartedAt;
      const qwenOutputTokens = estimateTokenCount(fullContent);
      totalQwenMs += qwenMs;
      totalQwenTokens += qwenOutputTokens;

      // ── Optional quality review pass (Séquence : Cerebras → GPT → Claude) ──
      let reviewData: {
        score: number;
        improvements: string[];
        gpt_score?: number;
        claude_score?: number;
        winner?: "gpt" | "claude" | "tie";
      } | null = null;
      if (enable_review && fullContent.length > 100) {
        try {
          // Phase 2 — GPT-5.2 démarre en premier
          res.write(`data: ${JSON.stringify({ type: "review_start", key: section.key, agent: "gpt" })}\n\n`);
          const gptResult = await reviewWithGPT(fullContent, brief, section.key);
          res.write(`data: ${JSON.stringify({ type: "review_agent_done", key: section.key, agent: "gpt", score: gptResult.score })}\n\n`);

          // Phase 3 — Claude démarre après GPT
          res.write(`data: ${JSON.stringify({ type: "review_start", key: section.key, agent: "claude" })}\n\n`);
          const claudeResult = await reviewWithClaude(fullContent, brief, section.key);
          res.write(`data: ${JSON.stringify({ type: "review_agent_done", key: section.key, agent: "claude", score: claudeResult.score })}\n\n`);

          // Fusion des résultats
          let winner: "gpt" | "claude" | "tie";
          let winnerResult: typeof gptResult;
          if (gptResult.score < claudeResult.score) { winner = "gpt"; winnerResult = gptResult; }
          else if (claudeResult.score < gptResult.score) { winner = "claude"; winnerResult = claudeResult; }
          else { winner = "tie"; winnerResult = claudeResult; }

          const allImprovements = [
            ...gptResult.improvements.map((i) => `[GPT] ${i}`),
            ...claudeResult.improvements.map((i) => `[Claude] ${i}`),
          ].slice(0, 6);

          const avgScore = Math.round(((gptResult.score + claudeResult.score) / 2) * 10) / 10;
          reviewData = { score: avgScore, improvements: allImprovements, gpt_score: gptResult.score, claude_score: claudeResult.score, winner };
          gptScores.push(gptResult.score);
          claudeScores.push(claudeResult.score);
          winnerCounts[winner] += 1;

          if (avgScore < 8 && winnerResult.refined !== fullContent) {
            fullContent = winnerResult.refined;
          }
        } catch {
          // La review est optionnelle — on ignore silencieusement en cas d'erreur
        }
      }

      res.write(
        `data: ${JSON.stringify({
          type: "section_done",
          key: section.key,
          agent: section.agent,
          fullContent,
          review: reviewData,
          metrics: {
            qwen_ms: qwenMs,
            qwen_output_tokens: qwenOutputTokens,
            qwen_tokens_per_second: qwenMs > 0 ? Math.round((qwenOutputTokens / qwenMs) * 10000) / 10 : 0,
          },
        })}\n\n`
      );
    } catch (err) {
      req.log.error({ err, section: section.key }, "Error enhancing prompt");
      res.write(`data: ${JSON.stringify({ type: "error", key: section.key, message: "Erreur lors de la génération" })}\n\n`);
    }
  }

  const average = (scores: number[]) => scores.length > 0
    ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
    : null;

  res.write(`data: ${JSON.stringify({
    type: "done",
    performance: {
      total_ms: Date.now() - generationStartedAt,
      qwen_ms: totalQwenMs,
      qwen_output_tokens: totalQwenTokens,
      qwen_tokens_per_second: totalQwenMs > 0 ? Math.round((totalQwenTokens / totalQwenMs) * 10000) / 10 : 0,
      gpt_average_score: average(gptScores),
      claude_average_score: average(claudeScores),
      winner_counts: winnerCounts,
      review_sections: gptScores.length,
      section_count: sections.length,
      review_enabled: Boolean(enable_review),
    },
  })}\n\n`);
  res.end();
});

export default router;
