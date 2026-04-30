/**
 * AI BRAND OS — Report Export
 *
 * Génère un dossier HTML "cabinet privé" autonome pour un module ou pour
 * l'ensemble des modules générés. Le HTML est entièrement standalone (pas
 * d'imports externes) avec :
 *  - Design éditorial premium (palette ivoire/or/noir, serif Playfair)
 *  - Brief complet du module
 *  - Pour chaque sous-module : prompt + recommandations modèles IA
 *  - Boutons "cliquer pour copier" (JS inline)
 *  - i18n du chrome (titres, boutons) selon la langue UI
 *
 * Aucun produit final n'est généré : seulement les prompts à utiliser dans
 * les outils IA externes recommandés.
 */

import type { Locale } from "@/i18n";

// ─── Types publics ──────────────────────────────────────────────────────────

export interface ModelRecommendation {
  name: string;
  useCase: string;
  howToUse: string;
  url?: string;
  badge?: string;
}

export interface ReportSection {
  key: string;
  title: string;
  agent?: string;
  prompt: string;
  meta?: Array<{ label: string; value: string }>;
  recommendedModels?: ModelRecommendation[];
  /**
   * Tips ou astuces additionnels (utilisés au-dessus des modèles), localisés.
   * Si absent, le système utilise un texte générique selon la langue.
   */
  tips?: string;
}

export interface BriefField {
  label: string;
  value: string;
}

export interface ModuleReport {
  moduleId: string;
  moduleNumber: string;
  moduleName: string;
  moduleTagline?: string;
  brief: BriefField[];
  sections: ReportSection[];
  /** ISO timestamp */
  generatedAt: string;
  /** Couleur d'accent du module (hex sans #) */
  accentHex?: string;
}

// ─── i18n du chrome HTML ────────────────────────────────────────────────────

type ChromeStrings = {
  cover_label: string;
  brand_label: string;
  generated_on: string;
  page_brief: string;
  page_sections: string;
  page_models: string;
  no_brief: string;
  brief_summary: string;
  agent_label: string;
  prompt_label: string;
  copy_btn: string;
  copied_btn: string;
  copy_full_btn: string;
  models_title: string;
  models_intro: string;
  use_case: string;
  how_to_use: string;
  visit_url: string;
  tips_default: string;
  meta_title: string;
  toc_label: string;
  module_label: string;
  page_label: string;
  footer_signature: string;
  footer_disclaimer: string;
  warning_no_product: string;
  page_intro_title: string;
  page_intro_body: string;
  combined_title: string;
  combined_subtitle: string;
};

const CHROME: Record<Locale, ChromeStrings> = {
  fr: {
    cover_label: "Dossier Stratégique",
    brand_label: "Marque",
    generated_on: "Généré le",
    page_brief: "Brief Stratégique",
    page_sections: "Prompts par sous-module",
    page_models: "Modèles IA recommandés",
    no_brief: "Aucun brief renseigné.",
    brief_summary: "Synthèse du brief",
    agent_label: "Agent",
    prompt_label: "Prompt à utiliser",
    copy_btn: "Copier le prompt",
    copied_btn: "✓ Copié",
    copy_full_btn: "Copier tout le rapport",
    models_title: "Modèles IA idéaux pour exploiter ce prompt",
    models_intro: "Cinq plateformes IA recommandées, classées par cas d'usage. Le prompt ci-dessus est conçu pour donner les meilleurs résultats sur ces outils — copiez-le tel quel.",
    use_case: "Cas d'usage",
    how_to_use: "Comment l'utiliser",
    visit_url: "Accéder",
    tips_default: "Astuce : copiez le prompt complet, choisissez l'un des modèles ci-dessous selon votre cas d'usage, et collez-le sans modification dans l'outil correspondant. Itérez ensuite par variations ciblées.",
    meta_title: "AI BRAND OS — Dossier Cabinet Privé",
    toc_label: "Sommaire",
    module_label: "Module",
    page_label: "Page",
    footer_signature: "INGENIERIE DIGITALE",
    footer_disclaimer: "Document confidentiel — usage interne. AI BRAND OS génère uniquement les prompts d'orchestration IA ; le livrable final reste produit par les outils externes recommandés.",
    warning_no_product: "Ce dossier ne contient pas le livrable final. Il rassemble les prompts optimisés et les modèles IA à utiliser pour produire le livrable.",
    page_intro_title: "Comment exploiter ce dossier",
    page_intro_body: "Chaque sous-module ci-après contient un prompt prêt à l'emploi, l'agent qui l'a calibré, et la liste des modèles IA recommandés pour l'exécuter. Cliquez sur « Copier le prompt » et collez dans l'outil de votre choix.",
    combined_title: "Dossier Complet — Tous les Modules",
    combined_subtitle: "Compilation intégrale des modules générés au sein de la session.",
  },
  en: {
    cover_label: "Strategic Dossier",
    brand_label: "Brand",
    generated_on: "Generated on",
    page_brief: "Strategic Brief",
    page_sections: "Prompts by sub-module",
    page_models: "Recommended AI models",
    no_brief: "No brief filled in.",
    brief_summary: "Brief summary",
    agent_label: "Agent",
    prompt_label: "Prompt to use",
    copy_btn: "Copy prompt",
    copied_btn: "✓ Copied",
    copy_full_btn: "Copy full report",
    models_title: "Best AI models to leverage this prompt",
    models_intro: "Five recommended AI platforms, ranked by use case. The prompt above is engineered for best results on these tools — paste it as-is.",
    use_case: "Use case",
    how_to_use: "How to use",
    visit_url: "Open",
    tips_default: "Tip: copy the full prompt, pick one of the models below based on your use case, and paste it as-is in the corresponding tool. Iterate with targeted variations afterwards.",
    meta_title: "AI BRAND OS — Private Cabinet Dossier",
    toc_label: "Table of contents",
    module_label: "Module",
    page_label: "Page",
    footer_signature: "INGENIERIE DIGITALE",
    footer_disclaimer: "Confidential document — internal use. AI BRAND OS only generates the AI orchestration prompts; the final deliverable is produced by the recommended external tools.",
    warning_no_product: "This dossier does not contain the final deliverable. It gathers the optimized prompts and AI models to use to produce the deliverable.",
    page_intro_title: "How to use this dossier",
    page_intro_body: "Each sub-module below contains a ready-to-use prompt, the agent that calibrated it, and the list of recommended AI models to execute it. Click \"Copy prompt\" and paste into the tool of your choice.",
    combined_title: "Complete Dossier — All Modules",
    combined_subtitle: "Full compilation of modules generated during the session.",
  },
  es: {
    cover_label: "Expediente Estratégico",
    brand_label: "Marca",
    generated_on: "Generado el",
    page_brief: "Brief Estratégico",
    page_sections: "Prompts por sub-módulo",
    page_models: "Modelos IA recomendados",
    no_brief: "No se ha completado ningún brief.",
    brief_summary: "Resumen del brief",
    agent_label: "Agente",
    prompt_label: "Prompt a utilizar",
    copy_btn: "Copiar prompt",
    copied_btn: "✓ Copiado",
    copy_full_btn: "Copiar informe completo",
    models_title: "Modelos IA ideales para este prompt",
    models_intro: "Cinco plataformas IA recomendadas, clasificadas por caso de uso. El prompt anterior está diseñado para dar los mejores resultados en estas herramientas — péguelo tal cual.",
    use_case: "Caso de uso",
    how_to_use: "Cómo usarlo",
    visit_url: "Acceder",
    tips_default: "Consejo: copie el prompt completo, elija uno de los modelos según su caso de uso y péguelo sin modificar en la herramienta. Itere luego con variaciones específicas.",
    meta_title: "AI BRAND OS — Expediente Privado",
    toc_label: "Índice",
    module_label: "Módulo",
    page_label: "Página",
    footer_signature: "INGENIERIE DIGITALE",
    footer_disclaimer: "Documento confidencial — uso interno. AI BRAND OS sólo genera los prompts de orquestación IA; el entregable final lo producen las herramientas externas recomendadas.",
    warning_no_product: "Este expediente no contiene el entregable final. Reúne los prompts optimizados y los modelos IA a utilizar para producirlo.",
    page_intro_title: "Cómo usar este expediente",
    page_intro_body: "Cada sub-módulo contiene un prompt listo para usar, el agente que lo calibró, y la lista de modelos IA recomendados. Haga clic en \"Copiar prompt\" y péguelo en la herramienta de su elección.",
    combined_title: "Expediente Completo — Todos los Módulos",
    combined_subtitle: "Compilación íntegra de los módulos generados durante la sesión.",
  },
  de: {
    cover_label: "Strategie-Dossier",
    brand_label: "Marke",
    generated_on: "Erstellt am",
    page_brief: "Strategisches Briefing",
    page_sections: "Prompts pro Teilmodul",
    page_models: "Empfohlene KI-Modelle",
    no_brief: "Kein Briefing ausgefüllt.",
    brief_summary: "Briefing-Zusammenfassung",
    agent_label: "Agent",
    prompt_label: "Zu verwendender Prompt",
    copy_btn: "Prompt kopieren",
    copied_btn: "✓ Kopiert",
    copy_full_btn: "Vollständigen Bericht kopieren",
    models_title: "Beste KI-Modelle für diesen Prompt",
    models_intro: "Fünf empfohlene KI-Plattformen, sortiert nach Anwendungsfall. Der Prompt oben ist auf beste Ergebnisse mit diesen Tools ausgelegt — fügen Sie ihn unverändert ein.",
    use_case: "Anwendungsfall",
    how_to_use: "Anwendung",
    visit_url: "Öffnen",
    tips_default: "Tipp: Kopieren Sie den vollständigen Prompt, wählen Sie ein Modell nach Anwendungsfall und fügen Sie ihn unverändert ein. Iterieren Sie danach mit gezielten Variationen.",
    meta_title: "AI BRAND OS — Vertrauliches Dossier",
    toc_label: "Inhalt",
    module_label: "Modul",
    page_label: "Seite",
    footer_signature: "INGENIERIE DIGITALE",
    footer_disclaimer: "Vertrauliches Dokument — interner Gebrauch. AI BRAND OS generiert nur die KI-Orchestrierungsprompts; das endgültige Resultat wird von den empfohlenen externen Tools produziert.",
    warning_no_product: "Dieses Dossier enthält nicht das fertige Resultat. Es bündelt die optimierten Prompts und KI-Modelle zur Erstellung.",
    page_intro_title: "Anwendung dieses Dossiers",
    page_intro_body: "Jedes Teilmodul enthält einen einsatzbereiten Prompt, den kalibrierenden Agenten und die empfohlenen KI-Modelle. Klicken Sie auf „Prompt kopieren\" und fügen Sie ihn in das Tool Ihrer Wahl ein.",
    combined_title: "Komplettes Dossier — Alle Module",
    combined_subtitle: "Vollständige Zusammenstellung der in der Sitzung generierten Module.",
  },
  it: {
    cover_label: "Dossier Strategico",
    brand_label: "Marca",
    generated_on: "Generato il",
    page_brief: "Brief Strategico",
    page_sections: "Prompt per sotto-modulo",
    page_models: "Modelli IA consigliati",
    no_brief: "Nessun brief compilato.",
    brief_summary: "Sintesi del brief",
    agent_label: "Agente",
    prompt_label: "Prompt da utilizzare",
    copy_btn: "Copia prompt",
    copied_btn: "✓ Copiato",
    copy_full_btn: "Copia rapporto completo",
    models_title: "Modelli IA ideali per questo prompt",
    models_intro: "Cinque piattaforme IA consigliate, ordinate per caso d'uso. Il prompt sopra è progettato per ottenere i migliori risultati su questi strumenti — incollalo così com'è.",
    use_case: "Caso d'uso",
    how_to_use: "Come usarlo",
    visit_url: "Apri",
    tips_default: "Consiglio: copia il prompt completo, scegli uno dei modelli in base al caso d'uso e incollalo senza modifiche nello strumento. Itera poi con varianti mirate.",
    meta_title: "AI BRAND OS — Dossier Privato",
    toc_label: "Indice",
    module_label: "Modulo",
    page_label: "Pagina",
    footer_signature: "INGENIERIE DIGITALE",
    footer_disclaimer: "Documento riservato — uso interno. AI BRAND OS genera solo i prompt di orchestrazione IA; il deliverable finale è prodotto dagli strumenti esterni consigliati.",
    warning_no_product: "Questo dossier non contiene il deliverable finale. Riunisce i prompt ottimizzati e i modelli IA da utilizzare per produrlo.",
    page_intro_title: "Come usare questo dossier",
    page_intro_body: "Ogni sotto-modulo contiene un prompt pronto all'uso, l'agente che l'ha calibrato e i modelli IA consigliati. Clicca su \"Copia prompt\" e incolla nello strumento di tua scelta.",
    combined_title: "Dossier Completo — Tutti i Moduli",
    combined_subtitle: "Compilazione integrale dei moduli generati durante la sessione.",
  },
  pt: {
    cover_label: "Dossier Estratégico",
    brand_label: "Marca",
    generated_on: "Gerado em",
    page_brief: "Briefing Estratégico",
    page_sections: "Prompts por submódulo",
    page_models: "Modelos IA recomendados",
    no_brief: "Nenhum briefing preenchido.",
    brief_summary: "Síntese do briefing",
    agent_label: "Agente",
    prompt_label: "Prompt a utilizar",
    copy_btn: "Copiar prompt",
    copied_btn: "✓ Copiado",
    copy_full_btn: "Copiar relatório completo",
    models_title: "Modelos IA ideais para este prompt",
    models_intro: "Cinco plataformas IA recomendadas, ordenadas por caso de uso. O prompt acima foi desenhado para os melhores resultados nestas ferramentas — cole-o tal e qual.",
    use_case: "Caso de uso",
    how_to_use: "Como usar",
    visit_url: "Aceder",
    tips_default: "Dica: copie o prompt completo, escolha um dos modelos conforme o caso de uso e cole sem alterar na ferramenta. Itere depois com variações dirigidas.",
    meta_title: "AI BRAND OS — Dossier Privado",
    toc_label: "Índice",
    module_label: "Módulo",
    page_label: "Página",
    footer_signature: "INGENIERIE DIGITALE",
    footer_disclaimer: "Documento confidencial — uso interno. AI BRAND OS gera apenas os prompts de orquestração IA; o entregável final é produzido pelas ferramentas externas recomendadas.",
    warning_no_product: "Este dossier não contém o entregável final. Reúne os prompts otimizados e os modelos IA a utilizar para o produzir.",
    page_intro_title: "Como usar este dossier",
    page_intro_body: "Cada submódulo contém um prompt pronto a usar, o agente que o calibrou e os modelos IA recomendados. Clique em \"Copiar prompt\" e cole na ferramenta da sua escolha.",
    combined_title: "Dossier Completo — Todos os Módulos",
    combined_subtitle: "Compilação integral dos módulos gerados durante a sessão.",
  },
};

// ─── Utilitaires ────────────────────────────────────────────────────────────

function esc(input: unknown): string {
  if (input === undefined || input === null) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function b64(input: string): string {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(unescape(encodeURIComponent(input)));
  }
  return Buffer.from(input, "utf-8").toString("base64");
}

function fmtDate(iso: string, locale: Locale): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

function getChrome(locale: Locale): ChromeStrings {
  return CHROME[locale] ?? CHROME.en;
}

// ─── Styles communs (cabinet privé) ─────────────────────────────────────────

function buildStyles(accent: string): string {
  return `
:root {
  --bg: #0d0a06;
  --paper: #f5f1e8;
  --paper-soft: #ede6d4;
  --ink: #1a1612;
  --ink-soft: #4a4136;
  --gold: #${accent};
  --gold-dark: #8a6c3c;
  --rule: rgba(26, 22, 18, 0.12);
  --shadow: 0 8px 28px rgba(0,0,0,0.18);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: 'Lora', Georgia, 'Times New Roman', serif;
  background: var(--paper);
  color: var(--ink);
  line-height: 1.65;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}
.serif { font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; }
.mono { font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace; }
a { color: var(--gold-dark); }
.page {
  max-width: 920px;
  margin: 0 auto;
  padding: 64px 56px;
  background: var(--paper);
}
.cover {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(180deg, #0d0a06 0%, #1a130a 60%, #2a1f0f 100%);
  color: var(--paper);
  padding: 80px 56px 56px;
  position: relative;
  overflow: hidden;
}
.cover::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 10%, rgba(200, 169, 110, 0.18), transparent 40%),
    radial-gradient(circle at 85% 80%, rgba(200, 169, 110, 0.12), transparent 45%);
  pointer-events: none;
}
.cover .top, .cover .center, .cover .bottom { position: relative; z-index: 1; }
.cover .eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.32em;
  font-size: 11px;
  color: var(--gold);
  font-weight: 600;
  margin-bottom: 16px;
}
.cover .title {
  font-family: 'Playfair Display', serif;
  font-size: 64px;
  line-height: 1.05;
  font-weight: 700;
  margin: 0 0 24px;
  color: var(--paper);
}
.cover .module-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: var(--gold);
  letter-spacing: 0.2em;
}
.cover .subtitle {
  font-style: italic;
  font-size: 19px;
  color: rgba(245, 241, 232, 0.78);
  max-width: 620px;
  margin: 16px 0 0;
  line-height: 1.5;
}
.cover .meta {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(245, 241, 232, 0.55);
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
}
.cover .meta strong { color: var(--gold); font-weight: 600; }
.cover .gold-bar {
  width: 60px;
  height: 2px;
  background: var(--gold);
  margin: 28px 0;
}
.cover .signature {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  color: var(--gold);
  letter-spacing: 0.25em;
  font-weight: 600;
  text-transform: uppercase;
}
.section-eyebrow {
  font-size: 11px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--gold-dark);
  font-weight: 600;
  margin: 0 0 8px;
}
h2.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 24px;
  color: var(--ink);
  letter-spacing: -0.01em;
}
h3.subsection {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 6px;
  color: var(--ink);
}
.divider {
  height: 1px;
  background: var(--rule);
  margin: 32px 0;
}
.thin-rule {
  width: 40px;
  height: 2px;
  background: var(--gold);
  margin: 0 0 20px;
}
.intro-card {
  border: 1px solid var(--rule);
  border-left: 3px solid var(--gold);
  background: var(--paper-soft);
  padding: 18px 22px;
  border-radius: 4px;
  margin: 0 0 32px;
}
.intro-card p { margin: 0; color: var(--ink-soft); font-size: 14.5px; }
.warning-banner {
  border: 1px solid var(--gold);
  background: rgba(200, 169, 110, 0.08);
  padding: 14px 18px;
  margin: 24px 0 36px;
  border-radius: 4px;
  font-size: 13.5px;
  color: var(--ink-soft);
  font-style: italic;
}
.brief-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 14px 28px;
  margin: 12px 0 0;
}
.brief-grid dt {
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-soft);
  font-weight: 600;
  padding-top: 4px;
  border-top: 1px solid var(--rule);
}
.brief-grid dd {
  margin: 0;
  font-size: 15px;
  color: var(--ink);
  padding-top: 4px;
  border-top: 1px solid var(--rule);
}
.section-card {
  margin: 0 0 56px;
  border: 1px solid var(--rule);
  border-radius: 6px;
  background: #fbf8ef;
  overflow: hidden;
  box-shadow: var(--shadow);
}
.section-head {
  padding: 24px 28px 20px;
  border-bottom: 1px solid var(--rule);
  background: linear-gradient(180deg, #fdfbf3 0%, #f7f1de 100%);
}
.section-head .key-badge {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--gold-dark);
  background: rgba(200, 169, 110, 0.12);
  border: 1px solid rgba(200, 169, 110, 0.35);
  padding: 3px 10px;
  border-radius: 999px;
  margin-bottom: 10px;
}
.section-head .agent {
  font-size: 12px;
  color: var(--ink-soft);
  margin: 4px 0 0;
  font-style: italic;
}
.section-body { padding: 24px 28px 28px; }
.tips-block {
  background: #f3ecd6;
  border: 1px solid rgba(200, 169, 110, 0.4);
  border-left: 3px solid var(--gold);
  padding: 14px 18px;
  border-radius: 4px;
  margin: 0 0 22px;
  font-size: 13.5px;
  color: var(--ink-soft);
  font-style: italic;
}
.prompt-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 10px;
}
.prompt-label .lbl {
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gold-dark);
  font-weight: 700;
}
.copy-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--paper);
  background: var(--ink);
  border: none;
  border-radius: 999px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.18s;
  font-weight: 600;
}
.copy-btn:hover { background: var(--gold-dark); }
.copy-btn.copied { background: #2e6f3a; }
.prompt-box {
  background: #15110a;
  color: #e8e1cd;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.62;
  padding: 22px 24px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid #3b2f1a;
  max-height: 520px;
  overflow-y: auto;
}
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin: 14px 0 0;
  font-size: 12px;
  color: var(--ink-soft);
}
.meta-row .pill {
  border: 1px solid var(--rule);
  background: var(--paper-soft);
  padding: 4px 10px;
  border-radius: 999px;
}
.meta-row .pill strong { color: var(--ink); font-weight: 600; }
.models-section {
  margin: 28px 0 0;
  padding: 22px 24px;
  background: var(--paper-soft);
  border: 1px solid var(--rule);
  border-radius: 4px;
}
.models-section h4 {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  margin: 0 0 6px;
  color: var(--ink);
}
.models-section .models-intro {
  font-size: 13px;
  color: var(--ink-soft);
  margin: 0 0 18px;
  font-style: italic;
}
.model-card {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 14px;
  padding: 14px 0;
  border-top: 1px solid var(--rule);
}
.model-card:first-of-type { border-top: none; padding-top: 4px; }
.model-card .num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--gold-dark);
  font-weight: 700;
  letter-spacing: 0.1em;
  padding-top: 2px;
}
.model-card .body strong {
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  color: var(--ink);
  font-weight: 700;
  display: block;
  margin: 0 0 4px;
}
.model-card .body .uc { font-size: 13.5px; color: var(--ink-soft); margin: 0 0 4px; }
.model-card .body .ht { font-size: 13px; color: var(--ink-soft); margin: 0; opacity: 0.85; }
.model-card .body .url-link { font-size: 12px; color: var(--gold-dark); text-decoration: none; letter-spacing: 0.06em; margin-top: 6px; display: inline-block; }
.model-card .body .badge { display: inline-block; font-size: 10px; letter-spacing: 0.2em; padding: 2px 8px; background: var(--gold); color: var(--ink); border-radius: 999px; margin-left: 8px; vertical-align: middle; font-family: 'JetBrains Mono', monospace; font-weight: 700; }
.toc {
  list-style: none;
  padding: 0;
  margin: 18px 0 0;
}
.toc li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 10px 0;
  border-bottom: 1px dotted var(--rule);
  font-size: 14.5px;
}
.toc li .num { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--gold-dark); margin-right: 14px; }
.toc li .name { flex: 1; color: var(--ink); }
.toc li .name a { color: inherit; text-decoration: none; }
.toc li .name a:hover { color: var(--gold-dark); }
.footer-page {
  border-top: 2px solid var(--ink);
  margin-top: 56px;
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.footer-page .signature { color: var(--gold-dark); font-weight: 700; font-family: 'Playfair Display', serif; letter-spacing: 0.32em; font-size: 12px; }
.footer-page .disclaimer { font-size: 10px; max-width: 520px; text-align: right; line-height: 1.5; text-transform: none; letter-spacing: 0.04em; font-style: italic; }
.module-divider {
  text-align: center;
  margin: 80px 0;
  position: relative;
}
.module-divider::before {
  content: "";
  display: block;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-dark), transparent);
  margin: 0 auto;
  width: 100%;
}
.module-divider .mark {
  display: inline-block;
  background: var(--paper);
  color: var(--gold-dark);
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  padding: 0 18px;
  position: relative;
  top: -14px;
  letter-spacing: 0.4em;
}
@media print {
  body { font-size: 14px; }
  .copy-btn { display: none; }
  .section-card { box-shadow: none; page-break-inside: avoid; }
  .cover { min-height: 95vh; page-break-after: always; }
  .module-divider { page-break-after: always; }
  .page { padding: 32px 28px; }
}
@media (max-width: 720px) {
  .page { padding: 32px 20px; }
  .cover { padding: 48px 22px 32px; }
  .cover .title { font-size: 40px; }
  .brief-grid { grid-template-columns: 1fr; }
  .brief-grid dt { padding-top: 10px; }
  .brief-grid dd { padding-top: 0; border-top: none; }
}
`;
}

// ─── Génération HTML d'un module ────────────────────────────────────────────

function buildSectionCard(
  section: ReportSection,
  idx: number,
  chrome: ChromeStrings,
): string {
  const promptB64 = b64(section.prompt ?? "");
  const meta = section.meta && section.meta.length
    ? `<div class="meta-row">${section.meta
        .map((m) => `<span class="pill"><strong>${esc(m.label)}:</strong> ${esc(m.value)}</span>`)
        .join("")}</div>`
    : "";
  const tipsText = section.tips ?? chrome.tips_default;
  const tips = `<div class="tips-block">💡 ${esc(tipsText)}</div>`;
  const models = section.recommendedModels && section.recommendedModels.length
    ? `<div class="models-section">
        <h4>${esc(chrome.models_title)}</h4>
        <p class="models-intro">${esc(chrome.models_intro)}</p>
        ${section.recommendedModels.map((m, i) => `
          <div class="model-card">
            <div class="num">${String(i + 1).padStart(2, "0")}</div>
            <div class="body">
              <strong>${esc(m.name)}${m.badge ? `<span class="badge">${esc(m.badge)}</span>` : ""}</strong>
              <p class="uc"><em>${esc(chrome.use_case)}:</em> ${esc(m.useCase)}</p>
              <p class="ht"><em>${esc(chrome.how_to_use)}:</em> ${esc(m.howToUse)}</p>
              ${m.url ? `<a class="url-link" href="${esc(m.url)}" target="_blank" rel="noopener">→ ${esc(chrome.visit_url)}</a>` : ""}
            </div>
          </div>
        `).join("")}
      </div>`
    : "";

  return `
    <article class="section-card" id="section-${esc(section.key)}-${idx}">
      <div class="section-head">
        <div class="key-badge">${esc(section.key.toUpperCase().replace(/_/g, " "))}</div>
        <h3 class="subsection">${esc(section.title)}</h3>
        ${section.agent ? `<p class="agent">${esc(chrome.agent_label)} · ${esc(section.agent)}</p>` : ""}
      </div>
      <div class="section-body">
        ${tips}
        <div class="prompt-label">
          <span class="lbl">${esc(chrome.prompt_label)}</span>
          <button class="copy-btn" data-copy="${promptB64}" data-label-copy="${esc(chrome.copy_btn)}" data-label-done="${esc(chrome.copied_btn)}">${esc(chrome.copy_btn)}</button>
        </div>
        <div class="prompt-box">${esc(section.prompt)}</div>
        ${meta}
        ${models}
      </div>
    </article>
  `;
}

function buildModuleSection(
  report: ModuleReport,
  chrome: ChromeStrings,
  isCombined: boolean,
): string {
  const briefRows = report.brief.length
    ? `<dl class="brief-grid">${report.brief
        .map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`)
        .join("")}</dl>`
    : `<p style="color:var(--ink-soft); font-style:italic;">${esc(chrome.no_brief)}</p>`;

  const sectionsHtml = report.sections
    .map((s, i) => buildSectionCard(s, i, chrome))
    .join("");

  const fullPromptText = report.sections
    .map((s) => `## ${s.title}\n\n${s.prompt}`)
    .join("\n\n---\n\n");
  const fullB64 = b64(fullPromptText);

  return `
    ${isCombined ? `<div class="module-divider"><span class="mark">— ${esc(report.moduleNumber)} —</span></div>` : ""}
    <section class="page" id="module-${esc(report.moduleId)}">
      ${!isCombined ? `
        <p class="section-eyebrow">${esc(chrome.page_intro_title)}</p>
        <div class="thin-rule"></div>
        <div class="intro-card"><p>${esc(chrome.page_intro_body)}</p></div>
        <div class="warning-banner">⚠ ${esc(chrome.warning_no_product)}</div>
      ` : `
        <p class="section-eyebrow">${esc(chrome.module_label)} ${esc(report.moduleNumber)} · ${esc(report.moduleName)}</p>
        <h2 class="section-title">${esc(report.moduleName)}</h2>
        ${report.moduleTagline ? `<p style="color:var(--ink-soft); font-style:italic; margin:0 0 24px;">${esc(report.moduleTagline)}</p>` : ""}
      `}

      <p class="section-eyebrow" style="margin-top:${isCombined ? "0" : "32px"};">${esc(chrome.page_brief)}</p>
      <h2 class="section-title" style="font-size:28px;">${esc(chrome.brief_summary)}</h2>
      <div class="thin-rule"></div>
      ${briefRows}

      <div class="divider"></div>

      <p class="section-eyebrow">${esc(chrome.page_sections)}</p>
      <h2 class="section-title" style="font-size:28px;">${esc(report.sections.length)} ${esc(chrome.page_sections.toLowerCase())}</h2>
      <div class="thin-rule"></div>
      <div style="text-align:right; margin: -28px 0 24px;">
        <button class="copy-btn" data-copy="${fullB64}" data-label-copy="${esc(chrome.copy_full_btn)}" data-label-done="${esc(chrome.copied_btn)}">${esc(chrome.copy_full_btn)}</button>
      </div>

      ${sectionsHtml}

      <div class="footer-page">
        <span class="signature">${esc(chrome.footer_signature)}</span>
        <span class="disclaimer">${esc(chrome.footer_disclaimer)}</span>
      </div>
    </section>
  `;
}

const COPY_SCRIPT = `
<script>
(function(){
  function decode(b64){ try { return decodeURIComponent(escape(atob(b64))); } catch(e){ return atob(b64); } }
  document.addEventListener('click', function(ev){
    var t = ev.target; if (!t || !t.matches || !t.matches('.copy-btn')) return;
    var data = t.getAttribute('data-copy'); if (!data) return;
    var text = decode(data);
    var done = t.getAttribute('data-label-done') || '✓';
    var orig = t.getAttribute('data-label-copy') || t.textContent;
    var apply = function(){
      t.textContent = done;
      t.classList.add('copied');
      setTimeout(function(){ t.textContent = orig; t.classList.remove('copied'); }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(apply, function(){
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); apply(); } catch(e){}
        document.body.removeChild(ta);
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); apply(); } catch(e){}
      document.body.removeChild(ta);
    }
  });
})();
</script>
`;

const FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lora:wght@400;500;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">`;

function buildCover(
  report: ModuleReport | { moduleNumber: string; moduleName: string; moduleTagline?: string; brand?: string; generatedAt: string; accentHex?: string },
  chrome: ChromeStrings,
  brandName: string,
  locale: Locale,
): string {
  const accent = (report as ModuleReport).accentHex ?? "C8A96E";
  return `
    <section class="cover">
      <div class="top">
        <p class="eyebrow">${esc(chrome.cover_label)}</p>
        <p class="module-num">${esc(chrome.module_label)} ${esc(report.moduleNumber)}</p>
      </div>
      <div class="center">
        <h1 class="title">${esc(report.moduleName)}</h1>
        ${report.moduleTagline ? `<p class="subtitle">${esc(report.moduleTagline)}</p>` : ""}
        <div class="gold-bar"></div>
        <div class="meta">
          <span><strong>${esc(chrome.brand_label)}:</strong> ${esc(brandName || "—")}</span>
          <span><strong>${esc(chrome.generated_on)}:</strong> ${esc(fmtDate(report.generatedAt, locale))}</span>
        </div>
      </div>
      <div class="bottom">
        <p class="signature">${esc(chrome.footer_signature)}</p>
      </div>
    </section>
  `;
}

export function generateModuleReportHTML(
  report: ModuleReport,
  brandName: string,
  locale: Locale = "fr",
): string {
  const chrome = getChrome(locale);
  const accent = report.accentHex ?? "C8A96E";
  return `<!DOCTYPE html>
<html lang="${esc(locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(chrome.meta_title)} — ${esc(report.moduleName)}</title>
${FONTS_LINK}
<style>${buildStyles(accent)}</style>
</head>
<body>
${buildCover(report, chrome, brandName, locale)}
${buildModuleSection(report, chrome, false)}
${COPY_SCRIPT}
</body>
</html>`;
}

// ─── Génération combinée (tous les modules) ─────────────────────────────────

export function generateCombinedReportHTML(
  reports: ModuleReport[],
  brandName: string,
  locale: Locale = "fr",
): string {
  const chrome = getChrome(locale);
  const generatedAt = new Date().toISOString();
  const totalSections = reports.reduce((acc, r) => acc + r.sections.length, 0);

  const toc = `
    <section class="page">
      <p class="section-eyebrow">${esc(chrome.toc_label)}</p>
      <h2 class="section-title">${esc(chrome.combined_title)}</h2>
      <div class="thin-rule"></div>
      <p style="color:var(--ink-soft); font-style:italic;">${esc(chrome.combined_subtitle)}</p>
      <div class="warning-banner">⚠ ${esc(chrome.warning_no_product)}</div>
      <ul class="toc">
        ${reports.map((r) => `
          <li>
            <span class="num">MOD-${esc(r.moduleNumber)}</span>
            <span class="name"><a href="#module-${esc(r.moduleId)}">${esc(r.moduleName)}</a></span>
            <span class="num">${r.sections.length} prompts</span>
          </li>
        `).join("")}
      </ul>
      <div class="footer-page">
        <span class="signature">${esc(chrome.footer_signature)}</span>
        <span class="disclaimer">${esc(chrome.footer_disclaimer)}</span>
      </div>
    </section>
  `;

  const cover = `
    <section class="cover">
      <div class="top">
        <p class="eyebrow">${esc(chrome.cover_label)}</p>
        <p class="module-num">${reports.length} ${esc(chrome.module_label.toLowerCase())} · ${totalSections} prompts</p>
      </div>
      <div class="center">
        <h1 class="title">${esc(chrome.combined_title)}</h1>
        <p class="subtitle">${esc(chrome.combined_subtitle)}</p>
        <div class="gold-bar"></div>
        <div class="meta">
          <span><strong>${esc(chrome.brand_label)}:</strong> ${esc(brandName || "—")}</span>
          <span><strong>${esc(chrome.generated_on)}:</strong> ${esc(fmtDate(generatedAt, locale))}</span>
        </div>
      </div>
      <div class="bottom">
        <p class="signature">${esc(chrome.footer_signature)}</p>
      </div>
    </section>
  `;

  const body = reports.map((r) => buildModuleSection(r, chrome, true)).join("");

  return `<!DOCTYPE html>
<html lang="${esc(locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(chrome.meta_title)} — ${esc(chrome.combined_title)}</title>
${FONTS_LINK}
<style>${buildStyles("C8A96E")}</style>
</head>
<body>
${cover}
${toc}
${body}
${COPY_SCRIPT}
</body>
</html>`;
}

// ─── Helpers téléchargement ─────────────────────────────────────────────────

export function downloadHTML(filename: string, html: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
