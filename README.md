# Neo Branding Studio

> Générateur de prompts IA chirurgicaux pour l'écosystème RoboNeo.com

---

## Présentation

**Neo Branding Studio** est une application web React qui génère des prompts créatifs ultra-précis, prêts à coller directement dans [RoboNeo.com](https://roboneo.com) pour créer tous les assets d'une marque.

L'utilisateur remplit un brief client, et l'IA (GPT-5.2 via Replit AI Integrations) génère les prompts en **streaming temps réel**, section par section.

---

## Modules disponibles

| # | Module | Prompts | Statut |
|---|--------|---------|--------|
| 01 | **Brand Identity** — Logo, Palette, Typographie, Charte graphique | 4 | ✅ Disponible |
| 02 | **Visual Content** — Photos produit, Lifestyle, Détail, Before/After, Try-On, Carrousel | 19 | ✅ Disponible |
| 03 | **Video Content** — Scripts 15s/30s/60s, TikTok, YouTube, Teaser, Miniatures, Voix off | 14 | ✅ Disponible |
| 04 | **Ad Creatives** — Meta Ads, Google Display (6 formats), TikTok Ads, Carousel, Ad Copy, Performance Predictor | 18 | ✅ Disponible |
| 05 | **Brand Sound** — Jingle, Musiques de fond 15s/30s/60s, Sound Effects, Voix Off ElevenLabs, Beat Sync | 16 | ✅ Disponible |
| 06 | Analytics Reports — Rapports visuels, dashboards | — | 🔒 Bientôt |
| 07 | Email Campaigns — Newsletters, séquences email | — | 🔒 Bientôt |
| 08 | Social Media — Posts, stories, stratégie contenu | — | 🔒 Bientôt |
| 09 | Web & Landing — Pages de vente, hero sections | — | 🔒 Bientôt |
| 10 | Influencer Kit — Media kit, pitch decks créateurs | — | 🔒 Bientôt |

---

## Stack technique

| Couche | Techno |
|--------|--------|
| Frontend | React + Vite + TypeScript |
| UI | shadcn/ui + Tailwind CSS + Framer Motion |
| Backend | Express.js (Node) |
| IA | GPT-5.2 via Replit AI Integrations |
| Streaming | Server-Sent Events (SSE) |
| Monorepo | pnpm workspaces |
| Base de données | PostgreSQL (Drizzle ORM) |

---

## Architecture

```
workspace/
├── Artefact/
│   ├── roboneo-generator/          # App React frontend (Vite, port 5000)
│   │   └── src/
│   │       └── pages/
│   │           ├── home.tsx              # Hub navigation (10 modules)
│   │           ├── module-01.tsx         # Brand Identity
│   │           ├── module-02.tsx         # Visual Content
│   │           ├── module-03.tsx         # Video Content
│   │           ├── module-04.tsx         # Ad Creatives
│   │           └── module-05.tsx         # Brand Sound
│   └── api-server/                 # Backend Express (port 3000)
│       └── src/routes/openai/
│           ├── enhance-prompts.ts          # Route Module 01
│           ├── enhance-prompts-visual.ts   # Route Module 02
│           ├── enhance-prompts-video.ts    # Route Module 03
│           ├── enhance-prompts-ads.ts      # Route Module 04
│           └── enhance-prompts-sound.ts    # Route Module 05
└── lib/
    └── db/src/schema/              # Schéma Drizzle (conversations, messages)
```

---

## Fonctionnement des modules

### Module 01 — Brand Identity

**Brief requis :** nom de marque, secteur, ton, valeurs, style logo (optionnel)

**Sections générées :**
- `MOD-01.1` Logo Generator — style auto-détecté selon le secteur
- `MOD-01.2` Palette Generator — couleurs primaire/secondaire/accent + WCAG
- `MOD-01.3` Typography System — fontes Google Fonts + CSS
- `MOD-01.4` Brand Guidelines — 10 règles avec Do's/Don'ts

---

### Module 02 — Visual Content

**Brief requis :** marque, secteur, type produit, nom produit, couleurs, matériaux, audience cible

**Sections générées (19 prompts) :**
- `MOD-02.1` Photos Produit — 5 angles auto selon le type produit
- `MOD-02.2` Photos Lifestyle — 3 formats (feed 1:1, Pinterest 4:5, Story 9:16)
- `MOD-02.3` Détail & Texture — 2 matériaux en macro
- `MOD-02.4` Before/After — scénario auto (skin/body/hair/object)
- `MOD-02.5` Virtual Try-On — 2 modèles adaptés à l'audience
- `MOD-02.6` Carrousel — 5 slides, style auto (luxe/storytelling/éducation/problème-solution)

---

### Module 03 — Video Content

**Brief requis :** marque, secteur, produit, valeurs, audience, couleurs, URL e-commerce

**Sections générées (14 prompts) :**
- `MOD-03.1` Scripts vidéo — 3 durées (15s, 30s, 60s) avec shot-list détaillée
- `MOD-03.2` Short Videos — TikTok/Reels avec hook 0-3s, arc narratif
- `MOD-03.3` Long Video — YouTube avec structure complète (teaser, développement, CTA)
- `MOD-03.4` Teaser Animé — motion design avec keyframes et transitions
- `MOD-03.5` Miniatures — 3 variantes A/B (photo, graphique, curiosité)
- `MOD-03.6` Voix Off — direction artistique + ElevenLabs + script prêt

---

### Module 04 — Ad Creatives

**Brief requis :** marque, secteur, produit, bénéfices, audience, couleurs, code promo, remise, stock

**Sections générées (18 prompts) :**
- `MOD-04.1` Meta Ads — 4 formats (Feed Image 1080x1080, Feed Vidéo, Stories 9:16, Reels 9:16)
- `MOD-04.2` Google Display — 6 formats (Leaderboard 728x90, Medium Rectangle 300x250, Large Rectangle 336x280, Mobile Banner 320x100, Half Page 300x600, Billboard 970x250)
- `MOD-04.3` TikTok Ads — shot-list 0-30s avec hook, hashtags, direction musicale
- `MOD-04.4` Carousel Ads — 5 slides narrative Hook→Problème→Solution→Preuve→CTA
- `MOD-04.5` Ad Copy — 4 variantes par plateforme (Meta Feed, Meta Stories, Google Display, TikTok)
- `MOD-04.6` Performance Predictor — CTR/CPC/ROAS prédictifs, plan A/B testing, quick wins

---

### Module 05 — Brand Sound

**Brief requis :** marque, secteur, ton, valeurs, audience cible. Options : nettoyage UGC, séparation vocale.

**Sections générées (16 prompts) :**
- `MOD-05.1` Jingle — brief créatif + prompt technique Suno/Udio + 3 variations (10s/3s/1s notification)
- `MOD-05.2` Musiques de fond — 3 durées (15s TikTok, 30s Meta Ads, 60s YouTube) avec points de sync montage
- `MOD-05.3` Sound Effects — 6 effets sur mesure (clic UI, notification, succès, whoosh, sweep, impact logo)
- `MOD-05.4` Voix Off — recommandation ElevenLabs (voix principale + alternative) + script 30s prêt + directions artistiques
- `MOD-05.5` Beat Sync & Audio Processing — synchronisation vidéo/musique + nettoyage UGC + séparation stems + mastering multi-plateforme

---

## Auto-détection intelligente

| Paramètre | Logique |
|-----------|---------|
| Style logo | Bijou → luxe, Streetwear → street, Tech → tech, Fitness → dynamique... |
| Angles produit | Bijou: face/profil/3-4/macro/dessus — Sac: face/profil/dessus/intérieur/fermeture... |
| Style carrousel | Bijou/Luxe → luxe, Cosmétique → problème-solution, Mode → storytelling, Tech → éducation |
| Scénario Before/After | Cosmétique/Skincare → skin, Fitness → body, Bijou → object |
| Profils Try-On | Auto selon l'audience cible (femmes 18-25, 25-45, 35-50, hommes 25-40, mixte) |
| Style sonore jingle | Bijou → orchestral harpe/cordes/piano, Tech → électronique synthé, Fitness → EDM, Streetwear → hip-hop |
| Voix ElevenLabs | Bijou/Luxe → Bella (élégante), Cosmétique/Mode → Rachel (chaleureuse), Tech → Adam (professionnel), Fitness → Antoni (dynamique) |

---

## Streaming temps réel

Les prompts sont générés via SSE (Server-Sent Events). Les événements du flux :

```
section_start → key, label, agent
chunk         → key, content (texte partiel)
section_done  → key, label, agent, data (JSON parsé), rawContent
section_error → key, error
done          → fin du flux
```

---

## Export

Chaque module permet d'exporter les prompts générés en :
- **JSON** — structure complète avec métadonnées, agents, paramètres
- **TXT** — format lisible prêt à copier dans RoboNeo

---

## Démarrage local

```bash
pnpm install
```

```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/api-server run dev
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/roboneo-generator run dev
```

Variables d'environnement requises (Replit AI Integrations) :
- `AI_INTEGRATIONS_OPENAI_BASE_URL`
- `AI_INTEGRATIONS_OPENAI_API_KEY`
- `DATABASE_URL`
