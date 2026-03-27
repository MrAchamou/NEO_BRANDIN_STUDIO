import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { buildSystemPrompt, buildNegativePrompt } from "../../lib/prompt-utils";

const router: IRouter = Router();

// ─── Mappings auto-détection ─────────────────────────────────────────────────

const STYLE_MAP: Record<string, string> = {
  bijou: "luxueux, élégant, raffiné, intemporel",
  luxe: "premium, exclusif, sophistiqué",
  maroquinerie: "artisanal, luxueux, précis",
  montres: "mécanique, précis, élégant, masculin",
  cosmétique: "frais, lumineux, naturel, doux",
  skincare: "apaisant, naturel, scientifique",
  tech: "moderne, dynamique, futuriste, innovant",
  gadgets: "pratique, malin, fun, innovant",
  fitness: "énergique, motivant, dynamique, puissant",
  sport: "intense, performance, victoire",
  mode: "tendance, élégant, moderne, confident",
  streetwear: "urban, cool, authentique, bold",
  décoration: "cosy, harmonieux, inspirant",
};

const GOOGLE_DIMENSIONS: Record<string, string> = {
  leaderboard: "728x90",
  medium_rectangle: "300x250",
  large_rectangle: "336x280",
  mobile_banner: "320x100",
  half_page: "300x600",
  billboard: "970x250",
};

function parseJsonSafe(text: string): Record<string, unknown> | null {
  try {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function sendEvent(res: any, data: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ─── Route POST ─────────────────────────────────────────────────────────────

router.post("/openai/enhance-prompts-ads", async (req, res) => {
  const {
    brand_name,
    sector,
    product_name,
    product_description = "",
    benefits = [],
    target_audience = "mixte",
    colors = [],
    promo_code = "",
    discount = 20,
    duration_days = "7",
    free_shipping = 100,
    stock = 50,
    problem = "",
  } = req.body as {
    brand_name: string;
    sector: string;
    product_name: string;
    product_description?: string;
    benefits?: string[];
    target_audience?: string;
    colors?: string[];
    promo_code?: string;
    discount?: number;
    duration_days?: string;
    free_shipping?: number;
    stock?: number;
    problem?: string;
  };

  if (!brand_name || !sector || !product_name) {
    res.status(400).json({ error: "Champs requis manquants" });
    return;
  }

  const style = STYLE_MAP[sector] ?? "moderne, professionnel";
  const promoCode = promo_code || brand_name.slice(0, 4).toUpperCase() + "20";
  const benefit1 = benefits[0] ?? "qualité supérieure";
  const benefit2 = benefits[1] ?? "expérience unique";
  const colorStr = colors.length > 0 ? colors.join(", ") : "couleurs de la marque";
  const problemStr = problem || `${sector} qui ne répondent pas aux attentes`;

  const contextBlock = `Marque: ${brand_name} | Secteur: ${sector} | Produit: ${product_name}
Description: ${product_description || "produit premium de qualité"}
Bénéfices: ${benefits.join(", ") || benefit1}
Cible: ${target_audience} | Style visuel: ${style}
Couleurs: ${colorStr} | Code promo: ${promoCode} | Remise: ${discount}% | Livraison offerte dès ${free_shipping}€ | Stock: ${stock} unités`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const systemPrompt = `Tu es un expert senior en publicité digitale et création de prompts pour RoboNeo.com.
Tu génères des prompts de création publicitaire ultra-précis (Meta Ads, Google Display, TikTok, Carousel) et des copies publicitaires prêtes à l'emploi.
Tu retournes TOUJOURS du JSON valide uniquement, sans markdown, sans texte avant ou après.
Tous les textes sont en français, percutants, adaptés au secteur ${sector} et au style ${style}.`;

  const SECTIONS = [
    {
      key: "meta_ads",
      label: "Meta Ads — Facebook & Instagram",
      agent: "AI Poster Agent / Creative Ad Video Agent",
      buildPrompt: () => `${contextBlock}

Génère 4 prompts de création publicitaire Meta Ads pour ${product_name} (${brand_name}).

Pour CHAQUE format, fournis un prompt de création ultra-détaillé:

FORMAT "feed_image" — Image carrée 1080x1080:
• Composition: disposition du produit, arrière-plan, éléments graphiques
• Éclairage: type et direction (studio, naturel, golden hour...)
• Texte overlay: contenu exact, typographie, couleur, position (max 20% surface)
• Logo: position, taille
• Style visuel: ${style}
• Ambiance et couleurs: ${colorStr}
• CTA visuel: "Acheter maintenant"

FORMAT "feed_video" — Vidéo carrée 1080x1080, 15-30s:
• Shot-list: 3-4 plans détaillés (angle, mouvement, durée)
• Transitions: type et durée
• Texte overlay animé: contenu, timing
• Son: ambiance musicale
• CTA final: texte + durée d'affichage

FORMAT "stories" — Vertical 1080x1920, 15s max:
• Zone de sécurité respectée (marges haut/bas 15%)
• Composition plein écran: produit, fond, texte
• Animation suggérée
• Swipe up CTA: design et position

FORMAT "reels" — Vertical 1080x1920, 15-30s:
• Hook 0-3s: accroche visuelle immédiate
• Développement 3-20s: démonstration produit
• CTA final: texte + effet

Retourne UNIQUEMENT ce JSON:
{
  "feed_image": "prompt création complet détaillé",
  "feed_video": "prompt réalisation vidéo complet",
  "stories": "prompt création stories complet",
  "reels": "prompt réalisation reels complet"
}`,
    },
    {
      key: "google_display",
      label: "Google Display — 6 Formats",
      agent: "AI Poster Agent / Brand Design Agent",
      buildPrompt: () => `${contextBlock}

Génère 6 prompts de création pour bannières Google Display pour ${product_name} (${brand_name}).

Pour CHAQUE format, décris précisément la création:

FORMAT "leaderboard" — 728x90px:
• Horizontal très large, très peu de hauteur
• Éléments: logo gauche, produit centre, texte accroche, bouton CTA droite
• Texte: max 30 caractères (${benefit1})
• Style: ${style}

FORMAT "medium_rectangle" — 300x250px:
• Format carré le plus utilisé sur le web
• Produit en évidence, titre court, description, CTA
• Couleurs: ${colorStr}

FORMAT "large_rectangle" — 336x280px:
• Similaire medium, légèrement plus grand
• Produit + titre percutant + CTA contrasté

FORMAT "mobile_banner" — 320x100px:
• Très compact, mobile first
• Logo + accroche ultra-courte (max 20 car.) + CTA

FORMAT "half_page" — 300x600px:
• Grand format vertical, storytelling possible
• Produit multiple angles ou before/after, texte détaillé, CTA en bas

FORMAT "billboard" — 970x250px:
• Très large, impact visuel maximal
• Produit grand format, accroche large, CTA visible

Pour chaque format: décris composition, couleurs, typographie, contenu exact des textes.

Retourne UNIQUEMENT ce JSON:
{
  "leaderboard": "prompt bannière 728x90 complet",
  "medium_rectangle": "prompt bannière 300x250 complet",
  "large_rectangle": "prompt bannière 336x280 complet",
  "mobile_banner": "prompt bannière 320x100 complet",
  "half_page": "prompt bannière 300x600 complet",
  "billboard": "prompt bannière 970x250 complet"
}`,
    },
    {
      key: "tiktok_ads",
      label: "TikTok Ads",
      agent: "Creative Ad Video Agent",
      buildPrompt: () => `${contextBlock}

Génère 1 prompt de réalisation complet pour une publicité TikTok pour ${product_name} (${brand_name}).

FORMAT: 1080x1920 (9:16) | Durée: 21-34 secondes (optimal TikTok) | Son: obligatoire

STRUCTURE SHOT-LIST PRÉCISE:
• 0-3s: HOOK visuel immédiat (retenir l'attention coûte que coûte — accroche choc, question, POV)
• 3-12s: Démonstration produit en action, bénéfice principal "${benefit1}"
• 12-22s: Preuve sociale ou transformation (before/after, témoignage, résultat)
• 22-30s: CTA avec code ${promoCode} affiché à l'écran

POUR CHAQUE SÉQUENCE:
• Description précise du plan (angle, sujet, mouvement caméra)
• Texte overlay (contenu, position, style, durée)
• Effets TikTok recommandés
• Timing musical (genre, BPM, moment de pic)
• Transitions

RÈGLES ALGORITHME TIKTOK:
• Son tendance obligatoire (genre adapté au secteur ${sector})
• Hook ultra-fort: première frame arrêtable
• Mouvements naturels (pas de pub trop "corporate")
• Texte lisible sur fond variable

Retourne UNIQUEMENT ce JSON:
{
  "tiktok_main": "prompt réalisation TikTok complet et ultra-détaillé",
  "hashtags": "#${brand_name.replace(/\s/g, "")} #${sector} #${product_name.replace(/\s/g, "")} + 5 hashtags tendance",
  "music_direction": "genre musical, BPM, ambiance recommandés"
}`,
    },
    {
      key: "carousel_ads",
      label: "Carousel Ads — 5 Slides",
      agent: "AI Poster Agent",
      buildPrompt: () => `${contextBlock}

Génère 5 prompts de création pour un Carousel Ad Meta pour ${product_name} (${brand_name}).
Narrative: Hook → Problème → Solution → Preuve → CTA
Format chaque slide: 1080x1080 (1:1) | Style: ${style}

SLIDE 1 — HOOK (arrêter le scroll):
• Visuel: lifestyle accrocheur, produit dans son univers
• Texte: question ou affirmation qui intrigue (max 8 mots)
• Objectif: créer la curiosité, faire swipe

SLIDE 2 — PROBLÈME (créer l'empathie):
• Visuel: situation "avant", sans le produit, le problème vécu
• Texte: identifier la douleur de la cible ${target_audience} ("${problemStr}")
• Émotion: frustration, désir de changement

SLIDE 3 — SOLUTION (révéler le produit):
• Visuel: ${product_name} en plein écran, mis en valeur
• Texte: "${benefit1}" — la réponse au problème
• Présentation: caractéristiques clés, design, qualité

SLIDE 4 — PREUVE (crédibiliser):
• Visuel: résultat, témoignage, statistique, before/after
• Texte: preuve chiffrée ou citation client
• Éléments: étoiles, notes, badges de confiance

SLIDE 5 — CTA (convertir):
• Visuel: produit + logo ${brand_name} + offre mise en avant
• Texte: "${promoCode}" — offre limitée
• CTA: bouton, urgence, bénéfice final "${benefit2}"

Pour chaque slide: détailler composition, couleurs, typographie, textes exacts.

Retourne UNIQUEMENT ce JSON:
{
  "slide_1": "prompt slide hook complet",
  "slide_2": "prompt slide problème complet",
  "slide_3": "prompt slide solution complet",
  "slide_4": "prompt slide preuve complet",
  "slide_5": "prompt slide CTA complet"
}`,
    },
    {
      key: "ad_copy",
      label: "Ad Copy — 4 Variantes par Plateforme",
      agent: "Expert Copywriter IA",
      buildPrompt: () => `${contextBlock}

Génère des copies publicitaires optimisées pour ${product_name} (${brand_name}) sur 4 plateformes.

Pour CHAQUE plateforme, 4 variantes de chaque élément:

PLATEFORME "meta_feed" — Facebook/Instagram Feed:
• primary_text: 4 variantes (max 125 car.) avec emojis, ton adapté ${sector}
• headline: 4 variantes (max 40 car.) percutantes
• description: 4 variantes (max 30 car.) avec bénéfice ou offre
• cta: 4 variantes (bouton d'action)

PLATEFORME "meta_stories" — Stories verticales:
• primary_text: 4 variantes ultra-courtes (max 50 car.) avec emojis
• headline: 4 variantes (max 20 car.)
• cta: 4 variantes

PLATEFORME "google_display" — Bannières Google:
• headline: 4 variantes (max 30 car. — SANS emojis)
• description: 4 variantes (max 90 car.)
• cta: 4 variantes courtes

PLATEFORME "tiktok" — TikTok Ads:
• primary_text: 4 variantes style TikTok (POV, réaction, secret...) avec emojis
• headline: 4 variantes tendance
• hashtags: 4 combinaisons de hashtags

RÈGLES:
• Français naturel, copywriting direct, adapté au secteur ${sector}
• Code promo ${promoCode}, remise ${discount}%, livraison offerte dès ${free_shipping}€
• Ton: ${style}

Retourne UNIQUEMENT ce JSON:
{
  "meta_feed": {
    "primary_text": ["variante1", "variante2", "variante3", "variante4"],
    "headline": ["h1", "h2", "h3", "h4"],
    "description": ["d1", "d2", "d3", "d4"],
    "cta": ["cta1", "cta2", "cta3", "cta4"]
  },
  "meta_stories": {
    "primary_text": ["v1", "v2", "v3", "v4"],
    "headline": ["h1", "h2", "h3", "h4"],
    "cta": ["c1", "c2", "c3", "c4"]
  },
  "google_display": {
    "headline": ["h1", "h2", "h3", "h4"],
    "description": ["d1", "d2", "d3", "d4"],
    "cta": ["c1", "c2", "c3", "c4"]
  },
  "tiktok": {
    "primary_text": ["v1", "v2", "v3", "v4"],
    "headline": ["h1", "h2", "h3", "h4"],
    "hashtags": ["#set1", "#set2", "#set3", "#set4"]
  }
}`,
    },
    {
      key: "performance_predictor",
      label: "Performance Predictor — A/B Testing",
      agent: "Analytics & Media Buying Expert IA",
      buildPrompt: () => `${contextBlock}

Génère une analyse de performance prédictive et un plan A/B testing pour les campagnes de ${brand_name} (${sector}).

ANALYSE CTR PRÉDICTIF:
Pour chaque format (Meta Feed, Stories, Google Display, TikTok), estime:
• CTR attendu (fourchette %)
• CPC estimé (en €)
• ROAS potentiel
• Facteurs de performance clés pour ce secteur ${sector}
• Top 3 optimisations spécifiques

PLAN A/B TESTING:
• Priorité des formats à tester en premier
• Variables à tester (créatif, texte, CTA, audience)
• Durée recommandée par test
• Budget minimum recommandé par format

RECOMMANDATIONS SECTEUR ${sector.toUpperCase()}:
• Meilleures pratiques créatives pour ce secteur
• Erreurs courantes à éviter
• Moments de diffusion optimaux
• Audiences recommandées pour ${target_audience}

QUICK WINS:
• 3 actions immédiates pour améliorer les performances
• Checklist pré-lancement campagne

Retourne UNIQUEMENT ce JSON:
{
  "ctr_predictions": {
    "meta_feed": {"ctr": "X-Y%", "cpc": "X-Y€", "roas": "Xx"},
    "meta_stories": {"ctr": "X-Y%", "cpc": "X-Y€", "roas": "Xx"},
    "google_display": {"ctr": "X-Y%", "cpc": "X-Y€", "roas": "Xx"},
    "tiktok": {"ctr": "X-Y%", "cpc": "X-Y€", "roas": "Xx"}
  },
  "ab_test_plan": ["test1", "test2", "test3", "test4", "test5"],
  "sector_recommendations": ["rec1", "rec2", "rec3"],
  "quick_wins": ["win1", "win2", "win3"],
  "launch_checklist": ["item1", "item2", "item3", "item4", "item5"]
}`,
    },
  ] as const;

  for (const section of SECTIONS) {
    sendEvent(res, { type: "section_start", key: section.key, label: section.label, agent: section.agent });

    let fullContent = "";
    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: section.buildPrompt() },
        ],
        max_completion_tokens: 2500,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content ?? "";
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
        data: parsed ?? {},
        rawContent: fullContent,
      });
    } catch (err) {
      sendEvent(res, { type: "section_error", key: section.key, error: err instanceof Error ? err.message : "Erreur inconnue" });
    }
  }

  sendEvent(res, { type: "done" });
  res.end();
});

export default router;
