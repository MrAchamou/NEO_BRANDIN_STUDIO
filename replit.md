# AI BRAND OS — v3.x

## Vue d'ensemble

**AI BRAND OS** — l'infrastructure stratégique des agences de marque nouvelle génération. Brand Operating System qui structure, gouverne, industrialise et scale la création de marque sur 10 modules end-to-end (Identity, Visual, Video, Ads, Sound, Copy, Launch, Chatbot, Upsell, Performance).

Le moteur historique multi-modèles (génération streaming SSE + agents critiques) est conservé sous forme de pipeline. La v3.x ajoute trois piliers agency-first par-dessus :

1. **Dual AI Engine** — `Replit Managed` par défaut (zéro config) ou `Professional OpenRouter (BYOK)` pour les agences qui apportent leur clé. Clés OpenRouter en `sessionStorage` uniquement, transmises via headers `X-AI-Mode` / `X-AI-Model` / `X-OpenRouter-Key`. Le serveur ne stocke jamais les clés.
2. **i18n complète (6 langues)** — UI et sorties IA en `fr` (défaut) / `en` / `es` / `de` / `it` / `pt`, avec **séparation langue UI vs langue de sortie**. Fallback EN automatique. Persistence `localStorage.aibrandos.ui_lang` + `localStorage.aibrandos.output_lang`.
3. **Gouvernance sectorielle** (héritée v2.x) — Profils JSON (cosmetics EU, fashion, finance EU, food EU, saas) + WCAG AA validator.

### Architecture i18n
- Frontend : `src/i18n/{index.tsx, types.ts, locales/{en,fr,es,de,it,pt}.json}` + Provider + `useT()` hook + `LanguageSelector` monté dans le header.
- Backend : `src/i18n/messages.ts` avec `resolveLang(req)` (lit `X-Output-Lang`/`X-UI-Lang`), `getMessage(lang, key)` (catalog flat key/value avec fallback EN), `languageInstruction(lang)` (bloc "Respond in <lang>" injecté dans les system prompts AI).
- Headers automatiques : `lib/ai-engine.ts` → `getEngineHeaders()` lit `localStorage` et joint `X-Output-Lang` + `X-UI-Lang` à toute requête fetch (10 modules + brief export).
- Brief export : `growth/brief-export.ts` → `renderBriefHtml(brief, { lang })` traduit les 10 sections (Vue d'ensemble, KPIs, Profitabilité, Scaling, Risques, Créatif, Rétention, Action) via le catalog.

### État de couverture (snapshot v3.x)
- Migré : header, hero, sidebar modules, AI engine config/badge, governance badge, brief summary banner, **brand brief panel intégral (en-tête + 8 sections + ~30 listes déroulantes + bloc GMB import + briefs sauvegardés, ~95 clés `brief_panel.*`)**, brief export (6 langues), export cabinet privé HTML par module + global, tous les prompts AI (9 routes).
- Partiel : module-01 (formulaire à finaliser comme témoin reproductible).
- Follow-up : modules 02-10 (pattern établi, ~10000 LOC à migrer).

**Préférence utilisateur : toujours répondre en français.**

## Couche Sector Intelligence v2.1.0 — Adaptation par secteur × région

Au-dessus du Trust Engine, une seconde couche **purement config-driven** adapte le comportement de l'IA selon le secteur et la région. Aucun secteur n'est codé en dur — ajouter un fichier JSON suffit pour activer un nouveau marché.

### Structure
```
Artefact/api-server/src/
  config/sectors/
    cosmetics_eu.json   ← EU 1223/2009 + 655/2013 (claims physio interdits)
    fashion.json        ← générique mode (urgence ok, claims esthétiques)
    finance_eu.json     ← MiFID + AMF (zéro garantie de rendement, WCAG AA)
    food_eu.json        ← EFSA 1924/2006 (claims santé alimentaires bloqués)
    saas.json           ← B2B Tech (uptime / sécurité absolue interdits)
  governance/
    sector-engine.ts    ← loadSectorProfile(sector, region) avec fallback en cascade
    wcag-validator.ts   ← contraste WCAG AA + suggestion d'ajustement automatique
```

### Schéma `SectorProfile`
```jsonc
{
  "id": "cosmetics_eu",
  "sector": "cosmetics",
  "region": "eu",
  "label": "Cosmétiques (Union Européenne)",
  "regulation": "Regulation (EC) 1223/2009 + Commission Regulation (EU) 655/2013",
  "medical_claims_allowed": false,
  "financial_promises_allowed": false,
  "health_claims_allowed": false,
  "urgency_policy": { "allowed": false, "requires_real_inventory": true },
  "forbidden_words": ["anti-aging", "miracle", "guérit", …],
  "tone_constraints": {
    "aggressiveness_level": "low",   // low | medium | high
    "emojis_allowed": false,
    "exclamation_limit": 0
  },
  "requires_wcag_validation": false,
  "requires_price_lock": true,
  "requires_claim_validation": true,
  "claim_packs": ["cosmetic_eu_physiological", "medical_vocab",
                  "fake_certifications", "fake_stats", …],
  "mandatory_disclaimers": ["Effets cosmétiques : « aide à », …"]
}
```

### Cascade de résolution
`loadSectorProfile(sector, region)` essaie dans l'ordre :
1. `{sector}_{region}` (ex. `cosmetics_eu`)
2. `{sector}` (ex. `fashion`)
3. `{sector}_global` (ex. `saas_global`)
4. **DEFAULT_PROFILE** (générique, permissif côté ton mais protections universelles activées)

Le matching est insensible à la casse et passe par des **alias** (`cosmétique`, `beauté`, `skincare` → `cosmetics` ; `france`, `ue`, `europe` → `eu`).

### Claim Packs activés par profil
Chaque profil liste les `claim_packs` qui pilotent dynamiquement le `compliance-agent`. Les packs disponibles :

| Pack | Déclencheurs | Exemples |
|---|---|---|
| `cosmetic_eu_physiological` | cosmetics_eu | "anti-aging", "reduces wrinkles", "boosts collagen" |
| `medical_vocab` | !medical_claims_allowed | "cures", "heals", "doctor approved" |
| `health_claims` | !health_claims_allowed | "boosts immunity", "prevents disease" |
| `food_eu_efsa` | food_eu | "detox", "burns fat", "lose 10kg" |
| `financial_guarantees` | !financial_promises_allowed | "guaranteed returns", "risk-free", "double your money" |
| `fake_certifications` | requires_claim_validation | ECOCERT/COSMOS/FDA quand non déclarés dans le lock |
| `fake_stats` | universel | "92% of women", "clinically proven" |
| `hyperbolic` | universel | "miracle", "magic" |
| `temporal_guarantees` | finance_eu, food_eu, cosmetics_eu | "in 7 days", "in 24 hours" |
| `urgency_dark_patterns` | !urgency_policy.allowed | "only 3 left", "X people viewing" |

Les flags du profil **forcent automatiquement** l'activation du pack correspondant (un JSON peut omettre un pack — il sera quand même injecté si le flag l'exige).

### Voice — intersection sector × growth_mode
Le `BrandLockVoice` final est l'**intersection la plus stricte** des deux couches :
- **forbidden_words** : union (sector + growth_mode + brief custom)
- **urgency_allowed** : `false` si l'un des deux interdit
- **emojis_allowed** : `false` si l'un des deux interdit
- **max_exclamation_marks** : `min(growth_mode, sector.exclamation_limit)`
- **aggressiveness_level** : imposé par le sector profile

Concrètement, un **finance_eu + aggressive_dtc** finit aussi strict que **finance_eu + premium_brand** (le sector gagne).

### WCAG validator
Activé quand `requires_wcag_validation: true` (finance_eu, saas) ou explicitement par le caller. Vérifie chaque couleur de marque (primary / secondary / accent) contre le fond, calcule le ratio de contraste WCAG 2.1, signale les paires < 4.5:1 et **suggère automatiquement** une teinte assombrie ou éclaircie atteignant le seuil.

### Pipeline complet (v2.1)
```
draft (LLM)
  → buildBrandLock() ← intègre sector_profile snapshot
  → applyGovernance()
       ├── runComplianceAgent     (claim packs activés par le profil)
       ├── runVoiceEnforcer       (voice = intersection sector × growth_mode)
       ├── price-lock validator   (si requires_price_lock)
       ├── runWcagValidator       (si requires_wcag_validation)
       └── disclaimers check      (mandatory_disclaimers)
  → SSE event "governance" enrichi { sector_profile_id, sector_profile_matched, … }
```

### Extensibilité
Ajouter un nouveau marché = **2 étapes** :
1. Créer `Artefact/api-server/src/config/sectors/{sector}_{region}.json`
2. L'importer dans `sector-engine.ts` (ligne `import xxx from "../config/sectors/xxx.json"` + entrée dans `PROFILES`)

Aucune autre modification du moteur. Aucun template dupliqué. Tous les comportements (claims, ton, urgence, WCAG, disclaimers) sont déduits du JSON.

## Couche Gouvernance v2.0.0 — Trust Engine

Pipeline de garde-fous appliqué par chaque module avant émission du résultat. Voir `Artefact/api-server/src/governance/`.

```
Brand Brief (Frontend)
   │  → governanceFields(brief) injecté dans chaque payload SSE
   ▼
extractBriefInputFromBody(req.body)
   │
   ▼
buildBrandLock()  → faits verrouillés (nom, prix, devise, packaging, origine,
   │                certifications, claims autorisés / interdits, voice rules)
   ▼
brandLockHeader() → préfixé en tête de TOUS les system prompts
   │
   ▼
[Génération Cerebras + Optimizer + Audit]
   │
   ▼
runGovernancePass(content, { lock, sectionKey })
   │     ├── brand-lock         : vérifie noms, prix, devise (auto-patch des coquilles)
   │     ├── compliance-agent   : claims interdits cosmétique UE, anti-dark-patterns
   │     ├── voice-enforcer     : tonalité, mots interdits, emojis selon growth_mode
   │     ├── profit-engine      : LTV / CAC / break-even / CPA dynamique (module 10)
   │     └── pricing-validator  : checkBundlePrice() vérifie les calculs de bundles (module 09)
   ▼
SSE event "governance"  +  section_done payload enrichi
{
  ok, blocked, passes[], findings[], patches_applied[], notes[]
}
```

### Growth Modes (`growth-modes.ts`)
- **premium_brand** : zéro urgence, claims sobres, narratif maison, pas d'emojis
- **balanced_growth** *(défaut)* : urgence raisonnée, claims mesurés
- **aggressive_dtc** : promos visibles, urgence forte (mais sans dark patterns)

### Modules câblés
Tous (01 → 10) appellent `buildBrandLock` + `brandLockHeader` + `runGovernancePass`.
- **07 (Launch)** : branche entre landing luxe / balanced / DTC selon `growth_mode`
- **09 (Upsell)** : injecte un Pricing Engine et valide `bundle_price` via `checkBundlePrice`
- **10 (Performance)** : injecte les valeurs verrouillées du `computeProfit` (LTV, payback, CPA dynamique) en interdisant à l'IA de recalculer

### Frontend
- `BrandBrief` étendu : `growth_mode`, `currency`, `packaging`, `origin`, `certifications`, `claims_allowed`, `claims_forbidden`, `voice_forbidden_words`, `urgency_allowed`, `emojis_allowed`, `repeat_purchase_rate`, `avg_orders_per_year`, `fixed_costs_monthly`
- Nouvelle section **Gouvernance** dans `brand-brief-panel.tsx` (onglet cyan)
- Helper `governanceFields(brief)` étalé dans chaque payload des modules
- Composant `governance-badge.tsx` prêt à afficher findings/patches dans tout module

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
| `AI_INTEGRATIONS_OPENAI_API_KEY` | GPT Optimizer (Replit natif) | ✅ Auto |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | URL Replit OpenAI | ✅ Auto |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Claude Final Auditor (Replit natif) | ✅ Auto |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | URL Replit Anthropic | ✅ Auto |
| `PORT` | Port de chaque service | ✅ |
| `BASE_PATH` | Chemin de base frontend | ✅ |

Les clés OpenAI et Anthropic sont injectées automatiquement via les intégrations Replit — pas besoin de les gérer manuellement.

État vérifié le 19/04/2026 : aucune clé `CEREBRAS_API_KEY_*` ni `GEMINI_API_KEY_*` n'est actuellement configurée dans l'environnement Replit. Les diagnostics `/api/healthz/cerebras` et `/api/healthz/gemini` retournent donc `missing_keys` tant qu'au moins une clé Cerebras n'est pas ajoutée.

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
| `GET /api/healthz/gemini` | Diagnostic complet pool Gemini (mode ultra-qualité) |
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
