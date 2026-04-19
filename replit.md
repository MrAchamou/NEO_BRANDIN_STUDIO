# Neo Branding Studio — v2.0.0

## Vue d'ensemble

Générateur de prompts IA "chirurgicaux" pour l'écosystème RoboNeo.com. L'utilisateur remplit un **Brief Global de Marque** unique et l'IA génère des prompts créatifs ultra-précis en temps réel via streaming SSE (Server-Sent Events), section par section, pour 10 modules complets couvrant l'intégralité de l'univers de marque.

**Préférence utilisateur : toujours répondre en français.**

## Pipeline IA Multi-Modèles

```
Cerebras Qwen-3 235B  →  génération rapide (6 clés en rotation circulaire)
         ↓
GPT-5.2 (Optimizer)  →  optimise le prompt vers la version “graal”
         ↓
Claude Sonnet (Final Auditor)  →  complète la version GPT, vérifie les oublis
         ↓
Version finale = couverture maximale sans débat entre agents
```

- **Cerebras** : moteur principal de génération, 6 clés en rotation anti-limite (CEREBRAS_API_KEY_1 à _6)
- **GPT-5.2** : agent d'optimisation via intégration Replit OpenAI (AI_INTEGRATIONS_OPENAI_API_KEY)
- **Claude Sonnet** : agent d'audit final via intégration Replit Anthropic (AI_INTEGRATIONS_ANTHROPIC_API_KEY)
- **Gemini 2.5** : mode ultra-qualité optionnel, 5 clés en rotation (GEMINI_API_KEY_1 à _5)

## Stack Technique

- **Monorepo** : pnpm workspaces
- **Node.js** : 20
- **TypeScript** : 5.9
- **Frontend** : React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui + Framer Motion + Wouter
- **Backend** : Express 5 (API server) + esbuild (bundle ESM)
- **Validation** : Zod v4, React Hook Form
- **Communication** : Server-Sent Events (SSE) pour le streaming temps réel
- **Routing** : Wouter (côté client)

## Structure du Projet

```text
workspace/
├── Artefact/
│   ├── roboneo-generator/              # Frontend React/Vite (port 5000)
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── home.tsx            # Dashboard principal + MODULES[]
│   │       │   ├── module-01.tsx       # Brand Identity
│   │       │   ├── module-02.tsx       # Visual Content
│   │       │   ├── module-03.tsx       # Video Content
│   │       │   ├── module-04.tsx       # Ad Creatives
│   │       │   ├── module-05.tsx       # Brand Sound
│   │       │   ├── module-06.tsx       # Copy & Content
│   │       │   ├── module-07.tsx       # Launch Ready
│   │       │   ├── module-08.tsx       # Chatbot Script
│   │       │   ├── module-09.tsx       # Upsell & Cross-sell Kit
│   │       │   └── module-10.tsx       # Performance Tracker
│   │       ├── components/
│   │       │   ├── brand-brief-panel.tsx   # Formulaire Brief Global (7 sections)
│   │       │   └── brief-summary-banner.tsx
│   │       └── context/
│   │           └── brand-context.tsx   # State global + localStorage + historique
│   └── api-server/                     # Backend Express (port 3000)
│       └── src/
│           ├── lib/
│           │   ├── cerebras-client.ts  # Rotation 6 clés + retry auto
│           │   ├── gemini-client.ts    # Rotation 5 clés
│           │   ├── anthropic-client.ts # Claude via Replit integration
│           │   ├── openai-review-client.ts # GPT via Replit integration
│           │   └── prompt-utils.ts     # Utilitaires prompts + reviewPromptQuality()
│           └── routes/openai/
│               ├── enhance-prompts.ts              # Module 01
│               ├── enhance-prompts-visual.ts       # Module 02
│               ├── enhance-prompts-video.ts        # Module 03
│               ├── enhance-prompts-ads.ts          # Module 04
│               ├── enhance-prompts-sound.ts        # Module 05
│               ├── enhance-prompts-copy.ts         # Module 06
│               ├── enhance-prompts-launch.ts       # Module 07
│               ├── enhance-prompts-chatbot.ts      # Module 08
│               ├── enhance-prompts-upsell.ts       # Module 09
│               ├── enhance-prompts-performance.ts  # Module 10
│               ├── review-prompt.ts                # Agent GPT+Claude review
│               └── persona-variants.ts             # Variantes de persona
├── lib/
│   ├── api-spec/           # Schémas OpenAPI + config Orval
│   ├── api-client-react/   # Hooks React auto-générés
│   ├── api-zod/            # Schémas Zod partagés
│   ├── db/                 # Schéma PostgreSQL + Drizzle ORM
│   └── integrations/       # Wrappers Replit OpenAI + Anthropic
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## Démarrage

Le workflow démarre les deux services en parallèle :
- **Backend** : `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/api-server run dev`
- **Frontend** : `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/roboneo-generator run dev`

Le serveur Vite proxie automatiquement les requêtes `/api` vers `http://localhost:3000`.

## Variables d'Environnement (Secrets Replit)

| Variable | Rôle | Obligatoire |
|---|---|---|
| `CEREBRAS_API_KEY_1` à `_6` | Moteur de génération principal | ✅ Min. 1 |
| `GEMINI_API_KEY_1` à `_5` | Mode ultra-qualité | Optionnel |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | GPT agent challenger (Replit natif) | ✅ Auto |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | URL Replit OpenAI | ✅ Auto |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Claude agent critique (Replit natif) | ✅ Auto |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | URL Replit Anthropic | ✅ Auto |
| `PORT` | Port de chaque service | ✅ |
| `BASE_PATH` | Chemin de base frontend | ✅ |

Les clés OpenAI et Anthropic sont injectées automatiquement via les intégrations Replit — pas besoin de les gérer manuellement.

## Brief Global de Marque — Champs Complets

Le formulaire couvre 7 sections, tous les champs sont persistés dans `localStorage` :

| Section | Champs |
|---|---|
| **Identité** | brand_name, market, sector, tone, values, colors (+ devise auto) |
| **Produit** | product_name, target_audience, product_description, product_features, benefits, product_colors, product_materials, unique_feature |
| **Commerce** | price, old_price, discount, promo_code, free_shipping, stock, shipping_info, checkout_url |
| **SAV** | warranty, delivery_days, express_delivery_days, express_price, return_days, sav_response_time, support_email, contact_channel, best_seller_1, best_seller_2, sav_message |
| **Visuel** | primary_color, secondary_color, accent_color, visual_style, heading_font, body_font |
| **Performance** | ca_target, basket_target, conv_target, roas_target, target_cpa, margin_percent |
| **Stratégie** | target_demographic, competitors, forbidden_keywords, usp |

## Modules

| # | Module | Sections générées |
|---|---|---|
| 01 | **Brand Identity** | Logo, Palette, Typographie, Charte graphique |
| 02 | **Visual Content** | Photo produit, Lifestyle, Détail, Before/After, Try-On, Carrousel |
| 03 | **Video Content** | Script TikTok/Reels, YouTube, Teaser, Voix off, Beat Sync |
| 04 | **Ad Creatives** | Meta Ads, Google Display, TikTok Ads, Carrousel Ads |
| 05 | **Brand Sound** | Jingle, Musiques 15/30/60s, Effets sonores, Playlist |
| 06 | **Copy & Content** | Fiche produit, Captions, Hashtags, Emails (3), Reviews (10) |
| 07 | **Launch Ready** | Landing page HTML, Guide d'utilisation, Calendrier 30 jours |
| 08 | **Chatbot Script** | FAQ (20 Q/R), Objections (8 scripts), Commentaires négatifs (5) |
| 09 | **Upsell & Cross-sell Kit** | Cross-sell (3), Bundles (3), Copy upsell, Emails post-achat (3) |
| 10 | **Performance Tracker** | Dashboard Google Sheets, KPIs par plateforme, Guide Scaling/Stop |

## Architecture SSE (Streaming)

Chaque route backend suit ce pattern :
1. `section_start` → début d'une section (`key`, `label`, `agent`)
2. `chunk` → fragments de texte streamés par Cerebras/GPT/Claude
3. `section_done` → JSON parsé complet de la section (`data`, `rawContent`)
4. `done` → fin + métriques de performance (total_ms, tokens/s, scores GPT/Claude)

Le frontend consomme le stream et met à jour l'UI section par section en temps réel.

## Routes API

Toutes montées sous `/api` :

| Route | Usage |
|---|---|
| `GET /api/healthz` | Santé du serveur |
| `GET /api/healthz/cerebras` | Diagnostic complet pool Cerebras (toutes les clés) |
| `POST /api/openai/enhance-prompts` | Module 01 — Brand Identity |
| `POST /api/openai/enhance-prompts-visual` | Module 02 — Visual Content |
| `POST /api/openai/enhance-prompts-video` | Module 03 — Video Content |
| `POST /api/openai/enhance-prompts-ads` | Module 04 — Ad Creatives |
| `POST /api/openai/enhance-prompts-sound` | Module 05 — Brand Sound |
| `POST /api/openai/enhance-prompts-copy` | Module 06 — Copy & Content |
| `POST /api/openai/enhance-prompts-launch` | Module 07 — Launch Ready |
| `POST /api/openai/enhance-prompts-chatbot` | Module 08 — Chatbot Script |
| `POST /api/openai/enhance-prompts-upsell` | Module 09 — Upsell Kit |
| `POST /api/openai/enhance-prompts-performance` | Module 10 — Performance Tracker |
| `POST /api/openai/review-prompt` | Review GPT+Claude d'un prompt existant |
| `POST /api/scrape-gmb` | Import automatique depuis Google My Business |

## Ajouter un Nouveau Module

1. **Backend** — Créer `Artefact/api-server/src/routes/openai/enhance-prompts-[nom].ts`
   - Pattern SSE : `section_start` → `chunk` → `section_done` → `done`
   - Utiliser `cerebrasStream()` pour la génération, `reviewPromptQuality()` pour la review

2. **Routes** — Ajouter import + `router.use(...)` dans `Artefact/api-server/src/routes/index.ts`

3. **Frontend** — Créer `Artefact/roboneo-generator/src/pages/module-0X.tsx`
   - Formulaire React Hook Form + Zod
   - Consommation SSE avec `response.body.getReader()`

4. **Home** — Mettre à jour `Artefact/roboneo-generator/src/pages/home.tsx`
   - Ajouter l'entrée dans `MODULES[]` avec `available: true`

5. **Redémarrer** le workflow pour rebuilder le backend.

## Version

**v2.0.0** — 10/10 modules — Pipeline Cerebras + GPT-5.2 + Claude Sonnet + Gemini 2.5
