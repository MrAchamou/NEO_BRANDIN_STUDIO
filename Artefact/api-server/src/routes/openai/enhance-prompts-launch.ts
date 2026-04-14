import { Router, type IRouter } from "express";
import { cerebrasStream, CEREBRAS_MODEL } from "../../lib/cerebras-client";
import { getMarketConfig, buildMarketContext, convertPrice } from "../../lib/market-config";

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
    primary_color = "#C8A96E",
    heading_font = "Playfair Display",
    body_font = "Lora",
    market,
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

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = `Tu es un expert développeur web et stratège de lancement pour RoboNeo.com.
Tu génères des contenus prêts à l'emploi, ultra-professionnels, adaptés à la marque.

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
- Modes de paiement locaux: ${marketCfg.payment_methods.slice(0, 4).join(", ")}
- Couleur principale: ${primary_color}
- Police titres: ${heading_font} | Police corps: ${body_font}
- Année: ${year}

RÈGLES ABSOLUES:
1. Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.
2. HTML VALIDE OBLIGATOIRE: toutes les balises doivent être correctement ouvertes ET fermées. Ne jamais laisser une balise corrompue ou incomplète (ex: <h2>Titre Not<\\/h2> est INTERDIT — écrire <h2>Titre complet</h2>).
3. Ne JAMAIS tronquer ou abréger le nom de la marque "${brand_name}" — toujours l'écrire en entier.
4. Pour les marchés africains francophones: afficher les prix avec mention "(Prix indicatif en Euros — paiement en FCFA disponible)" ou convertir directement en FCFA (1€ ≈ 655 FCFA).
5. CSS de qualité luxe: inclure des transitions fluides (transition: all 0.3s ease) sur les boutons, liens et éléments interactifs. Utiliser la couleur exacte ${primary_color} et sa variante hover à -10% de luminosité — ne jamais utiliser une autre teinte dorée.
6. Police corps = ${body_font} EXCLUSIVEMENT pour le texte de paragraphe — ne pas substituer par Montserrat ou une autre police géométrique.`;

  const sections = [
    {
      key: "landing_page",
      label: "Landing Page — Prompt IA + Cahier des Charges",
      agent: "Landing Page Architect / GOD-TIER Conversion Strategist",
      prompt: `Tu es un expert senior en architecture de landing pages haute conversion et en rédaction de cahiers des charges pour IA générative.

Tu dois produire un PROMPT IA COMPLET + CAHIER DES CHARGES ULTRA-DÉTAILLÉ pour créer une landing page GOD-TIER pour "${product_name}" de la marque "${brand_name}" (secteur ${sector}, ton ${tone}).

CONTEXTE PRODUIT:
- Marque: ${brand_name} | Produit: ${product_name}
- Prix: ${priceDisplay} (avant: ${oldPriceDisplay}, -${discount}%) | Code promo: ${code}
- Description: ${product_description || "produit premium"}
- Caractéristiques: ${featuresStr || "qualité supérieure, durabilité, élégance"}
- Bénéfices: ${benefitsStr || "style, performance, satisfaction garantie"}
- URL checkout: ${checkout_url} | Livraison: ${shipping_info}
- Couleur principale: ${primary_color} | Polices: ${heading_font} (titres) / ${body_font} (corps)
- Marché: ${marketCfg.country} — Paiements locaux: ${marketCfg.payment_methods.slice(0, 3).join(", ")}

Réponds en JSON avec EXACTEMENT cette structure (tous les champs obligatoires, rien ne doit être vide ou générique):
{
  "ai_prompt": "PROMPT IA COMPLET prêt à coller dans v0.dev / Cursor AI / Claude Artifacts / Webflow AI / Framer AI — en anglais, ultra-détaillé, avec toutes les spécifications techniques exactes de couleurs HEX, polices, dimensions, animations, micro-interactions, copywriting inclus mot pour mot, structure de sections, call-to-action, éléments de preuve sociale. Ce prompt doit permettre à n'importe quelle IA de générer la landing page parfaite sans poser de question.",

  "cahier_des_charges": {
    "objectif_strategique": "objectif précis de conversion (ex: transformer 8-12% des visiteurs en acheteurs en moins de 90 secondes) avec KPIs mesurables",

    "architecture_page": {
      "above_fold": "description ultra-précise de ce qui apparaît sans scroll: headline, sous-titre, visuel hero, CTA primaire, badge urgence/preuve sociale",
      "sections_ordonnees": [
        "1. HERO — [détail exact: headline H1 word-for-word, sous-titre, visuel, CTA bouton texte + couleur, badge promo]",
        "2. SOCIAL PROOF BAR — [logos partenaires ou nombre clients ou note étoiles]",
        "3. PROBLÈME → SOLUTION — [présentation du problème avant/après]",
        "4. FEATURES — [3-5 caractéristiques avec icône, titre, description courte]",
        "5. BÉNÉFICES ÉMOTIONNELS — [section storytelling ou témoignage vidéo]",
        "6. TESTIMONIALS — [3 avis détaillés avec nom, photo placeholder, note, texte]",
        "7. OFFRE IRRÉSISTIBLE — [prix barré, prix promo, code promo, countdown timer, garantie]",
        "8. FAQ — [5 questions/réponses qui lèvent les objections principales]",
        "9. CTA FINAL — [répétition de l'offre + bouton achat + réassurance livraison/paiement]",
        "10. FOOTER — [mentions légales, liens, méthodes de paiement]"
      ],
      "navigation": "sticky header avec logo + CTA 'Acheter maintenant' toujours visible"
    },

    "design_system": {
      "couleur_principale": "${primary_color}",
      "couleur_hover": "calculer ${primary_color} à -10% luminosité",
      "couleur_fond": "#FFFFFF avec sections alternées #F9F9F9",
      "couleur_texte_principal": "#1A1A1A",
      "couleur_texte_secondaire": "#666666",
      "couleur_accentuation_urgence": "#E53E3E (rouge pour badge 'Offre limitée')",
      "police_titres": "${heading_font} — weights 700 et 900",
      "police_corps": "${body_font} — weight 400 et 500",
      "taille_texte_base": "18px desktop / 16px mobile",
      "border_radius": "12px cards / 8px boutons / 50px badges",
      "ombres": "box-shadow: 0 8px 32px rgba(0,0,0,0.08) sur les cards",
      "animations": "fade-in-up au scroll (100ms delay, 0.4s duration), pulse sur le bouton CTA principal toutes les 3s"
    },

    "copywriting_exact": {
      "headline_h1": "headline H1 percutant word-for-word pour ${brand_name} — ${product_name} (max 8 mots, orienté bénéfice, pas de générique)",
      "sous_titre": "sous-titre explicatif 1 phrase (20-25 mots max) qui complète le H1",
      "cta_principal": "texte exact du bouton CTA principal (ex: 'Obtenir ${product_name} maintenant →')",
      "badge_urgence": "texte badge urgence (ex: '🔥 Offre -${discount}% — ${code} — Expire ce soir')",
      "proposition_valeur": "1 phrase de valeur unique sous le CTA (ex: 'Livraison offerte • Satisfait ou remboursé 30 jours • Paiement sécurisé')"
    },

    "elements_conversion": {
      "urgence": "countdown timer 24h sous le prix, badge 'Stock limité', mentions '${code} valable aujourd'hui seulement'",
      "confiance": "badges paiement sécurisé (${marketCfg.payment_methods.slice(0, 3).join(', ')}), garantie satisfait ou remboursé, nombre de clients satisfaits",
      "preuve_sociale": "3 témoignages avec étoiles 5/5, noms réalistes pour marché ${marketCfg.country}, photos avatars, dates récentes",
      "ancrage_prix": "prix barré ${oldPriceDisplay} visible, prix actuel ${priceDisplay} en ${primary_color} gras, économie en badge vert '-${discount}%'"
    },

    "specifications_techniques": {
      "responsive": "mobile-first, breakpoints: 375px / 768px / 1280px",
      "performance": "LCP < 2.5s, images WebP/AVIF, lazy loading, CSS critique inliné",
      "seo": {
        "title_tag": "titre SEO 60 chars max pour ${brand_name} ${product_name}",
        "meta_description": "meta description 155 chars avec CTA et mot-clé principal",
        "og_image": "1200×630px — fond ${primary_color} avec produit centré et texte blanc"
      },
      "tracking": "Google Analytics GA4 + Meta Pixel (placeholders à remplacer), events: page_view, add_to_cart, purchase, scroll_depth_50, scroll_depth_90",
      "accessibilite": "WCAG 2.1 AA — contrastes vérifiés, alt texts, aria-labels, navigation clavier"
    },

    "outils_recommandes": [
      "v0.dev — coller le ai_prompt directement pour générer le code React/Next.js",
      "Cursor AI + Claude — coller le ai_prompt pour générer HTML/CSS/JS complet",
      "Framer AI — pour une version no-code animée",
      "Webflow AI — pour une version CMS professionnelle",
      "Builder.io — pour intégration e-commerce Shopify/WooCommerce"
    ],

    "checklist_lancement": [
      "✅ Remplacer les placeholders photos par les vraies images produit (format WebP, min 800px)",
      "✅ Configurer l'URL checkout réelle: ${checkout_url}",
      "✅ Activer le countdown timer sur le serveur (pas côté client)",
      "✅ Tester le code promo ${code} dans le système de paiement",
      "✅ Installer le Meta Pixel et GA4 avec les vrais IDs",
      "✅ A/B tester 2 variants du headline sur 1000 visiteurs minimum",
      "✅ Configurer les modes de paiement locaux: ${marketCfg.payment_methods.slice(0, 4).join(', ')}",
      "✅ Vérifier la vitesse PageSpeed Insights > 90 mobile et desktop"
    ]
  },

  "meta": {
    "title": "titre SEO 60 chars pour ${brand_name} — ${product_name}",
    "description": "meta description 155 chars avec CTA",
    "recommended_tools": ["v0.dev", "Cursor AI", "Framer AI", "Webflow AI", "Builder.io"]
  }
}`,
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
