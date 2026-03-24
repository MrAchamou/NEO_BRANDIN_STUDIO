import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Download, ChevronRight, Check, RefreshCw, Brain, FileText, Zap, Camera, Image, Layers, Repeat, Wand2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SectionResult {
  key: string;
  label: string;
  agent: string;
  data: Record<string, string>;
  rawContent: string;
  carouselStyle?: string;
}

interface StreamState {
  sections: Record<string, { label: string; agent: string; buffer: string; data: Record<string, string>; done: boolean }>;
  activeSection: string | null;
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ReactNode> = {
  product_photos: <Camera className="w-4 h-4" />,
  lifestyle_photos: <Image className="w-4 h-4" />,
  detail_photos: <Layers className="w-4 h-4" />,
  before_after: <Repeat className="w-4 h-4" />,
  virtual_tryon: <Wand2 className="w-4 h-4" />,
  carousel: <LayoutGrid className="w-4 h-4" />,
};

const SECTION_COLORS: Record<string, string> = {
  product_photos: "from-amber-500/10 to-transparent border-amber-500/20",
  lifestyle_photos: "from-rose-500/10 to-transparent border-rose-500/20",
  detail_photos: "from-purple-500/10 to-transparent border-purple-500/20",
  before_after: "from-cyan-500/10 to-transparent border-cyan-500/20",
  virtual_tryon: "from-emerald-500/10 to-transparent border-emerald-500/20",
  carousel: "from-blue-500/10 to-transparent border-blue-500/20",
};

const SUB_PROMPT_LABELS: Record<string, Record<string, string>> = {
  product_photos: {
    front: "Face", profile: "Profil", three_quarter: "3/4", macro: "Macro",
    top: "Dessus", back: "Dos", detail_collar: "Détail Col", detail_seam: "Détail Coutures",
    interior: "Intérieur", detail_zipper: "Fermeture", macro_texture: "Macro Texture",
    hand_holding: "En Main", macro_port: "Connecteurs", bottom: "Dessous",
    detail_fabric: "Tissu", action: "Action", detail_hinge: "Charnières",
  },
  lifestyle_photos: { feed: "Feed (1:1)", pinterest: "Pinterest (4:5)", story: "Story (9:16)" },
  before_after: { before: "BEFORE", after: "AFTER" },
  virtual_tryon: { model_1: "Modèle 1", model_2: "Modèle 2" },
  carousel: { slide_1: "Slide 1", slide_2: "Slide 2", slide_3: "Slide 3", slide_4: "Slide 4", slide_5: "Slide 5" },
};

const PRODUCT_TYPES = ["bijou", "vêtement", "sac", "cosmétique", "tech", "fitness", "lunettes"];
const SECTORS = ["bijou", "luxe", "mode", "streetwear", "cosmétique", "skincare", "tech", "fitness", "décoration", "maroquinerie", "gadgets", "montres", "autre"];
const TARGET_AUDIENCES = ["femmes_18_25", "femmes_25_45", "femmes_35_50", "hommes_25_40", "mixte"];
const CAROUSEL_STYLES = ["auto", "luxe", "probleme_solution", "storytelling", "education"];

const formSchema = z.object({
  brand_name: z.string().min(2, "Nom de marque requis"),
  sector: z.string().min(1),
  product_type: z.string().min(1),
  product_name: z.string().min(2, "Nom du produit requis"),
  product_colors: z.string().default(""),
  product_materials: z.string().default(""),
  target_audience: z.string().min(1),
  carousel_style: z.string().default("auto"),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Sous-composant: affichage sub-prompts ───────────────────────────────────

function SubPromptList({
  sectionKey, data, streaming, streamBuffer, isActive
}: {
  sectionKey: string;
  data: Record<string, string>;
  streaming: boolean;
  streamBuffer: string;
  isActive: boolean;
}) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const keys = Object.keys(data);
  const labelsMap = SUB_PROMPT_LABELS[sectionKey] ?? {};
  const currentTab = activeTab ?? keys[0];

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedStates((p) => ({ ...p, [key]: true }));
    toast({ title: "Copié !" });
    setTimeout(() => setCopiedStates((p) => ({ ...p, [key]: false })), 2000);
  };

  if (streaming && isActive && keys.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-40 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-primary/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (keys.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-40 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {keys.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                currentTab === k
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {labelsMap[k] ?? k}
            </button>
          ))}
        </div>
      )}
      {keys.length === 1 && (
        <p className="text-xs text-muted-foreground">{labelsMap[keys[0]] ?? keys[0]}</p>
      )}

      <div className="relative">
        <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap pr-12">
          {data[currentTab] ?? ""}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleCopy(data[currentTab] ?? "", currentTab)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-primary"
        >
          {copiedStates[currentTab] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function Module02() {
  const { toast } = useToast();
  const [sections, setSections] = useState<SectionResult[]>([]);
  const [streamState, setStreamState] = useState<StreamState>({ sections: {}, activeSection: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand_name: "", sector: "luxe", product_type: "bijou",
      product_name: "", product_colors: "", product_materials: "",
      target_audience: "femmes_25_45", carousel_style: "auto",
    },
  });

  const generateWithAI = async (data: FormValues) => {
    const colors = data.product_colors.split(",").map((c) => c.trim()).filter(Boolean);
    const materials = data.product_materials.split(",").map((m) => m.trim()).filter(Boolean);

    setStreamState({ sections: {}, activeSection: null });
    setSections([]);

    const response = await fetch(`${import.meta.env.BASE_URL}api/openai/enhance-prompts-visual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_name: data.brand_name,
        sector: data.sector,
        product_type: data.product_type,
        product_name: data.product_name,
        product_colors: colors,
        product_materials: materials,
        target_audience: data.target_audience,
        carousel_style: data.carousel_style === "auto" ? null : data.carousel_style,
      }),
    });

    if (!response.ok || !response.body) throw new Error("Erreur API");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const finalSections: SectionResult[] = [];

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
            setStreamState((p) => ({
              activeSection: event.key,
              sections: {
                ...p.sections,
                [event.key]: { label: event.label, agent: event.agent, buffer: "", data: {}, done: false },
              },
            }));
          } else if (event.type === "chunk") {
            setStreamState((p) => ({
              ...p,
              sections: {
                ...p.sections,
                [event.key]: { ...p.sections[event.key], buffer: (p.sections[event.key]?.buffer ?? "") + event.content },
              },
            }));
          } else if (event.type === "section_done") {
            const sec: SectionResult = {
              key: event.key, label: event.label, agent: event.agent,
              data: event.data ?? {}, rawContent: event.rawContent ?? "",
              carouselStyle: event.carouselStyle,
            };
            finalSections.push(sec);
            setStreamState((p) => ({
              activeSection: null,
              sections: {
                ...p.sections,
                [event.key]: { label: event.label, agent: event.agent, buffer: "", data: event.data ?? {}, done: true },
              },
            }));
          } else if (event.type === "section_error") {
            setStreamState((p) => ({
              ...p,
              activeSection: null,
              sections: {
                ...p.sections,
                [event.key]: { ...p.sections[event.key], done: true, data: {} },
              },
            }));
          }
        } catch {}
      }
    }

    setSections(finalSections);
    return finalSections;
  };

  const SECTION_ORDER = ["product_photos", "lifestyle_photos", "detail_photos", "before_after", "virtual_tryon", "carousel"];

  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setFormData(data);
    setShowResults(true);
    try {
      await generateWithAI(data);
      toast({ title: "Module 02 — Prompts IA générés !", description: "Les 6 sections sont prêtes." });
    } catch (err) {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadTXT = () => {
    if (!sections.length || !formData) return;
    let txt = `================================================================================\nPROMPTS MODULE 02 — VISUAL CONTENT — ROBONEO.COM\nMarque: ${formData.brand_name} | Produit: ${formData.product_name} | Généré le: ${new Date().toLocaleString("fr-FR")}\n================================================================================\n\n`;

    for (const sec of sections) {
      txt += `\n--- ${sec.label.toUpperCase()} ---\nAgent: ${sec.agent}\n\n`;
      for (const [k, v] of Object.entries(sec.data)) {
        const label = (SUB_PROMPT_LABELS[sec.key] ?? {})[k] ?? k;
        txt += `[${label}]\n${v}\n\n`;
      }
    }
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = `prompts_m02_${formData.brand_name.toLowerCase()}.txt`;
    a.click();
  };

  const handleDownloadJSON = () => {
    if (!sections.length || !formData) return;
    const output = { generated_at: new Date().toISOString(), brand_name: formData.brand_name, product: formData.product_name, sections };
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(output, null, 2));
    a.download = `prompts_m02_${formData.brand_name.toLowerCase()}.json`;
    a.click();
  };

  const allDone = sections.length === 6;
  const isStreaming = isGenerating;

  return (
    <AnimatePresence mode="wait">
      {!showResults ? (
        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="max-w-2xl">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Brief — Visual Content</CardTitle>
              <CardDescription>Définissez le produit pour générer les 6 sections visuelles (19 prompts).</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom de la marque <span className="text-primary">*</span></label>
                    <Input placeholder="ex: LUXEOR" {...form.register("brand_name")} className="bg-black/20" />
                    {form.formState.errors.brand_name && <p className="text-destructive text-xs">{form.formState.errors.brand_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Secteur <span className="text-primary">*</span></label>
                    <div className="relative">
                      <select {...form.register("sector")} className="flex h-11 w-full appearance-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors">
                        {SECTORS.map((s) => <option key={s} value={s} className="bg-card">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Type de produit <span className="text-primary">*</span></label>
                    <div className="relative">
                      <select {...form.register("product_type")} className="flex h-11 w-full appearance-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors">
                        {PRODUCT_TYPES.map((t) => <option key={t} value={t} className="bg-card">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom du produit <span className="text-primary">*</span></label>
                    <Input placeholder="ex: Montre Élégance Or Rose" {...form.register("product_name")} className="bg-black/20" />
                    {form.formState.errors.product_name && <p className="text-destructive text-xs">{form.formState.errors.product_name.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Couleurs du produit</label>
                  <Input placeholder="ex: or rose, noir, blanc ivoire" {...form.register("product_colors")} className="bg-black/20" />
                  <p className="text-xs text-muted-foreground">Séparez par des virgules.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Matériaux du produit</label>
                  <Input placeholder="ex: acier inoxydable, verre saphir, cuir" {...form.register("product_materials")} className="bg-black/20" />
                  <p className="text-xs text-muted-foreground">Séparez par des virgules. (2 premiers utilisés pour les photos détail)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Audience cible <span className="text-primary">*</span></label>
                    <div className="relative">
                      <select {...form.register("target_audience")} className="flex h-11 w-full appearance-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors">
                        {TARGET_AUDIENCES.map((a) => <option key={a} value={a} className="bg-card">{a.replace(/_/g, " ")}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Style carrousel</label>
                    <div className="relative">
                      <select {...form.register("carousel_style")} className="flex h-11 w-full appearance-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors">
                        {CAROUSEL_STYLES.map((s) => <option key={s} value={s} className="bg-card">{s === "auto" ? "✨ Auto-détection" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-black/20">
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Amélioration par IA</p>
                      <p className="text-xs text-muted-foreground">GPT génère 19 prompts en 6 sections</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setUseAI(!useAI)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useAI ? "bg-primary" : "bg-muted"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useAI ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>

                <Button type="submit" variant="luxury" size="lg" className="w-full sm:w-auto" disabled={isGenerating}>
                  {isGenerating
                    ? <><RefreshCw className="mr-2 h-5 w-5 animate-spin" />GPT génère les visuels...</>
                    : <><Brain className="mr-2 h-5 w-5" />Générer les 19 Prompts Visuels</>
                  }
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-serif">Prompts Visual Content</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                  <Brain className="w-3 h-3" /> IA — 19 prompts
                </span>
              </div>
              <p className="text-muted-foreground">
                <span className="text-primary font-semibold">{formData?.brand_name}</span>
                {" — "}{formData?.product_name}
                {isStreaming && <span className="ml-2 text-xs text-primary animate-pulse">● Génération en cours...</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => { setShowResults(false); setSections([]); setStreamState({ sections: {}, activeSection: null }); }} disabled={isStreaming}>
                <RefreshCw className="w-4 h-4 mr-2" /> Nouveau Brief
              </Button>
              {allDone && (
                <>
                  <Button variant="secondary" onClick={handleDownloadTXT}><FileText className="w-4 h-4 mr-2" /> TXT</Button>
                  <Button variant="luxury" onClick={handleDownloadJSON}><Download className="w-4 h-4 mr-2" /> JSON</Button>
                </>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progression</span>
              <span>{Object.values(streamState.sections).filter((s) => s.done).length} / 6 sections</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${(Object.values(streamState.sections).filter((s) => s.done).length / 6) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {SECTION_ORDER.map((key, index) => {
              const streamSec = streamState.sections[key];
              const doneSec = sections.find((s) => s.key === key);
              const isActive = streamState.activeSection === key;
              const isDone = streamSec?.done ?? false;
              const isPending = !streamSec && !isActive;
              const colorClass = SECTION_COLORS[key] ?? "";

              const sectionLabel = streamSec?.label ?? doneSec?.label ?? key;
              const sectionAgent = streamSec?.agent ?? doneSec?.agent ?? "—";
              const sectionData = doneSec?.data ?? streamSec?.data ?? {};
              const streamBuffer = streamSec?.buffer ?? "";

              const subCount = key === "product_photos" ? 5
                : key === "lifestyle_photos" ? 3
                : key === "detail_photos" ? 2
                : key === "before_after" ? 2
                : key === "virtual_tryon" ? 2
                : key === "carousel" ? 5 : 0;

              return (
                <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                  <Card className={`h-full flex flex-col transition-all duration-300 ${
                    isActive ? "border-primary/60 shadow-lg shadow-primary/10"
                    : isDone ? `bg-gradient-to-br ${colorClass} hover:border-opacity-40`
                    : "border-white/5 opacity-40"
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base text-primary/90 flex items-center gap-2">
                            {SECTION_ICONS[key]}
                            {sectionLabel}
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1.5 text-xs">
                            {isActive ? (
                              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            ) : isDone ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                            )}
                            {sectionAgent}
                          </CardDescription>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">{subCount} prompts</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-4">
                      <SubPromptList
                        sectionKey={key}
                        data={sectionData}
                        streaming={isStreaming}
                        streamBuffer={streamBuffer}
                        isActive={isActive}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {allDone && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg border border-green-500/20 bg-green-500/5 text-center">
              <Check className="w-5 h-5 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-400">Génération terminée — 19 prompts prêts pour RoboNeo.com</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
