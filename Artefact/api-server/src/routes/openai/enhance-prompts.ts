import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { EnhancePromptsBody } from "@workspace/api-zod";
import { buildSystemPrompt, buildNegativePrompt, reviewPromptQuality, type EnhancedBrief } from "../../lib/prompt-utils";
import * as zod from "zod";

const router: IRouter = Router();

// ─── Extended schema (accepts new optional quality fields) ────────────────────

const ExtendedBody = EnhancePromptsBody.extend({
  target_demographic: zod.string().nullish(),
  competitors: zod.string().nullish(),
  forbidden_keywords: zod.string().nullish(),
  enable_review: zod.boolean().nullish(),
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
    enable_review,
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
  };

  const negativeBlock = buildNegativePrompt(sector, tone);
  const moduleLabel = "MODULE 01 — Brand Identity (Logo, Palette, Typographie, Charte Graphique)";
  const systemPrompt = buildSystemPrompt(brief, moduleLabel);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sections = [
    {
      key: "logo",
      agent: "Brand Design Agent / Product Display Agent",
      userPrompt: `MODULE 01.1 — LOGO GENERATOR

Génère un prompt RoboNeo ULTRA-PRÉCIS pour créer le logo de ${brand_name}.

CONTEXTE STYLISTIQUE DÉTECTÉ:
• Style: ${style}
• Description: ${styleDesc}

STRUCTURE DU PROMPT À GÉNÉRER:
1. Contexte marque + positionnement
2. Direction artistique (style, esprit, ambiance)
3. Typographie recommandée (nom police + lien Google Fonts + alternatives)
4. Symbole/icône (description précise + inspirations)
5. Palette (codes HEX: primaire, secondaire, accent)
6. 4 variations requises (fond clair, fond sombre, monochrome, inversé)
7. Spécifications techniques (PNG 2000×2000px + SVG vectoriel, espace de protection)
8. Bloc NEGATIVE_PROMPT

${negativeBlock}

Commence directement par: "Crée le logo de ${brand_name}..."`,
    },
    {
      key: "palette",
      agent: "Brand Design Agent",
      userPrompt: `MODULE 01.2 — PALETTE GENERATOR

Génère un prompt RoboNeo ULTRA-PRÉCIS pour créer la palette chromatique complète de ${brand_name}.

STRUCTURE DU PROMPT À GÉNÉRER:
1. Couleur primaire (60% usage) — code HEX + RGB + signification psychologique
2. Couleur secondaire (30% usage) — code HEX + RGB + accord avec la primaire
3. Couleur accent/CTA (10% usage) — code HEX + RGB + émotion générée
4. 5 nuances neutres (codes HEX exacts)
5. Validation WCAG 2.1 AA (paires valides/invalides sur fond blanc et fond sombre)
6. Applications recommandées (boutons, fonds, textes, icônes)
7. Palette saisonnière ou mood board optionnel

${negativeBlock}

Commence directement par: "Génère la palette de couleurs complète pour ${brand_name}..."`,
    },
    {
      key: "typography",
      agent: "Brand Design Agent",
      userPrompt: `MODULE 01.3 — TYPOGRAPHY SYSTEM

Génère un prompt RoboNeo ULTRA-PRÉCIS pour le système typographique de ${brand_name}.

STRUCTURE DU PROMPT À GÉNÉRER:
1. Police titres (h1/h2/h3): nom + Google Fonts URL + graisses + tailles (h1: 48px, h2: 36px, h3: 24px)
2. Police corps (paragraphes): nom + URL + 16px + interligne 1.5 + graisses
3. Police accent (CTA/boutons/captions): nom + URL + tailles + graisses
4. 2 fallbacks web-safe par police
5. Variables CSS (--font-heading, --font-body, --font-accent)
6. Classes utilitaires (.heading-xl, .heading-lg, .body-md, .caption, .cta)
7. Paires recommandées (quelle police sur quel fond de couleur)

${negativeBlock}

Commence directement par: "Génère le système typographique complet pour ${brand_name}..."`,
    },
    {
      key: "guidelines",
      agent: "Brand Design Agent (PDF generation)",
      userPrompt: `MODULE 01.4 — BRAND GUIDELINES

Génère un prompt RoboNeo ULTRA-PRÉCIS pour créer la charte graphique PDF de ${brand_name}.

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

Commence directement par: "Génère la charte graphique complète pour ${brand_name}..."`,
    },
  ];

  for (const section of sections) {
    try {
      res.write(`data: ${JSON.stringify({ type: "section_start", key: section.key })}\n\n`);

      let fullContent = "";

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: section.userPrompt },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullContent += content;
          res.write(`data: ${JSON.stringify({ type: "chunk", key: section.key, content })}\n\n`);
        }
      }

      // ── Optional quality review pass ──────────────────────────────────────
      let reviewData: { score: number; improvements: string[] } | null = null;
      if (enable_review && fullContent.length > 100) {
        try {
          const review = await reviewPromptQuality(fullContent, brief, section.key);
          reviewData = { score: review.score, improvements: review.improvements };
          // If refined prompt is significantly better, stream the diff
          if (review.score < 8 && review.refined !== fullContent) {
            fullContent = review.refined;
          }
        } catch {
          // Review is optional — silently skip on error
        }
      }

      res.write(
        `data: ${JSON.stringify({
          type: "section_done",
          key: section.key,
          agent: section.agent,
          fullContent,
          review: reviewData,
        })}\n\n`
      );
    } catch (err) {
      req.log.error({ err, section: section.key }, "Error enhancing prompt");
      res.write(`data: ${JSON.stringify({ type: "error", key: section.key, message: "Erreur lors de la génération" })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  res.end();
});

export default router;
