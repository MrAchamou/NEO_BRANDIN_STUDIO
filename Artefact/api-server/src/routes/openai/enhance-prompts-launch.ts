import { Router, type IRouter } from "express";
import { cerebrasStream, CEREBRAS_MODEL } from "../../lib/cerebras-client";
import { getMarketConfig, buildMarketContext, convertPrice } from "../../lib/market-config";
import { reviewPromptQuality, type EnhancedBrief } from "../../lib/prompt-utils";

const router: IRouter = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sendEvent(res: any, data: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function parseJsonSafe(text: string): Record<string, unknown> | null {
  const parse = (value: string) => JSON.parse(value) as Record<string, unknown>;
  try {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      return parse(clean);
    } catch {
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return parse(clean.slice(start, end + 1));
      }
      return null;
    }
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
    primary_color = "#C8A96E",
    heading_font = "Playfair Display",
    body_font = "Lora",
    market,
    values,
    target_demographic,
    competitors,
    forbidden_keywords,
    colors,
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
    market?: string;
    values?: string | string[];
    target_demographic?: string;
    competitors?: string;
    forbidden_keywords?: string;
    colors?: string;
  };

  if (!brand_name || !sector || !product_name) {
    res.status(400).json({ error: "brand_name, sector et product_name sont requis" });
    return;
  }

  const marketCfg = getMarketConfig(market);
  const marketCtx = buildMarketContext(marketCfg);
  const priceDisplay = convertPrice(price, marketCfg);
  const oldPriceDisplay = convertPrice(old_price, marketCfg);

  const code = promo_code || brand_name.slice(0, 4).toUpperCase() + discount;
  const featuresStr = Array.isArray(features) ? features.join(", ") : features;
  const benefitsStr = Array.isArray(benefits) ? benefits.join(", ") : benefits;
  const year = new Date().getFullYear();

  const brief: EnhancedBrief = {
    brand_name,
    sector,
    tone,
    values: values ?? sector,
    target_demographic: target_demographic ?? undefined,
    competitors: competitors ?? undefined,
    forbidden_keywords: forbidden_keywords ?? undefined,
    colors: colors ?? primary_color ?? undefined,
    product_name,
    product_description,
    benefits: benefitsStr,
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = `Tu es un expert senior en architecture de landing pages haute conversion, développeur web et stratège de lancement pour RoboNeo.com.

${marketCtx}

Contexte:
- Marque: ${brand_name}
- Produit: ${product_name}
- Secteur: ${sector}
- Ton: ${tone}
- Pays / Marché: ${marketCfg.country} (${marketCfg.region})
- Prix: ${priceDisplay} (avant: ${oldPriceDisplay}, remise: ${discount}%)
- Code promo: ${code}
- Description: ${product_description || "produit premium"}
- Caractéristiques: ${featuresStr || "qualité supérieure"}
- Bénéfices: ${benefitsStr || "élégance, durabilité"}
- URL checkout: ${checkout_url}
- Livraison: ${shipping_info}
- Couleur principale: ${primary_color}
- Police titres: ${heading_font} | Police corps: ${body_font}
- Année: ${year}

RÈGLES ABSOLUES:
1. Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.
2. Ne JAMAIS tronquer ou abréger le nom de la marque "${brand_name}" — toujours l'écrire en entier.
3. Tous les documents combinés sont rédigés en anglais (langage natif des modèles IA de génération).`;

  const sections = [
    {
      key: "landing_page",
      label: "Landing Page — Prompt IA + Cahier des Charges GOD-TIER",
      agent: "Landing Page Architect / GOD-TIER Conversion Strategist",
      useReview: true,
      prompt: `Tu es un expert senior en architecture de landing pages haute conversion et en rédaction de cahiers des charges pour IA générative.

Tu dois produire un DOCUMENT UNIFIÉ COMPLET : PROMPT IA + CAHIER DES CHARGES ULTRA-DÉTAILLÉ, fusionnés en un seul document prêt à coller directement dans v0.dev, Cursor AI, Claude Artifacts, Framer AI ou Webflow AI pour générer une landing page GOD-TIER pour "${product_name}" de la marque "${brand_name}" (secteur ${sector}, ton ${tone}).

Le "combined_document" doit être UN SEUL TEXTE STRUCTURÉ EN ANGLAIS qui joue simultanément le rôle de prompt IA et de cahier des charges — suffisamment précis et complet pour qu'une IA génère la landing page parfaite sans poser aucune question.

CONTEXTE PRODUIT:
- Marque: ${brand_name} | Produit: ${product_name}
- Prix: ${priceDisplay} (avant: ${oldPriceDisplay}, -${discount}%) | Code promo: ${code}
- Description: ${product_description || "produit premium"}
- Caractéristiques: ${featuresStr || "qualité supérieure, durabilité, élégance"}
- Bénéfices: ${benefitsStr || "style, performance, satisfaction garantie"}
- URL checkout: ${checkout_url} | Livraison: ${shipping_info}
- Couleur principale: ${primary_color} | Polices: ${heading_font} (titres) / ${body_font} (corps)
- Marché: ${marketCfg.country} — Paiements locaux: ${marketCfg.payment_methods.slice(0, 3).join(", ")}

Réponds en JSON avec EXACTEMENT cette structure:
{
  "combined_document": "DOCUMENT COMPLET EN ANGLAIS — commence par une ligne de titre claire (ex: '# LANDING PAGE SPECIFICATION + AI PROMPT — [BRAND] [PRODUCT]'), puis structure le document en sections bien délimitées avec des headers markdown (##). Ce document UNIQUE doit contenir dans cet ordre:\\n\\n## 1. MISSION & CONVERSION OBJECTIVE\\nObjectif de conversion précis avec KPIs mesurables (ex: convert 8-12% of visitors into buyers within 90 seconds). 3-4 phrases.\\n\\n## 2. PAGE ARCHITECTURE (ordered sections)\\nDétail complet section par section avec le texte exact, les visuels attendus et les interactions:\\n- HERO: headline H1 word-for-word, sous-titre, visual hero description, CTA button text + color, urgency badge text\\n- SOCIAL PROOF BAR: exact content\\n- PROBLEM → SOLUTION: before/after storytelling exact\\n- FEATURES (3-5): icon + title + description for each\\n- TESTIMONIALS (3): name, avatar description, rating, full review text\\n- IRRESISTIBLE OFFER: prix barré ${oldPriceDisplay}, prix promo ${priceDisplay}, code ${code}, countdown, garantie\\n- FAQ (5 Q&A): exact questions and answers that remove purchase objections\\n- FINAL CTA: exact text + design\\n- FOOTER: legal mentions, payment methods ${marketCfg.payment_methods.slice(0, 3).join(', ')}\\n\\n## 3. DESIGN SYSTEM\\nCouleur principale: ${primary_color} / Hover: ${primary_color} at -10% luminosity / Background: #FFFFFF / Text: #1A1A1A / Secondary: #666666 / Urgency: #E53E3E / Fonts: ${heading_font} (700, 900) / ${body_font} (400, 500) / Border-radius: 12px cards, 8px buttons, 50px badges / Shadows: 0 8px 32px rgba(0,0,0,0.08) / Animations: fade-in-up on scroll (100ms delay, 0.4s), CTA pulse every 3s\\n\\n## 4. COPYWRITING (word-for-word)\\nH1 headline (max 8 words, benefit-focused): exact text / Subtitle (20-25 words): exact text / CTA button: exact text / Urgency badge: exact text including code ${code} and discount -${discount}% / Value proposition line: exact text\\n\\n## 5. CONVERSION ENGINEERING\\nUrgency: 24h countdown timer, 'Stock limité', code ${code} expires today / Trust signals: secure payment badges (${marketCfg.payment_methods.slice(0, 3).join(', ')}), 30-day guarantee, satisfied customers count / Social proof: 3 reviews with realistic names for ${marketCfg.country} market / Price anchoring: ${oldPriceDisplay} struck through, ${priceDisplay} in ${primary_color} bold, -${discount}% green badge\\n\\n## 6. TECHNICAL SPECIFICATIONS\\nResponsive: mobile-first, breakpoints 375px / 768px / 1280px / Performance: LCP < 2.5s, WebP/AVIF images, lazy loading, critical CSS inlined / SEO: title tag ≤60 chars, meta description ≤155 chars with CTA, OG image 1200×630px / Tracking: GA4 + Meta Pixel placeholders, events: page_view, add_to_cart, purchase, scroll_depth_50, scroll_depth_90 / Accessibility: WCAG 2.1 AA, contrast checked, alt texts, aria-labels, keyboard navigation\\n\\n## 7. IMPLEMENTATION INSTRUCTIONS\\nStep-by-step instructions for the AI model: what to generate first, how to handle responsive, how to wire the checkout URL ${checkout_url}, how to implement the countdown timer server-side, how to configure local payment methods for ${marketCfg.country}\\n\\n## 8. LAUNCH CHECKLIST\\n8 items: replace placeholder images (WebP min 800px), configure real checkout URL, activate server-side countdown, test promo code ${code}, install Meta Pixel + GA4, A/B test 2 headline variants, configure local payments, verify PageSpeed > 90 mobile",

  "recommended_models": [
    {"name": "v0.dev", "icon": "🎨", "why": "Best for: generates complete React/Next.js + Tailwind code instantly. Paste the combined_document directly.", "url": "https://v0.dev", "badge": "TOP PICK"},
    {"name": "Cursor AI", "icon": "⚡", "why": "Best for: full project context, generates HTML/CSS/JS with file structure. Use claude-sonnet-4-6 model.", "url": "https://cursor.sh", "badge": ""},
    {"name": "Claude Artifacts", "icon": "🟣", "why": "Best for: interactive React prototype in seconds. Instant preview, no setup required.", "url": "https://claude.ai", "badge": "FAST"},
    {"name": "Framer AI", "icon": "✨", "why": "Best for: no-code animated landing page. Professional transitions and interactions built-in.", "url": "https://framer.com", "badge": "NO-CODE"},
    {"name": "Webflow AI", "icon": "🌐", "why": "Best for: CMS-powered professional site with e-commerce integration. SEO-optimized output.", "url": "https://webflow.com", "badge": ""}
  ],

  "meta": {
    "title": "titre SEO 60 chars max pour ${brand_name} — ${product_name}",
    "description": "meta description 155 chars avec CTA et mot-clé principal",
    "seo_keywords": ["mot-cle-1", "mot-cle-2", "mot-cle-3"]
  }
}`,
    },
    {
      key: "user_guide",
      label: "Guide d'Utilisation (README)",
      agent: "Documentation Agent / Launch Strategist",
      useReview: false,
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
      useReview: false,
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
        max_tokens: section.key === "landing_page" ? 8192 : 4096,
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

      // ── Automatic GPT + Claude review for landing_page ─────────────────────
      if (section.useReview && parsed && typeof (parsed as any).combined_document === "string") {
        const combinedDoc = (parsed as any).combined_document as string;

        sendEvent(res, {
          type: "review_start",
          key: section.key,
          message: "GPT optimise le document, puis Claude vérifie la couverture finale...",
        });

        try {
          const reviewResult = await reviewPromptQuality(combinedDoc, brief, "landing_page_combined_spec");

          sendEvent(res, {
            type: "review_done",
            key: section.key,
            refined: reviewResult.refined,
            score: reviewResult.score,
            gpt_score: reviewResult.gpt_score,
            claude_score: reviewResult.claude_score,
            improvements: reviewResult.improvements,
          });
        } catch (reviewErr) {
          req.log.warn({ reviewErr }, "Landing page review failed, keeping Cerebras output");
          sendEvent(res, {
            type: "review_error",
            key: section.key,
            message: "Review indisponible — document Cerebras conservé.",
          });
        }
      }
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
