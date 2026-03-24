import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

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
  };

  if (!brand_name || !sector) {
    res.status(400).json({ error: "brand_name et sector sont requis" });
    return;
  }

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

  const systemPrompt = `Tu es un expert en performance marketing e-commerce et analyse de données pour RoboNeo.com.
Ta mission: créer des outils de tracking et d'optimisation PRÉCIS et ACTIONNABLES pour maximiser le ROI.
Contexte de la marque:
- Nom: ${brand_name}
- Secteur: ${sector}
- Objectifs: CA cible ${ctx.ca_target}€, ROAS cible ${ctx.roas_target}x, CPA cible ${ctx.target_cpa}€
Toutes tes réponses doivent être en JSON valide, directement exploitables.`;

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

Couvre: Meta Ads, Google Ads, TikTok Ads, Organique, Email Marketing.`,
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

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        max_completion_tokens: 4096,
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
        context: ctx,
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
