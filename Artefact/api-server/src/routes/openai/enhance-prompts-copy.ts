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

router.post("/openai/enhance-prompts-copy", async (req, res) => {
  const {
    brand_name,
    sector,
    tone = "professionnel",
    values = [],
    product_name,
    product_description = "",
    product_features = [],
    benefits = [],
    target_audience = "mixte",
    discount = 20,
    promo_code,
  } = req.body as {
    brand_name: string;
    sector: string;
    tone?: string;
    values?: string[];
    product_name: string;
    product_description?: string;
    product_features?: string[];
    benefits?: string[];
    target_audience?: string;
    discount?: number;
    promo_code?: string;
  };

  if (!brand_name || !sector || !product_name) {
    res.status(400).json({ error: "brand_name, sector et product_name sont requis" });
    return;
  }

  const code = promo_code || brand_name.slice(0, 4).toUpperCase() + discount;
  const valuesStr = Array.isArray(values) ? values.join(", ") : values;
  const featuresStr = Array.isArray(product_features) ? product_features.join(", ") : product_features;
  const benefitsStr = Array.isArray(benefits) ? benefits.join(", ") : benefits;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = `Tu es un expert copywriter et stratège de contenu pour RoboNeo.com.
Tu génères du contenu textuel ultra-professionnel, optimisé conversion, en français.
Contexte de la marque:
- Marque: ${brand_name}
- Produit: ${product_name}
- Secteur: ${sector}
- Ton: ${tone}
- Valeurs: ${valuesStr || "excellence, qualité"}
- Description produit: ${product_description || "produit premium"}
- Caractéristiques: ${featuresStr || "qualité supérieure"}
- Bénéfices: ${benefitsStr || "élégance, durabilité"}
- Audience cible: ${target_audience}
- Remise promo: ${discount}%
- Code promo: ${code}

RÈGLE ABSOLUE: Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

  // ─── Section 1 : Fiche Produit ───────────────────────────────────────────

  const sections = [
    {
      key: "product_sheet",
      label: "Fiche Produit Complète",
      agent: "Copywriting Agent / E-commerce Optimizer",
      prompt: `Génère une fiche produit e-commerce complète pour "${product_name}" de la marque "${brand_name}" (secteur ${sector}, ton ${tone}).

Réponds en JSON avec exactement cette structure:
{
  "titles": ["titre1", "titre2", "titre3", "titre4"],
  "description": "description longue et persuasive de 120-150 mots avec storytelling",
  "bullet_points": ["point1", "point2", "point3", "point4", "point5"],
  "faq": [
    {"question": "Q1", "answer": "R1"},
    {"question": "Q2", "answer": "R2"},
    {"question": "Q3", "answer": "R3"},
    {"question": "Q4", "answer": "R4"},
    {"question": "Q5", "answer": "R5"}
  ]
}

Les 4 titres doivent être différents : accrocheur SEO, bénéfice principal, storytelling, édition limitée.
Les bullet points doivent commencer par une emoji pertinente.
La description doit intégrer les caractéristiques: ${featuresStr || "qualité supérieure"}.`,
    },
    {
      key: "captions",
      label: "Captions par Plateforme",
      agent: "Social Media Agent / Content Creator",
      prompt: `Génère des captions optimisées pour chaque plateforme sociale pour "${product_name}" de "${brand_name}" (secteur ${sector}).

Réponds en JSON avec exactement cette structure:
{
  "instagram_feed": ["caption1", "caption2", "caption3"],
  "instagram_story": ["caption1", "caption2", "caption3"],
  "tiktok": ["caption1", "caption2", "caption3"],
  "pinterest": ["caption1", "caption2"],
  "facebook": ["caption1", "caption2"]
}

Chaque caption doit:
- Instagram feed: 150-200 caractères + hashtags intégrés + emoji
- Instagram story: court, punch, call-to-action
- TikTok: hook viral, POV ou question rhétorique + hashtags
- Pinterest: descriptif, riche en mots-clés, intemporel
- Facebook: conversationnel, engagement-driven

Code promo à intégrer (dans certaines captions): ${code}`,
    },
    {
      key: "hashtags",
      label: "Hashtags Optimisés",
      agent: "SEO Social Agent / Hashtag Optimizer",
      prompt: `Génère des sets de hashtags ultra-optimisés pour "${brand_name}" dans le secteur "${sector}".

Réponds en JSON avec exactement cette structure:
{
  "instagram": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10", "#hashtag11", "#hashtag12", "#hashtag13", "#hashtag14", "#hashtag15"],
  "tiktok": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8"],
  "pinterest": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10", "#hashtag11", "#hashtag12", "#hashtag13", "#hashtag14", "#hashtag15", "#hashtag16", "#hashtag17", "#hashtag18", "#hashtag19", "#hashtag20"],
  "strategy": "explication courte de la stratégie hashtag pour ce secteur"
}

Mix: 30% hashtags de niche (500k-2M posts), 50% secteur (2M-10M), 20% trending.
Inclure: #${brand_name.toLowerCase()}, des hashtags français ET anglais pertinents pour le secteur ${sector}.`,
    },
    {
      key: "email_sequence",
      label: "Séquence Emails (3 emails)",
      agent: "Email Marketing Agent / CRM Specialist",
      prompt: `Génère une séquence de 3 emails marketing pour "${brand_name}" autour du produit "${product_name}" (${sector}, ton ${tone}).

Réponds en JSON avec exactement cette structure:
{
  "launch": {
    "subject": "objet de l'email de lancement (max 60 caractères, avec emoji)",
    "preheader": "préheader de 80-100 caractères",
    "body": "corps de l'email HTML-friendly, 150-200 mots, avec [BOUTON CTA]",
    "cta": "texte du bouton CTA"
  },
  "abandoned_cart": {
    "subject": "objet panier abandonné urgent",
    "preheader": "préheader crée l'urgence",
    "body": "corps email panier abandonné, 120-150 mots, avec [BOUTON CTA]",
    "cta": "texte du bouton CTA"
  },
  "loyalty": {
    "subject": "objet email fidélité et remerciement",
    "preheader": "préheader surprise et exclusivité",
    "body": "corps email fidélité, 130-160 mots, avec [BOUTON CTA]",
    "cta": "texte du bouton CTA"
  }
}

Code promo pour launch et loyalty: ${code} (-${discount}%).
Ton: ${tone}. Personnalisation: {prénom} dans les corps d'emails.`,
    },
    {
      key: "client_reviews",
      label: "Reviews Clients (10 avis)",
      agent: "Social Proof Agent / UGC Optimizer",
      prompt: `Génère 10 avis clients réalistes et authentiques pour "${product_name}" de "${brand_name}" (secteur ${sector}).

Réponds en JSON avec exactement cette structure:
{
  "reviews": [
    {
      "name": "Prénom N.",
      "rating": 5,
      "title": "titre court percutant",
      "content": "avis détaillé et authentique de 40-70 mots mentionnant le produit et un détail précis",
      "verified": true,
      "date": "il y a X jours/semaines"
    }
  ]
}

Les 10 avis doivent:
- Varier entre 4 et 5 étoiles (8 à 5 étoiles, 2 à 4 étoiles)
- Avoir des prénoms français variés (hommes et femmes)
- Mentionner des détails spécifiques: livraison, emballage, qualité, usage
- Être crédibles et différenciés — éviter la répétition
- Intégrer naturellement "${product_name}" dans certains avis
- Varier les dates (de 2 jours à 3 mois)`,
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
      req.log.error({ err, section: section.key }, "Error generating copy section");
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
