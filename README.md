# Neo Branding Studio

> Plateforme de génération de prompts IA chirurgicaux pour l'écosystème **RoboNeo.com**

---

## Vue d'ensemble

**Neo Branding Studio** est une application web full-stack conçue pour générer, en temps réel, des prompts créatifs ultra-précis couvrant l'intégralité de l'identité d'une marque. À partir d'un brief client, un pipeline multi-modèles prend en charge la génération, l'évaluation et le raffinement automatique de chaque section — section par section, en streaming continu.

Le système repose sur une architecture **Cerebras → GPT → Claude** :
1. **Cerebras** génère le prompt initial à haute vitesse (streaming SSE)
2. **GPT-5.2** l'analyse en tant qu'agent challenger technique
3. **Claude Sonnet** l'évalue en tant qu'agent critique voix de marque
4. L'agent le plus exigeant remporte le débat — sa version raffinée est conservée

---

## Pipeline IA & Rotation de clés

### Moteur principal — Cerebras (Génération)

Le générateur principal utilise **6 clés API Cerebras** en rotation circulaire automatique pour garantir une continuité totale sans interruption liée aux cooldowns.

```
Sous-module 1 → CEREBRAS_API_KEY_1
Sous-module 2 → CEREBRAS_API_KEY_2
Sous-module 3 → CEREBRAS_API_KEY_3
Sous-module 4 → CEREBRAS_API_KEY_4
Sous-module 5 → CEREBRAS_API_KEY_5
Sous-module 6 → CEREBRAS_API_KEY_6
Sous-module 7 → CEREBRAS_API_KEY_1  ← repart en boucle
```

**Logique de résilience :**
- Si une clé répond 429 / `queue_exceeded` → la suivante prend le relais automatiquement
- Si toutes les clés sont saturées → fallback sur le modèle rapide `llama3.1-8b`
- Le serveur loggue chaque rotation : `[Cerebras] ✓ logo → clé #2/6 (next: #3)`

### Agents de revue — GPT & Claude (Qualité)

- **GPT-5.2** via intégration Replit OpenAI (`AI_INTEGRATIONS_OPENAI_API_KEY`)
- **Claude Sonnet** via intégration Replit Anthropic (`AI_INTEGRATIONS_ANTHROPIC_API_KEY`)
- Les deux évaluent le même prompt en séquence, notent sur 10 et proposent une version améliorée
- L'agent avec le **score le plus bas** (le plus critique) remporte — sa version raffinée est retenue

### Variantes Persona — Gemini (Mode Ultra-Qualité)

Utilise **5 clés API Gemini** avec le même système de rotation pour générer 3 variantes de prompt calibrées par persona.

```
Appel 1 → GEMINI_API_KEY_1
Appel 2 → GEMINI_API_KEY_2
...
Appel 6 → GEMINI_API_KEY_1  ← repart en boucle
```

---

## Modules disponibles

| # | Module | Sections | Statut |
|---|--------|:--------:|--------|
| 01 | **Brand Identity** — Logo, Palette, Typographie, Charte graphique | 4 | ✅ Disponible |
| 02 | **Visual Content** — Photos produit, Lifestyle, Détail, Before/After, Try-On, Carrousel | 6 | ✅ Disponible |
| 03 | **Video Content** — Scripts, TikTok/Reels, YouTube, Teaser animé, Miniatures, Voix Off | 6 | ✅ Disponible |
| 04 | **Ad Creatives** — Meta Ads, Google Display, TikTok Ads, Carousel, Ad Copy, Predictor | 6 | ✅ Disponible |
| 05 | **Brand Sound** — Jingle, Musiques de fond, Sound Effects, Voix Off, Beat Sync | 5 | ✅ Disponible |
| 06 | **Copy & Content** — Fiche produit, Captions, Hashtags, Emails, Avis clients | 5 | ✅ Disponible |
| 07 | **Launch Ready** — Landing page HTML, Guide, Calendrier 30 jours | 3 | ✅ Disponible |
| 08 | **Chatbot Script** — FAQ (20 Q/R), Scripts objections, Commentaires négatifs | 3 | ✅ Disponible |
| 09 | **Upsell & Cross-sell Kit** — Cross-sell, Bundles, Copy upsell, Emails post-achat | 4 | ✅ Disponible |
| 10 | **Performance Tracker** — Dashboard KPIs, Guide Scaling/Stop, Analyse hebdo | 4 | ✅ Disponible |

**Total : 10 modules — 46 sections — Brand Universe complet**

---

## Architecture du projet

```
workspace/
├── Artefact/
│   ├── roboneo-generator/              # Frontend React + Vite (port 5000)
│   │   └── src/pages/
│   │       ├── home.tsx                  # Hub de navigation — 10 modules
│   │       ├── module-01.tsx             # Brand Identity
│   │       ├── module-02.tsx             # Visual Content
│   │       ├── module-03.tsx             # Video Content
│   │       ├── module-04.tsx             # Ad Creatives
│   │       ├── module-05.tsx             # Brand Sound
│   │       ├── module-06.tsx             # Copy & Content
│   │       ├── module-07.tsx             # Launch Ready
│   │       ├── module-08.tsx             # Chatbot Script
│   │       ├── module-09.tsx             # Upsell Kit
│   │       └── module-10.tsx             # Performance Tracker
│   └── api-server/                     # Backend Express 5 (port 3000)
│       └── src/
│           ├── lib/
│           │   ├── cerebras-client.ts    # Rotateur 6 clés + retry automatique
│           │   ├── gemini-client.ts      # Rotateur 5 clés + proxy OpenAI-compatible
│           │   ├── openai-review-client.ts  # Agent GPT (Review)
│           │   ├── anthropic-client.ts   # Agent Claude (Review)
│           │   └── prompt-utils.ts       # Chain-of-Thought, Few-Shot, Review
│           ├── governance/               # Pipeline gouvernance v3.0
│           │   ├── index.ts              # Orchestrateur principal (pipeline v3)
│           │   ├── brand-lock.ts         # Verrou factuel marque
│           │   ├── compliance-agent.ts   # Règles conformité sectorielles
│           │   ├── sector-engine.ts      # Profils sectoriels config-driven
│           │   ├── voice-enforcer.ts     # Ton, emojis, exclamations
│           │   ├── wcag-validator.ts     # Accessibilité couleurs
│           │   └── sectors/              # JSON : cosmetics_eu, fashion, finance_eu, food_eu, saas
│           ├── memory/                   # v3 — Brand Memory Engine
│           │   ├── memory-store.ts       # Store central en mémoire
│           │   ├── correction-log.ts     # Journal corrections/approbations/rejections
│           │   ├── decision-history.ts   # Historique décisions stratégiques
│           │   └── memory-profile-builder.ts  # Profil mémoire dynamique
│           ├── growth/                   # v3 — Growth Decision Brain
│           │   ├── ltv-engine.ts         # Calcul LTV/CAC dynamique
│           │   ├── cohort-analysis.ts    # Analyse cohortes et rétention
│           │   ├── seasonality-model.ts  # Calendrier saisonnier par secteur
│           │   ├── creative-fatigue-detector.ts  # Détection fatigue créative
│           │   └── strategy-recommender.ts  # Recommandation scaling contextuelle
│           ├── positioning/              # v3 — Strategic Positioning Engine
│           │   ├── archetype-engine.ts   # Détection archétype Jungien (12 types)
│           │   ├── market-mapping.ts     # Cartographie 4 axes stratégiques
│           │   ├── competitor-analysis.ts  # Analyse concurrentielle
│           │   ├── differentiation-matrix.ts  # Matrice de différenciation
│           │   ├── territory-builder.ts  # Territoire narratif complet
│           │   └── positioning-lock.ts   # Verrou de positionnement
│           └── routes/
│               ├── governance.ts         # GET /api/governance/profiles, /status
│               ├── memory.ts             # POST/GET /api/memory/*
│               ├── positioning.ts        # POST/GET /api/positioning/*
│               └── openai/               # Routes génération modules 01–10
└── lib/
    ├── db/src/schema/                  # Drizzle ORM (PostgreSQL)
    ├── api-zod/                        # Validation Zod — schémas API
    ├── api-client-react/               # Hooks React générés (Orval)
    └── integrations/                   # Intégrations Replit (OpenAI, Anthropic)
```

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + Vite + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 + Framer Motion |
| Routing | Wouter |
| Formulaires | React Hook Form + Zod v4 |
| Backend | Express.js 5 (Node 20) |
| Build backend | esbuild (bundle ESM) |
| IA — Génération | Cerebras `qwen-3-235b-a22b-instruct-2507` (streaming SSE) |
| IA — Review | GPT-5.2 + Claude Sonnet (débat contradictoire) |
| IA — Persona | Gemini `gemini-2.5-pro-exp-03-25` |
| Streaming | Server-Sent Events (SSE) |
| Base de données | PostgreSQL + Drizzle ORM |
| Monorepo | pnpm workspaces (11 packages) |

---

## API Reference

Toutes les routes sont montées sous `/api` :

### Routes Génération (Modules 01–10)

| Méthode | Route | Module |
|---------|-------|--------|
| `GET` | `/api/healthz` | Healthcheck |
| `POST` | `/api/openai/enhance-prompts` | 01 — Brand Identity |
| `POST` | `/api/openai/enhance-prompts-visual` | 02 — Visual Content |
| `POST` | `/api/openai/enhance-prompts-video` | 03 — Video Content |
| `POST` | `/api/openai/enhance-prompts-ads` | 04 — Ad Creatives |
| `POST` | `/api/openai/enhance-prompts-sound` | 05 — Brand Sound |
| `POST` | `/api/openai/enhance-prompts-copy` | 06 — Copy & Content |
| `POST` | `/api/openai/enhance-prompts-launch` | 07 — Launch Ready |
| `POST` | `/api/openai/enhance-prompts-chatbot` | 08 — Chatbot Script |
| `POST` | `/api/openai/enhance-prompts-upsell` | 09 — Upsell Kit |
| `POST` | `/api/openai/enhance-prompts-performance` | 10 — Performance Tracker |
| `POST` | `/api/openai/review-prompt` | Review GPT vs Claude (on-demand) |

### Routes Gouvernance v3.0

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/governance/profiles` | Liste des profils sectoriels chargés (id, label, regulation, claim_packs…) |
| `GET` | `/api/governance/status?brand_id=` | Statut global : profil actif, mémoire, positioning lock |

### Routes Brand Memory Engine v3.0

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/memory/profile/:brand_id` | Profil mémoire dynamique d'une marque |
| `GET` | `/api/memory/stats/:brand_id` | Stats d'interactions (corrections, rejections, decisions) |
| `POST` | `/api/memory/correction` | Log une correction humaine `{brand_id, module, before, after}` |
| `POST` | `/api/memory/approval` | Log une approbation `{brand_id, module, content}` |
| `POST` | `/api/memory/rejection` | Log un rejet `{brand_id, module, content, reason}` |
| `POST` | `/api/memory/override` | Log un override de règle de gouvernance |
| `POST` | `/api/memory/decision` | Enregistre une décision stratégique |
| `DELETE` | `/api/memory/:brand_id` | Réinitialise la mémoire d'une marque |

### Routes Strategic Positioning Engine v3.0

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/positioning/analyze` | Analyse complète : archétype + carte marché + territoire + lock |
| `POST` | `/api/positioning/archetype` | Détecte uniquement l'archétype dominant |
| `GET` | `/api/positioning/lock/:brand_id` | Récupère le positioning lock actif |
| `DELETE` | `/api/positioning/lock/:brand_id` | Réinitialise le positioning lock |

### Format du flux SSE

```
section_start       → { key, label, agent }
chunk               → { key, content }         ← texte partiel en temps réel
review_start        → { key, agent }            ← début de l'évaluation
review_agent_done   → { key, agent, score }     ← score de l'agent
section_done        → { key, fullContent, review, metrics }
done                → { performance }           ← métriques globales
```

---

## Variables d'environnement

| Variable | Source | Rôle |
|----------|--------|------|
| `CEREBRAS_API_KEY_1` → `_6` | [cloud.cerebras.ai](https://cloud.cerebras.ai) | Génération principale (rotation 6 clés) |
| `GEMINI_API_KEY_1` → `_5` | [aistudio.google.com](https://aistudio.google.com/apikey) | Variantes persona (rotation 5 clés) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit AI Integration | Agent Review GPT-5.2 |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Replit AI Integration | Proxy OpenAI (auto-configuré) |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Replit AI Integration | Agent Review Claude Sonnet |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Replit AI Integration | Proxy Anthropic (auto-configuré) |
| `DATABASE_URL` | Replit PostgreSQL | Base de données (conversations, messages) |

---

## Démarrage

```bash
# Installer les dépendances (monorepo pnpm)
pnpm install

# Démarrer le backend (port 3000) et le frontend (port 5000) en parallèle
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/api-server run dev &
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/roboneo-generator run dev
```

---

## Intelligence embarquée

### Auto-détection par secteur

| Paramètre | Logique d'inférence |
|-----------|---------------------|
| Style logo | Bijou → luxe · Streetwear → street · Tech → tech · Fitness → dynamique |
| Angles produit | Bijou: face/profil/3-4/macro/dessus · Sac: face/profil/dessus/intérieur/fermeture |
| Style carrousel | Bijou/Luxe → luxe · Cosmétique → problème-solution · Mode → storytelling |
| Scénario Before/After | Cosmétique → skin · Fitness → body · Bijou → object |
| Jingle sonore | Bijou → harpe/cordes/piano · Tech → électronique/synthé · Fitness → EDM |
| Voix ElevenLabs | Luxe/Bijou → Charlotte · Cosmétique/Mode → Josephine · Fitness/Tech → Thomas |

### Règles qualité embarquées

- **Anti-hallucination** : aucune date, statistique ou certification inventée si absente du brief
- **Anti-biais** : les sujets humains correspondent exactement à la cible déclarée (ethnie, style culturel)
- **Typographie** : toutes les couleurs en HEX pur, jamais d'opacité CSS — ratios WCAG 2.1 AA calculés
- **Français** : contrôles de genre, faux-sens bloqués (`"J'use"`, `"mon peau"`, `"m'aveugle"`)
- **Unités** : température en Kelvin toujours avec K majuscule (5600K, jamais 5600k)

### Système de revue GPT vs Claude

```
[Cerebras génère] → prompt initial
        ↓
[GPT-5.2] score /10 + version améliorée   ← Agent Challenger (technique)
[Claude Sonnet] score /10 + version améliorée  ← Agent Critique (voix de marque)
        ↓
Score le plus bas = agent le plus exigeant = vainqueur
        ↓
Version raffinée du vainqueur → affichage final
```

---

## Export

Chaque module permet d'exporter les prompts générés en :
- **JSON** — structure complète avec métadonnées, agents, scores, métriques de performance
- **TXT** — format lisible, prêt à coller dans RoboNeo.com

---

## Version

**v3.0.0** — Avril 2026

### v3.0.0 — AI BRAND OS — Adaptive Strategic Intelligence

- **Brand Memory Engine** : le système apprend des corrections humaines, construit un profil mémoire dynamique (tone, urgence, complexité créative, risque), et l'injecte dans les générations futures via `brand_id`
- **Growth Decision Brain** : calcul LTV/CAC dynamique, analyse de cohortes, modèle de saisonnalité par secteur (13 événements par secteur), détection de fatigue créative (CTR/ROAS/fréquence), recommandation de scaling contextuelle multi-facteur
- **Strategic Positioning Engine** : détection automatique des 12 archétypes Jungiens, cartographie marché sur 4 axes, matrice de différenciation vs concurrents archétypes par secteur, territoire narratif complet (tension/promesse/hook/pilier/ancre), positioning lock multi-modules
- **Route `/api/governance/profiles`** : exposition dynamique des profils sectoriels pour le frontend (id, label, regulation, claim_packs, tone)
- **Pipeline v3 complet** : `brandLock → sectorEngine → positioningEngine → memoryInjection → complianceAgent → toneEnforcer → claimFilter → pricingValidator → wcagValidator → growthBrainEvaluation → finalValidation`
- Rétrocompatibilité totale : les layers v3 s'activent uniquement si `brand_id` est fourni

### v2.2.0 — Gouvernance Sector-Aware (base)

- 10/10 modules disponibles — Brand Universe complet (46 sections)
- Pipeline IA tri-modèles opérationnel : Cerebras + GPT + Claude + Gemini
- Rotation automatique 6 clés Cerebras + 5 clés Gemini avec retry et fallback
- Intégrations Replit OpenAI & Anthropic configurées (clés auto-injectées)
- Streaming SSE bout en bout avec métriques temps réel (tokens/s, scores, vainqueur)
