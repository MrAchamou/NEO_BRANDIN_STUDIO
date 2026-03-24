import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { EnhancePromptsBody } from "@workspace/api-zod";

const router: IRouter = Router();

const LOGO_STYLE_MAP: Record<string, string> = {
  bijou: "luxe",
  luxe: "luxe",
  maroquinerie: "luxe",
  montres: "luxe",
  mode: "editorial",
  streetwear: "street",
  cosmétique: "minimal",
  skincare: "nature",
  tech: "tech",
  fitness: "playful",
  décoration: "artisanal",
  gadgets: "futuristic",
};

const LOGO_STYLE_DESCRIPTIONS: Record<string, string> = {
  luxe: "Élégant, raffiné, intemporel. Typographie sérif fine. Symbole: couronne, pierre précieuse. Palette: or, noir profond, blanc cassé.",
  minimal: "Épuré, géométrique, moderne. Typographie sans-serif fine. Symbole géométrique simple. Palette monochrome.",
  street: "Dynamique, gras, impactant. Typographie sans-serif extra-bold. Palette vives, néon ou noir/blanc.",
  tech: "Angulaire, précis, innovant. Typographie sans-serif géométrique. Symbole circuit ou onde. Palette bleu électrique, gris.",
  artisanal: "Organique, texturé, chaleureux. Typographie manuscrite. Symboles naturels. Palette terre, beige, vert sauge.",
  vintage: "Badge, blason, contour épais. Typographie sérif vintage. Palette sépia, bordeaux, vert olive.",
  playful: "Arrondi, dynamique, joyeux. Typographie rounded sans-serif. Palette vives et joyeuses.",
  corporate: "Sobre, stable, confiance. Typographie sans-serif solide. Palette bleu marine, gris, blanc.",
  nature: "Organique, fluide, apaisant. Symboles naturels: feuille, arbre, vague. Palette vert, marron, bleu ciel.",
  editorial: "Raffiné, élégant, intemporel. Typographie sérif élégant. Palette noir, blanc, or.",
  futuristic: "Néon, dégradés dynamiques. Typographie angulaire. Palette violet, cyan, magenta.",
  ethnic: "Coloré, expressif, authentique. Motifs traditionnels. Palette rouge, orange, or, terre.",
};

router.post("/openai/enhance-prompts", async (req, res) => {
  const parsed = EnhancePromptsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
    return;
  }

  const { brand_name, sector, tone, values, style_pref } = parsed.data;
  const style = style_pref || LOGO_STYLE_MAP[sector] || "minimal";
  const styleDesc = LOGO_STYLE_DESCRIPTIONS[style] || LOGO_STYLE_DESCRIPTIONS["minimal"];
  const valuesStr = values.join(", ");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = `Tu es un expert en création de prompts pour RoboNeo.com, une plateforme de génération d'assets créatifs par IA.
Ta mission: générer des prompts ULTRA-PRÉCIS, DÉTAILLÉS et PROFESSIONNELS pour les agents RoboNeo.
Contexte de la marque:
- Nom: ${brand_name}
- Secteur: ${sector}
- Ton: ${tone}
- Valeurs: ${valuesStr}
- Style logo: ${style}

Chaque prompt doit:
1. Être directement utilisable dans RoboNeo sans modification
2. Inclure des détails spécifiques à la marque
3. Être en français
4. Mentionner le nom de la marque
5. Inclure des spécifications techniques précises`;

  const sections = [
    {
      key: "logo",
      agent: "Brand Design Agent / Product Display Agent",
      userPrompt: `Génère un prompt RoboNeo complet et détaillé pour créer le logo de la marque ${brand_name}.
Style logo: ${style}. ${styleDesc}
Le prompt doit inclure: le style visuel, la typographie recommandée, le symbole/icône, la palette de couleurs (avec codes HEX), les 4 variations requises (fond clair, fond sombre, monochrome, inversé), et le format (PNG + SVG 2000x2000px).
Commence directement par "Crée un logo pour ${brand_name}..."`,
    },
    {
      key: "palette",
      agent: "Brand Design Agent",
      userPrompt: `Génère un prompt RoboNeo complet et détaillé pour créer la palette de couleurs de ${brand_name}.
Le prompt doit demander: 1 couleur primaire (60% usage), 1 couleur secondaire (30%), 1 couleur accent (10%), 5 nuances neutres, validation WCAG 2.1 AA, codes HEX et RGB pour chaque couleur. 
Adapte les choix chromatiques au secteur ${sector} et au ton ${tone}.
Commence directement par "Génère une palette de couleurs professionnelle pour ${brand_name}..."`,
    },
    {
      key: "typography",
      agent: "Brand Design Agent",
      userPrompt: `Génère un prompt RoboNeo complet et détaillé pour créer le système typographique de ${brand_name}.
Le prompt doit demander: 1 police titres (h1/h2/h3 avec tailles), 1 police corps (body 16px, interligne 1.5), 1 police accent (CTA/boutons), 2 fallbacks web-safe par police, liens Google Fonts, variables CSS.
Adapte au ton ${tone} et au secteur ${sector}.
Commence directement par "Génère un système typographique complet pour ${brand_name}..."`,
    },
    {
      key: "guidelines",
      agent: "Brand Design Agent (PDF generation)",
      userPrompt: `Génère un prompt RoboNeo complet et détaillé pour créer la charte graphique de ${brand_name} au format PDF.
Le prompt doit couvrir 10 règles (R01 à R10): usage du logo, espace minimal, taille minimale, couleur primaire, couleur secondaire, accessibilité WCAG, typographie titres, typographie corps, ton et voix, valeurs de marque.
Pour chaque règle: description, Do's, Don'ts, conséquences.
Commence directement par "Génère une charte graphique complète pour ${brand_name}..."`,
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

      res.write(
        `data: ${JSON.stringify({
          type: "section_done",
          key: section.key,
          agent: section.agent,
          fullContent,
        })}\n\n`
      );
    } catch (err) {
      req.log.error({ err, section: section.key }, "Error enhancing prompt");
      res.write(`data: ${JSON.stringify({ type: "error", key: section.key, message: "Erreur lors de l'amélioration" })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  res.end();
});

export default router;
