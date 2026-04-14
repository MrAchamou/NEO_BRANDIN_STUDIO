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

router.post("/openai/enhance-prompts-chatbot", async (req, res) => {
  const {
    brand_name,
    sector,
    tone = "professionnel",
    product_name,
    product_description = "",
    material = "matériaux d'exception",
    warranty = 2,
    delivery_days = 3,
    express_delivery_days = 1,
    express_price = 9.90,
    return_days = 30,
    discount = 20,
    promo_code,
    price = 299,
    free_shipping = 100,
    support_email,
    unique_feature = "fabrication artisanale",
    best_seller_1 = "",
    best_seller_2 = "",
  } = req.body as {
    brand_name: string;
    sector: string;
    tone?: string;
    product_name: string;
    product_description?: string;
    material?: string;
    warranty?: number;
    delivery_days?: number;
    express_delivery_days?: number;
    express_price?: number;
    return_days?: number;
    discount?: number;
    promo_code?: string;
    price?: number;
    free_shipping?: number;
    support_email?: string;
    unique_feature?: string;
    best_seller_1?: string;
    best_seller_2?: string;
  };

  if (!brand_name || !sector || !product_name) {
    res.status(400).json({ error: "brand_name, sector et product_name sont requis" });
    return;
  }

  const code = promo_code || brand_name.slice(0, 4).toUpperCase() + discount;
  const email = support_email || `contact@${brand_name.toLowerCase().replace(/\s+/g, "")}.com`;
  const discountedPrice = Math.round(price * (1 - discount / 100) * 100) / 100;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = `Tu es un expert en service client, gestion de communauté et chatbot marketing pour RoboNeo.com.
Tu génères des scripts de service client ultra-professionnels, empathiques et orientés conversion, en français.
Contexte de la marque:
- Marque: ${brand_name}
- Produit: ${product_name}
- Secteur: ${sector}
- Ton: ${tone}
- Matériau principal: ${material}
- Description: ${product_description || "produit premium"}
- Garantie: ${warranty} ans
- Livraison: ${delivery_days} jours ouvrés (express: ${express_delivery_days}j pour ${express_price}€)
- Retours: ${return_days} jours
- Prix: ${price}€ (remise ${discount}% → ${discountedPrice}€ avec code ${code})
- Livraison offerte dès: ${free_shipping}€
- Email support: ${email}
- Point différenciateur: ${unique_feature}
- Best-sellers: ${best_seller_1 || "produit phare"}, ${best_seller_2 || "coup de cœur"}

RÈGLE ABSOLUE: Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

  const sections = [
    {
      key: "faq",
      label: "FAQ Service Client (20 questions)",
      agent: "Chatbot Agent / Customer Service AI",
      prompt: `Génère 20 questions/réponses FAQ complètes pour le chatbot de service client de "${brand_name}" (produit: "${product_name}", secteur: ${sector}, ton: ${tone}).

Les questions doivent couvrir : commande et paiement, livraison et suivi, retours et remboursements, qualité et matériaux, entretien, personnalisation/gravure, cadeaux, tailles/compatibilité, garantie, service après-vente.

Réponds en JSON avec exactement cette structure:
{
  "questions": [
    {
      "id": 1,
      "category": "catégorie (Livraison / Commande / Produit / SAV / Cadeaux / etc.)",
      "question": "Question naturelle telle que la poserait un client",
      "answer": "Réponse complète, empathique et convaincante (2-4 phrases) personnalisée pour ${brand_name} / ${product_name}",
      "quick_reply": "Résumé ultra-court 10 mots max pour bouton de chatbot"
    }
  ]
}

Les 20 questions doivent être variées, réalistes et 100% adaptées au secteur "${sector}" et au produit "${product_name}".
Inclure les infos spécifiques: livraison ${delivery_days}j, retours ${return_days}j, garantie ${warranty}ans, code promo ${code}, email ${email}.`,
    },
    {
      key: "objections",
      label: "Scripts de Gestion des Objections (8 scénarios)",
      agent: "Sales Conversion Agent / Objection Handler",
      prompt: `Génère 8 scripts de gestion des objections de vente pour "${brand_name}" (produit: "${product_name}", secteur: ${sector}).

Les 8 objections à traiter: 
1. Prix trop élevé
2. Délai de livraison trop long
3. Hésitation sur la qualité / doute
4. Comparaison avec un concurrent moins cher
5. "Je verrai plus tard" / procrastination
6. Frais de port trop élevés
7. Incertitude sur la taille / compatibilité
8. Achat pour offrir (hésitation sur le choix cadeau)

Réponds en JSON avec exactement cette structure:
{
  "scripts": [
    {
      "id": 1,
      "objection_type": "prix_trop_eleve",
      "scenario": "Titre court décrivant la situation",
      "trigger": "Ce que dit exactement le client (citation)",
      "response": "Réponse du service client (3-5 phrases): empathie + valeur + solution concrète avec les infos de la marque",
      "follow_up": "Question de relance courte pour maintenir la conversation",
      "tip": "Conseil interne pour l'agent: ton à adopter ou astuce clé"
    }
  ]
}

Personnaliser avec: prix ${price}€, remise ${discount}%, code ${code} (→ ${discountedPrice}€), livraison ${delivery_days}j, express ${express_delivery_days}j à ${express_price}€, garantie ${warranty}ans, retours ${return_days}j, livraison offerte dès ${free_shipping}€, point fort "${unique_feature}".`,
    },
    {
      key: "negative_comments",
      label: "Réponses Commentaires Négatifs (5 situations)",
      agent: "Community Manager Agent / Reputation Defender",
      prompt: `Génère 5 réponses professionnelles aux commentaires négatifs sur les réseaux sociaux pour "${brand_name}" (produit: "${product_name}", secteur: ${sector}).

Les 5 situations à traiter:
1. Produit défectueux / endommagé à la réception
2. Retard de livraison
3. Service client insatisfaisant / pas de réponse
4. Produit différent de la description / photos
5. Client mécontent du prix (a trouvé moins cher ailleurs)

Pour chaque situation, génère 2 types de réponse:
- Réponse publique (visible par tous): courte, empathique, professionnelle, déplace vers le privé
- Message privé de suivi: plus détaillé, avec solution concrète et geste commercial si approprié

Réponds en JSON avec exactement cette structure:
{
  "situations": [
    {
      "id": 1,
      "type": "defaut_produit",
      "situation_title": "Titre court de la situation",
      "example_comment": "Exemple de commentaire négatif réaliste que pourrait laisser un client",
      "public_response": "Réponse publique: 2-3 phrases, commence par le prénom [Prénom], empathie sincère + action immédiate + invitation en privé",
      "private_message": "Message privé: 4-6 phrases, excuse + demande info précise + solution concrète (renvoi / remboursement / geste commercial)",
      "dos": ["point positif à faire"],
      "donts": ["chose à éviter absolument dans cette situation"]
    }
  ]
}

L'email de support est ${email}. Adapter les réponses au secteur "${sector}" et au ton "${tone}" de la marque.
Les gestes commerciaux peuvent inclure: remboursement, renvoi, code promo ${code} (-${discount}%), avoir.`,
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
      req.log.error({ err, section: section.key }, "Error generating chatbot section");
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
