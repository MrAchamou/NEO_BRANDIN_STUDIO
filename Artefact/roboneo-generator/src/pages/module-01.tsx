import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Download, Sparkles, ChevronRight, Check, RefreshCw, Brain, FileText, Zap, Star, Users, AlertTriangle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { generatePrompts, type BrandBrief, type GenerationResult, generateTxtExport } from "@/lib/prompt-generator";
import { useToast } from "@/hooks/use-toast";
import { useBrand } from "@/context/brand-context";
import BriefSummaryBanner from "@/components/brief-summary-banner";

const STYLES = ["auto-detect", "luxe", "minimal", "street", "tech", "artisanal", "vintage", "playful", "corporate", "nature", "editorial", "futuristic", "ethnic"];

const SECTION_LABELS: Record<string, { title: string; agent: string }> = {
  logo: { title: "MOD-01.1 — Logo Generator", agent: "Brand Design Agent / Product Display Agent" },
  palette: { title: "MOD-01.2 — Palette Generator", agent: "Brand Design Agent" },
  typography: { title: "MOD-01.3 — Typography System", agent: "Brand Design Agent" },
  guidelines: { title: "MOD-01.4 — Brand Guidelines", agent: "Brand Design Agent (PDF generation)" },
};

const SECTION_PARAMS: Record<string, Record<string, unknown>> = {
  logo: { style: "auto", variations: 4, formats: ["png", "svg"], dimensions: "2000x2000" },
  palette: { colors: ["primary", "secondary", "accent", "neutrals"], format: ["hex", "rgb"], wcag: true },
  typography: { fonts: ["heading", "body", "accent"], format: ["google_fonts", "css"], fallbacks: true },
  guidelines: { rules: Array.from({ length: 10 }, (_, i) => `R${(i + 1).toString().padStart(2, "0")}`), format: "pdf", do_donts: true },
};

const AI_MODEL_RECOMMENDATIONS: Record<SectionKey, { name: string; useCase: string; howToUse: string }[]> = {
  logo: [
    { name: "Midjourney V7", useCase: "logos premium, monogrammes, directions artistiques luxe", howToUse: "Colle le prompt complet dans Imagine, garde les paramètres techniques et ajoute --style raw si tu veux un rendu plus fidèle au brief." },
    { name: "Ideogram 3.0", useCase: "logos avec texte lisible et lettering de marque", howToUse: "Utilise-le quand le nom de marque doit apparaître proprement dans le logo, puis lance 2 à 4 variations typographiques." },
    { name: "Recraft V3", useCase: "icônes vectorielles, SVG et systèmes de marque", howToUse: "Colle surtout les sections symbole, palette et contraintes SVG pour obtenir une base vectorielle exploitable." },
    { name: "FLUX.1 Kontext Pro", useCase: "variations cohérentes et retouches de concept", howToUse: "Utilise le prompt comme référence créative, puis demande une variation ciblée sans changer la structure de marque." },
    { name: "GPT-Image", useCase: "brief créatif précis et déclinaisons contrôlées", howToUse: "Colle le prompt entier et demande une planche de 4 directions logo pour comparer avant finalisation." },
  ],
  palette: [
    { name: "GPT-5.2", useCase: "raisonnement couleur, contrastes et cohérence secteur", howToUse: "Colle le prompt et demande une validation WCAG, des tokens CSS et une version light/dark si nécessaire." },
    { name: "Claude Sonnet", useCase: "nuance de marque et choix chromatiques éditoriaux", howToUse: "Utilise-le pour challenger la symbolique des couleurs et vérifier que la palette respecte le ton de marque." },
    { name: "Gemini 2.5 Pro", useCase: "comparaison de palettes et justification stratégique", howToUse: "Demande un tableau comparatif entre palette principale, alternative premium et alternative conversion." },
    { name: "Recraft V3", useCase: "application visuelle directe sur assets de marque", howToUse: "Colle les HEX et demande une planche d’applications : logo, packaging, social post et bannière." },
    { name: "Figma AI", useCase: "tests rapides UI, composants et tokens couleurs", howToUse: "Transforme la palette en styles Figma, puis teste-la sur boutons, cartes, formulaires et états d’alerte." },
  ],
  typography: [
    { name: "GPT-5.2", useCase: "systèmes typographiques, CSS et hiérarchie technique", howToUse: "Colle le prompt et demande un export CSS complet avec variables, classes utilitaires et responsive sizes." },
    { name: "Claude Sonnet", useCase: "voix de marque, lisibilité et cohérence éditoriale", howToUse: "Utilise-le pour vérifier si les polices soutiennent bien le ton, la cible et le niveau premium attendu." },
    { name: "Gemini 2.5 Pro", useCase: "benchmark de font pairings et alternatives web", howToUse: "Demande 3 paires alternatives Google Fonts avec avantages, risques et usages recommandés." },
    { name: "Figma AI", useCase: "prototypage UI et validation des tailles", howToUse: "Transforme les tailles et graisses du prompt en styles texte Figma, puis teste la hiérarchie sur une page." },
    { name: "Perplexity Pro", useCase: "recherche de polices, licences et références", howToUse: "Colle les noms de polices proposés pour vérifier licences, alternatives open-source et liens officiels." },
  ],
  guidelines: [
    { name: "Claude Sonnet", useCase: "charte narrative, règles Do/Don't et cohérence globale", howToUse: "Colle le prompt et demande une charte rédigée en sections prêtes à maqueter, avec exemples concrets." },
    { name: "GPT-5.2", useCase: "structuration PDF, checklists et précision opérationnelle", howToUse: "Utilise-le pour convertir le contenu en sommaire PDF, checklist d’usage et règles applicables par équipe." },
    { name: "Gemini 2.5 Pro", useCase: "audit multi-critères et synthèse stratégique", howToUse: "Demande un audit de cohérence entre logo, palette, typo et règles graphiques avant livraison client." },
    { name: "Canva Magic Studio", useCase: "mise en page de brand book et templates", howToUse: "Colle les sections une par une pour créer les pages du brand book et générer des templates de présentation." },
    { name: "Figma AI", useCase: "documentation design system et composants", howToUse: "Utilise les règles pour documenter composants, tokens, espacements et exemples Do/Don’t dans Figma." },
  ],
};

const formSchema = z.object({
  style_pref: z.string().optional().default("auto-detect"),
  enable_review: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof formSchema>;

type SectionKey = "logo" | "palette" | "typography" | "guidelines";

interface ReviewData {
  score: number;
  improvements: string[];
  gpt_score?: number;
  claude_score?: number;
  winner?: "gpt" | "claude" | "tie";
}

interface PersonaVariant {
  persona: string;
  variant: string;
}

interface StreamState {
  prompts: Partial<Record<SectionKey, string>>;
  reviews: Partial<Record<SectionKey, ReviewData>>;
  activeSection: SectionKey | null;
  completedSections: Set<SectionKey>;
}

interface SectionTiming {
  cerebrasStart?: number;
  cerebrasEnd?: number;
  gptStart?: number;
  gptEnd?: number;
  claudeStart?: number;
  claudeEnd?: number;
  qwenMs?: number;
  qwenTokens?: number;
  qwenTokensPerSecond?: number;
}

interface PerformanceSummary {
  total_ms: number;
  qwen_ms: number;
  qwen_output_tokens: number;
  qwen_tokens_per_second: number;
  gpt_average_score: number | null;
  claude_average_score: number | null;
  winner_counts: { gpt: number; claude: number; tie: number };
  review_sections: number;
  section_count: number;
  review_enabled: boolean;
}

const fmtMs = (ms: number) => ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
const fmtRate = (rate: number) => Number.isFinite(rate) ? rate.toFixed(1) : "0.0";
const elapsed = (start?: number, end?: number): string | null => {
  if (!start) return null;
  return fmtMs((end ?? Date.now()) - start);
};
const getQualityBadge = (score?: number) => {
  if (score === undefined) return null;
  if (score >= 9) return {
    label: "Premium",
    description: "Prompt prêt pour une production haut de gamme",
    className: "border-amber-300/40 bg-amber-300/15 text-amber-200",
    barClassName: "bg-amber-300",
  };
  if (score >= 8) return {
    label: "Gold",
    description: "Très solide, exploitable avec peu d'ajustements",
    className: "border-yellow-500/35 bg-yellow-500/10 text-yellow-300",
    barClassName: "bg-yellow-500",
  };
  if (score >= 7) return {
    label: "Silver",
    description: "Bonne base premium, améliorable selon le contexte",
    className: "border-slate-300/35 bg-slate-300/10 text-slate-200",
    barClassName: "bg-slate-300",
  };
  return {
    label: "Bronze",
    description: "Base exploitable, à renforcer avant livraison",
    className: "border-orange-600/35 bg-orange-600/10 text-orange-300",
    barClassName: "bg-orange-600",
  };
};

const adaptPromptForModel = (modelName: string, sectionKey: SectionKey, prompt: string, brandName: string, sector: string, tone: string) => {
  const context = `Marque : ${brandName || "à préciser"}\nSecteur : ${sector || "à préciser"}\nTon : ${tone || "à préciser"}\nType de prompt : ${SECTION_LABELS[sectionKey].title}`;
  const base = `${context}\n\nPrompt source optimisé :\n${prompt.trim()}`;
  const name = modelName.toLowerCase();

  if (name.includes("midjourney")) {
    return `/imagine prompt: premium brand logo system for ${brandName || "the brand"}, ${sector || "modern business"}, ${tone || "refined"} tone, ${prompt.trim()} --style raw --v 7 --ar 1:1 --q 2`;
  }

  if (name.includes("ideogram")) {
    return `Create a premium brand logo with clean readable typography.\nRequired brand text: "${brandName || "BRAND NAME"}"\nStyle direction: ${tone || "premium and coherent"}\nSector: ${sector || "brand identity"}\n\nUse this creative brief exactly:\n${prompt.trim()}\n\nOutput requirements: readable lettering, balanced icon/text lockup, no misspellings, no extra words, professional brand identity presentation.`;
  }

  if (name.includes("recraft")) {
    return `Vector brand asset brief for Recraft.\n${context}\n\nCreate a clean vector-ready result with precise geometry, controlled palette, scalable shapes, transparent background and export-friendly SVG logic.\n\nSource prompt:\n${prompt.trim()}\n\nDeliverable: polished vector asset, brand-safe composition, usable for logo systems, icons, packaging and digital UI.`;
  }

  if (name.includes("flux")) {
    return `FLUX.1 Kontext Pro editing/generation brief.\n${context}\n\nPreserve the brand strategy and visual identity. Generate coherent variations without changing the core concept.\n\nReference prompt:\n${prompt.trim()}\n\nInstruction: produce 4 controlled variations, each changing only one creative axis: composition, contrast, detail level or premium finish.`;
  }

  if (name.includes("gpt-image")) {
    return `Create a premium visual concept sheet for ${brandName || "this brand"}.\n${context}\n\nUse this optimized creative prompt:\n${prompt.trim()}\n\nOutput: 4 distinct directions in one clean presentation board, with consistent brand logic, professional spacing, refined composition and no unrelated elements.`;
  }

  if (name.includes("figma")) {
    return `Figma AI instruction.\n${context}\n\nTransform the following prompt into a practical brand/design-system setup inside Figma:\n${prompt.trim()}\n\nCreate structured styles, tokens, components or documentation sections depending on the prompt type. Keep names clear, production-ready and easy for a design team to reuse.`;
  }

  if (name.includes("canva")) {
    return `Canva Magic Studio brief.\n${context}\n\nUse this content to create a polished brand book or presentation template:\n${prompt.trim()}\n\nStructure the output as editable pages with clear titles, premium spacing, brand-safe examples and practical usage rules.`;
  }

  if (name.includes("perplexity")) {
    return `Research and verify the following brand typography recommendations.\n${context}\n\nPrompt to analyze:\n${prompt.trim()}\n\nReturn official links, license notes, reliable alternatives, Google Fonts equivalents when possible, and any practical risks before production use.`;
  }

  if (name.includes("claude")) {
    return `Tu es un directeur de marque senior. À partir du prompt optimisé ci-dessous, transforme le contenu en livrable clair, nuancé et directement exploitable par une équipe créative.\n\n${base}\n\nRéponds en français avec une structure professionnelle, des règles concrètes, des exemples Do/Don't si pertinent, et les points de vigilance avant livraison client.`;
  }

  if (name.includes("gpt")) {
    return `Tu es un expert brand design et design system. Convertis le prompt optimisé ci-dessous en livrable opérationnel, précis et prêt à intégrer dans une production.\n\n${base}\n\nFournis une réponse structurée, avec recommandations, contraintes techniques, tokens ou checklist si pertinent.`;
  }

  if (name.includes("gemini")) {
    return `Analyse comparative pour Gemini.\n${context}\n\nPrompt à comparer et challenger :\n${prompt.trim()}\n\nProduis 3 options stratégiques, compare avantages/risques, puis recommande la meilleure direction selon cohérence de marque, différenciation et facilité d'exécution.`;
  }

  return `${base}\n\nAdapte ce prompt au format attendu par ${modelName}, en gardant la cohérence de marque et les contraintes premium.`;
};

export default function Module01() {
  const { toast } = useToast();
  const { brief, updateBrief } = useBrand();
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [streamState, setStreamState] = useState<StreamState>({ prompts: {}, reviews: {}, activeSection: null, completedSections: new Set() });
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [personaVariants, setPersonaVariants] = useState<Partial<Record<SectionKey, PersonaVariant[]>>>({});
  const [loadingPersonas, setLoadingPersonas] = useState<Partial<Record<SectionKey, boolean>>>({});
  const [openPersonas, setOpenPersonas] = useState<Partial<Record<SectionKey, boolean>>>({});
  const [loadingReview, setLoadingReview] = useState<Partial<Record<SectionKey, boolean>>>({});
  const [improvedPrompts, setImprovedPrompts] = useState<Partial<Record<SectionKey, string>>>({});
  const [sectionTimings, setSectionTimings] = useState<Partial<Record<SectionKey, SectionTiming>>>({});
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const tickRef = useRef(0);
  const [, setTick] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { style_pref: "auto-detect", enable_review: false },
  });

  const enableReview = form.watch("enable_review");

  // Ticker — force re-render toutes les 100ms pendant la génération pour les chronomètres live
  useEffect(() => {
    if (!isGenerating) return;
    const id = setInterval(() => {
      tickRef.current += 1;
      setTick(tickRef.current);
    }, 100);
    return () => clearInterval(id);
  }, [isGenerating]);

  const generateWithAI = async (data: FormValues) => {
    const values = brief.values.split(",").map((v) => v.trim()).filter(Boolean);
    setStreamState({ prompts: {}, reviews: {}, activeSection: null, completedSections: new Set() });
    setSectionTimings({});
    setPerformanceSummary(null);

    const response = await fetch(`${import.meta.env.BASE_URL}api/openai/enhance-prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_name: brief.brand_name,
        sector: brief.sector,
        tone: brief.tone,
        values,
        style_pref: data.style_pref === "auto-detect" ? null : data.style_pref,
        enable_review: data.enable_review ?? false,
        target_demographic: brief.target_demographic || undefined,
        competitors: brief.competitors || undefined,
        forbidden_keywords: brief.forbidden_keywords || undefined,
        colors: brief.colors || undefined,
      }),
    });

    if (!response.ok || !response.body) throw new Error("Erreur API");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const finalPrompts: Partial<Record<SectionKey, string>> = {};
    const finalReviews: Partial<Record<SectionKey, ReviewData>> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "section_start") {
            const now = Date.now();
            setStreamState((p) => ({ ...p, activeSection: event.key }));
            setSectionTimings((p) => ({ ...p, [event.key]: { cerebrasStart: now } }));
          } else if (event.type === "chunk") {
            finalPrompts[event.key as SectionKey] = (finalPrompts[event.key as SectionKey] ?? "") + event.content;
            setStreamState((p) => ({ ...p, prompts: { ...p.prompts, [event.key]: finalPrompts[event.key as SectionKey] } }));
          } else if (event.type === "review_start") {
            const now = Date.now();
            if (event.agent === "gpt") {
              setSectionTimings((p) => {
                const t = p[event.key as SectionKey] ?? {};
                return { ...p, [event.key]: { ...t, cerebrasEnd: now, gptStart: now } };
              });
            } else if (event.agent === "claude") {
              setSectionTimings((p) => {
                const t = p[event.key as SectionKey] ?? {};
                return { ...p, [event.key]: { ...t, gptEnd: t.gptEnd ?? now, claudeStart: now } };
              });
            }
          } else if (event.type === "review_agent_done") {
            const now = Date.now();
            if (event.agent === "gpt") {
              setSectionTimings((p) => {
                const t = p[event.key as SectionKey] ?? {};
                return { ...p, [event.key]: { ...t, gptEnd: now } };
              });
            } else if (event.agent === "claude") {
              setSectionTimings((p) => {
                const t = p[event.key as SectionKey] ?? {};
                return { ...p, [event.key]: { ...t, claudeEnd: now } };
              });
            }
          } else if (event.type === "section_done") {
            finalPrompts[event.key as SectionKey] = event.fullContent;
            if (event.review) {
              finalReviews[event.key as SectionKey] = event.review;
            }
            setSectionTimings((p) => {
              const t = p[event.key as SectionKey] ?? {};
              return {
                ...p,
                [event.key]: {
                  ...t,
                  cerebrasEnd: t.cerebrasEnd ?? Date.now(),
                  qwenMs: event.metrics?.qwen_ms,
                  qwenTokens: event.metrics?.qwen_output_tokens,
                  qwenTokensPerSecond: event.metrics?.qwen_tokens_per_second,
                },
              };
            });
            setStreamState((p) => {
              const next = new Set(p.completedSections);
              next.add(event.key);
              return {
                ...p,
                prompts: { ...p.prompts, [event.key]: event.fullContent },
                reviews: { ...p.reviews, ...(event.review ? { [event.key]: event.review } : {}) },
                activeSection: null,
                completedSections: next,
              };
            });
          } else if (event.type === "done" && event.performance) {
            setPerformanceSummary(event.performance);
          }
        } catch {}
      }
    }

    const generated: GenerationResult = {
      generated_at: new Date().toISOString(),
      version: "1.0.0",
      brand: { brand_name: brief.brand_name, sector: brief.sector, tone: brief.tone, values: brief.values, parsed_values: values, style_pref: data.style_pref },
      modules: {
        brand_identity: {
          logo: { agent: SECTION_LABELS.logo.agent, prompt: finalPrompts.logo ?? "", parameters: { ...SECTION_PARAMS.logo, style: data.style_pref } },
          palette: { agent: SECTION_LABELS.palette.agent, prompt: finalPrompts.palette ?? "", parameters: SECTION_PARAMS.palette },
          typography: { agent: SECTION_LABELS.typography.agent, prompt: finalPrompts.typography ?? "", parameters: SECTION_PARAMS.typography },
          guidelines: { agent: SECTION_LABELS.guidelines.agent, prompt: finalPrompts.guidelines ?? "", parameters: SECTION_PARAMS.guidelines },
        },
      },
    };

    // Propager les outputs vers le brief (ex: polices si détectées)
    if (finalPrompts.palette || finalPrompts.typography) {
      const colorMatch = finalPrompts.palette?.match(/#([0-9A-Fa-f]{6})/);
      const fontMatch = finalPrompts.typography?.match(/Google Fonts[^(]*\(([^)]+)\)/);
      const patch: Record<string, string> = {};
      if (colorMatch && !brief.primary_color) patch.primary_color = `#${colorMatch[1]}`;
      if (fontMatch && !brief.heading_font) patch.heading_font = fontMatch[1].split(",")[0].trim();
      if (Object.keys(patch).length > 0) updateBrief(patch);
    }

    setStreamState((p) => ({ ...p, reviews: finalReviews }));
    return generated;
  };

  const handleGeneratePersonas = async (key: SectionKey) => {
    const promptText = getPromptText(key);
    if (!promptText) return;
    setLoadingPersonas((p) => ({ ...p, [key]: true }));
    try {
      const values = brief.values.split(",").map((v) => v.trim()).filter(Boolean);
      const res = await fetch(`${import.meta.env.BASE_URL}api/openai/persona-variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_prompt: promptText,
          brand_name: brief.brand_name,
          sector: brief.sector,
          tone: brief.tone,
          values,
          target_demographic: brief.target_demographic || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur API personas");
      const data = await res.json();
      setPersonaVariants((p) => ({ ...p, [key]: data.variants }));
      setOpenPersonas((p) => ({ ...p, [key]: true }));
      toast({ title: "3 variantes personas générées !" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de générer les variantes personas.", variant: "destructive" });
    } finally {
      setLoadingPersonas((p) => ({ ...p, [key]: false }));
    }
  };

  const handleImproveWithAI = async (key: SectionKey) => {
    const currentPrompt = getPromptText(key);
    if (!currentPrompt) return;
    setLoadingReview((p) => ({ ...p, [key]: true }));
    try {
      const values = brief.values.split(",").map((v) => v.trim()).filter(Boolean);
      const res = await fetch(`${import.meta.env.BASE_URL}api/openai/review-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentPrompt,
          section_key: key,
          brand_name: brief.brand_name,
          sector: brief.sector,
          tone: brief.tone,
          values,
          target_demographic: brief.target_demographic || undefined,
          competitors: brief.competitors || undefined,
          forbidden_keywords: brief.forbidden_keywords || undefined,
          colors: brief.colors || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur API review");
      const data = await res.json();
      const review: ReviewData = {
        score: data.score,
        improvements: data.improvements,
        gpt_score: data.gpt_score,
        claude_score: data.claude_score,
        winner: data.winner,
      };
      setStreamState((p) => ({ ...p, reviews: { ...p.reviews, [key]: review } }));
      if (data.refined && data.refined !== currentPrompt) {
        setImprovedPrompts((p) => ({ ...p, [key]: data.refined }));
      }
      toast({ title: `Score obtenu : ${data.score}/10 — ${data.winner === "gpt" ? "GPT ⚡ gagne" : data.winner === "claude" ? "Claude 🧠 gagne" : "Égalité 🤝"}` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de lancer la review IA.", variant: "destructive" });
    } finally {
      setLoadingReview((p) => ({ ...p, [key]: false }));
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setFormData(data);
    setPersonaVariants({});
    setOpenPersonas({});
    setImprovedPrompts({});
    setLoadingReview({});
    setPerformanceSummary(null);
    try {
      const generated = useAI ? await generateWithAI(data) : generatePrompts({ brand_name: brief.brand_name, sector: brief.sector, tone: brief.tone, values: brief.values, style_pref: data.style_pref } as BrandBrief);
      if (!useAI) await new Promise((r) => setTimeout(r, 400));
      setResult(generated);
      toast({ title: useAI ? "Prompts IA générés !" : "Prompts générés !" });
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedStates({ ...copiedStates, [id]: true });
    toast({ title: "Copié !" });
    setTimeout(() => setCopiedStates((p) => ({ ...p, [id]: false })), 2000);
  };

  const handleDownloadTXT = () => {
    if (!result) return;
    const txt = generateTxtExport(result);
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = `prompts_m01_${result.brand.brand_name.toLowerCase()}.txt`;
    a.click();
  };

  const handleDownloadJSON = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    a.download = `prompts_m01_${result.brand.brand_name.toLowerCase()}.json`;
    a.click();
  };

  const SECTION_KEYS: SectionKey[] = ["logo", "palette", "typography", "guidelines"];
  const isStreaming = isGenerating && useAI;
  const showResultsView = result !== null || isStreaming;

  const getPromptText = (key: SectionKey): string => {
    if (improvedPrompts[key]) return improvedPrompts[key]!;
    if (result) return result.modules.brand_identity[key].prompt;
    if (isStreaming) return streamState.prompts[key] ?? "";
    return "";
  };

  const getReview = (key: SectionKey): ReviewData | null => {
    return streamState.reviews[key] ?? null;
  };

  const bestAgent = performanceSummary?.gpt_average_score !== null && performanceSummary?.claude_average_score !== null && performanceSummary?.gpt_average_score !== undefined && performanceSummary?.claude_average_score !== undefined
    ? performanceSummary.gpt_average_score > performanceSummary.claude_average_score
      ? "GPT"
      : performanceSummary.claude_average_score > performanceSummary.gpt_average_score
        ? "Claude"
        : "Égalité"
    : null;

  const scoreColor = (score: number) => {
    if (score >= 9) return "text-green-400 bg-green-400/10 border-green-400/30";
    if (score >= 7) return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    return "text-red-400 bg-red-400/10 border-red-400/30";
  };

  return (
    <AnimatePresence mode="wait">
      {!showResultsView ? (
        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="max-w-2xl">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Brief — Brand Identity</CardTitle>
              <CardDescription>Définissez l'identité de marque pour calibrer les agents.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <BriefSummaryBanner />

                {/* Champs stratégiques détectés */}
                {(brief.competitors || brief.forbidden_keywords || brief.target_demographic) && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 p-3 rounded-lg border border-red-400/20 bg-red-400/5">
                    <span className="w-full text-[10px] text-red-400 font-semibold uppercase tracking-wider mb-0.5">Contexte stratégique détecté ✓</span>
                    {brief.target_demographic && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-400/10 border border-red-400/20 text-red-300">🎯 {brief.target_demographic.substring(0, 40)}{brief.target_demographic.length > 40 ? "…" : ""}</span>}
                    {brief.competitors && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-400/10 border border-red-400/20 text-red-300">⚡ Concurrents: {brief.competitors.substring(0, 30)}{brief.competitors.length > 30 ? "…" : ""}</span>}
                    {brief.forbidden_keywords && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-400/10 border border-red-400/20 text-red-300">🚫 Interdits: {brief.forbidden_keywords.substring(0, 30)}{brief.forbidden_keywords.length > 30 ? "…" : ""}</span>}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Style de Logo</label>
                  <div className="relative">
                    <select {...form.register("style_pref")} className="flex h-11 w-full appearance-none rounded-md border border-white/10 bg-neutral-900 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors [&>option]:bg-neutral-900 [&>option]:text-white">
                      {STYLES.map((s) => <option key={s} value={s} className="bg-card">{s === "auto-detect" ? "✨ Détection automatique (recommandé)" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-black/20">
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Amélioration par IA</p>
                      <p className="text-xs text-muted-foreground">GPT optimise chaque prompt en temps réel</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setUseAI(!useAI)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useAI ? "bg-primary" : "bg-muted"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useAI ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>

                {useAI && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center justify-between p-4 rounded-lg border border-amber-400/20 bg-amber-400/5"
                  >
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Mode Ultra-Qualité</p>
                        <p className="text-xs text-muted-foreground">Débat GPT ⚡ vs Claude 🧠 — le plus exigeant raffine le prompt</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => form.setValue("enable_review", !enableReview)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enableReview ? "bg-amber-500" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableReview ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </motion.div>
                )}

                <Button type="submit" variant="luxury" size="lg" className="w-full sm:w-auto" disabled={isGenerating}>
                  {isGenerating
                    ? <><RefreshCw className="mr-2 h-5 w-5 animate-spin" />{useAI ? "Qwen-3 génère..." : "Génération..."}</>
                    : <>{useAI ? <Brain className="mr-2 h-5 w-5" /> : <Zap className="mr-2 h-5 w-5" />}{useAI ? `Générer avec l'IA${enableReview ? " (Ultra-Qualité)" : ""}` : "Générer les Prompts"}</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-serif">Prompts Brand Identity</h2>
                {useAI && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold"><Brain className="w-3 h-3" /> IA</span>}
                {enableReview && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold"><Star className="w-3 h-3" /> Ultra-Qualité</span>}
              </div>
              <p className="text-muted-foreground">
                <span className="text-primary font-semibold">{brief.brand_name}</span>
                {isStreaming && <span className="ml-2 text-xs text-primary animate-pulse">● En cours...</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => { setResult(null); setStreamState({ prompts: {}, reviews: {}, activeSection: null, completedSections: new Set() }); setPersonaVariants({}); setOpenPersonas({}); setImprovedPrompts({}); setLoadingReview({}); setPerformanceSummary(null); }} disabled={isStreaming}>
                <RefreshCw className="w-4 h-4 mr-2" /> Nouveau
              </Button>
              {result && (
                <>
                  <Button variant="secondary" onClick={handleDownloadTXT}><FileText className="w-4 h-4 mr-2" /> TXT</Button>
                  <Button variant="luxury" onClick={handleDownloadJSON}><Download className="w-4 h-4 mr-2" /> JSON</Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {SECTION_KEYS.map((key, i) => {
              const label = SECTION_LABELS[key];
              const prompt = getPromptText(key);
              const review = getReview(key);
              const isActive = isStreaming && streamState.activeSection === key;
              const isDone = isStreaming ? streamState.completedSections.has(key) : !!result;
              const isPending = isStreaming && !isDone && streamState.activeSection !== key && !streamState.prompts[key];
              const variants = personaVariants[key];
              const isLoadingVariants = loadingPersonas[key];
              const showVariants = openPersonas[key] && variants && variants.length > 0;
              const timing = sectionTimings[key];
              const optimizationHasRun = !!review || !!timing?.gptStart || !!timing?.claudeStart;
              const modelRecommendations = AI_MODEL_RECOMMENDATIONS[key];
              const qualityBadge = getQualityBadge(review?.score);

              return (
                <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="flex flex-col gap-3">
                  <Card className={`flex flex-col transition-colors duration-300 ${isActive ? "border-primary/60 shadow-lg shadow-primary/10" : isDone ? "border-white/10 hover:border-primary/30" : "border-white/5 opacity-50"}`}>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg text-primary/90">{label.title}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1.5 text-xs">
                            {isActive ? <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> : isDone ? <Check className="w-3 h-3 text-green-500" /> : <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                            {label.agent}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {review && review.winner && (
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${review.winner === "gpt" ? "text-blue-400 bg-blue-400/10 border-blue-400/30" : review.winner === "claude" ? "text-orange-400 bg-orange-400/10 border-orange-400/30" : "text-violet-400 bg-violet-400/10 border-violet-400/30"}`}>
                              {review.winner === "gpt" ? "⚡ GPT" : review.winner === "claude" ? "🧠 Claude" : "🤝 Tie"}
                            </span>
                          )}
                          {review && (
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold ${scoreColor(review.score)}`}>
                              <Star className="w-2.5 h-2.5" />
                              {review.score}/10
                            </span>
                          )}
                          {qualityBadge && (
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${qualityBadge.className}`}>
                              {qualityBadge.label}
                            </span>
                          )}
                          {(isDone || !isStreaming) && prompt && (
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(prompt, key)} className="text-muted-foreground hover:text-primary">
                              {copiedStates[key] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-4">
                      <div className="bg-black/30 rounded-md p-4 h-56 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
                        {isPending ? <span className="text-muted-foreground/40 italic">En attente...</span> : <>{prompt}{isActive && <span className="inline-block w-2 h-4 bg-primary/80 animate-pulse ml-0.5 align-middle" />}</>}
                      </div>

                      {prompt && optimizationHasRun && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-lg border border-amber-400/25 bg-amber-400/5 p-3">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 rounded-full border border-amber-400/30 bg-amber-400/10 p-1">
                              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                                  {review ? "Prompt validé par les agents optimisateurs" : "Optimisation IA en cours"}
                                </p>
                                {review?.winner && (
                                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${review.winner === "gpt" ? "border-blue-400/30 bg-blue-400/10 text-blue-300" : review.winner === "claude" ? "border-orange-400/30 bg-orange-400/10 text-orange-300" : "border-violet-400/30 bg-violet-400/10 text-violet-300"}`}>
                                    {review.winner === "gpt" ? "GPT le plus exigeant" : review.winner === "claude" ? "Claude le plus exigeant" : "Équilibre GPT/Claude"}
                                  </span>
                                )}
                                {qualityBadge && (
                                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${qualityBadge.className}`}>
                                    Niveau {qualityBadge.label}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                {review
                                  ? "Ce prompt a été généré par Qwen-3, puis relu, scoré et renforcé par GPT-5.2 et Claude avant affichage final."
                                  : "Qwen-3 a terminé sa base et les agents GPT-5.2 / Claude sont en train de contrôler la précision premium."}
                              </p>
                              {qualityBadge && (
                                <div className="mt-3 rounded-md border border-white/5 bg-black/20 p-2">
                                  <div className="flex items-center justify-between gap-3 text-[11px]">
                                    <span className="font-semibold text-foreground/90">Classement automatique : {qualityBadge.label}</span>
                                    <span className="tabular-nums text-muted-foreground">{review?.score}/10</span>
                                  </div>
                                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (review?.score ?? 0) * 10)}%` }} className={`h-full rounded-full ${qualityBadge.barClassName}`} />
                                  </div>
                                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{qualityBadge.description}</p>
                                </div>
                              )}
                              <div className="mt-3 space-y-1.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">5 modèles IA idéaux pour exploiter ce prompt premium</p>
                                <div className="grid gap-1.5">
                                  {modelRecommendations.map((model, idx) => (
                                    <div key={model.name} className="flex items-start gap-2 rounded-md border border-white/5 bg-black/20 px-2 py-1.5">
                                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">{idx + 1}</span>
                                      <div className="min-w-0 space-y-1">
                                        <p className="text-[11px] leading-snug text-muted-foreground">
                                          <span className="font-semibold text-foreground/90">{model.name}</span>
                                          <span className="text-muted-foreground"> — {model.useCase}</span>
                                        </p>
                                        <p className="text-[10px] leading-snug text-muted-foreground/75">{model.howToUse}</p>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleCopy(adaptPromptForModel(model.name, key, prompt, brief.brand_name, brief.sector, brief.tone), `${key}_${idx}_${model.name}`)}
                                          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary"
                                        >
                                          {copiedStates[`${key}_${idx}_${model.name}`] ? <Check className="mr-1 h-3 w-3 text-green-500" /> : <Copy className="mr-1 h-3 w-3" />}
                                          Copier pour ce modèle
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ── Chronos par phase IA ──────────────────────────────── */}
                      {(() => {
                        const t = sectionTimings[key];
                        if (!t?.cerebrasStart) return null;
                        const cerebrasActive = !!t.cerebrasStart && !t.cerebrasEnd;
                        const gptActive = !!t.gptStart && !t.gptEnd;
                        const claudeActive = !!t.claudeStart && !t.claudeEnd;
                        const showGpt = !!t.gptStart;
                        const showClaude = !!t.claudeStart;
                        return (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {/* Cerebras */}
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-mono transition-colors ${cerebrasActive ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-white/10 bg-black/20 text-green-400/70"}`}>
                              {cerebrasActive
                                ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                                : <span className="text-green-500 text-[10px] flex-shrink-0">✓</span>}
                              <span className="text-muted-foreground/60">Qwen-3</span>
                              <span className="font-bold tabular-nums">{elapsed(t.cerebrasStart, t.cerebrasEnd)}</span>
                              {t.qwenTokensPerSecond !== undefined && <span className="text-muted-foreground/50">· {fmtRate(t.qwenTokensPerSecond)} tok/s</span>}
                            </div>
                            {/* GPT */}
                            {showGpt ? (
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-mono transition-colors ${gptActive ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-white/10 bg-black/20 text-blue-400/70"}`}>
                                {gptActive
                                  ? <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                                  : <span className="text-blue-400 text-[10px] flex-shrink-0">✓</span>}
                                <span className="text-muted-foreground/60">GPT-5.2</span>
                                <span className="font-bold tabular-nums">{elapsed(t.gptStart, t.gptEnd)}</span>
                              </div>
                            ) : (enableReview && !t.cerebrasEnd) ? null : enableReview ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-white/5 text-[11px] font-mono text-muted-foreground/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 flex-shrink-0" />
                                <span>GPT-5.2</span>
                              </div>
                            ) : null}
                            {/* Claude */}
                            {showClaude ? (
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-mono transition-colors ${claudeActive ? "border-orange-500/40 bg-orange-500/10 text-orange-400" : "border-white/10 bg-black/20 text-orange-400/70"}`}>
                                {claudeActive
                                  ? <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
                                  : <span className="text-orange-400 text-[10px] flex-shrink-0">✓</span>}
                                <span className="text-muted-foreground/60">Claude</span>
                                <span className="font-bold tabular-nums">{elapsed(t.claudeStart, t.claudeEnd)}</span>
                              </div>
                            ) : (showGpt && !t.gptEnd) ? null : enableReview && showGpt ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-white/5 text-[11px] font-mono text-muted-foreground/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 flex-shrink-0" />
                                <span>Claude</span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}

                      {/* Résultat du débat GPT vs Claude */}
                      {review && (review.gpt_score !== undefined || review.improvements.length > 0) && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-2">
                          {review.gpt_score !== undefined && review.claude_score !== undefined && (
                            <div className="flex items-center gap-3 px-2 py-1.5 rounded-md bg-black/20 border border-white/5">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Débat IA</span>
                              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${review.winner === "gpt" ? "text-blue-400 bg-blue-400/15" : "text-blue-400/50"}`}>
                                ⚡ GPT {review.gpt_score}/10
                              </span>
                              <span className="text-muted-foreground/30 text-xs">vs</span>
                              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${review.winner === "claude" ? "text-orange-400 bg-orange-400/15" : "text-orange-400/50"}`}>
                                🧠 Claude {review.claude_score}/10
                              </span>
                            </div>
                          )}
                          {review.improvements.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-[10px] text-amber-400/70 font-semibold uppercase tracking-wider flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Améliorations détectées
                              </p>
                              {review.improvements.map((imp, idx) => (
                                <p key={idx} className={`text-[11px] pl-2 border-l ${imp.startsWith("[GPT]") ? "text-blue-300/70 border-blue-400/20" : imp.startsWith("[Claude]") ? "text-orange-300/70 border-orange-400/20" : "text-muted-foreground border-amber-400/20"}`}>
                                  • {imp}
                                </p>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 border-t border-white/5 mt-2 pt-3 flex flex-col gap-2 items-start">
                      <p className="text-xs text-muted-foreground">
                        {Object.entries(SECTION_PARAMS[key]).map(([k, v]) => `${k}=${Array.isArray(v) ? v.length : v}`).join(" | ")}
                      </p>
                      {(isDone || (!isStreaming && !!result)) && prompt && (
                        <div className="flex flex-wrap gap-2 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleImproveWithAI(key)}
                            disabled={!!loadingReview[key] || !!isLoadingVariants}
                            className="h-7 text-xs gap-1.5 border-amber-400/40 text-amber-300 hover:bg-amber-400/10 hover:border-amber-400/60"
                          >
                            {loadingReview[key]
                              ? <><RefreshCw className="w-3 h-3 animate-spin" />GPT & Claude analysent...</>
                              : <><Wand2 className="w-3 h-3" />{improvedPrompts[key] ? "Ré-améliorer" : "Améliorer avec GPT & Claude"}</>
                            }
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showVariants ? setOpenPersonas((p) => ({ ...p, [key]: false })) : handleGeneratePersonas(key)}
                            disabled={!!isLoadingVariants || !!loadingReview[key]}
                            className="h-7 text-xs gap-1.5 border-violet-400/30 text-violet-400 hover:bg-violet-400/10"
                          >
                            {isLoadingVariants ? <><RefreshCw className="w-3 h-3 animate-spin" />Génération personas...</> : <><Users className="w-3 h-3" />{showVariants ? "Masquer les variantes" : "3 Variantes Personas"}</>}
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>

                  {/* Persona Variants Panel */}
                  <AnimatePresence>
                    {showVariants && variants && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-2"
                      >
                        {variants.map((v, idx) => (
                          <Card key={idx} className="border-violet-400/20 bg-violet-400/5">
                            <CardHeader className="pb-2 pt-3 px-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-violet-400/60">PERSONA {idx + 1}</span>
                                  <span className="text-xs font-semibold text-violet-300">{v.persona}</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleCopy(v.variant, `${key}_persona_${idx}`)} className="h-6 w-6 text-muted-foreground hover:text-violet-400">
                                  {copiedStates[`${key}_persona_${idx}`] ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-3">
                              <div className="bg-black/20 rounded p-3 font-mono text-xs text-foreground/70 leading-relaxed border border-violet-400/10 max-h-40 overflow-y-auto whitespace-pre-wrap">
                                {v.variant}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {result && useAI && performanceSummary && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">Récapitulatif de performance</CardTitle>
                  <CardDescription>Vue finale du pipeline Qwen-3 → GPT → Claude après génération complète.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Temps total</p>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{fmtMs(performanceSummary.total_ms)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{performanceSummary.section_count} sections finalisées</p>
                    </div>
                    <div className="rounded-lg border border-green-400/20 bg-green-400/5 p-4">
                      <p className="text-xs uppercase tracking-wider text-green-300/70">Vitesse Qwen-3</p>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-green-300">{fmtRate(performanceSummary.qwen_tokens_per_second)} tokens/s</p>
                      <p className="mt-1 text-xs text-muted-foreground">{performanceSummary.qwen_output_tokens.toLocaleString("fr-FR")} tokens estimés en {fmtMs(performanceSummary.qwen_ms)}</p>
                    </div>
                    <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
                      <p className="text-xs uppercase tracking-wider text-amber-300/70">Score comparatif</p>
                      <p className="mt-2 text-2xl font-bold text-amber-300">{bestAgent ?? "Non évalué"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {performanceSummary.review_enabled
                          ? `${performanceSummary.review_sections} sections analysées par GPT et Claude`
                          : "Activez le mode Ultra-Qualité pour comparer GPT et Claude"}
                      </p>
                    </div>
                  </div>

                  {performanceSummary.gpt_average_score !== null && performanceSummary.claude_average_score !== null && (
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Comparatif GPT vs Claude</p>
                          <p className="text-xs text-muted-foreground">Moyenne des scores qualité attribués après la sortie complète de Qwen-3.</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Gagnants exigeants : GPT {performanceSummary.winner_counts.gpt} · Claude {performanceSummary.winner_counts.claude} · Égalité {performanceSummary.winner_counts.tie}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-300 font-semibold">GPT</span>
                            <span className="tabular-nums text-blue-200">{performanceSummary.gpt_average_score}/10</span>
                          </div>
                          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, performanceSummary.gpt_average_score * 10)}%` }} className="h-full rounded-full bg-blue-400" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-orange-300 font-semibold">Claude</span>
                            <span className="tabular-nums text-orange-200">{performanceSummary.claude_average_score}/10</span>
                          </div>
                          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, performanceSummary.claude_average_score * 10)}%` }} className="h-full rounded-full bg-orange-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
