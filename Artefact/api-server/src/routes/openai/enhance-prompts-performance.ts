import { Router, type IRouter } from "express";
import { cerebrasStream, CEREBRAS_MODEL } from "../../lib/cerebras-client";
import { getMarketConfig, buildMarketContext } from "../../lib/market-config";
import { brandLockHeader } from "../../lib/prompt-utils";
import { buildBrandLock, computeProfit } from "../../governance";
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

// Valeurs par défaut selon le secteur
const SECTOR_DEFAULTS: Record<string, Record<string, number>> = {
  bijou:       { ca_target: 10000, basket_target: 150, conv_target: 2.5, cac_target: 30, roas_target: 3.0, margin_percent: 65, max_cpa: 25, target_cpa: 15 },
  luxe:        { ca_target: 15000, basket_target: 300, conv_target: 2.0, cac_target: 50, roas_target: 3.5, margin_percent: 70, max_cpa: 45, target_cpa: 25 },
  cosmétique:  { ca_target: 8000,  basket_target: 60,  conv_target: 3.0, cac_target: 20, roas_target: 3.5, margin_percent: 70, max_cpa: 18, target_cpa: 12 },
  tech:        { ca_target: 15000, basket_target: 200, conv_target: 2.0, cac_target: 40, roas_target: 2.5, margin_percent: 55, max_cpa: 35, target_cpa: 20 },
  mode:        { ca_target: 12000, basket_target: 100, conv_target: 2.2, cac_target: 35, roas_target: 2.8, margin_percent: 60, max_cpa: 30, target_cpa: 18 },
  fitness:     { ca_target: 10000, basket_target: 80,  conv_target: 2.5, cac_target: 25, roas_target: 3.0, margin_percent: 65, max_cpa: 22, target_cpa: 14 },
  décoration:  { ca_target: 9000,  basket_target: 120, conv_target: 2.0, cac_target: 28, roas_target: 2.8, margin_percent: 58, max_cpa: 24, target_cpa: 16 },
  maroquinerie:{ ca_target: 12000, basket_target: 180, conv_target: 2.2, cac_target: 38, roas_target: 3.0, margin_percent: 62, max_cpa: 33, target_cpa: 19 },
};

router.post("/openai/enhance-prompts-performance", async (req, res) => {
  const {
    brand_name,
    sector,
    tone = "professionnel",
    market,
    ca_target,
    basket_target,
    conv_target,
    cac_target,
    roas_target,
    margin_percent,
    max_cpa,
    target_cpa,
  } = req.body as {
    brand_name: string;
    sector: string;
    tone?: string;
    ca_target?: number;
    basket_target?: number;
    conv_target?: number;
    cac_target?: number;
    roas_target?: number;
    margin_percent?: number;
    max_cpa?: number;
    target_cpa?: number;
    market?: string;
  };

  if (!brand_name || !sector) {
    res.status(400).json({ error: "brand_name et sector sont requis" });
    return;
  }

  const marketCfg = getMarketConfig(market);
  const marketCtx = buildMarketContext(marketCfg);

  const defaults = SECTOR_DEFAULTS[sector] ?? SECTOR_DEFAULTS["bijou"];
  const ctx = {
    ca_target:       ca_target       ?? defaults.ca_target,
    basket_target:   basket_target   ?? defaults.basket_target,
    conv_target:     conv_target     ?? defaults.conv_target,
    cac_target:      cac_target      ?? defaults.cac_target,
    roas_target:     roas_target     ?? defaults.roas_target,
    margin_percent:  margin_percent  ?? defaults.margin_percent,
    max_cpa:         max_cpa         ?? defaults.max_cpa,
    target_cpa:      target_cpa      ?? defaults.target_cpa,
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const lock = buildBrandLock(extractBriefInputFromBody(req.body) ?? undefined);
  const lockHeader = brandLockHeader(lock);

  // ── Dynamic Profit Engine : LTV, CAC, break-even, max CPA dynamique ───
  const profit = computeProfit(lock, {
    aov: ctx.basket_target,
    margin_percent: ctx.margin_percent,
    repeat_purchase_rate: Number(req.body?.repeat_purchase_rate) || undefined,
    avg_orders_per_year: Number(req.body?.avg_orders_per_year) || undefined,
    cac: ctx.cac_target,
    fixed_costs_monthly: Number(req.body?.fixed_costs_monthly) || undefined,
  });

  const profitBlock = `\n\n═══ DYNAMIC PROFIT ENGINE — VALEURS CALCULÉES (NE PAS RECALCULER) ═══
${profit.formula_explanations.length > 0 ? profit.formula_explanations.map((l) => `  • ${l}`).join("\n") : "  (Inputs incomplets — la rubrique Profit doit signaler les manques sans inventer de chiffres)"}
Valeurs verrouillées :
  • AOV               = ${profit.aov ?? "n/a"}
  • Profit par commande = ${profit.gross_profit_per_order ?? "n/a"}
  • LTV               = ${profit.ltv ?? "n/a"}
  • LTV / CAC         = ${profit.ltv_cac_ratio ?? "n/a"}
  • Payback (orders)  = ${profit.payback_period_orders ?? "n/a"}
  • Break-even / mois = ${profit.break_even_orders_monthly ?? "n/a"}
  • CPA max dynamique = ${profit.max_cpa_dynamic ?? "n/a"}
  • CPA cible dynamique = ${profit.target_cpa_dynamic ?? "n/a"}
RÈGLE : Ces chiffres sont la SEULE source de vérité financière. Tout autre nombre que tu produis (ROAS, prévisions CA, etc.) doit être cohérent avec eux. Tout chiffre absent doit être marqué "n/a" dans ta réponse, jamais inventé.`;

  const systemPrompt = `${lockHeader}Tu es un expert en performance marketing e-commerce et analyse de données pour RoboNeo.com.${profitBlock}
Ta mission: créer des outils de tracking et d'optimisation PRÉCIS et ACTIONNABLES pour maximiser le ROI.

${marketCtx}

Contexte de la marque:
- Nom EXACT de la marque: ${brand_name} (NE JAMAIS altérer ce nom — ex: ne pas écrire "${brand_name}kin" ou "${brand_name.slice(0, -1)}" ou toute variation)
- Pays / Marché: ${marketCfg.country} (${marketCfg.region})
- Secteur: ${sector}
- Objectifs: CA cible ${ctx.ca_target} ${marketCfg.currency_symbol}, ROAS cible ${ctx.roas_target}x, CPA cible ${ctx.target_cpa} ${marketCfg.currency_symbol}

RÈGLES ABSOLUES:
1. Toutes tes réponses doivent être en JSON valide, directement exploitables.
2. INTÉGRITÉ DU NOM: Toujours écrire le nom de la marque exactement: "${brand_name}". Ne jamais l'abréger, déformer ou halluciner une variante.
3. GLOSSAIRE OBLIGATOIRE: Dans la section kpi_guide, inclure systématiquement un champ "lexique" avec les définitions simples de: ROAS, CPA, CTR, CAC, Taux de conversion — pour qu'une fondatrice de TPE sans expérience marketing puisse comprendre.
4. Les exemples de produits dans les fichiers doivent utiliser le vrai nom "${brand_name}" et non un nom inventé.`;

  const sections = [
    {
      key: "dashboard",
      label: "Dashboard Google Sheets",
      agent: "Manual (Google Sheets)",
      userPrompt: `Génère un tableau de bord Google Sheets complet pour ${brand_name} dans le secteur ${sector}.
Objectifs: CA cible ${ctx.ca_target}€/mois, panier moyen ${ctx.basket_target}€, taux conversion ${ctx.conv_target}%, ROAS cible ${ctx.roas_target}x, CAC max ${ctx.cac_target}€.

Réponds UNIQUEMENT avec un JSON valide:
{
  "tabs": [
    {
      "name": "Nom de l'onglet",
      "description": "Ce que cet onglet contient",
      "columns": ["Colonne 1", "Colonne 2", "..."],
      "sample_rows": [["valeur exemple", "valeur exemple", "..."]],
      "formulas": ["=FORMULE1", "=FORMULE2"],
      "notes": "Conseil d'utilisation"
    }
  ],
  "alert_system": [
    {
      "metric": "Nom de la métrique",
      "red_threshold": "Condition 🔴",
      "orange_threshold": "Condition 🟡",
      "green_threshold": "Condition 🟢",
      "action_red": "Action à prendre si rouge",
      "action_green": "Action à prendre si vert"
    }
  ],
  "setup_instructions": ["Étape 1...", "Étape 2...", "Étape 3..."]
}

Inclus 5 onglets: Synthèse, Meta Ads, Google Ads, TikTok Ads, Organique/Email. Système d'alertes avec ROAS, CPA, CTR.`,
    },
    {
      key: "kpi_guide",
      label: "Guide KPIs par Plateforme",
      agent: "Manual (PDF)",
      userPrompt: `Génère un guide complet des KPIs de performance pour ${brand_name} (secteur ${sector}).
Adapte les seuils au secteur ${sector} et aux objectifs: ROAS ${ctx.roas_target}x, CPA ${ctx.target_cpa}€.

Réponds UNIQUEMENT avec un JSON valide:
{
  "lexique": [
    {
      "terme": "ROAS",
      "definition": "Return On Ad Spend = CA généré par la pub / Coût de la pub. Exemple: si tu dépenses 10 000 FCFA en pub et génères 40 000 FCFA de ventes, ton ROAS est de 4.",
      "exemple_concret": "exemple pratique pour une fondatrice de TPE"
    },
    {
      "terme": "CPA",
      "definition": "Coût Par Acquisition = Budget pub total / Nombre de commandes. Exemple: 50 000 FCFA de pub pour 10 commandes = CPA de 5 000 FCFA.",
      "exemple_concret": "exemple pratique"
    },
    {
      "terme": "CTR",
      "definition": "Click-Through Rate (Taux de clic) = Nombre de clics / Nombre d'impressions × 100. Mesure combien de personnes cliquent sur ta pub.",
      "exemple_concret": "exemple pratique"
    },
    {
      "terme": "CAC",
      "definition": "Coût d'Acquisition Client = Total dépenses marketing / Nombre de nouveaux clients. Différent du CPA: inclut toutes les dépenses, pas seulement la pub.",
      "exemple_concret": "exemple pratique"
    },
    {
      "terme": "Taux de conversion",
      "definition": "% de visiteurs qui achètent = Commandes / Visiteurs × 100. Exemple: 100 visiteurs, 3 achats = taux de conversion de 3%.",
      "exemple_concret": "exemple pratique"
    }
  ],
  "platforms": [
    {
      "name": "Nom de la plateforme",
      "kpis": [
        {
          "name": "Nom du KPI",
          "formula": "Formule de calcul",
          "unit": "€ ou % ou x",
          "good": "Valeur considérée bonne",
          "very_good": "Valeur très bonne",
          "excellent": "Valeur excellente",
          "warning": "Quand s'inquiéter",
          "tip": "Conseil pour améliorer ce KPI"
        }
      ],
      "priority_kpi": "Le KPI le plus important sur cette plateforme",
      "common_mistakes": ["Erreur 1", "Erreur 2"]
    }
  ],
  "global_rules": ["Règle globale 1", "Règle globale 2", "Règle globale 3"]
}

Couvre: Meta Ads, Google Ads, TikTok Ads, Organique, Email Marketing.
RAPPEL: Adapter les exemples concrets du lexique au secteur ${sector} et à la marque ${brand_name}.`,
    },
    {
      key: "scaling_guide",
      label: "Guide Scaling & Stop",
      agent: "Manual (PDF)",
      userPrompt: `Génère un guide d'optimisation complet pour ${brand_name} (secteur ${sector}).
Seuils: ROAS cible ${ctx.roas_target}x, CPA max ${ctx.max_cpa}€, CPA cible ${ctx.target_cpa}€.

Réponds UNIQUEMENT avec un JSON valide:
{
  "stop_criteria": [
    {
      "condition": "Condition d'arrêt",
      "delay": "Après combien de temps",
      "action": "Action précise à prendre",
      "severity": "immédiat | urgent | à surveiller"
    }
  ],
  "scale_criteria": [
    {
      "condition": "Condition de scaling",
      "action": "Action précise",
      "increase_percent": 30,
      "monitoring": "Quoi surveiller après scaling"
    }
  ],
  "phases": [
    {
      "name": "Phase 1: Lancement",
      "duration": "Semaines 1-2",
      "budget_per_campaign": "20€/jour",
      "roas_target": 1.5,
      "actions": ["Action 1", "Action 2"],
      "kpis_to_watch": ["KPI 1", "KPI 2"]
    },
    {
      "name": "Phase 2: Scaling",
      "duration": "Semaines 3-4",
      "budget_per_campaign": "50€/jour",
      "roas_target": 2.5,
      "actions": ["Action 1", "Action 2"],
      "kpis_to_watch": ["KPI 1", "KPI 2"]
    },
    {
      "name": "Phase 3: Maturité",
      "duration": "Semaine 5+",
      "budget_per_campaign": "100€+/jour",
      "roas_target": ${ctx.roas_target},
      "actions": ["Action 1", "Action 2"],
      "kpis_to_watch": ["KPI 1", "KPI 2"]
    }
  ],
  "decision_algorithm": [
    { "if": "ROAS > ${ctx.roas_target}", "then": "Action à prendre", "priority": "haute" },
    { "if": "ROAS entre 2.0 et ${ctx.roas_target}", "then": "Action à prendre", "priority": "normale" },
    { "if": "ROAS < 2.0", "then": "Action à prendre", "priority": "critique" }
  ],
  "quick_wins": ["Conseil rapide 1", "Conseil rapide 2", "Conseil rapide 3"]
}`,
    },
    {
      key: "weekly_review",
      label: "Template Analyse Hebdomadaire",
      agent: "Manual (Google Docs)",
      userPrompt: `Génère un template d'analyse hebdomadaire complet pour ${brand_name} (secteur ${sector}).
Objectifs semaine: CA ${Math.round(ctx.ca_target / 4)}€, ROAS ${ctx.roas_target}x, CPA ${ctx.target_cpa}€.

Réponds UNIQUEMENT avec un JSON valide:
{
  "sections": [
    {
      "title": "Titre de la section",
      "type": "summary | table | checklist | textarea",
      "fields": [
        {
          "label": "Nom du champ",
          "placeholder": "Valeur exemple ou instruction",
          "formula": "Formule si applicable",
          "insight_prompt": "Question à se poser pour analyser ce champ"
        }
      ]
    }
  ],
  "questions_of_the_week": [
    "Question stratégique 1 à se poser chaque semaine ?",
    "Question stratégique 2 ?",
    "Question stratégique 3 ?"
  ],
  "checklist_actions": {
    "monday": ["Action lundi 1", "Action lundi 2"],
    "wednesday": ["Action mercredi 1"],
    "friday": ["Action vendredi 1", "Action vendredi 2"],
    "sunday": ["Action dimanche 1 (bilan)"]
  },
  "kpi_targets": {
    "ca_weekly": ${Math.round(ctx.ca_target / 4)},
    "roas_min": ${ctx.roas_target},
    "cpa_max": ${ctx.max_cpa},
    "cpa_target": ${ctx.target_cpa},
    "conv_rate_min": ${ctx.conv_target}
  }
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

      sendEvent(res, {
        type: "section_done",
        key: section.key,
        agent: section.agent,
        fullContent,
        data: parsed ?? {},
        context: ctx,
        profit_engine: profit,
        governance: govResult.summary,
      });
    } catch (err) {
      req.log.error({ err, section: section.key }, "Error generating performance section");
      sendEvent(res, { type: "error", key: section.key, message: "Erreur lors de la génération" });
    }
  }

  sendEvent(res, { type: "done" });
  res.end();
});

export default router;
