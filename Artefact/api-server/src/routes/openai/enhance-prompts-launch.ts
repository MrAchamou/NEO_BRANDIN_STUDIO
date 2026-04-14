import { Router, type IRouter } from "express";
import { cerebrasStream, CEREBRAS_MODEL } from "../../lib/cerebras-client";

const router: IRouter = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sendEvent(res: any, data: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function parseJsonSafe(text: string): Record<string, unknown> | null {
  try {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ─── Route POST ──────────────────────────────────────────────────────────────

router.post("/openai/enhance-prompts-launch", async (req, res) => {
  const {
    brand_name,
    sector,
    tone = "professionnel",
    product_name,
    product_description = "",
    price = 299,
    old_price = 399,
    discount = 20,
    promo_code,
    checkout_url = "#",
    shipping_info = "Livraison offerte dès 100€",
    features = [],
    benefits = [],
    primary_color = "#D4AF37",
    heading_font = "Playfair Display",
    body_font = "Montserrat",
  } = req.body as {
    brand_name: string;
    sector: string;
    tone?: string;
    product_name: string;
    product_description?: string;
    price?: number;
    old_price?: number;
    discount?: number;
    promo_code?: string;
    checkout_url?: string;
    shipping_info?: string;
    features?: string[];
    benefits?: string[];
    primary_color?: string;
    heading_font?: string;
    body_font?: string;
  };

  if (!brand_name || !sector || !product_name) {
    res.status(400).json({ error: "brand_name, sector et product_name sont requis" });
    return;
  }

  const code = promo_code || brand_name.slice(0, 4).toUpperCase() + discount;
  const featuresStr = Array.isArray(features) ? features.join(", ") : features;
  const benefitsStr = Array.isArray(benefits) ? benefits.join(", ") : benefits;
  const year = new Date().getFullYear();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = `Tu es un expert développeur web et stratège de lancement pour RoboNeo.com.
Tu génères des contenus prêts à l'emploi, ultra-professionnels, adaptés à la marque.
Contexte:
- Marque: ${brand_name}
- Produit: ${product_name}
- Secteur: ${sector}
- Ton: ${tone}
- Prix: ${price}€ (avant: ${old_price}€, remise: ${discount}%)
- Code promo: ${code}
- Description: ${product_description || "produit premium"}
- Caractéristiques: ${featuresStr || "qualité supérieure"}
- Bénéfices: ${benefitsStr || "élégance, durabilité"}
- URL checkout: ${checkout_url}
- Livraison: ${shipping_info}
- Couleur principale: ${primary_color}
- Police titres: ${heading_font} | Police corps: ${body_font}
- Année: ${year}

RÈGLE ABSOLUE: Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

  const sections = [
    {
      key: "landing_page",
      label: "Landing Page HTML",
      agent: "Web Design Agent / Conversion Optimizer",
      prompt: `Génère une landing page HTML complète et prête à déployer pour "${product_name}" de la marque "${brand_name}" (secteur ${sector}).

La landing page doit inclure :
- Header avec logo placeholder et nom de la marque
- Section Hero : badge promo, titre H1 accrocheur, description courte persuasive, prix barré + prix promo, bouton CTA
- Section Features (3 caractéristiques avec icône emoji)
- Section Testimonials (3 avis clients fictifs réalistes)
- Section FAQ (4 questions/réponses pertinentes pour le secteur)
- Footer avec mentions légales

CSS intégré utilisant : couleur principale ${primary_color}, police ${heading_font} pour les titres, ${body_font} pour le corps, fond blanc, design responsive.

Réponds en JSON avec exactement cette structure:
{
  "html": "<!DOCTYPE html>...</html> — CODE HTML COMPLET VALIDE en une seule chaîne (échapper les guillemets internes)",
  "meta": {
    "title": "titre SEO de la page",
    "description": "meta description 150 caractères",
    "sections": ["hero", "features", "testimonials", "faq", "footer"]
  }
}

La valeur "html" doit être le code HTML COMPLET de la page, prêt à copier-coller dans un fichier index.html.
Code promo à afficher: ${code} (-${discount}%).
Prix: ${old_price}€ barré → ${price}€. Livraison: ${shipping_info}.`,
    },
    {
      key: "user_guide",
      label: "Guide d'Utilisation (README)",
      agent: "Documentation Agent / Launch Strategist",
      prompt: `Génère un guide d'utilisation complet pour le pack de lancement "${brand_name}" — "${product_name}" (secteur ${sector}).

Le guide doit couvrir :
1. Introduction et bienvenue
2. Structure du dossier de fichiers (07 dossiers : brand_identity, visual_content, video_content, ad_creatives, brand_sound, copy_content, launch_ready)
3. Calendrier 30 jours en 4 semaines (semaine 1: installation, semaine 2: lancement, semaine 3: amplification, semaine 4: fidélisation)
4. Par plateforme : Instagram, TikTok, Facebook, Pinterest, Site web
5. Conseils d'optimisation pour la conversion, le SEO et les réseaux sociaux

Réponds en JSON avec exactement cette structure:
{
  "introduction": "texte d'introduction en 2-3 paragraphes",
  "folder_structure": "arborescence du dossier en texte ASCII (avec les 7 dossiers modules)",
  "calendar_summary": {
    "week_1": {"theme": "Installation & Préparation", "actions": ["action1", "action2", "action3", "action4", "action5", "action6", "action7"]},
    "week_2": {"theme": "Lancement Officiel", "actions": ["action1", "action2", "action3", "action4", "action5", "action6", "action7"]},
    "week_3": {"theme": "Amplification & Publicité", "actions": ["action1", "action2", "action3", "action4", "action5", "action6", "action7"]},
    "week_4": {"theme": "Fidélisation & Optimisation", "actions": ["action1", "action2", "action3", "action4", "action5", "action6", "action7"]}
  },
  "platform_guide": {
    "instagram": "guide Instagram en 3-4 lignes avec formats et fichiers",
    "tiktok": "guide TikTok en 2-3 lignes",
    "facebook": "guide Facebook en 2-3 lignes",
    "pinterest": "guide Pinterest en 2-3 lignes",
    "website": "guide site web / Shopify en 3-4 lignes"
  },
  "optimization_tips": ["conseil1", "conseil2", "conseil3", "conseil4", "conseil5", "conseil6"]
}

Personnalise tous les contenus pour la marque ${brand_name} dans le secteur ${sector} avec un ton ${tone}.`,
    },
    {
      key: "calendar",
      label: "Calendrier 30 Jours (JSON)",
      agent: "Content Calendar Agent / Social Media Planner",
      prompt: `Génère un calendrier de publication sur 30 jours ultra-détaillé et personnalisé pour "${brand_name}" (${product_name}, secteur ${sector}).

Réponds en JSON avec exactement cette structure:
{
  "brand": "${brand_name}",
  "product": "${product_name}",
  "total_days": 30,
  "days": [
    {
      "day": 1,
      "date_offset": "J+1",
      "week": 1,
      "theme": "thème de la semaine",
      "action": "action précise à effectuer",
      "platform": "plateforme concernée (instagram/tiktok/email/facebook/pinterest/website/ads/analytics/offline)",
      "file_to_use": "fichier ou dossier à utiliser (ex: logos/, captions/instagram_feed[0])",
      "content_type": "type de contenu (post/story/reel/email/pub/vidéo/setup)",
      "priority": "high/medium/low",
      "tip": "conseil court et actionnable"
    }
  ]
}

Génère les 30 jours complets avec:
- Semaine 1 (J1-J7): Installation boutique, configuration logo/couleurs/polices, fiche produit, photos, emails automatiques
- Semaine 2 (J8-J14): LANCEMENT — post annonce, TikTok/Reels, carrousel, stories, email launch, Pinterest, YouTube
- Semaine 3 (J15-J21): Amplification — Meta Ads, Before/After, teaser vidéo, LinkedIn, email panier abandonné, TikTok trend, Google Display
- Semaine 4 (J22-J30): Fidélisation — avis clients, email loyalty, retargeting, UGC, bilan, planification mois 2

Adapte les actions et contenus spécifiquement au secteur "${sector}" et à la marque "${brand_name}".`,
    },
  ];

  for (const section of sections) {
    try {
      sendEvent(res, {
        type: "section_start",
        key: section.key,
        label: section.label,
        agent: section.agent,
      });

      let fullContent = "";

      const stream = await cerebrasStream({
        model: CEREBRAS_MODEL,
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: section.prompt },
        ],
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullContent += content;
          sendEvent(res, { type: "chunk", key: section.key, content });
        }
      }

      const parsed = parseJsonSafe(fullContent);

      sendEvent(res, {
        type: "section_done",
        key: section.key,
        label: section.label,
        agent: section.agent,
        data: parsed ?? { raw: fullContent },
        rawContent: fullContent,
      });
    } catch (err) {
      req.log.error({ err, section: section.key }, "Error generating launch section");
      sendEvent(res, {
        type: "section_error",
        key: section.key,
        message: "Erreur lors de la génération",
      });
    }
  }

  sendEvent(res, { type: "done" });
  res.end();
});

export default router;
