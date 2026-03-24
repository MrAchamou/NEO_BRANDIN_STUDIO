# Neo Branding Studio

## Overview

Générateur de prompts IA pour RoboNeo.com. L'utilisateur remplit un brief de marque et l'IA génère des prompts créatifs précis en temps réel via streaming SSE (Server-Sent Events), section par section. **10 modules disponibles sur 10 — suite complète.**

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 20
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: Express 5 (API server)
- **AI**: OpenAI GPT-5.2 via Replit AI Integrations — streaming SSE
- **Validation**: Zod (`zod/v4`), React Hook Form + Zod resolver
- **Build**: esbuild (ESM bundle)

## Structure

```text
workspace/
├── Artefact/
│   ├── roboneo-generator/          # Frontend React/Vite (port 5000)
│   │   └── src/pages/
│   │       ├── home.tsx            # Dashboard principal avec MODULES[]
│   │       ├── module-01.tsx       # Brand Identity
│   │       ├── module-02.tsx       # Visual Content
│   │       ├── module-03.tsx       # Video Content
│   │       ├── module-04.tsx       # Ad Creatives
│   │       ├── module-05.tsx       # Brand Sound
│   │       ├── module-06.tsx       # Copy & Content
│   │       ├── module-07.tsx       # Launch Ready
│   │       ├── module-08.tsx       # Chatbot Script
│   │       ├── module-09.tsx       # Upsell & Cross-sell Kit
│   │       └── module-10.tsx       # Performance Tracker
│   └── api-server/
│       └── src/routes/openai/
│           ├── enhance-prompts.ts              # Module 01
│           ├── enhance-prompts-visual.ts       # Module 02
│           ├── enhance-prompts-video.ts        # Module 03
│           ├── enhance-prompts-ads.ts          # Module 04
│           ├── enhance-prompts-sound.ts        # Module 05
│           ├── enhance-prompts-copy.ts         # Module 06
│           ├── enhance-prompts-launch.ts       # Module 07
│           ├── enhance-prompts-chatbot.ts      # Module 08
│           ├── enhance-prompts-upsell.ts       # Module 09
│           └── enhance-prompts-performance.ts  # Module 10
├── lib/
│   ├── integrations-openai-ai-server/  # Client OpenAI serveur
│   └── integrations-openai-ai-react/   # Client OpenAI React
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## Running the App

Le workflow démarre les deux services en parallèle :
- **Backend**: `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/api-server run dev`
- **Frontend**: `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/roboneo-generator run dev`

Le serveur Vite proxie les requêtes `/api` vers `http://localhost:3000`.

## Key Environment Variables

- `AI_INTEGRATIONS_OPENAI_BASE_URL` — URL de base de l'intégration Replit AI
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Clé API de l'intégration Replit AI
- `PORT` — Port de chaque service
- `BASE_PATH` — Chemin de base pour le frontend

## Modules

| # | Module | Couleur | Sections générées | Status |
|---|--------|---------|-------------------|--------|
| 01 | **Brand Identity** | amber | Logo, Palette, Typographie, Charte graphique | ✅ Disponible |
| 02 | **Visual Content** | violet | Photo produit, Lifestyle, Détail, Before/After, Try-On, Carrousel | ✅ Disponible |
| 03 | **Video Content** | pink | Script TikTok/Reels, YouTube, Teaser, Voix off, Beat Sync | ✅ Disponible |
| 04 | **Ad Creatives** | yellow | Meta Ads, Google Display, TikTok Ads, Carrousel Ads | ✅ Disponible |
| 05 | **Brand Sound** | green | Jingle, Musiques 15/30/60s, Effets sonores, Playlist | ✅ Disponible |
| 06 | **Copy & Content** | emerald | Fiche produit, Captions, Hashtags, Emails (3), Reviews (10) | ✅ Disponible |
| 07 | **Launch Ready** | blue | Landing page HTML, Guide d'utilisation, Calendrier 30 jours | ✅ Disponible |
| 08 | **Chatbot Script** | cyan | FAQ (20 Q/R), Objections (8 scripts), Commentaires négatifs (5) | ✅ Disponible |
| 09 | **Upsell & Cross-sell Kit** | green | Cross-sell (3), Bundles (3), Copy upsell (4 contextes), Emails post-achat (3) | ✅ Disponible |
| 10 | **Performance Tracker** | blue | Dashboard Google Sheets, KPIs par plateforme, Guide Scaling/Stop, Analyse hebdo | ✅ Disponible |

## Architecture SSE (Streaming)

Chaque route backend suit le même pattern :
1. `section_start` → indique le début d'une section avec `key`, `label`, `agent`
2. `chunk` → fragments de texte streamés par GPT-5.2
3. `section_done` → JSON parsé complet de la section (`data`, `rawContent`)
4. `done` → fin de toutes les sections

Le frontend consomme le stream et met à jour l'UI section par section en temps réel.

## API Routes

Toutes les routes sont montées sous `/api` :

| Route | Module | Paramètres clés |
|-------|--------|-----------------|
| `GET /api/health` | — | — |
| `POST /api/openai/enhance-prompts` | 01 Brand Identity | brand_name, sector, tone, values, colors |
| `POST /api/openai/enhance-prompts-visual` | 02 Visual Content | brand_name, sector, product_name, colors, style |
| `POST /api/openai/enhance-prompts-video` | 03 Video Content | brand_name, sector, product_name, tone, target |
| `POST /api/openai/enhance-prompts-ads` | 04 Ad Creatives | brand_name, sector, product_name, discount, promo_code |
| `POST /api/openai/enhance-prompts-sound` | 05 Brand Sound | brand_name, sector, tone, tempo, instruments |
| `POST /api/openai/enhance-prompts-copy` | 06 Copy & Content | brand_name, product_name, sector, tone, discount |
| `POST /api/openai/enhance-prompts-launch` | 07 Launch Ready | brand_name, product_name, price, primary_color, fonts |
| `POST /api/openai/enhance-prompts-chatbot` | 08 Chatbot Script | brand_name, product_name, sector, warranty, delivery_days |
| `POST /api/openai/enhance-prompts-upsell` | 09 Upsell Kit | brand_name, sector, product_name, product_price, margin_percent |
| `POST /api/openai/enhance-prompts-performance` | 10 Performance Tracker | brand_name, sector, ca_target, basket_target, conv_target, roas_target, target_cpa |

## Ajout d'un Nouveau Module

Pour ajouter un module :

1. **Backend** — Créer `Artefact/api-server/src/routes/openai/enhance-prompts-[nom].ts`
   - Même structure SSE : `section_start` → `chunk` → `section_done` → `done`
   - Modèle : `gpt-5.2`, `max_completion_tokens: 4096`

2. **Routes** — Ajouter import + `router.use(...)` dans `Artefact/api-server/src/routes/index.ts`

3. **Frontend** — Créer `Artefact/roboneo-generator/src/pages/module-0X.tsx`
   - Formulaire avec React Hook Form + Zod
   - Consommation SSE avec `response.body.getReader()`
   - Vues spécialisées par type de contenu

4. **Home** — Mettre à jour `Artefact/roboneo-generator/src/pages/home.tsx`
   - Importer le nouveau composant
   - Modifier l'entrée dans le tableau `MODULES[]` : `available: true`, `component: ModuleXX`
   - Incrémenter la version

5. **Redémarrer** le workflow pour rebuilder le backend.

## Version

**v2.0.0** — 10/10 modules disponibles — Complete Brand Universe
