import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Download, Sparkles, ChevronRight, Check, RefreshCw, Brain, FileText, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { generatePrompts, type BrandBrief, type GenerationResult, generateTxtExport } from "@/lib/prompt-generator";
import { useToast } from "@/hooks/use-toast";

const SECTORS = ["bijou", "luxe", "mode", "streetwear", "cosmétique", "skincare", "tech", "fitness", "décoration", "maroquinerie", "gadgets", "montres", "autre"];
const TONES = ["luxe", "minimal", "street", "tech", "artisanal", "vintage", "playful", "corporate", "nature", "editorial", "futuristic", "ethnic"];
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

const formSchema = z.object({
  brand_name: z.string().min(2, "Le nom de la marque est requis"),
  sector: z.string().min(1, "Le secteur est requis"),
  tone: z.string().min(1, "Le ton est requis"),
  values: z.string().min(2, "Veuillez entrer au moins une valeur"),
  style_pref: z.string().optional().default("auto-detect"),
});

type FormValues = z.infer<typeof formSchema>;

type SectionKey = "logo" | "palette" | "typography" | "guidelines";

interface StreamState {
  prompts: Partial<Record<SectionKey, string>>;
  activeSection: SectionKey | null;
  completedSections: Set<SectionKey>;
}

export default function Module01() {
  const { toast } = useToast();
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [streamState, setStreamState] = useState<StreamState>({ prompts: {}, activeSection: null, completedSections: new Set() });
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { brand_name: "", sector: "luxe", tone: "luxe", values: "", style_pref: "auto-detect" },
  });

  const generateWithAI = async (data: FormValues) => {
    const values = data.values.split(",").map((v) => v.trim()).filter(Boolean);
    setStreamState({ prompts: {}, activeSection: null, completedSections: new Set() });

    const response = await fetch(`${import.meta.env.BASE_URL}api/openai/enhance-prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_name: data.brand_name, sector: data.sector, tone: data.tone, values, style_pref: data.style_pref === "auto-detect" ? null : data.style_pref }),
    });

    if (!response.ok || !response.body) throw new Error("Erreur API");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const finalPrompts: Partial<Record<SectionKey, string>> = {};

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
            setStreamState((p) => ({ ...p, activeSection: event.key }));
          } else if (event.type === "chunk") {
            finalPrompts[event.key as SectionKey] = (finalPrompts[event.key as SectionKey] ?? "") + event.content;
            setStreamState((p) => ({ ...p, prompts: { ...p.prompts, [event.key]: finalPrompts[event.key as SectionKey] } }));
          } else if (event.type === "section_done") {
            finalPrompts[event.key as SectionKey] = event.fullContent;
            setStreamState((p) => {
              const next = new Set(p.completedSections);
              next.add(event.key);
              return { ...p, prompts: { ...p.prompts, [event.key]: event.fullContent }, activeSection: null, completedSections: next };
            });
          }
        } catch {}
      }
    }

    const generated: GenerationResult = {
      generated_at: new Date().toISOString(),
      version: "1.0.0",
      brand: { brand_name: data.brand_name, sector: data.sector, tone: data.tone, values: data.values, parsed_values: values, style_pref: data.style_pref },
      modules: {
        brand_identity: {
          logo: { agent: SECTION_LABELS.logo.agent, prompt: finalPrompts.logo ?? "", parameters: { ...SECTION_PARAMS.logo, style: data.style_pref } },
          palette: { agent: SECTION_LABELS.palette.agent, prompt: finalPrompts.palette ?? "", parameters: SECTION_PARAMS.palette },
          typography: { agent: SECTION_LABELS.typography.agent, prompt: finalPrompts.typography ?? "", parameters: SECTION_PARAMS.typography },
          guidelines: { agent: SECTION_LABELS.guidelines.agent, prompt: finalPrompts.guidelines ?? "", parameters: SECTION_PARAMS.guidelines },
        },
      },
    };
    return generated;
  };

  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setFormData(data);
    try {
      const generated = useAI ? await generateWithAI(data) : generatePrompts(data as BrandBrief);
      if (!useAI) await new Promise((r) => setTimeout(r, 400));
      setResult(generated);
      toast({ title: useAI ? "Prompts IA générés !" : "Prompts générés !" });
    } catch (err) {
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
    if (result) return result.modules.brand_identity[key].prompt;
    if (isStreaming) return streamState.prompts[key] ?? "";
    return "";
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nom de la marque <span className="text-primary">*</span></label>
                  <Input placeholder="ex: LUXEOR" {...form.register("brand_name")} className="bg-black/20" />
                  {form.formState.errors.brand_name && <p className="text-destructive text-sm">{form.formState.errors.brand_name.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Secteur d'activité", name: "sector", options: SECTORS },
                    { label: "Ton de communication", name: "tone", options: TONES },
                  ].map(({ label, name, options }) => (
                    <div key={name} className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{label} <span className="text-primary">*</span></label>
                      <div className="relative">
                        <select {...form.register(name as any)} className="flex h-11 w-full appearance-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors">
                          {options.map((o) => <option key={o} value={o} className="bg-card">{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                        </select>
                        <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Valeurs fondamentales <span className="text-primary">*</span></label>
                  <Textarea placeholder="ex: excellence, prestige, authenticité..." {...form.register("values")} className="bg-black/20" />
                  <p className="text-xs text-muted-foreground">Séparez les valeurs par des virgules.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Style de Logo</label>
                  <div className="relative">
                    <select {...form.register("style_pref")} className="flex h-11 w-full appearance-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors">
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

                <Button type="submit" variant="luxury" size="lg" className="w-full sm:w-auto" disabled={isGenerating}>
                  {isGenerating ? <><RefreshCw className="mr-2 h-5 w-5 animate-spin" />{useAI ? "GPT génère..." : "Génération..."}</> : <>{useAI ? <Brain className="mr-2 h-5 w-5" /> : <Zap className="mr-2 h-5 w-5" />}{useAI ? "Générer avec l'IA" : "Générer les Prompts"}</>}
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
              </div>
              <p className="text-muted-foreground">
                <span className="text-primary font-semibold">{formData?.brand_name}</span>
                {isStreaming && <span className="ml-2 text-xs text-primary animate-pulse">● En cours...</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => { setResult(null); setStreamState({ prompts: {}, activeSection: null, completedSections: new Set() }); }} disabled={isStreaming}>
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
              const isActive = isStreaming && streamState.activeSection === key;
              const isDone = isStreaming ? streamState.completedSections.has(key) : !!result;
              const isPending = isStreaming && !isDone && streamState.activeSection !== key && !streamState.prompts[key];

              return (
                <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Card className={`h-full flex flex-col transition-colors duration-300 ${isActive ? "border-primary/60 shadow-lg shadow-primary/10" : isDone ? "border-white/10 hover:border-primary/30" : "border-white/5 opacity-50"}`}>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg text-primary/90">{label.title}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1.5 text-xs">
                            {isActive ? <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> : isDone ? <Check className="w-3 h-3 text-green-500" /> : <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                            {label.agent}
                          </CardDescription>
                        </div>
                        {(isDone || !isStreaming) && prompt && (
                          <Button variant="ghost" size="icon" onClick={() => handleCopy(prompt, key)} className="text-muted-foreground hover:text-primary">
                            {copiedStates[key] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-4">
                      <div className="bg-black/30 rounded-md p-4 h-56 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
                        {isPending ? <span className="text-muted-foreground/40 italic">En attente...</span> : <>{prompt}{isActive && <span className="inline-block w-2 h-4 bg-primary/80 animate-pulse ml-0.5 align-middle" />}</>}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 text-xs text-muted-foreground border-t border-white/5 mt-2 pt-3">
                      {Object.entries(SECTION_PARAMS[key]).map(([k, v]) => `${k}=${Array.isArray(v) ? v.length : v}`).join(" | ")}
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
