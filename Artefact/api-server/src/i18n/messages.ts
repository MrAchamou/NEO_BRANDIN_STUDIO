/**
 * i18n — Server-side messages and language helpers
 * --------------------------------------------------
 * AI BRAND OS v3.x — French-default, EN fallback, 6 supported locales.
 *
 *  - resolveLang(req)        : reads X-Output-Lang or X-UI-Lang headers
 *  - getMessage(lang, key)   : flat key lookup with EN fallback
 *  - languageInstruction(l)  : returns "Respond in <language>" block to inject
 *                              into AI system prompts when output language is set.
 */

import type { Request } from "express";

export const SUPPORTED_LANGS = ["en", "fr", "es", "de", "it", "pt"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: SupportedLang = "fr";
export const FALLBACK_LANG: SupportedLang = "en";

const LANG_NAMES: Record<SupportedLang, string> = {
  en: "English",
  fr: "French (Français)",
  es: "Spanish (Español)",
  de: "German (Deutsch)",
  it: "Italian (Italiano)",
  pt: "Portuguese (Português)",
};

/** Server-side message catalog (errors, governance, brief export labels). */
const CATALOG: Record<string, Record<SupportedLang, string>> = {
  "errors.invalid_body": {
    en: "Invalid request body",
    fr: "Corps de requête invalide",
    es: "Cuerpo de solicitud no válido",
    de: "Ungültiger Anfragetext",
    it: "Corpo della richiesta non valido",
    pt: "Corpo da solicitação inválido",
  },
  "errors.brief_required": {
    en: "Brand brief is required for this operation",
    fr: "Le brief de marque est requis pour cette opération",
    es: "Se requiere el brief de marca para esta operación",
    de: "Brand-Brief ist für diesen Vorgang erforderlich",
    it: "Il brief di marca è richiesto per questa operazione",
    pt: "O brief de marca é necessário para esta operação",
  },
  "errors.upstream_ai": {
    en: "AI engine error — please try again or switch to Replit Managed mode",
    fr: "Erreur du moteur AI — réessaie ou bascule en mode Replit Managed",
    es: "Error del motor de IA — inténtalo de nuevo o cambia al modo Replit Managed",
    de: "AI-Engine-Fehler — versuche es erneut oder wechsle in den Replit Managed Modus",
    it: "Errore del motore AI — riprova o passa alla modalità Replit Managed",
    pt: "Erro do motor de IA — tente novamente ou mude para o modo Replit Managed",
  },
  "governance.blocked": {
    en: "Generation blocked by governance",
    fr: "Génération bloquée par la gouvernance",
    es: "Generación bloqueada por la gobernanza",
    de: "Generierung durch Governance blockiert",
    it: "Generazione bloccata dalla governance",
    pt: "Geração bloqueada pela governança",
  },
  "brief.section_overview": {
    en: "Overview", fr: "Vue d'ensemble", es: "Resumen", de: "Übersicht",
    it: "Panoramica", pt: "Visão geral",
  },
  "brief.section_kpis": {
    en: "KPIs", fr: "KPIs", es: "KPIs", de: "KPIs", it: "KPI", pt: "KPIs",
  },
  "brief.section_identity": {
    en: "Brand identity", fr: "Identité de marque", es: "Identidad de marca",
    de: "Markenidentität", it: "Identità di marca", pt: "Identidade da marca",
  },
  "brief.section_positioning": {
    en: "Positioning", fr: "Positionnement", es: "Posicionamiento",
    de: "Positionierung", it: "Posizionamento", pt: "Posicionamento",
  },
  "brief.section_governance": {
    en: "Governance", fr: "Gouvernance", es: "Gobernanza",
    de: "Governance", it: "Governance", pt: "Governança",
  },
  "brief.exported_at": {
    en: "Exported at", fr: "Exporté le", es: "Exportado el",
    de: "Exportiert am", it: "Esportato il", pt: "Exportado em",
  },
  "brief.client_ready": {
    en: "Client-ready brief", fr: "Brief client-ready", es: "Brief listo para cliente",
    de: "Kundenbereiter Brief", it: "Brief pronto per il cliente", pt: "Brief pronto para o cliente",
  },
  "brief.label_generated_at": {
    en: "Generated on", fr: "Généré le", es: "Generado el",
    de: "Erstellt am", it: "Generato il", pt: "Gerado em",
  },
  "brief.section_overview_perf": {
    en: "Performance overview", fr: "Vue d'ensemble performance",
    es: "Resumen de rendimiento", de: "Performance-Übersicht",
    it: "Panoramica performance", pt: "Visão geral de desempenho",
  },
  "brief.label_outlook": {
    en: "Outlook", fr: "Perspective", es: "Perspectiva",
    de: "Ausblick", it: "Prospettiva", pt: "Perspectiva",
  },
  "brief.label_profit_sustainability": {
    en: "Profit sustainability", fr: "Soutenabilité profit",
    es: "Sostenibilidad del beneficio", de: "Profit-Nachhaltigkeit",
    it: "Sostenibilità del profitto", pt: "Sustentabilidade do lucro",
  },
  "brief.label_risk_index": {
    en: "Risk index", fr: "Indice de risque", es: "Índice de riesgo",
    de: "Risikoindex", it: "Indice di rischio", pt: "Índice de risco",
  },
  "brief.section_profit_check": {
    en: "Profitability check", fr: "Check profitabilité",
    es: "Comprobación de rentabilidad", de: "Profitabilitätscheck",
    it: "Verifica della redditività", pt: "Verificação de rentabilidade",
  },
  "brief.label_profitability": {
    en: "Profitability", fr: "Profitabilité", es: "Rentabilidad",
    de: "Profitabilität", it: "Redditività", pt: "Rentabilidade",
  },
  "brief.label_breakeven": {
    en: "Break-even", fr: "Break-even", es: "Punto de equilibrio",
    de: "Break-even", it: "Pareggio", pt: "Break-even",
  },
  "brief.section_scaling": {
    en: "Scaling opportunities", fr: "Opportunités de scaling",
    es: "Oportunidades de escalado", de: "Skalierungs­möglichkeiten",
    it: "Opportunità di scaling", pt: "Oportunidades de escalada",
  },
  "brief.empty_scaling": {
    en: "No priority scaling opportunity detected this week.",
    fr: "Aucune opportunité prioritaire détectée cette semaine.",
    es: "No se detectó ninguna oportunidad prioritaria esta semana.",
    de: "Diese Woche wurde keine prioritäre Skalierungschance erkannt.",
    it: "Nessuna opportunità prioritaria rilevata questa settimana.",
    pt: "Nenhuma oportunidade prioritária detectada esta semana.",
  },
  "brief.section_risks": {
    en: "Risk signals", fr: "Signaux de risque", es: "Señales de riesgo",
    de: "Risikosignale", it: "Segnali di rischio", pt: "Sinais de risco",
  },
  "brief.empty_risks": {
    en: "No active risk signal.", fr: "Aucun signal de risque actif.",
    es: "Ninguna señal de riesgo activa.", de: "Kein aktives Risikosignal.",
    it: "Nessun segnale di rischio attivo.", pt: "Nenhum sinal de risco ativo.",
  },
  "brief.section_creative": {
    en: "Creative analysis", fr: "Analyse créative",
    es: "Análisis creativo", de: "Kreativ­analyse",
    it: "Analisi creativa", pt: "Análise criativa",
  },
  "brief.empty_creative": {
    en: "No notable creative signal.", fr: "Pas de signal créatif notable.",
    es: "Sin señal creativa relevante.", de: "Kein bemerkenswertes Kreativsignal.",
    it: "Nessun segnale creativo significativo.", pt: "Sem sinal criativo notável.",
  },
  "brief.section_retention": {
    en: "Retention update", fr: "Mise à jour rétention",
    es: "Actualización de retención", de: "Retention-Update",
    it: "Aggiornamento retention", pt: "Atualização de retenção",
  },
  "brief.label_cohort_health": {
    en: "Cohort health", fr: "Santé cohorte", es: "Salud de la cohorte",
    de: "Kohorten-Gesundheit", it: "Salute della coorte", pt: "Saúde da coorte",
  },
  "brief.label_action": {
    en: "Recommended action", fr: "Action recommandée",
    es: "Acción recomendada", de: "Empfohlene Aktion",
    it: "Azione raccomandata", pt: "Ação recomendada",
  },
};

const LOCALE_TAGS: Record<SupportedLang, string> = {
  en: "en-US", fr: "fr-FR", es: "es-ES",
  de: "de-DE", it: "it-IT", pt: "pt-PT",
};

export function localeTag(lang: SupportedLang): string {
  return LOCALE_TAGS[lang] || "en-US";
}

/** Read output language from request headers, with safe fallback. */
export function resolveLang(req: Request): SupportedLang {
  const raw =
    String(req.header("x-output-lang") || req.header("x-ui-lang") || "")
      .trim()
      .toLowerCase()
      .slice(0, 2);
  return (SUPPORTED_LANGS as readonly string[]).includes(raw)
    ? (raw as SupportedLang)
    : DEFAULT_LANG;
}

/** Flat-key message lookup with EN fallback. */
export function getMessage(lang: SupportedLang, key: string): string {
  const entry = CATALOG[key];
  if (!entry) return key;
  return entry[lang] || entry[FALLBACK_LANG] || key;
}

/**
 * Returns a "Respond in <language>" instruction block to be appended to AI
 * system prompts. Returns empty string when language is the default (FR) so
 * existing prompts keep their current French behavior unchanged.
 */
export function languageInstruction(lang: SupportedLang): string {
  if (lang === DEFAULT_LANG) return "";
  const name = LANG_NAMES[lang];
  return `\n\n═══ OUTPUT LANGUAGE ═══\nAll generated copy, captions, descriptions, error messages and human-readable text MUST be written in ${name}. Technical fields (HEX colors, model parameters, --ar tags, font names, file extensions) stay as-is.`;
}

export function languageName(lang: SupportedLang): string {
  return LANG_NAMES[lang];
}
