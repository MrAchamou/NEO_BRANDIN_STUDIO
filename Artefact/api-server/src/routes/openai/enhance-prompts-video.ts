import { Router, type IRouter } from "express";
import { cerebrasStream, CEREBRAS_MODEL } from "../../lib/cerebras-client";
import { buildSystemPrompt, buildNegativePrompt } from "../../lib/prompt-utils";

const router: IRouter = Router();

// ─── Mappings auto-détection ─────────────────────────────────────────────────

const TEASER_STYLE_MAP: Record<string, string> = {
  bijou: "luxe", luxe: "luxe", maroquinerie: "luxe", montres: "luxe",
  cosmétique: "cinematic", skincare: "cinematic",
  tech: "glitch", gadgets: "glitch", streetwear: "glitch",
  fitness: "kinetic", sport: "kinetic",
  mode: "minimal", décoration: "minimal",
};

const THUMBNAIL_TYPE_MAP: Record<string, string> = {
  bijou: "product_focus", luxe: "product_focus", maroquinerie: "product_focus", montres: "product_focus", mode: "product_focus",
  cosmétique: "before_after", skincare: "before_after", fitness: "before_after",
  tech: "review", gadgets: "unboxing", streetwear: "review",
};

// ⚠️ VOIX ELEVENLABS — MODÈLE OBLIGATOIRE: eleven_multilingual_v2
// Les voix anglaises (Bella, Rachel, Emily, Antoni, Adam) lisent le français avec un fort accent US.
// Toujours utiliser des voix du catalogue multilingue + model_id: eleven_multilingual_v2
const VOICE_MAP: Record<string, { id: string; description: string; tone: string; lang_note: string }> = {
  bijou: { id: "Charlotte", description: "Voix féminine multilingue, élégante, posée, parfaite pour le luxe en français", tone: "elegant, sophisticated, refined", lang_note: "Modèle: eleven_multilingual_v2 — excellente diction française, accent neutre" },
  luxe: { id: "Charlotte", description: "Voix féminine multilingue, élégante, posée, parfaite pour le luxe en français", tone: "elegant, sophisticated, refined", lang_note: "Modèle: eleven_multilingual_v2 — excellente diction française, accent neutre" },
  maroquinerie: { id: "Charlotte", description: "Voix féminine multilingue, élégante, artisanale", tone: "elegant, sophisticated, refined", lang_note: "Modèle: eleven_multilingual_v2" },
  montres: { id: "Charlotte", description: "Voix féminine multilingue, précise, intemporelle", tone: "elegant, sophisticated, refined", lang_note: "Modèle: eleven_multilingual_v2" },
  cosmétique: { id: "Josephine", description: "Voix française native, chaleureuse, accessible et naturelle", tone: "friendly, warm, inviting", lang_note: "Voix native française — Modèle: eleven_multilingual_v2, aucun accent étranger" },
  skincare: { id: "Josephine", description: "Voix française native, douce, naturelle et authentique", tone: "natural, authentic, genuine", lang_note: "Voix native française — Modèle: eleven_multilingual_v2" },
  mode: { id: "Josephine", description: "Voix française native, chaleureuse, lifestyle", tone: "friendly, warm, inviting", lang_note: "Voix native française — Modèle: eleven_multilingual_v2" },
  fitness: { id: "Thomas", description: "Voix masculine française, énergique, dynamique et motivante", tone: "energetic, enthusiastic, motivating", lang_note: "Modèle: eleven_multilingual_v2 — diction française parfaite" },
  sport: { id: "Thomas", description: "Voix masculine française, épique, motivante", tone: "energetic, enthusiastic, motivating", lang_note: "Modèle: eleven_multilingual_v2" },
  streetwear: { id: "Thomas", description: "Voix masculine française, directe, urbaine et authentique", tone: "energetic, enthusiastic, motivating", lang_note: "Modèle: eleven_multilingual_v2" },
  tech: { id: "Thomas", description: "Voix masculine française, professionnelle et confiante", tone: "professional, confident, authoritative", lang_note: "Modèle: eleven_multilingual_v2" },
  gadgets: { id: "Thomas", description: "Voix masculine française, claire et enthousiasmante", tone: "professional, confident, authoritative", lang_note: "Modèle: eleven_multilingual_v2" },
};

const TEASER_DESCRIPTIONS: Record<string, string> = {
  luxe: "slow pan élégant, particules dorées flottantes, lumière chaude 3200K, depth of field extrême, fondu logo or/noir, grain film 8mm",
  cinematic: "slow zoom dramatique (24mm → 85mm f/1.4), profondeur de champ cinéma, lens flare anamorph doré, grain film 35mm, musique orchestrale crescendo, color grading teal & orange. VERSION BOUCLE 5s: macro texture du produit en loop seamless, bokeh lumière dorée animé, logo en transparence 30% — idéal pour fond Stories et site web",
  glitch: "effets RGB split (décalage 8px), scanlines CRT, distortion cyberpunk, chromatic aberration, transitions saccadées frame-by-frame, beat électronique synchronisé",
  kinetic: "typographie animée dynamique (kinetic type), mouvements rapides, motion blur 180° shutter, zoom in brutal, EDM 128 BPM, énergie maximale, couleurs saturées",
  minimal: "fond blanc épuré, rotation 360° produit (turntable), drop shadow doux, transitions morph fluides, piano ambient 80 BPM, texte minimal en noir",
};

// ⚠️ IMPORTANT: Les générateurs d'images (Midjourney, DALL-E, SDXL) écrivent mal le texte long.
// Ces prompts génèrent le FOND VISUEL uniquement — tout texte overlay (AVANT/APRÈS, titres, CTAs)
// doit être ajouté en post-production (Canva, Photoshop, After Effects).
const THUMBNAIL_DESCRIPTIONS: Record<string, string> = {
  product_focus: "produit centré, éclairage studio professionnel, palette marque, contraste élevé — zone vierge en haut pour texte overlay post-prod",
  before_after: "split screen gauche/droite, côté gauche désaturé/terne, côté droit vibrant/éclatant — AUCUN texte dans l'image, zone vierge 20% haut réservée pour overlay 'AVANT / APRÈS' en post-production (Canva/Photoshop)",
  tutorial: "main tenant le produit, composition claire, fond épuré — zone vierge 25% haut réservée pour overlay 'COMMENT FAIRE' en post-production",
  review: "visage surpris/impressionné + produit, fond coloré vif — zone vierge en bas pour overlay texte en post-production",
  unboxing: "packaging + produit sorti, confettis, ambiance excitante — zone vierge en haut pour overlay titre en post-production",
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

router.post("/openai/enhance-prompts-video", async (req, res) => {
  const {
    brand_name, sector, product_name,
    product_description = "",
    product_features = [],
    benefits = [],
    target_audience = "mixte",
    year = "",
    promo_code = "",
    duration_days = "7",
    teaser_style: teaser_style_override = null,
    thumbnail_type: thumbnail_type_override = null,
    brand_colors = "",
  } = req.body as {
    brand_name: string; sector: string; product_name: string;
    product_description?: string; product_features?: string[];
    benefits?: string[]; target_audience?: string; year?: string;
    promo_code?: string; duration_days?: string;
    teaser_style?: string | null; thumbnail_type?: string | null;
    brand_colors?: string;
  };

  if (!brand_name || !sector || !product_name) {
    res.status(400).json({ error: "Champs requis manquants" });
    return;
  }

  const teaserStyle = teaser_style_override ?? TEASER_STYLE_MAP[sector] ?? "cinematic";
  const thumbnailType = thumbnail_type_override ?? THUMBNAIL_TYPE_MAP[sector] ?? "product_focus";
  const voice = VOICE_MAP[sector] ?? { id: "Adam", description: "Voix professionnelle", tone: "professional, confident" };
  const promoCode = promo_code || brand_name.slice(0, 4).toUpperCase() + "20";

  const material = product_features[0] ?? "matériaux d'exception";
  const detail = product_features[1] ?? "finitions soignées";
  const benefit1 = benefits[0] ?? "qualité supérieure";
  const benefit2 = benefits[1] ?? "expérience unique";

  const colorsLine = brand_colors ? `\nCouleurs de marque (IMPOSÉES): ${brand_colors}` : "";
  const yearLine = year ? ` | Année fondation: ${year}` : "";
  const contextBlock = `Marque: ${brand_name} | Secteur: ${sector} | Produit: ${product_name}
Description: ${product_description || "produit premium de qualité"}
Caractéristiques: ${product_features.join(", ") || material}
Bénéfices: ${benefits.join(", ") || benefit1}
Cible: ${target_audience}${yearLine} | Code promo: ${promoCode} | Durée promo: ${duration_days} jours${colorsLine}

⚠️ ANTI-HALLUCINATION: N'invente AUCUNE date, statistique, chiffre ou certification non présent dans ce brief. Si l'année de fondation n'est pas fournie, ne la mentionne JAMAIS dans les scripts.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const colorPriorityBlock = brand_colors
    ? `\n⚠️ RÈGLE ABSOLUE COULEURS: Le client impose ces couleurs de marque: ${brand_colors}. Ces couleurs sont SACRÉES — les utiliser EXACTEMENT dans tous les visuels vidéo décrits.`
    : "";
  const systemPrompt = `Tu es un expert senior en création de scripts publicitaires et prompts vidéo pour RoboNeo.com.
Tu rédiges des scripts punchy, adaptés au secteur ${sector}, en français. Formule courte, efficace, copywriting direct.
Tu retournes TOUJOURS du JSON valide uniquement, sans markdown, sans texte avant ou après.${colorPriorityBlock}

RÈGLES VOIX DE MARQUE — OBLIGATOIRES:
• INTERDIT dans les scripts: argot ("ça saoule", "c'est ouf", "trop bien", "franchement"), expressions familières ("ce que j'aime", "j'ai une routine simple"), ton de conversation personnelle
• Le ton doit rester cohérent avec le secteur ${sector} — voir la charte de voix R09 définie en Module 01.4
• Scripts en voix off professionnelle: neutre, fluide, adapté au TTS ElevenLabs

RÈGLES OVERLAY TEXTE VIDÉO — OBLIGATOIRES (conformes charte R01):
• INTERDIT: effets emboss, gaufrage, relief, ombre portée épaisse sur les textes overlay
• Texte overlay: flat, net, sans effet 3D — fond semi-transparent ou outline simple 1px maximum
• Respecter les règles R01 (usage du logo) et R09 (voix de marque) de la charte graphique du Module 01.4`;

  const SECTIONS = [
    {
      key: "scripts",
      label: "Scripts — 15s / 30s / 60s",
      agent: "Creative Ad Video Agent (scripts)",
      buildPrompt: () => `${contextBlock}

Génère 3 scripts publicitaires professionnels pour ${product_name} (${brand_name}) en 3 durées.

STRUCTURE ABSOLUE par durée:
- "15s": format AIDA court: {hook, interest, desire, cta, full_script}
  • hook (5 mots max): accroche choc, fait tourner les têtes
  • interest (8 mots max): caractéristique clé — ${material}, ${detail}
  • desire (8 mots max): bénéfice émotionnel — ce que ça change dans la vie
  • cta (5 mots max): appel à l'action direct
  • full_script: les 4 sections enchaînées naturellement (~15 secondes à lire)

- "30s": format PASOP: {problem, agitation, solution, offer, cta, full_script}
  • problem (10 mots): problème que connaît la cible
  • agitation (10 mots): pourquoi c'est frustrant
  • solution (15 mots): ${brand_name} — ${material}, ${benefit1}
  • offer (10 mots): l'offre / la preuve
  • cta (8 mots): code ${promoCode}, lien bio
  • full_script: tout enchaîné (~30 secondes)

- "60s": format Storytelling: {hook, context, discovery, proof, cta, full_script}
  • hook (10 mots): ouverture narrative accrocheuse
  • context (20 mots): mise en situation réelle de la cible ${target_audience}
  • discovery (20 mots): révélation du produit, ${material}, ${detail}
  • proof (15 mots): preuve sociale ou résultat chiffré
  • cta (10 mots): invitation finale avec code ${promoCode}
  • full_script: tout enchaîné (~60 secondes)

RÈGLES:
• Français naturel, punchy, copywriting direct
• Adapté au ton du secteur ${sector}
• Scripts prêts à lire pour une voix off

Retourne UNIQUEMENT ce JSON:
{
  "15s": { "hook": "...", "interest": "...", "desire": "...", "cta": "...", "full_script": "..." },
  "30s": { "problem": "...", "agitation": "...", "solution": "...", "offer": "...", "cta": "...", "full_script": "..." },
  "60s": { "hook": "...", "context": "...", "discovery": "...", "proof": "...", "cta": "...", "full_script": "..." }
}`,
    },
    {
      key: "short_videos",
      label: "Vidéos Courtes — TikTok / Reels",
      agent: "Creative Ad Video Agent",
      buildPrompt: () => `${contextBlock}

Génère 2 prompts de réalisation vidéo pour des vidéos courtes verticales (format 9:16, 1080×1920px).

FORMAT "tiktok_15s" (15 secondes):
- Structure shot-list complète: 4-5 plans de 3s maximum
- Chaque plan: description précise (angle, sujet, mouvement, éclairage)
- Transitions: type et durée
- Texte overlay: quoi, quand, style (taille, couleur, position)
- Son: musique recommandée (genre, BPM), timing voix off
- Accroche visuelle dans les 3 premières secondes (rétention maximale)

FORMAT "tiktok_30s" (30 secondes):
- Structure narrative en 3 actes: accroche (8s) + développement (15s) + CTA (7s)
- Shot-list: 6-8 plans avec descriptions complètes
- Animations de texte: style, timing, contenu
- Transitions: type et durée
- Code ${promoCode} visible à l'écran en fin de vidéo

RÈGLES:
• Adapté aux algorithmes TikTok/Reels (hook fort en 0-3s)
• Mouvements de caméra naturels, tendances actuelles
• Français, ultra-précis, réalisable avec un smartphone ou caméra

Retourne UNIQUEMENT ce JSON:
{
  "tiktok_15s": "prompt de réalisation complet 15s",
  "tiktok_30s": "prompt de réalisation complet 30s"
}`,
    },
    {
      key: "long_video",
      label: "Vidéo YouTube — 60s",
      agent: "Creative Ad Video Agent",
      buildPrompt: () => `${contextBlock}

Génère 1 prompt de réalisation pour une vidéo YouTube horizontal (16:9, 1920×1080px, 60 secondes).

STRUCTURE:
- Format horizontal 16:9, qualité cinéma
- Découpage en 4 séquences:
  1. OUVERTURE (0-10s): plan large cinématographique, mise en ambiance
  2. PRÉSENTATION (10-30s): produit en détail, caractéristiques en overlay
  3. LIFESTYLE (30-50s): produit en usage réel avec la cible ${target_audience}
  4. CTA (50-60s): logo, code ${promoCode}, appel à l'action

POUR CHAQUE SÉQUENCE, décrire:
- Plans exacts (composition, angle, mouvement)
- Éclairage (studio, naturel, golden hour...)
- Transitions entre séquences
- Texte overlay (contenu, style, timing)
- Musique: dynamique et évolution sur 60s

RÈGLES:
• Qualité pub TV/YouTube Premium
• Mouvements caméra maîtrisés, non amateurs
• Rythme: pose en début, montée en énergie vers le CTA

Retourne UNIQUEMENT ce JSON:
{
  "youtube_60s": "prompt de réalisation complet 60s"
}`,
    },
    {
      key: "teaser",
      label: `Teaser Animé — Style ${teaserStyle.toUpperCase()}`,
      agent: "Anime Video Agent / Image-to-Video",
      buildPrompt: () => `${contextBlock}

Style de teaser sélectionné: ${teaserStyle.toUpperCase()}
Description du style: ${TEASER_DESCRIPTIONS[teaserStyle] ?? "style professionnel adapté"}

Génère un prompt de teaser animé ultra-précis de 15 secondes pour ${product_name} (${brand_name}).

PLAN SÉQUENCE SECOND PAR SECONDE:
- 0-4s: ouverture (selon le style ${teaserStyle})
- 4-8s: révélation du produit
- 8-12s: détails et bénéfice clé
- 12-15s: logo ${brand_name}, CTA

POUR CHAQUE PHASE, décrire:
• Visuels: fond, couleurs, composition
• Animations: type de mouvement, vitesse, effets spéciaux spécifiques au style ${teaserStyle}
• Typographie: police, taille, animation du texte
• Transitions: type exact, durée en frames
• Audio: genre musical, BPM, évolution

RÈGLES ABSOLUES:
• Trois versions: vertical 9:16 (1080×1920), horizontal 16:9 (1920×1080), et boucle 5s ambient
• Prompt en français, extrêmement détaillé et précis
• Effets adaptés au style ${teaserStyle}: ${TEASER_DESCRIPTIONS[teaserStyle]}

VERSION BOUCLE 5s (ambient loop — pour fond de site web, Stories en boucle, écran d'accueil):
• Durée: exactement 5 secondes en boucle parfaite seamless
• Contenu: macro texture/matière du produit, bokeh lumineux animé, logo en transparence 25-30%
• Aucune coupure visible, transition début/fin imperceptible
• Pas de mouvement brusque — uniquement dérives lentes, particules, reflets

Retourne UNIQUEMENT ce JSON:
{
  "vertical": "prompt teaser vertical 9:16 complet (15s)",
  "horizontal": "prompt teaser horizontal 16:9 complet (15s)",
  "loop_5s": "prompt boucle ambient 5s seamless pour site web et Stories",
  "style": "${teaserStyle}",
  "effects": "liste des effets utilisés"
}`,
    },
    {
      key: "thumbnails",
      label: `Miniatures YouTube — Type ${thumbnailType.replace(/_/g, " ").toUpperCase()}`,
      agent: "AI Poster Agent",
      buildPrompt: () => `${contextBlock}

Type de miniature: ${thumbnailType.replace(/_/g, " ").toUpperCase()}
Description: ${THUMBNAIL_DESCRIPTIONS[thumbnailType] ?? "miniature professionnelle optimisée CTR"}

Génère 3 variantes de miniatures YouTube pour ${product_name} (${brand_name}).

FORMAT: 1280×720px (16:9), JPG optimisé

Pour CHAQUE variante (A, B, C), décrire:
• Composition: disposition des éléments visuels sur la miniature
• Sujet principal: description précise (produit, visage, scène)
• Texte: contenu exact (3-6 mots), police, taille, couleur, position, ombre
• Palette: couleurs dominantes, contraste, background
• Éléments graphiques: flèches, cercles, icônes, overlays
• Éclairage: naturel/studio/composite

TYPE ${thumbnailType.toUpperCase()} — Règles spécifiques: ${THUMBNAIL_DESCRIPTIONS[thumbnailType]}

RÈGLES CTR:
• Contraste maximal pour se démarquer dans les suggestions YouTube
• Visage ou objet reconnaissable à 200px
• Texte lisible sur mobile
• Teaser de curiosité sans spoiler

⚠️ NOTE POST-PRODUCTION OBLIGATOIRE:
Les générateurs d'images actuels (Midjourney, DALL-E, SDXL, Firefly) ne peuvent pas reproduire fidèlement du texte long ou des titres précis.
Ces prompts génèrent le FOND VISUEL et l'AMBIANCE uniquement.
Tout texte overlay ('AVANT / APRÈS', noms produits, CTAs, statistiques) DOIT être ajouté en post-production sur Canva, Photoshop ou After Effects pour garantir une typographie parfaite.
Chaque variante doit inclure une zone vierge clairement définie pour accueillir ce texte.

RÈGLES OVERLAY TEXTE (conformes charte R01):
• INTERDIT dans le prompt image: tout texte lisible, toute typographie dans la composition
• La zone texte sera ajoutée en post-production uniquement
• Décrire uniquement: fond visuel, éclairage, composition, ambiance

DISCLAIMER RÉGLEMENTAIRE (miniatures Before/After uniquement):
• Si le type est "before_after": inclure une micro-mention en bas de miniature "Résultats individuels — usage créatif uniquement"
• Zone mention: 24px hauteur, texte blanc 8px sur fond #000000 semi-transparent 50%
• Ces visuels sont à usage promotionnel créatif uniquement et ne constituent pas une allégation clinique

Retourne UNIQUEMENT ce JSON:
{
  "variant_a": "prompt miniature variante A complet",
  "variant_b": "prompt miniature variante B complet",
  "variant_c": "prompt miniature variante C complet",
  "type": "${thumbnailType}"
}`,
    },
    {
      key: "voice_over",
      label: "Voix Off — Scripts & Recommandation",
      agent: "ElevenLabs / AI Voice Generator",
      buildPrompt: () => `${contextBlock}

⚠️ LANGUE: Les scripts sont en FRANÇAIS. Utiliser OBLIGATOIREMENT une voix multilingue française avec model_id: eleven_multilingual_v2 pour éviter l'accent étranger.

Voix recommandée pour ce secteur (${sector}): ${voice.id} — ${voice.description}
Ton: ${voice.tone}
Note technique: ${voice.lang_note}

Génère les textes de voix off optimisés pour lecture TTS (ElevenLabs) en 3 durées.

Pour CHAQUE durée, le texte doit être:
• Rédigé pour être LU à voix haute (pas de texte d'écran)
• Ponctuation adaptée au débit voix (virgules = pause courte, ... = pause longue)
• Rythme: 15s = ~35 mots, 30s = ~75 mots, 60s = ~150 mots
• Émotionnel et adapté au ton ${voice.tone}
• Français naturel, pas robotique

RÈGLES ELEVENLABS:
• Ajoute des <break time="0.5s"/> là où la pause est importante
• Mots-clés à ACCENTUER en majuscules (3 max par script)
• Fin avec une montée d'intonation sur le CTA

Retourne UNIQUEMENT ce JSON:
{
  "recommended_voice": "${voice.id}",
  "voice_description": "${voice.description}",
  "voice_tone": "${voice.tone}",
  "model_id": "eleven_multilingual_v2",
  "lang_note": "${voice.lang_note}",
  "script_15s": "texte voix off 15s optimisé ElevenLabs",
  "script_30s": "texte voix off 30s optimisé ElevenLabs",
  "script_60s": "texte voix off 60s optimisé ElevenLabs",
  "elevenlabs_settings": {"stability": 0.75, "similarity_boost": 0.85, "style": 0.3, "model_id": "eleven_multilingual_v2"}
}`,
    },
  ] as const;

  for (const section of SECTIONS) {
    sendEvent(res, { type: "section_start", key: section.key, label: section.label, agent: section.agent });

    let fullContent = "";
    try {
      const stream = await cerebrasStream({
        model: CEREBRAS_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: section.buildPrompt() },
        ],
        max_tokens: 2000,
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
        meta: {
          teaserStyle: section.key === "teaser" ? teaserStyle : undefined,
          thumbnailType: section.key === "thumbnails" ? thumbnailType : undefined,
          voice: section.key === "voice_over" ? voice : undefined,
        },
      });
    } catch (err) {
      sendEvent(res, { type: "section_error", key: section.key, error: err instanceof Error ? err.message : "Erreur inconnue" });
    }
  }

  sendEvent(res, { type: "done" });
  res.end();
});

export default router;
