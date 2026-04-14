import { Router, type IRouter } from "express";
import { cerebrasAI, CEREBRAS_MODEL } from "../../lib/cerebras-client";
import { buildSystemPrompt, buildNegativePrompt } from "../../lib/prompt-utils";

const router: IRouter = Router();

// ─── Helpers de détection automatique ──────────────────────────────────────

const PRODUCT_ANGLES: Record<string, Record<string, string>> = {
  bijou: { front: "Vue de face", profile: "Vue de profil", three_quarter: "Vue en 3/4", macro: "Macro sertissage/pierres", top: "Vue de dessus" },
  vêtement: { front: "Vue de face", back: "Vue de dos", detail_collar: "Détail col", detail_seam: "Détail coutures", three_quarter: "Vue en 3/4" },
  sac: { front: "Vue de face", profile: "Vue de profil", top: "Vue de dessus", interior: "Intérieur/doublure", detail_zipper: "Détail fermeture" },
  cosmétique: { front: "Vue de face", top: "Vue de dessus", three_quarter: "Vue en 3/4", macro_texture: "Macro texture produit", hand_holding: "Tenu en main" },
  tech: { front: "Vue de face", profile: "Vue de profil", three_quarter: "Vue en 3/4", macro_port: "Macro connecteurs", bottom: "Vue de dessous" },
  fitness: { front: "Vue de face", back: "Vue de dos", three_quarter: "Vue en 3/4", detail_fabric: "Détail tissu technique", action: "En mouvement" },
  lunettes: { front: "Vue de face", profile: "Vue de profil", three_quarter: "Vue en 3/4", detail_hinge: "Détail charnières", top: "Vue de dessus" },
};

const BEFORE_AFTER_MAP: Record<string, string> = {
  bijou: "object", maroquinerie: "object", cosmétique: "skin", skincare: "skin",
  fitness: "body", mode: "object", streetwear: "object", décoration: "object",
  montres: "object", gadgets: "object", luxe: "object", autre: "object",
};

const CAROUSEL_STYLE_MAP: Record<string, string> = {
  bijou: "luxe", luxe: "luxe", maroquinerie: "luxe", montres: "luxe",
  cosmétique: "probleme_solution", skincare: "probleme_solution", fitness: "probleme_solution",
  tech: "education", gadgets: "education",
  mode: "storytelling", streetwear: "storytelling", décoration: "storytelling",
};

const TRYON_CATEGORY_MAP: Record<string, string> = {
  bijou: "bijou", vêtement: "vêtement", sac: "sac",
  lunettes: "lunettes", cosmétique: "vêtement", fitness: "vêtement",
};

const AUDIENCE_PROFILES: Record<string, [string, string]> = {
  femmes_18_25: ["jeune femme 20-25 ans, peau claire, cheveux bruns, style urbain dynamique", "jeune femme 22-25 ans, peau miel, cheveux noirs longs, style sportif chic"],
  femmes_25_45: ["femme élégante 30-35 ans, peau claire, cheveux châtains, style sophistiqué", "femme distinguée 38-42 ans, peau mate, cheveux noirs, style professionnel"],
  femmes_35_50: ["femme raffinée 38-42 ans, peau claire, cheveux blonds, style luxe", "femme élégante 45-50 ans, peau mate, cheveux grisonnants stylisés, style contemporain"],
  hommes_25_40: ["homme élancé 28-32 ans, peau claire, cheveux bruns courts, style décontracté chic", "homme sportif 33-38 ans, peau mate, barbe soignée, style urban chic"],
  mixte: ["femme élégante 28-35 ans, peau claire, cheveux bruns, style moderne et accessible", "homme distingué 30-38 ans, peau mate, style urban chic"],
};

const SCENARIO_DETAILS: Record<string, { context: string; before: string; after: string }> = {
  skin: {
    context: "Transformation cutanée suite à une routine skincare",
    before: "Peau avec imperfections cutanées (rougeurs, pores dilatés, teint irrégulier), expression neutre",
    after: "Peau unifiée, lumineuse, éclatante, hydratée. Expression confiante et radieuse",
  },
  body: {
    context: "Transformation physique suite à un programme fitness",
    before: "Corps non tonique, posture neutre, vêtements fitness basiques. Expression neutre",
    after: "Corps tonique et musclé, posture confiante, même vêtements fitness. Expression rayonnante",
  },
  hair: {
    context: "Transformation capillaire (soin, traitement)",
    before: "Cheveux secs, abîmés, ternes, sans volume ni brillance",
    after: "Cheveux brillants, soyeux, hydratés. Volume naturel et mouvement",
  },
  object: {
    context: "Transformation du produit (avant/après traitement, restauration ou première utilisation)",
    before: "Produit/objet terne, vieilli, abîmé ou dans son état brut avant traitement",
    after: "Même produit/objet restauré, éclatant, brillant, comme neuf après traitement",
  },
};

const CAROUSEL_NARRATIVES: Record<string, string[]> = {
  luxe: [
    "Slide 1 – Ambiance luxe: visuel d'ouverture immersif, produit mis en valeur dans un décor haut de gamme. Texte: 'L'excellence à portée de main'",
    "Slide 2 – Matériaux nobles: gros plan sur les matières d'exception (or, cuir, soie). Texte: 'Des matériaux d'exception'",
    "Slide 3 – Savoir-faire: artisan ou processus de création. Texte: 'Un héritage de savoir-faire'",
    "Slide 4 – Exclusivité: édition limitée, coffret luxe. Texte: 'Une pièce unique'",
    "Slide 5 – CTA: logo sur fond noir, reflets dorés. Texte: 'Découvrez la collection'",
  ],
  probleme_solution: [
    "Slide 1 – Accroche lifestyle: produit en situation, visuel accrocheur. Texte: 'Vous connaissez ce problème?'",
    "Slide 2 – Problème: situation sans produit, expression frustrée ou problème visible",
    "Slide 3 – Produit: mise en valeur du produit, bénéfice principal visible. Texte: 'La solution'",
    "Slide 4 – Résultat: après utilisation, transformation visible. Expression confiante",
    "Slide 5 – CTA: logo + produit + offre spéciale. Texte: 'Essayez maintenant'",
  ],
  storytelling: [
    "Slide 1 – Contexte: mise en scène du besoin, ambiance narrative. Texte: 'Imaginez...'",
    "Slide 2 – Découverte: moment de découverte du produit, surprise. Texte: 'Et si la solution existait?'",
    "Slide 3 – Transformation: produit en action, usage concret. Texte: 'La révélation'",
    "Slide 4 – Résultat: satisfaction, bonheur, résultat visible. Texte: 'La vie a changé'",
    "Slide 5 – Invitation: logo, produit, CTA doux. Texte: 'Votre histoire commence ici'",
  ],
  education: [
    "Slide 1 – Question: visuel interrogatif, curiosité suscitée. Texte: 'Saviez-vous que...?'",
    "Slide 2 – Explication: schéma simple ou produit décomposé. Texte: 'Voici pourquoi'",
    "Slide 3 – Démonstration: produit en utilisation réelle. Texte: 'Comment ça marche'",
    "Slide 4 – Résultats: données chiffrées ou transformation visible. Texte: 'Les résultats parlent'",
    "Slide 5 – CTA: logo + offre. Texte: 'Prêt à essayer?'",
  ],
};

function parseJsonSafe(text: string): Record<string, string> | null {
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

router.post("/openai/enhance-prompts-visual", async (req, res) => {
  const {
    brand_name, sector, product_type, product_name,
    product_colors = [], product_materials = [],
    target_audience, carousel_style: carousel_style_override = null,
    brand_colors = "",
  } = req.body as {
    brand_name: string; sector: string; product_type: string;
    product_name: string; product_colors?: string[];
    product_materials?: string[]; target_audience: string;
    carousel_style?: string | null; brand_colors?: string;
  };

  if (!brand_name || !sector || !product_type || !product_name || !target_audience) {
    res.status(400).json({ error: "Champs requis manquants" });
    return;
  }

  const angles = PRODUCT_ANGLES[product_type] ?? PRODUCT_ANGLES["bijou"];
  const baScenario = BEFORE_AFTER_MAP[sector] ?? "object";
  const scenarioInfo = SCENARIO_DETAILS[baScenario];
  const carouselStyle = carousel_style_override ?? CAROUSEL_STYLE_MAP[sector] ?? "probleme_solution";
  const carouselNarrative = CAROUSEL_NARRATIVES[carouselStyle];
  const tryonCategory = TRYON_CATEGORY_MAP[product_type] ?? "vêtement";
  const audienceProfiles = AUDIENCE_PROFILES[target_audience] ?? AUDIENCE_PROFILES["mixte"];

  // Matériaux pour les photos détail (2 max)
  let materials = product_materials.slice(0, 2);
  if (materials.length < 2) {
    const fallbacks: Record<string, string> = { bijou: "pierre précieuse", sac: "cuir", vêtement: "textile", cosmétique: "verre", tech: "plastique premium" };
    materials.push(fallbacks[product_type] ?? "métal");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const SECTIONS = [
    {
      key: "product_photos",
      label: "Photos Produit — 5 Angles",
      agent: "Product Display Agent / Image Generation",
      buildUserPrompt: () => {
        const anglesList = Object.entries(angles).map(([k, v]) => `"${k}": "${v}"`).join(", ");
        return `Tu es un expert RoboNeo en photographie produit professionnelle studio.

Génère exactement 5 prompts photo produit studio pour "${product_name}" (${product_type}) — Marque: ${brand_name} (${sector}).
Couleurs: ${product_colors.join(", ") || "naturelles"}
Matériaux: ${product_materials.join(", ") || "non spécifiés"}
Cible: ${target_audience}

Angles: ${anglesList}

RÈGLES STRICTES:
• Fond blanc pur professionnel, éclairage studio 3 points
• Format carré 2000×2000px, qualité commerciale premium
• Chaque prompt en français, 4-6 phrases ultra-précises
• Décrire: le produit exact, l'angle précis, le type d'éclairage, les ombres, les reflets, les détails clés du matériau/couleur
• Vocabulaire de photographe professionnel (key light, fill light, rim light, f/8, ISO 100, etc.)

Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans texte):
{${Object.keys(angles).map((k) => `\n  "${k}": "prompt complet"`).join(",")}\n}`;
      },
    },
    {
      key: "lifestyle_photos",
      label: "Photos Lifestyle — 3 Formats",
      agent: "Image Generation / Background Change",
      buildUserPrompt: () => `Tu es un expert RoboNeo en photographie lifestyle pour réseaux sociaux premium.

Génère 3 prompts lifestyle pour "${product_name}" — Marque: ${brand_name} (${sector}).
Audience: ${target_audience}
Couleurs produit: ${product_colors.join(", ") || "naturelles"}

Formats requis:
• "feed": carré 1080×1080px — Instagram feed, composition parfaite, ambiance marque forte
• "pinterest": vertical 1080×1350px (4:5) — aspirationnel, vie de rêve, lifestyle premium
• "story": vertical 1080×1920px (9:16) — immersif, dynamique, texte espace prévu en haut/bas

RÈGLES:
• Adapté au secteur ${sector}: ${sector === "luxe" || sector === "bijou" ? "décors élégants, lumière dorée heure magique, matières riches" : sector === "fitness" ? "mouvement, énergie, couleurs saturées, lumière naturelle dynamique" : "scènes authentiques, lumière naturelle, vie réelle et aspirationnelle"}
• Produit visible et central mais intégré naturellement
• Mannequin/personne correspondant à ${target_audience}
• 4-6 phrases précises par prompt (décor, lumière, personnage, composition, ambiance)

RÈGLES TECHNIQUES OPTIQUES OBLIGATOIRES:
• Si le prompt inclut un personnage ET un produit dans le même cadre: utiliser f/5.6 minimum pour maintenir les deux nets simultanément — INTERDIT de spécifier un bokeh fort (f/1.8, f/2.0, f/2.2) avec personnage ET produit tous les deux "nets" dans le même plan, c'est physiquement impossible
• Pour un bokeh artistique (fond flou): choisir UN sujet principal net — soit le produit seul (f/1.8-f/2.8), soit le visage avec le produit en arrière-plan flou, jamais les deux simultanément nets à faible ouverture
• Termes vagues à remplacer par des instructions techniques précises: au lieu de "aucune sur-accentuation", spécifier "sharpening: 0, clarity: +10, texture: +15 dans Lightroom"

Retourne UNIQUEMENT un JSON valide:
{
  "feed": "prompt complet",
  "pinterest": "prompt complet",
  "story": "prompt complet"
}`,
    },
    {
      key: "detail_photos",
      label: "Photos Détail & Texture",
      agent: "Image Generation (Macro Studio)",
      buildUserPrompt: () => {
        const matList = materials.slice(0, 2);
        const mat0Lower = matList[0].toLowerCase();
        const mat1Lower = matList[1].toLowerCase();
        const isTransparent = (m: string) => m.includes("verre") || m.includes("cristal") || m.includes("transparent") || m.includes("acrylique");
        const focusStack0 = isTransparent(mat0Lower) ? "focus stacking: ON (5-7 couches, empilage logiciel Helicon Focus) — obligatoire pour les matériaux transparents avec profondeur optique" : "mise au point unique sur la texture de surface, focus stacking: optionnel";
        const focusStack1 = isTransparent(mat1Lower) ? "focus stacking: ON (5-7 couches, empilage logiciel Helicon Focus) — obligatoire pour les matériaux transparents avec profondeur optique" : "mise au point unique sur la texture de surface, focus stacking: optionnel";
        return `Tu es un expert RoboNeo en photographie macro et texture matériaux.

Génère 2 prompts macro texture pour les matériaux de "${product_name}" — Marque: ${brand_name}.

Matériaux à photographier:
1. "${matList[0]}"
2. "${matList[1]}"

RÈGLES:
• Photographie macro ultra-précise (macro 100mm, bague allonge)
• Texture, grain, fibres ou facettes visibles à l'extrême
• Éclairage adapté mat 1: ${mat0Lower.includes("cuir") || mat0Lower.includes("textile") ? "lumière rasante latérale 15° pour révéler le grain et la texture" : mat0Lower.includes("métal") || mat0Lower.includes("or") ? "éclairage studio contrôlé polarisé, reflets maîtrisés, pas de surexposition spéculaire" : "lumière douce diffuse 5600K, fond neutre 18% gris"}
• Éclairage adapté mat 2: ${mat1Lower.includes("cuir") || mat1Lower.includes("textile") ? "lumière rasante latérale 15° pour révéler le grain et la texture" : mat1Lower.includes("métal") || mat1Lower.includes("or") ? "éclairage studio contrôlé polarisé, reflets maîtrisés, pas de surexposition spéculaire" : "lumière douce diffuse 5600K, fond neutre 18% gris"}
• Mat 1 — ${focusStack0}
• Mat 2 — ${focusStack1}
• Format carré 2000×2000px, fond neutre ou sombre
• Accentuation précise: sharpening +60, clarity +20, texture +30 (paramètres Lightroom) — jamais de termes vagues comme "accentuation naturelle"
• 4-5 phrases: objectif, éclairage, mise au point, texture, ambiance

Retourne UNIQUEMENT un JSON valide:
{
  "${matList[0]}": "prompt macro complet",
  "${matList[1]}": "prompt macro complet"
}`;
      },
    },
    {
      key: "before_after",
      label: "Before / After Studio",
      agent: "Portrait Retouching Agent",
      buildUserPrompt: () => `Tu es un expert RoboNeo en création de visuels Before/After pour le marketing.

Génère un set Before/After pour "${product_name}" — Marque: ${brand_name} (${sector}).

Contexte de transformation: ${scenarioInfo.context}
BEFORE: ${scenarioInfo.before}
AFTER: ${scenarioInfo.after}

Audience: ${target_audience}

RÈGLES ABSOLUES:
• MÊME éclairage, MÊME angle, MÊME cadrage pour before ET after (cohérence absolue)
• Format carré 1080×1080px
• Transformation crédible, progressive et réaliste (pas exagérée)
• Before: lumière neutre légèrement froide, expression neutre ou légère frustration
• After: même lumière, légère chaleur en plus, expression confiante et positive
• 5-6 phrases ultra-précises par prompt

DISCLAIMER RÉGLEMENTAIRE OBLIGATOIRE (à inclure dans chaque prompt):
• Ajouter en bas du visuel une mention lisible: "Visuel à usage créatif uniquement — résultats non contractuels"
• Pour les secteurs cosmétique/skincare: ajouter "Ce visuel ne constitue pas une allégation de performance conforme à la Directive UE 655/2013 sur les produits cosmétiques"
• Zone de mention: bande de 40px en bas, texte blanc sur fond semi-transparent #000000 à 60%, police 10px minimum
• Ne jamais suggérer des résultats garantis ou mesurables sans données cliniques fournies dans le brief

Retourne UNIQUEMENT un JSON valide:
{
  "before": "prompt before complet",
  "after": "prompt after complet"
}`,
    },
    {
      key: "lookbook",
      label: "Lookbook & Fashion Editorial — 2 Modèles",
      agent: "AI Wardrobe / Fashion Editorial",
      buildUserPrompt: () => `Tu es un expert RoboNeo en direction artistique lookbook et photographie fashion editorial.

Génère 2 prompts de photographie fashion editorial (style lookbook magazine) pour "${product_name}" (${tryonCategory}) — Marque: ${brand_name}.
Note: il s'agit de photographie fashion/lookbook stylisée, pas de virtual try-on technologique au sens IA.

Profil Modèle 1: ${audienceProfiles[0]}
Profil Modèle 2: ${audienceProfiles[1]}

Couleurs produit: ${product_colors.join(", ") || "naturelles"}

RÈGLES:
• Fond studio professionnel (cyc blanc ou dégradé neutre) ou décor éditorial cohérent avec la marque
• Éclairage 3 points professionnel (key light 45°, fill light, rim light cheveux)
• Produit parfaitement visible, bien ajusté, porté naturellement dans une composition éditoriale
• Format portrait 1080×1350px (4:5) — style magazine de mode
• Expression confiante, posture naturelle mais travaillée, regard caméra ou regard détourné selon l'ambiance
• Direction artistique précise: hauteur modèle, morphologie, teint, coiffure, expression, pose exacte, tenue complète
• Ambiance éditoriale: référence à un style (Vogue minimal, Harper's Bazaar, Dazed & Confused, etc.)
• 5-6 phrases par prompt

Retourne UNIQUEMENT un JSON valide:
{
  "model_1": "prompt lookbook modèle 1 complet",
  "model_2": "prompt lookbook modèle 2 complet"
}`,
    },
    {
      key: "carousel",
      label: `Carrousel ${carouselStyle.toUpperCase()} — 5 Slides`,
      agent: "AI Poster Agent",
      buildUserPrompt: () => `Tu es un expert RoboNeo en design de carrousels Instagram pour le marketing de contenu premium.

Génère 5 prompts visuels pour un carrousel "${carouselStyle.toUpperCase()}" pour "${product_name}" — Marque: ${brand_name} (${sector}).

Audience: ${target_audience}
Couleurs marque: ${product_colors.join(", ") || "identité marque"}
Format: carré 1080×1080px pour chaque slide

Narrative à suivre:
${carouselNarrative.map((s, i) => `Slide ${i + 1}: ${s}`).join("\n")}

RÈGLES:
• Cohérence visuelle totale (même palette, même style, même typographie sur toutes les slides)
• Chaque slide a un propos visuel distinct mais complémentaire
• Espace prévu pour le texte superposé (zone vide en haut ou bas)
• Adapté au ton ${sector}: ${sector === "luxe" || sector === "bijou" ? "épuré, or et noir, espaces blancs généreux" : sector === "fitness" ? "dynamique, couleurs vives, diagonales" : "moderne, accessible, lifestyle"}
• 5-6 phrases ultra-précises par slide

Retourne UNIQUEMENT un JSON valide:
{
  "slide_1": "prompt slide 1 complet",
  "slide_2": "prompt slide 2 complet",
  "slide_3": "prompt slide 3 complet",
  "slide_4": "prompt slide 4 complet",
  "slide_5": "prompt slide 5 complet"
}`,
    },
  ] as const;

  const body = req.body as any;
  const sectorTone = body.tone ?? "professionnel";
  const sectorValues = body.values ?? sector;
  const negativePart = buildNegativePrompt(sector, sectorTone);
  const colorPriorityBlock = brand_colors
    ? `\n\n⚠️ RÈGLE ABSOLUE COULEURS: Le client a fourni ces couleurs de marque: ${brand_colors}\nCes couleurs sont SACRÉES — les utiliser EXACTEMENT dans tous les visuels. L'auto-détection par secteur est DÉSACTIVÉE.`
    : "";
  const baseSysPrompt = buildSystemPrompt(
    { brand_name, sector, tone: sectorTone, values: sectorValues,
      target_demographic: body.target_demographic ?? undefined,
      competitors: body.competitors ?? undefined,
      forbidden_keywords: body.forbidden_keywords ?? undefined,
      colors: brand_colors || undefined,
    },
    "MODULE 02 — Visual Content (Photos Produit, Lifestyle, Détail, Before/After, Try-On, Carrousel)"
  );
  const systemPrompt = `${baseSysPrompt}${colorPriorityBlock}

IMPORTANT: Tu retournes UNIQUEMENT du JSON valide, sans aucun markdown, sans texte avant ou après le JSON.
Chaque prompt visuel doit inclure un champ "negative_prompt" avec les éléments à éviter: "${negativePart}"`;


  for (const section of SECTIONS) {
    sendEvent(res, { type: "section_start", key: section.key, label: section.label, agent: section.agent });

    let fullContent = "";
    try {
      const stream = await cerebrasAI.chat.completions.create({
        model: CEREBRAS_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: section.buildUserPrompt() },
        ],
        max_tokens: 2000,
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
        carouselStyle: section.key === "carousel" ? carouselStyle : undefined,
      });
    } catch (err) {
      sendEvent(res, {
        type: "section_error",
        key: section.key,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }
  }

  sendEvent(res, { type: "done" });
  res.end();
});

export default router;
