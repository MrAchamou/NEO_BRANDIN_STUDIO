import { Router, type IRouter } from "express";
import { cerebrasStream, CEREBRAS_MODEL } from "../../lib/cerebras-client";
import { buildSystemPrompt, buildNegativePrompt } from "../../lib/prompt-utils";

const router: IRouter = Router();

// ─── Mappings secteur ────────────────────────────────────────────────────────

const JINGLE_STYLE_MAP: Record<string, string> = {
  bijou: "orchestral élégant — harpe, cordes, piano, 80-90 BPM, intemporel",
  luxe: "orchestral majestueux — cordes, cuivres, harpe, timbales, 70-80 BPM",
  maroquinerie: "orchestral artisanal — cordes, piano, guitare classique, 85-95 BPM",
  montres: "mécanique précis — tic-tac stylisé, cordes, piano, 90-100 BPM",
  cosmétique: "pop frais — piano, guitare acoustique, clochettes, 100-110 BPM",
  skincare: "ambient doux — piano, nappes, sons nature, 80-90 BPM",
  tech: "électronique minimal — synthé, beats électroniques, glitch, 110-120 BPM",
  gadgets: "pop électronique — beats, synthé, sons UI, 115-125 BPM",
  fitness: "EDM énergique — batterie électronique, synthé, basse, 130-140 BPM",
  sport: "épique motivant — orchestre + électronique, batterie, 125-135 BPM",
  mode: "pop urbaine tendance — beat, basse, synthé, 100-110 BPM",
  streetwear: "hip-hop trap — 808, basse, vocal chop, 120-130 BPM",
  décoration: "ambient cosy — guitare acoustique, piano, sons intérieur, 80-90 BPM",
};

const BGM_STYLE_MAP: Record<string, string> = {
  bijou: "orchestral pop élégant — harpe (lead mélodique), cordes en nappe, piano Rhodes (accords doux), triangle cristallin — lumineux, intemporel",
  luxe: "orchestral cinématique — orchestre cordes complet, harpe (arpèges lead), cuivres doux, timbales feutrées, clavecin optionnel — majestueux, intemporel",
  cosmétique: "pop acoustique fraîche — piano acoustique (lead), guitare acoustique (picking), clochettes légères, glockenspiel, basse fretless douce — frais, naturel",
  skincare: "ambient pop apaisant — piano acoustique (mélodie), nappe de synthé pad doux, flûte traversière, sons nature (eau douce, feuilles), basse sine wave — relaxant, zen",
  tech: "électronique minimal — synthé lead analogique, beats électroniques 4/4, basse synthé, arpégiateur rapide, effets glitch contrôlés — moderne, précis",
  gadgets: "électronique pop — synthé pad, beats entraînants, basse synthé, sons UI stylisés (bip, click), marimba électronique — fun, pratique",
  fitness: "EDM énergique — kick 4/4 fort, synthé supersaw, basse sidechain, snare claquante, risers et drops — motivant, explosif, 130-140 BPM",
  sport: "épique orchestral + électronique — section cordes puissante, cuivres héroïques, percussions orchestrales (timbales, grosse caisse), batterie électronique en renfort — puissant, inspirant",
  mode: "pop urbaine tendance — beat trap léger, basse chaude, synthé pad aérien, guitare rythmique, voix harmonisées choppées — cool, aspirationnel",
  streetwear: "hip-hop/trap authentique — kick 808 profond, basse sub, snare claquante, hi-hat roulant, vocal chop mélodique, sample vinyle — urbain, authentique",
  décoration: "ambient cosy — guitare acoustique fingerpicking (lead), piano Fender Rhodes, violoncelle doux, sons d'intérieur (feu de cheminée, horloge feutrée) — chaleureux, serein",
  maroquinerie: "orchestral artisanal — quatuor à cordes (lead), piano classique, guitare classique nylon, contrebasse pizzicato — qualité, savoir-faire",
};

// ⚠️ VOIX ELEVENLABS FRANCOPHONES — model_id: eleven_multilingual_v2 OBLIGATOIRE
// Rachel, Bella, Emily, Antoni, Adam = voix ANGLAISES → accent fort en français
// Utiliser uniquement des voix multilingues natives ou excellentes en français
const ELEVENLABS_VOICES: Record<string, { name: string; description: string; tone: string; use_for: string[]; lang_note: string }> = {
  Josephine: { name: "Josephine", description: "Voix française native, chaleureuse, naturelle et accessible", tone: "friendly, warm, inviting", use_for: ["cosmétique", "skincare", "mode", "lifestyle"], lang_note: "Voix native française — model_id: eleven_multilingual_v2" },
  Thomas: { name: "Thomas", description: "Voix masculine française, professionnelle et confiante", tone: "professional, confident, authoritative", use_for: ["tech", "gadgets", "finance", "B2B", "fitness", "sport", "streetwear"], lang_note: "model_id: eleven_multilingual_v2 — diction française parfaite" },
  Charlotte: { name: "Charlotte", description: "Voix féminine multilingue, élégante, raffinée — excellente diction française", tone: "elegant, sophisticated, refined", use_for: ["bijou", "luxe", "maroquinerie", "montres", "décoration", "bio", "nature"], lang_note: "Multilingue — model_id: eleven_multilingual_v2, accent neutre élégant" },
};

function pickVoice(sector: string) {
  for (const [, voice] of Object.entries(ELEVENLABS_VOICES)) {
    if (voice.use_for.includes(sector)) return voice;
  }
  return ELEVENLABS_VOICES["Thomas"];
}

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

// ─── Route POST ──────────────────────────────────────────────────────────────

router.post("/openai/enhance-prompts-sound", async (req, res) => {
  const {
    brand_name,
    sector,
    tone = "professionnel",
    values = [],
    target_audience = "mixte",
    has_ugc_audio = false,
    needs_vocal_separation = false,
    brand_colors = "",
  } = req.body as {
    brand_name: string;
    sector: string;
    tone?: string;
    values?: string[];
    target_audience?: string;
    has_ugc_audio?: boolean;
    needs_vocal_separation?: boolean;
    brand_colors?: string;
  };

  if (!brand_name || !sector) {
    res.status(400).json({ error: "Champs requis manquants" });
    return;
  }

  const jingleStyle = JINGLE_STYLE_MAP[sector] ?? "orchestral, moderne, professionnel";
  const bgmStyle = BGM_STYLE_MAP[sector] ?? "moderne, professionnel";
  const recommendedVoice = pickVoice(sector);
  const valuesStr = values.length > 0 ? values.join(", ") : "qualité, confiance, excellence";

  const colorsLine = brand_colors ? ` | Couleurs de marque (identité): ${brand_colors}` : "";
  const contextBlock = `Marque: ${brand_name} | Secteur: ${sector} | Ton: ${tone}
Valeurs: ${valuesStr} | Cible: ${target_audience}${colorsLine}
Style sonore jingle: ${jingleStyle}
Style musiques de fond: ${bgmStyle}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const colorPriorityBlock = brand_colors
    ? `\nL'identité visuelle de la marque utilise ces couleurs: ${brand_colors}. Le rendu sonore doit traduire cette palette chromatique en émotions musicales cohérentes.`
    : "";
  const systemPrompt = `Tu es un directeur artistique sonore expert en identité sonore de marque et en génération de prompts pour des outils de création audio (Suno, Udio, ElevenLabs, Adobe Podcast).
Tu génères des prompts audio ultra-précis et des briefs créatifs complets pour chaque actif sonore d'une marque.
Tu retournes TOUJOURS du JSON valide uniquement, sans markdown, sans texte avant ou après.
Tous les textes sont en français, créatifs, adaptés au secteur ${sector} et au style ${tone}.${colorPriorityBlock}

RÈGLE ABSOLUE — NOMMAGE DES INSTRUMENTS:
• TOUJOURS nommer les instruments avec précision et leur rôle exact. INTERDIT d'écrire "guitare" ou "percussions" seuls.
• Format obligatoire: "nom de l'instrument (rôle dans le mix)" — ex: "kora (lead mélodique arabesque)", "balafon (contrechant rythmique)", "nappe de piano électrique Rhodes (harmonie en fond)", "shakers légers (texture rythmique)"
• Pour les genres world/afro: Kora (harpe africaine à 21 cordes), Balafon (xylophone africain en bois), Djembé (percussions lead), Talking drum (percussions répondantes), Ngoni (luth africain)
• Pour les genres latins: Tumbadora/Conga (lead), Bongos (contrechant), Güiro (texture rythmique), Tres cubano (harmonie)
• Pour les genres orientaux: Oud (lead mélodique), Qanun (harmonie), Darbuka (percussions lead), Bendir (percussions nappe)
• Ces précisions permettent aux IA musicales (Suno, Udio) de ne pas partir sur de la pop commerciale générique`;

  const SECTIONS = [
    {
      key: "jingle",
      label: "Jingle de Marque — 5-10 secondes",
      agent: "AI Music Generator (Suno / Udio)",
      buildPrompt: () => `${contextBlock}

Génère un prompt ultra-précis pour créer le JINGLE de marque de ${brand_name} (secteur: ${sector}).

BRIEF CRÉATIF COMPLET:
• Style musical: ${jingleStyle}
• Durée cible: 7 secondes (max 10s)
• Structure musicale: intro (1s) → mélodie signature (4s) → résolution (2s)
• Instruments: liste précise avec rôle de chaque instrument
• Arrangement: description de la progression harmonique, du rythme, de la dynamique
• Ambiance: 5 adjectifs sonores précis
• Éléments distinctifs: sons caractéristiques du secteur ${sector}
• Intégration du nom: comment et où ${brand_name} est prononcé (voix off, chanté, humming)
• Variations recommandées: version longue (10s), version courte (3s), version notification (1s)
• Notes de réalisation pour le producteur

PROMPT TECHNIQUE:
• BPM précis
• Tonalité recommandée (Do majeur, La mineur...)
• Format de sortie: MP3 320kbps + WAV 44.1kHz
• Notes de mastering: niveau -14 LUFS, limiteur -1dB

Retourne UNIQUEMENT ce JSON:
{
  "creative_brief": "description créative complète et inspirante du jingle",
  "technical_prompt": "prompt technique ultra-précis pour l'outil de génération audio",
  "variations": {
    "version_longue_10s": "brief variation longue",
    "version_courte_3s": "brief version courte",
    "version_notification_1s": "brief notification"
  },
  "vocal_integration": "comment intégrer le nom ${brand_name} dans le jingle",
  "usage_recommandations": "où utiliser chaque variation (intros vidéo, notifications app, podcasts...)"
}`,
    },
    {
      key: "background_music",
      label: "Musiques de Fond — 15s / 30s / 60s",
      agent: "AI Background Music Generator (Suno / Udio)",
      buildPrompt: () => `${contextBlock}

Génère 3 prompts de musique de fond pour ${brand_name} (${sector}), un par durée.

STYLE MUSICAL: ${bgmStyle}
RÈGLES COMMUNES: loopable, adaptée à la publicité, non intrusive, sans paroles, libre de droits

FORMAT 15 SECONDES — TikTok, Reels, vidéos courtes:
• Structure: intro courte (2s) → hook principal (9s) → outro (4s)
• Énergie: adaptée aux formats courts dynamiques
• Instruments: version épurée, percussion claire
• Points de sync: indiquer où placer les cuts de montage vidéo

FORMAT 30 SECONDES — Meta Ads, publicités Instagram/Facebook:
• Structure: intro (4s) → verse (8s) → chorus (10s) → outro (8s)
• Énergie: crescendo progressif vers le chorus
• Instruments: version plus complète, harmonie riche
• Moments clés: build-up avant le CTA de la pub

FORMAT 60 SECONDES — YouTube, vidéos explicatives:
• Structure: intro (8s) → verse (12s) → chorus (15s) → bridge (10s) → outro (15s)
• Énergie: dynamique complète avec variations
• Instruments: arrangement complet, couches multiples
• Arc émotionnel: décrire l'évolution de l'ambiance sur 60s

Retourne UNIQUEMENT ce JSON:
{
  "15s": {
    "prompt": "prompt technique complet pour génération 15s",
    "usage": "TikTok, Reels, vidéos courtes",
    "sync_points": "timestamps des moments clés pour montage"
  },
  "30s": {
    "prompt": "prompt technique complet pour génération 30s",
    "usage": "Meta Ads, publicités Instagram",
    "sync_points": "timestamps des moments clés pour montage"
  },
  "60s": {
    "prompt": "prompt technique complet pour génération 60s",
    "usage": "YouTube, vidéos de marque",
    "sync_points": "timestamps des moments clés pour montage"
  }
}`,
    },
    {
      key: "sound_effects",
      label: "Bibliothèque d'Effets Sonores",
      agent: "AI Sound Design / Suno",
      buildPrompt: () => `${contextBlock}

Génère 6 prompts d'effets sonores de marque pour ${brand_name} (${sector}).

Pour CHAQUE effet, fournis un prompt de création précis adapté à l'univers de la marque:

EFFET 1 — "ui_click": clic interface UI, 0.3s
• Adapté au secteur ${sector}, ton ${tone}
• Caractère: [décris l'ambiance du clic pour cette marque]

EFFET 2 — "ui_notification": notification push, 1s
• Mémorable, non intrusif, reconnaissable en tant que ${brand_name}
• Caractère: [décris le son de notification idéal]

EFFET 3 — "ui_success": validation/succès, 1.5s
• Positif, satisfaisant, cohérent avec l'identité sonore
• Caractère: [décris la sensation de succès pour ce secteur]

EFFET 4 — "transition_whoosh": transition vidéo, 0.8s
• Pour transitions entre scènes dans les vidéos ${brand_name}
• Caractère: [décris le whoosh adapté au style de la marque]

EFFET 5 — "transition_sweep": sweep élégant, 1s
• Pour transitions fluides, entrées de texte à l'écran
• Caractère: [décris le sweep idéal]

EFFET 6 — "impact_soft": impact pour apparition logo/texte, 0.5s
• Pour révélation du logo ${brand_name}, apparition de texte clé
• Caractère: [décris l'impact adapté à la marque]

Retourne UNIQUEMENT ce JSON:
{
  "ui_click": {"prompt": "prompt création son", "duree": "0.3s", "caractere": "description"},
  "ui_notification": {"prompt": "prompt création son", "duree": "1s", "caractere": "description"},
  "ui_success": {"prompt": "prompt création son", "duree": "1.5s", "caractere": "description"},
  "transition_whoosh": {"prompt": "prompt création son", "duree": "0.8s", "caractere": "description"},
  "transition_sweep": {"prompt": "prompt création son", "duree": "1s", "caractere": "description"},
  "impact_soft": {"prompt": "prompt création son", "duree": "0.5s", "caractere": "description"}
}`,
    },
    {
      key: "voice_over",
      label: "Voix Off — Recommandation ElevenLabs",
      agent: "ElevenLabs / AI Voice Generator",
      buildPrompt: () => `${contextBlock}
Voix recommandée pour ce secteur: ${recommendedVoice.name} (${recommendedVoice.description}) — Ton: ${recommendedVoice.tone}

Génère une recommandation complète de voix off ElevenLabs pour ${brand_name}.

ANALYSE DU PROFIL VOCAL IDÉAL:
• Ton de la marque ${brand_name}: ${tone}
• Valeurs à incarner: ${valuesStr}
• Cible ${target_audience}: quelle voix résonne avec elle ?
• Émotion principale à transmettre

RECOMMANDATION PRIMAIRE:
• Voix recommandée pour ce secteur (parmi: Rachel, Adam, Antoni, Bella, Emily)
• Paramètres ElevenLabs optimaux: stability, similarity_boost, style
• Ton de jeu conseillé pour les spots de ${brand_name}

SCRIPT TEMPLATE:
• Template de script générique pour une publicité 30s de ${brand_name}
• Instructions de jeu pour le comédien
• Points d'emphase à placer

RECOMMANDATION SECONDAIRE (voix alternative):
• Voix alternative pour des tonalités différentes
• Quand l'utiliser (event, offre promotionnelle, contenu éducatif)

Retourne UNIQUEMENT ce JSON:
{
  "primary_voice": {
    "name": "nom voix ElevenLabs",
    "rationale": "pourquoi cette voix est parfaite pour ${brand_name}",
    "parameters": {"stability": 0.6, "similarity_boost": 0.8, "style": 0.3},
    "direction": "instructions de jeu pour le comédien"
  },
  "secondary_voice": {
    "name": "nom voix alternative",
    "use_case": "quand utiliser cette voix",
    "direction": "ton et style d'interprétation"
  },
  "script_template_30s": "script générique 30s pour ${brand_name} avec balises d'emphase [EMPHASE: mot] et pauses [PAUSE 0.5s]",
  "script_directions": "instructions complètes pour le directeur artistique"
}`,
    },
    {
      key: "beat_sync",
      label: `Audio Processing & Beat Sync${has_ugc_audio || needs_vocal_separation ? " — UGC inclus" : ""}`,
      agent: "Adobe Podcast / Audioshake / librosa",
      buildPrompt: () => `${contextBlock}
Options activées: UGC Audio: ${has_ugc_audio ? "OUI" : "NON"} | Séparation vocale: ${needs_vocal_separation ? "OUI" : "NON"}

Génère les prompts de traitement audio pour ${brand_name}.

1. BEAT DETECTION & SYNCHRONISATION VIDÉO:
Crée un guide complet pour synchroniser les musiques de fond de ${brand_name} avec les vidéos (Module 03).
• Comment repérer les downbeats pour placer les cuts de montage
• Comment aligner les transitions visuelles sur les temps forts
• Recommandations BPM pour chaque format (TikTok 15s, Reels 30s, YouTube 60s)
• Outils recommandés (Premiere Pro, CapCut, DaVinci Resolve)

${has_ugc_audio ? `2. NETTOYAGE AUDIO UGC:
Brief pour purifier les audios UGC clients de ${brand_name}:
• Processus de débruitage (Adobe Podcast ou Auphonic)
• Normalisation à -14 LUFS (standard streaming)
• Gestion des clics, souffles, bruits de fond
• Réglages recommandés par contexte (intérieur, extérieur, téléphone)` : "2. NETTOYAGE AUDIO UGC: Non activé pour cette session."}

${needs_vocal_separation ? `3. SÉPARATION VOCALE (STEM EXTRACTION):
Brief pour séparer les stems audio:
• Outil recommandé (Audioshake, Lalal.ai, Moises)
• Workflow: vocal seul, instrumental seul, basse, batterie
• Comment réutiliser les stems dans les créations ${brand_name}
• Export et nommage des fichiers` : "3. SÉPARATION VOCALE: Non activée pour cette session."}

4. MASTERING FINAL:
• Paramètres de normalisation pour chaque plateforme (Spotify -14 LUFS, YouTube -14 LUFS, TikTok -14 LUFS, Meta Ads -16 LUFS)
• Chaîne de traitement recommandée
• Checklist de validation audio avant diffusion

Retourne UNIQUEMENT ce JSON:
{
  "beat_detection": {
    "guide": "guide complet synchronisation vidéo/musique",
    "tools": ["outil1", "outil2"],
    "bpm_recommendations": {"tiktok_15s": "X-Y BPM", "instagram_30s": "X-Y BPM", "youtube_60s": "X-Y BPM"}
  },
  "ugc_cleaning": ${has_ugc_audio ? '{"prompt": "brief débruitage complet", "tools": ["outil1", "outil2"], "steps": ["étape1", "étape2", "étape3"]}' : 'null'},
  "vocal_separation": ${needs_vocal_separation ? '{"prompt": "brief séparation vocale", "tools": ["outil1", "outil2"], "stems": ["vocal", "instrumental", "bass", "drums"]}' : 'null'},
  "mastering": {
    "lufs_by_platform": {"spotify": "-14", "youtube": "-14", "tiktok": "-14", "meta": "-16"},
    "checklist": ["item1", "item2", "item3", "item4", "item5"]
  }
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
      });
    } catch (err) {
      sendEvent(res, { type: "section_error", key: section.key, error: err instanceof Error ? err.message : "Erreur inconnue" });
    }
  }

  sendEvent(res, { type: "done" });
  res.end();
});

export default router;
