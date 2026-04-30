/**
 * Module Report Builder
 *
 * Convertit les structures de résultats hétérogènes des 10 modules en un
 * `ModuleReport` standard exploitable par le générateur HTML cabinet privé.
 *
 * - `buildSectionsReport()` : pour les modules 02→10 qui exposent
 *   `sections: { key, label, agent, data: Record<string,string> }[]`
 * - `buildModule01Report()` : module 01 a une structure différente
 *   (`result.modules.brand_identity.{logo,palette,typography,guidelines}`)
 *
 * Les recommandations de modèles IA sont centralisées par module et restent
 * en français (langue principale de l'opérateur). Le chrome HTML autour est
 * lui localisé dans 6 langues par `report-export.ts`.
 */

import type { ModuleReport, ReportSection, BriefField, ModelRecommendation } from "./report-export";
import type { BrandBrief } from "./prompt-generator";

// ─── Méta-données des 10 modules ────────────────────────────────────────────

export const MODULE_META: Record<string, {
  id: string;
  number: string;
  name: string;
  tagline: string;
  accentHex: string;
}> = {
  "brand-identity": { id: "brand-identity", number: "01", name: "Brand Identity", tagline: "Logo, palette, typographie et guidelines de marque.", accentHex: "C8A96E" },
  "visual-content": { id: "visual-content", number: "02", name: "Visual Content", tagline: "Photos produit, lifestyle, détails, before/after, virtual try-on et carrousels.", accentHex: "F59E0B" },
  "video-content": { id: "video-content", number: "03", name: "Video Content", tagline: "Hooks, plans, motion design et scripts vidéo prêts à produire.", accentHex: "F43F5E" },
  "ad-creatives": { id: "ad-creatives", number: "04", name: "Ad Creatives", tagline: "Bannières, statics, vidéos courtes et déclinaisons multi-formats publicitaires.", accentHex: "A855F7" },
  "sound-music": { id: "sound-music", number: "05", name: "Sound & Music", tagline: "Jingles, voix off, ambiances sonores et signatures audio de marque.", accentHex: "FB923C" },
  "copy-writing": { id: "copy-writing", number: "06", name: "Copywriting", tagline: "Slogans, hooks, descriptions produit et copies optimisées conversion.", accentHex: "8B5CF6" },
  "launch-assets": { id: "launch-assets", number: "07", name: "Launch Assets", tagline: "Landing page, emails de lancement, assets PR et plan de séquence.", accentHex: "10B981" },
  "chatbot-cs": { id: "chatbot-cs", number: "08", name: "Chatbot & Customer Service", tagline: "Persona conversationnelle, scripts de réponse et arbres de décision SAV.", accentHex: "3B82F6" },
  "upsell-engine": { id: "upsell-engine", number: "09", name: "Upsell Engine", tagline: "Bundles, cross-sells, upgrades et séquences de relance.", accentHex: "06B6D4" },
  "performance-analytics": { id: "performance-analytics", number: "10", name: "Performance & Analytics", tagline: "KPIs, tableaux de bord, alertes et rapports de performance marque.", accentHex: "22C55E" },
};

// ─── Catalogue modèles IA recommandés par module ────────────────────────────

const MODELS: Record<string, ModelRecommendation[]> = {
  "brand-identity": [
    { name: "Midjourney V7", useCase: "logos premium, monogrammes, directions artistiques luxe", howToUse: "Colle le prompt complet dans Imagine, garde les paramètres techniques et ajoute --style raw pour un rendu plus fidèle.", url: "https://www.midjourney.com", badge: "TOP" },
    { name: "Ideogram 3.0", useCase: "logos avec texte lisible et lettering de marque", howToUse: "Utilise-le quand le nom de marque doit apparaître proprement dans le logo.", url: "https://ideogram.ai" },
    { name: "Recraft V3", useCase: "icônes vectorielles, SVG et systèmes de marque", howToUse: "Colle les sections symbole, palette et contraintes SVG pour obtenir une base vectorielle exploitable.", url: "https://www.recraft.ai" },
    { name: "GPT-Image", useCase: "brief créatif précis et déclinaisons contrôlées", howToUse: "Demande une planche de 4 directions logo pour comparer avant finalisation.", url: "https://chatgpt.com" },
    { name: "Claude Sonnet", useCase: "guidelines, charte narrative et règles Do/Don't", howToUse: "Colle le prompt et demande une charte rédigée en sections prêtes à maqueter.", url: "https://claude.ai" },
  ],
  "visual-content": [
    { name: "Midjourney V7", useCase: "photos produit et lifestyle premium hyperréalistes", howToUse: "Colle le prompt entier, ajoute --ar 4:5 pour Instagram ou --ar 16:9 pour bannières.", url: "https://www.midjourney.com", badge: "TOP" },
    { name: "FLUX.1 Pro", useCase: "rendu produit ultra-détaillé, matières et éclairage cinéma", howToUse: "Idéal pour photos packshot et détails matière. Garde les keywords techniques du prompt.", url: "https://blackforestlabs.ai" },
    { name: "Higgsfield", useCase: "photos lifestyle avec mannequins et mises en scène", howToUse: "Particulièrement fort sur scènes humaines et émotion. Préserve les indications de pose et lumière.", url: "https://higgsfield.ai" },
    { name: "Nano Banana / Gemini Image", useCase: "before/after, retouches et virtual try-on rapide", howToUse: "Upload la photo source + le prompt — excellent pour transformations contextuelles.", url: "https://gemini.google.com" },
    { name: "Recraft V3", useCase: "carrousels Instagram, mockups et déclinaisons graphiques", howToUse: "Utilise pour générer toutes les pages d'un carrousel avec direction visuelle cohérente.", url: "https://www.recraft.ai" },
  ],
  "video-content": [
    { name: "Sora 2", useCase: "vidéos cinéma, plans-séquence narratifs et hooks premium", howToUse: "Colle le script de plan tel quel, génère 8 secondes, puis enchaîne les plans.", url: "https://openai.com/sora", badge: "TOP" },
    { name: "Veo 3.1", useCase: "vidéos produit longues, motion fluide et son synchronisé", howToUse: "Idéal jusqu'à 60 secondes avec son intégré. Préserve les indications caméra du prompt.", url: "https://deepmind.google/technologies/veo" },
    { name: "Runway Gen-3 Alpha", useCase: "transitions, motion design et effets stylisés", howToUse: "Excellent pour image-to-video. Upload une frame clé et applique le mouvement décrit.", url: "https://runwayml.com" },
    { name: "Kling 2.0", useCase: "personnages, danse, mouvements humains réalistes", howToUse: "Le meilleur pour scènes humaines longues. Garde les directions de pose et émotion.", url: "https://klingai.com" },
    { name: "Luma Dream Machine", useCase: "loops courts, éléments graphiques animés", howToUse: "Parfait pour boucles 5s d'éléments produit ou logo en mouvement.", url: "https://lumalabs.ai/dream-machine" },
  ],
  "ad-creatives": [
    { name: "Midjourney V7 + Photoshop AI", useCase: "statics publicitaires premium toutes plateformes", howToUse: "Génère le visuel principal sur MJ, puis ajoute texte et CTA dans Photoshop avec génération générative.", url: "https://www.midjourney.com", badge: "TOP" },
    { name: "Veo 3.1", useCase: "vidéos pub courtes (15s, 30s, 60s) avec son intégré", howToUse: "Colle le script de spot publicitaire, génère plusieurs variations, monte la meilleure.", url: "https://deepmind.google/technologies/veo" },
    { name: "Recraft V3", useCase: "déclinaisons multi-formats (1:1, 9:16, 16:9, 4:5) cohérentes", howToUse: "Utilise les templates pour produire toutes les tailles requises par Meta/TikTok/Google.", url: "https://www.recraft.ai" },
    { name: "Krea AI", useCase: "itérations rapides et A/B tests visuels", howToUse: "Génère 8-16 variantes du même prompt pour tester les meilleurs hooks visuels.", url: "https://krea.ai" },
    { name: "Canva Magic Studio", useCase: "templates publicitaires éditables et déclinaison rapide", howToUse: "Importe les visuels MJ et ajoute branding, copies et CTAs avec les templates Canva Pro.", url: "https://canva.com" },
  ],
  "sound-music": [
    { name: "Suno V4", useCase: "jingles, musiques de marque, hymnes publicitaires complets", howToUse: "Colle la description musicale et les paroles. Génère 2 versions par run pour comparer.", url: "https://suno.com", badge: "TOP" },
    { name: "Udio", useCase: "compositions instrumentales premium et ambiances longues", howToUse: "Idéal pour sound design d'événement ou musique d'attente. Préserve mood et BPM.", url: "https://udio.com" },
    { name: "ElevenLabs V3", useCase: "voix off multilingues, voix de marque clonée", howToUse: "Colle le script de voix off ; choisis une voix qui matche le persona décrit.", url: "https://elevenlabs.io" },
    { name: "Stable Audio 2.0", useCase: "effets sonores courts (UI, transitions, sting)", howToUse: "Génère des SFX de 5-15 secondes pour habiller vidéos et interfaces produit.", url: "https://stableaudio.com" },
    { name: "AIVA", useCase: "musiques orchestrales et bandes-son cinématiques", howToUse: "Pour des films de marque ou intros corporate haut-de-gamme.", url: "https://aiva.ai" },
  ],
  "copy-writing": [
    { name: "Claude Sonnet 4.5", useCase: "rédaction longue, ton de marque nuancé, storytelling", howToUse: "Colle le prompt complet — Claude excelle pour copies à voix singulière et émotionnelle.", url: "https://claude.ai", badge: "TOP" },
    { name: "GPT-5.2", useCase: "structures persuasives, headlines, hooks viraux courts", howToUse: "Demande 10 variantes du même message pour A/B test, puis itère sur les 3 meilleures.", url: "https://chatgpt.com" },
    { name: "Gemini 2.5 Pro", useCase: "copies SEO, descriptions produit longues et research", howToUse: "Excellent pour intégrer recherche concurrentielle et keywords dans le copy.", url: "https://gemini.google.com" },
    { name: "Perplexity Pro", useCase: "vérification des claims, sourcing données et stats", howToUse: "Utilise pour valider chaque chiffre ou statistique mentionné dans la copy.", url: "https://perplexity.ai" },
    { name: "Jasper / Copy.ai", useCase: "déclinaisons multi-formats (email, ads, social, web)", howToUse: "Importe le copy maître et décline-le par format avec les templates dédiés.", url: "https://jasper.ai" },
  ],
  "launch-assets": [
    { name: "v0.dev (Vercel)", useCase: "landing pages premium prêtes à déployer", howToUse: "Colle le prompt landing — v0 produit du React/Tailwind directement déployable.", url: "https://v0.dev", badge: "TOP" },
    { name: "Cursor + Claude", useCase: "intégration custom et personnalisation avancée", howToUse: "Ouvre le prompt dans Cursor, demande à Claude de scaffolder le projet complet.", url: "https://cursor.sh" },
    { name: "Framer AI", useCase: "landing pages no-code stylées et publication immédiate", howToUse: "Importe le prompt comme brief Framer et personnalise visuellement.", url: "https://framer.com" },
    { name: "Webflow AI", useCase: "sites complets avec CMS et e-commerce intégré", howToUse: "Idéal si tu veux un CMS éditable. Le prompt sert de blueprint structurel.", url: "https://webflow.com" },
    { name: "Claude Artifacts", useCase: "prototypage rapide en HTML/CSS standalone", howToUse: "Pour valider la structure avant intégration. Génère un MVP cliquable en quelques minutes.", url: "https://claude.ai" },
  ],
  "chatbot-cs": [
    { name: "Claude Sonnet 4.5", useCase: "persona conversationnelle nuancée et empathique", howToUse: "Colle le system prompt persona — Claude tient le ton et la voix de marque sur des conversations longues.", url: "https://claude.ai", badge: "TOP" },
    { name: "GPT-5.2 (Custom GPT)", useCase: "chatbot déployable directement avec mémoire", howToUse: "Crée un Custom GPT avec le prompt de persona — partage le lien à ton équipe ou clients.", url: "https://chatgpt.com" },
    { name: "Voiceflow", useCase: "arbres de décision visuels et intégration multi-canal", howToUse: "Importe les flows et arbres de décision du prompt dans Voiceflow pour déploiement omnichannel.", url: "https://voiceflow.com" },
    { name: "Intercom Fin AI", useCase: "chatbot SAV intégré au support client existant", howToUse: "Utilise le prompt persona comme base de Fin Profile + injecte ta knowledge base.", url: "https://intercom.com/fin" },
    { name: "Cohere Command R+", useCase: "chatbot multilingue avec retrieval augmenté", howToUse: "Idéal si tu sers plusieurs marchés. Colle le prompt persona et connecte ta documentation.", url: "https://cohere.com" },
  ],
  "upsell-engine": [
    { name: "GPT-5.2", useCase: "raisonnement bundles, calcul AOV et stratégie cross-sell", howToUse: "Colle le prompt et demande une matrice de bundles avec marge cible et logique d'association.", url: "https://chatgpt.com", badge: "TOP" },
    { name: "Claude Sonnet 4.5", useCase: "scripts d'upsell email/SMS persuasifs et personnalisés", howToUse: "Excellent pour rédiger les séquences relance avec ton de marque cohérent.", url: "https://claude.ai" },
    { name: "Klaviyo AI", useCase: "déploiement direct des séquences email d'upsell", howToUse: "Importe les copies générées dans Klaviyo et configure les triggers automatiques.", url: "https://klaviyo.com" },
    { name: "ReConvert / Honeycomb Upsell", useCase: "post-purchase upsells natifs Shopify", howToUse: "Colle les prompts d'offres post-achat dans les apps Shopify dédiées.", url: "https://reconvert.io" },
    { name: "Gemini 2.5 Pro", useCase: "analyse panier moyen et recommandations data-driven", howToUse: "Upload tes données ventes + le prompt — Gemini propose des bundles fondés sur les co-occurrences réelles.", url: "https://gemini.google.com" },
  ],
  "performance-analytics": [
    { name: "GPT-5.2 (Advanced Data Analysis)", useCase: "analyse de KPIs, dashboards et insights actionnables", howToUse: "Upload tes exports CSV + le prompt d'audit — obtiens un rapport structuré et des recommandations.", url: "https://chatgpt.com", badge: "TOP" },
    { name: "Claude Sonnet 4.5", useCase: "rapports executive-summary et synthèses stratégiques", howToUse: "Colle les données brutes et le prompt — Claude rédige un rapport prêt-board.", url: "https://claude.ai" },
    { name: "Hex / Mode Analytics", useCase: "notebooks SQL + IA pour exploration de données", howToUse: "Importe les requêtes SQL générées par le prompt pour suivi continu.", url: "https://hex.tech" },
    { name: "Looker Studio + Gemini", useCase: "tableaux de bord visuels et alertes automatiques", howToUse: "Configure les KPIs du prompt comme widgets et active les alertes Gemini.", url: "https://lookerstudio.google.com" },
    { name: "Perplexity Pro", useCase: "benchmark sectoriel et veille concurrentielle continue", howToUse: "Programme des recherches récurrentes pour comparer tes KPIs au marché.", url: "https://perplexity.ai" },
  ],
};

export function getModelsForModule(moduleId: string): ModelRecommendation[] {
  return MODELS[moduleId] ?? [];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function briefToFields(brief: BrandBrief): BriefField[] {
  const out: BriefField[] = [];
  const push = (label: string, value: unknown) => {
    if (value === undefined || value === null) return;
    const v = Array.isArray(value) ? value.filter(Boolean).join(", ") : String(value);
    if (!v.trim()) return;
    out.push({ label, value: v });
  };
  push("Marque", brief.brand_name);
  push("Secteur", brief.sector);
  push("Ton", brief.tone);
  push("Valeurs", brief.values);
  push("Mission", (brief as any).mission);
  push("Audience cible", (brief as any).target_audience);
  push("Démographique", (brief as any).target_demographic);
  push("Produit principal", (brief as any).product_name);
  push("Type de produit", (brief as any).product_type);
  push("Couleurs produit", (brief as any).product_colors);
  push("Matériaux", (brief as any).product_materials);
  push("Couleurs marque", (brief as any).colors);
  push("Concurrents", (brief as any).competitors);
  push("Mots interdits", (brief as any).forbidden_keywords);
  return out;
}

// ─── Builder pour modules 02→10 (structure sections+data) ───────────────────

interface SectionLike {
  key: string;
  label?: string;
  agent?: string;
  data?: Record<string, unknown>;
  rawContent?: string;
}

export function buildSectionsReport(
  moduleId: string,
  brief: BrandBrief,
  sections: SectionLike[],
  options?: {
    /** Mapping facultatif key→label de sous-prompt par section. */
    subPromptLabels?: Record<string, Record<string, string>>;
  },
): ModuleReport {
  const meta = MODULE_META[moduleId];
  if (!meta) throw new Error(`Unknown moduleId: ${moduleId}`);

  const models = getModelsForModule(moduleId);
  const reportSections: ReportSection[] = [];

  for (const sec of sections) {
    const subLabels = options?.subPromptLabels?.[sec.key] ?? {};
    const data = sec.data ?? {};
    const entries = Object.entries(data).filter(([, v]) => typeof v === "string" && v.trim().length > 0);

    if (entries.length === 0 && sec.rawContent && sec.rawContent.trim()) {
      reportSections.push({
        key: sec.key,
        title: sec.label ?? sec.key,
        agent: sec.agent,
        prompt: sec.rawContent,
        recommendedModels: models,
      });
      continue;
    }

    for (const [k, v] of entries) {
      const label = subLabels[k] ?? k.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
      reportSections.push({
        key: `${sec.key}__${k}`,
        title: `${sec.label ?? sec.key} — ${label}`,
        agent: sec.agent,
        prompt: typeof v === "string" ? v : JSON.stringify(v, null, 2),
        recommendedModels: models,
      });
    }
  }

  return {
    moduleId: meta.id,
    moduleNumber: meta.number,
    moduleName: meta.name,
    moduleTagline: meta.tagline,
    accentHex: meta.accentHex,
    brief: briefToFields(brief),
    sections: reportSections,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Builder spécifique module 01 ───────────────────────────────────────────

export function buildModule01Report(
  brief: BrandBrief,
  result: {
    modules?: {
      brand_identity?: {
        logo?: { agent?: string; prompt?: string };
        palette?: { agent?: string; prompt?: string };
        typography?: { agent?: string; prompt?: string };
        guidelines?: { agent?: string; prompt?: string };
      };
    };
  },
  perSectionModels?: Record<string, ModelRecommendation[]>,
): ModuleReport {
  const meta = MODULE_META["brand-identity"];
  const fallback = getModelsForModule("brand-identity");
  const bi = result.modules?.brand_identity ?? {};

  const items: Array<{ key: string; title: string; data?: { agent?: string; prompt?: string } }> = [
    { key: "logo", title: "Logo & Symbole", data: bi.logo },
    { key: "palette", title: "Palette de couleurs", data: bi.palette },
    { key: "typography", title: "Système typographique", data: bi.typography },
    { key: "guidelines", title: "Brand Guidelines", data: bi.guidelines },
  ];

  const sections: ReportSection[] = items
    .filter((it) => it.data?.prompt)
    .map((it) => ({
      key: it.key,
      title: it.title,
      agent: it.data?.agent,
      prompt: it.data?.prompt ?? "",
      recommendedModels: perSectionModels?.[it.key] ?? fallback,
    }));

  return {
    moduleId: meta.id,
    moduleNumber: meta.number,
    moduleName: meta.name,
    moduleTagline: meta.tagline,
    accentHex: meta.accentHex,
    brief: briefToFields(brief),
    sections,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Builder spécifique module 07 (combined_document) ───────────────────────

export function buildModule07Report(
  brief: BrandBrief,
  sections: SectionLike[],
  combinedDocument?: string,
): ModuleReport {
  const base = buildSectionsReport("launch-assets", brief, sections);
  if (combinedDocument && combinedDocument.trim()) {
    base.sections.unshift({
      key: "combined_document",
      title: "Document combiné — Brief + Spec landing complet",
      agent: "Launch Orchestrator",
      prompt: combinedDocument,
      recommendedModels: getModelsForModule("launch-assets"),
      tips: "Ce document compile tout : brief stratégique + specs techniques. Colle-le tel quel dans v0.dev, Cursor ou Claude Artifacts pour scaffolder ta landing page complète en un seul prompt.",
    });
  }
  return base;
}
