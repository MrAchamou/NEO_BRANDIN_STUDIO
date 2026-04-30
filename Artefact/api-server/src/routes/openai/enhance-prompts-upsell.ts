import { Router, type IRouter } from "express";
import { cerebrasStream, CEREBRAS_MODEL } from "../../lib/cerebras-client";
import { getMarketConfig, buildMarketContext, convertPrice } from "../../lib/market-config";
import { brandLockHeader } from "../../lib/prompt-utils";
import { resolveLang, languageInstruction } from "../../i18n/messages";
import { buildBrandLock, checkBundlePrice } from "../../governance";
import { runGovernancePass, extractBriefInputFromBody } from "../../governance/sse-helper";

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
    currency,
    brand_colors = "",
    market,
  } = req.body as {
    brand_name: string;
    sector: string;
    tone?: string;
    product_name: string;
    product_price?: number;
    product_features?: string[];
    values?: string[];
    currency?: string;
    brand_colors?: string;
    market?: string;
  };

  if (!brand_name || !sector || !product_name) {
    res.status(400).json({ error: "brand_name, sector et product_name sont requis" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const marketCfg = getMarketConfig(market);
  const localCurrency = currency ?? marketCfg.currency_symbol;
  const marketCtx = buildMarketContext(marketCfg);
  const priceDisplay = convertPrice(product_price, marketCfg);

  const featuresStr = product_features.length > 0 ? product_features.join(", ") : "non spécifiées";
  const valuesStr = values.length > 0 ? values.join(", ") : "qualité, confiance, élégance";

  const brandColorsBlock = brand_colors
    ? `- Charte couleurs SACRÉE (respecter dans TOUS les visuels produits): ${brand_colors}`
    : "";

  const lock = buildBrandLock(extractBriefInputFromBody(req.body) ?? undefined);
  const lockHeader = brandLockHeader(lock);

  // ── Bloc Pricing Consistency : verrouille le calcul mathématique des bundles
  const lockedPrice = lock.product.price ?? product_price;
  const lockedCurrency = lock.product.currency ?? localCurrency ?? "EUR";
  const pricingDirective = `\n\n═══ DYNAMIC PRICING ENGINE — RÈGLE MATHÉMATIQUE ABSOLUE ═══
Le prix unitaire VERROUILLÉ est ${lockedPrice} ${lockedCurrency}. Tout bundle DOIT être calculé exactement comme suit :
  bundle_price = unit_price × quantity × (1 - discount_percent / 100)
Exemple — 3 unités à ${lockedPrice} ${lockedCurrency} avec 15% de remise :
  ${lockedPrice} × 3 × 0.85 = ${(lockedPrice * 3 * 0.85).toFixed(2)} ${lockedCurrency}
Inclure dans chaque bundle JSON un champ "price_breakdown" :
  {
    "unit_price": ${lockedPrice},
    "quantity": <int>,
    "subtotal": <unit_price × quantity>,
    "discount_percent": <int>,
    "bundle_price": <calculé strictement>
  }
Tout écart entre le calcul et le prix annoncé sera rejeté par le Pricing Validator.`;

  const outputLang = resolveLang(req);
  const systemPrompt = `${lockHeader}${languageInstruction(outputLang)}Tu es un expert en stratégie e-commerce et maximisation du panier moyen pour RoboNeo.com.${pricingDirective}
Ta mission: générer des stratégies d'upsell et cross-sell PRÉCISES et ACTIONNABLES pour augmenter le chiffre d'affaires.

${marketCtx}

Contexte de la marque:
- Nom: ${brand_name}
- Pays / Marché: ${marketCfg.country} (${marketCfg.region})
- Secteur: ${sector}
- Ton: ${tone}
- Produit principal: ${product_name} (${priceDisplay})
- Caractéristiques: ${featuresStr}
- Valeurs: ${valuesStr}
${brandColorsBlock}

RÈGLES ABSOLUES:
1. Toutes tes réponses doivent être en JSON valide, directement exploitables.
2. NOMS DE PRODUITS BRANDÉS: Chaque produit complémentaire doit porter le nom de la marque "${brand_name}" dedans. Ex: au lieu de "Crème de Nuit", écrire "Baume Nuit Régénérant — ${brand_name}". Les noms doivent sonner comme une extension de gamme, pas un produit générique.
3. COHÉRENCE COULEURS: Si une charte couleur est fournie, les produits visuels (Gua Sha, accessoires, packaging) doivent respecter ces couleurs. Interdire les couleurs hors charte (ex: si la charte est Ivoire/Or/Vert, ne pas proposer un Gua Sha rose).
4. DEVISE LOCALE: Afficher les prix en ${currency}. Si des prix en Euros sont utilisés, ajouter "(Prix indicatif — paiement en FCFA disponible)".
5. Ne jamais altérer ou déformer le nom de marque "${brand_name}".`;

  const sections = [
    {
      key: "cross_sell",
      label: "Produits Complémentaires",
      agent: "Manual (strategy)",
      userPrompt: `Génère exactement 3 idées de produits complémentaires (cross-sell) pour ${brand_name} dans le secteur ${sector}.
Le produit principal est: ${product_name} à ${product_price} ${currency}.

RÈGLES OBLIGATOIRES:
- Chaque "product_name" DOIT inclure le nom "${brand_name}" (ex: "Baume Corps Éclat — ${brand_name}", pas juste "Baume Corps")
- Les prix dans "price_range" en ${currency}
- Les visuels produits doivent respecter la charte couleurs: ${brand_colors || "couleurs neutres luxe (ivoire, or, vert naturel)"}
- Ne jamais suggérer des couleurs hors charte pour les accessoires/produits (ex: pas de Gua Sha rose si la charte est Ivoire/Or/Vert)

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après:
{
  "ideas": [
    {
      "id": 1,
      "product_name": "Nom brandé du produit complémentaire incluant ${brand_name}",
      "description": "Description courte et percutante (1 phrase)",
      "price_range": "XX-XX ${currency}",
      "justification": "Pourquoi ce produit complète parfaitement ${product_name}",
      "margin": "XX%",
      "bundle_discount": 15,
      "placement": "Page produit / Panier / Post-achat",
      "visual_prompt": "Prompt détaillé pour générer le visuel produit sur RoboNeo. Format carré 1080x1080px, fond épuré, couleurs respectant la charte ${brand_name}, style cohérent avec la marque."
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

      const govResult = runGovernancePass(fullContent, { res, sectionKey: section.key, lock });
      fullContent = govResult.content;
      const parsed = parseJsonSafe(fullContent);

      // ── Pricing Validator : vérifie la cohérence mathématique des bundles
      const pricingFindings: Array<{ name: string; expected: number; claimed: number; diff: number }> = [];
      if (parsed && Array.isArray((parsed as any).bundles)) {
        for (const b of (parsed as any).bundles as Array<Record<string, any>>) {
          const breakdown = b.price_breakdown as Record<string, any> | undefined;
          if (!breakdown) continue;
          const unit = Number(breakdown.unit_price);
          const qty = Number(breakdown.quantity);
          const disc = Number(breakdown.discount_percent ?? 0);
          const claimed = Number(breakdown.bundle_price ?? b.bundle_price);
          if ([unit, qty, claimed].some((n) => !Number.isFinite(n))) continue;
          const check = checkBundlePrice(Array(qty).fill(unit), disc, claimed);
          if (!check.ok) {
            pricingFindings.push({
              name: String(b.name ?? "bundle"),
              expected: check.expected,
              claimed,
              diff: check.diff,
            });
          }
        }
      }

      sendEvent(res, {
        type: "section_done",
        key: section.key,
        agent: section.agent,
        fullContent,
        data: parsed ?? {},
        governance: govResult.summary,
        pricing_validator: {
          ok: pricingFindings.length === 0,
          mismatches: pricingFindings,
        },
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
