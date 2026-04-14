import { Router, type IRouter } from "express";
import { cerebrasStream, CEREBRAS_MODEL } from "../../lib/cerebras-client";

const router: IRouter = Router();

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

router.post("/openai/enhance-prompts-upsell", async (req, res) => {
  const {
    brand_name,
    sector,
    tone = "professionnel",
    product_name,
    product_price = 299,
    product_features = [],
    values = [],
  } = req.body as {
    brand_name: string;
    sector: string;
    tone?: string;
    product_name: string;
    product_price?: number;
    product_features?: string[];
    values?: string[];
  };

  if (!brand_name || !sector || !product_name) {
    res.status(400).json({ error: "brand_name, sector et product_name sont requis" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const featuresStr = product_features.length > 0 ? product_features.join(", ") : "non spécifiées";
  const valuesStr = values.length > 0 ? values.join(", ") : "qualité, confiance, élégance";

  const systemPrompt = `Tu es un expert en stratégie e-commerce et maximisation du panier moyen pour RoboNeo.com.
Ta mission: générer des stratégies d'upsell et cross-sell PRÉCISES et ACTIONNABLES pour augmenter le chiffre d'affaires.
Contexte de la marque:
- Nom: ${brand_name}
- Secteur: ${sector}
- Ton: ${tone}
- Produit principal: ${product_name} (${product_price}€)
- Caractéristiques: ${featuresStr}
- Valeurs: ${valuesStr}

Toutes tes réponses doivent être en JSON valide, directement exploitables.`;

  const sections = [
    {
      key: "cross_sell",
      label: "Produits Complémentaires",
      agent: "Manual (strategy)",
      userPrompt: `Génère exactement 3 idées de produits complémentaires (cross-sell) pour ${brand_name} dans le secteur ${sector}.
Le produit principal est: ${product_name} à ${product_price}€.

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après:
{
  "ideas": [
    {
      "id": 1,
      "product_name": "Nom du produit complémentaire",
      "description": "Description courte et percutante (1 phrase)",
      "price_range": "XX-XX€",
      "justification": "Pourquoi ce produit complète parfaitement ${product_name}",
      "margin": "XX%",
      "bundle_discount": 15,
      "placement": "Page produit / Panier / Post-achat",
      "visual_prompt": "Prompt détaillé pour générer le visuel produit sur RoboNeo. Format carré 1080x1080px, fond épuré, style cohérent avec ${brand_name}."
    }
  ]
}`,
    },
    {
      key: "bundles",
      label: "Offres Groupées",
      agent: "Manual (strategy)",
      userPrompt: `Génère 3 offres groupées (bundles) pour ${brand_name} autour de ${product_name} (${product_price}€).

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après:
{
  "offers": [
    {
      "id": 1,
      "type": "standard",
      "name": "Nom du pack (ex: Pack Essentiel)",
      "tagline": "Accroche courte et vendeuse",
      "products": ["${product_name}", "Nom accessoire 1"],
      "original_price": 0,
      "bundle_price": 0,
      "discount_percent": 15,
      "savings": 0,
      "cta": "Texte du bouton d'achat",
      "best_for": "Pour qui ce bundle est idéal",
      "visual_prompt": "Prompt pour créer le visuel bundle sur RoboNeo. Fond épuré, produits côte à côte, format 1080x1080px."
    }
  ]
}

Les 3 types: standard (Pack Essentiel, -15%), premium (Pack Complet, -20%), gift (Pack Cadeau, -10%).
Calcule les prix réels basés sur ${product_price}€ pour le produit principal.`,
    },
    {
      key: "upsell_copy",
      label: "Copy Upsell/Cross-sell",
      agent: "Manual (copywriting)",
      userPrompt: `Génère toute la copy pour les stratégies upsell et cross-sell de ${brand_name} pour ${product_name}.

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après:
{
  "product_page": {
    "title": "Titre upsell sur la page produit",
    "subtitle": "Sous-titre engageant",
    "cta": "Texte du bouton",
    "badge": "Texte du badge (ex: Populaire, Recommandé)",
    "benefit": "Bénéfice principal mis en avant"
  },
  "cart_page": [
    {
      "title": "Titre cross-sell dans le panier",
      "description": "Description courte (1 phrase)",
      "cta": "Bouton d'ajout",
      "urgency": "Élément d'urgence ou rareté"
    },
    {
      "title": "2ème suggestion cross-sell",
      "description": "Description courte (1 phrase)",
      "cta": "Bouton d'ajout",
      "urgency": "Élément d'urgence ou rareté"
    }
  ],
  "post_purchase": {
    "title": "Offre post-achat exclusive",
    "description": "Description de l'offre (2 phrases max)",
    "discount": 15,
    "cta": "Bouton d'action",
    "expiry": "Durée de validité",
    "subject_email": "Objet de l'email post-achat"
  },
  "checkout_bump": {
    "title": "Bump d'ordre dans le tunnel de vente",
    "description": "Description courte et urgente",
    "price_display": "Affichage du prix (ex: Ajoutez-le pour seulement +X€)",
    "cta": "Oui, j'ajoute ça !",
    "not_interested": "Non merci, je refuse cette offre exceptionnelle"
  }
}`,
    },
    {
      key: "email_sequences",
      label: "Séquences Email",
      agent: "Manual (copywriting)",
      userPrompt: `Génère une séquence d'emails upsell/cross-sell pour ${brand_name} après l'achat de ${product_name}.

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après:
{
  "sequences": [
    {
      "id": 1,
      "timing": "J+1 (24h après achat)",
      "trigger": "Déclencheur de l'envoi",
      "subject": "Objet de l'email",
      "preview": "Texte de prévisualisation",
      "headline": "Titre principal de l'email",
      "body": "Corps de l'email (3-4 phrases percutantes)",
      "cta": "Texte du bouton principal",
      "secondary_cta": "Texte du lien secondaire",
      "goal": "Objectif de cet email"
    },
    {
      "id": 2,
      "timing": "J+3",
      "trigger": "Déclencheur",
      "subject": "Objet",
      "preview": "Prévisualisation",
      "headline": "Titre",
      "body": "Corps (3-4 phrases)",
      "cta": "Bouton",
      "secondary_cta": "Lien secondaire",
      "goal": "Objectif"
    },
    {
      "id": 3,
      "timing": "J+7",
      "trigger": "Déclencheur",
      "subject": "Objet",
      "preview": "Prévisualisation",
      "headline": "Titre",
      "body": "Corps (3-4 phrases)",
      "cta": "Bouton",
      "secondary_cta": "Lien secondaire",
      "goal": "Objectif"
    }
  ]
}`,
    },
  ];

  for (const section of sections) {
    try {
      sendEvent(res, { type: "section_start", key: section.key });

      let fullContent = "";

      const stream = await cerebrasStream({
        model: CEREBRAS_MODEL,
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: section.userPrompt },
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
        agent: section.agent,
        fullContent,
        data: parsed ?? {},
      });
    } catch (err) {
      req.log.error({ err, section: section.key }, "Error generating upsell section");
      sendEvent(res, { type: "error", key: section.key, message: "Erreur lors de la génération" });
    }
  }

  sendEvent(res, { type: "done" });
  res.end();
});

export default router;
