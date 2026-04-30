import React, { useState } from "react";
import { getEngineHeaders } from "@/lib/ai-engine";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Download, ChevronRight, Check, Brain,
  MonitorPlay, LayoutGrid, Smartphone, Layers, FileText, BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBrand, governanceFields } from "@/context/brand-context";
import BriefSummaryBanner from "@/components/brief-summary-banner";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SectionResult {
  key: string;
  label: string;
  agent: string;
  data: Record<string, unknown>;
  rawContent: string;
  governance?: any;
  pricing_validator?: any;
  profit_engine?: any;
}

interface StreamState {
  sections: Record<string, { label: string; agent: string; buffer: string; data: Record<string, unknown>; done: boolean }>;
  activeSection: string | null;
}

// ─── Config sections ─────────────────────────────────────────────────────────

const SECTION_ORDER = ["meta_ads", "google_display", "tiktok_ads", "carousel_ads", "ad_copy", "performance_predictor"];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  meta_ads: <MonitorPlay className="w-4 h-4" />,
  google_display: <LayoutGrid className="w-4 h-4" />,
  tiktok_ads: <Smartphone className="w-4 h-4" />,
  carousel_ads: <Layers className="w-4 h-4" />,
  ad_copy: <FileText className="w-4 h-4" />,
  performance_predictor: <BarChart2 className="w-4 h-4" />,
};

const SECTION_COLORS: Record<string, string> = {
  meta_ads: "from-blue-500/10 to-transparent border-blue-500/20",
  google_display: "from-green-500/10 to-transparent border-green-500/20",
  tiktok_ads: "from-pink-500/10 to-transparent border-pink-500/20",
  carousel_ads: "from-violet-500/10 to-transparent border-violet-500/20",
  ad_copy: "from-amber-500/10 to-transparent border-amber-500/20",
  performance_predictor: "from-cyan-500/10 to-transparent border-cyan-500/20",
};

// Labels lisibles pour les sous-clés
const SUB_LABELS: Record<string, Record<string, string>> = {
  meta_ads: {
    feed_image: "Feed Image 1080x1080",
    feed_video: "Feed Vidéo 1080x1080",
    stories: "Stories 1080x1920",
    reels: "Reels 1080x1920",
  },
  google_display: {
    leaderboard: "Leaderboard 728x90",
    medium_rectangle: "Medium Rectangle 300x250",
    large_rectangle: "Large Rectangle 336x280",
    mobile_banner: "Mobile Banner 320x100",
    half_page: "Half Page 300x600",
    billboard: "Billboard 970x250",
  },
  tiktok_ads: {
    tiktok_main: "Prompt réalisation TikTok",
    hashtags: "Hashtags",
    music_direction: "Direction musicale",
  },
  carousel_ads: {
    slide_1: "Slide 1 — Hook",
    slide_2: "Slide 2 — Problème",
    slide_3: "Slide 3 — Solution",
    slide_4: "Slide 4 — Preuve",
    slide_5: "Slide 5 — CTA",
  },
  ad_copy: {
    meta_feed: "Meta Feed",
    meta_stories: "Meta Stories",
    google_display: "Google Display",
    tiktok: "TikTok",
  },
  performance_predictor: {
    ctr_predictions: "Prédictions CTR / CPC / ROAS",
    ab_test_plan: "Plan A/B Testing",
    sector_recommendations: "Recommandations secteur",
    quick_wins: "Quick Wins",
    launch_checklist: "Checklist lancement",
  },
};

function extractDisplayValue(sectionKey: string, subKey: string, value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "object" && value !== null) {
    // ad_copy : afficher les variantes dans un format lisible
    if (sectionKey === "ad_copy") {
      const obj = value as Record<string, unknown>;
      return Object.entries(obj)
        .map(([field, variants]) => {
          const lines = Array.isArray(variants)
            ? variants.map((v, i) => `  ${i + 1}. ${v}`).join("\n")
            : String(variants);
          return `▸ ${field.toUpperCase()}\n${lines}`;
        })
        .join("\n\n");
    }
    // performance_predictor : CTR predictions
    if (sectionKey === "performance_predictor") {
      const obj = value as Record<string, unknown>;
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join("\n");
    }
    return JSON.stringify(value, null, 2);
  }
  return String(value ?? "");
}

// ─── Composant SubPromptTabs ─────────────────────────────────────────────────

function SubPromptTabs({
  sectionKey, data, streaming, streamBuffer, isActive,
}: {
  sectionKey: string;
  data: Record<string, unknown>;
  streaming: boolean;
  streamBuffer: string;
  isActive: boolean;
}) {
  const labelsMap = SUB_LABELS[sectionKey] ?? {};
  const allKeys = Object.keys(data).filter((k) => data[k] !== undefined && data[k] !== null);
  const displayKeys = Object.keys(labelsMap).filter((k) => allKeys.includes(k));
  const actualKeys = displayKeys.length > 0 ? displayKeys : allKeys;

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const currentTab = activeTab ?? actualKeys[0] ?? "";
  const currentValue = data[currentTab];
  const displayText = extractDisplayValue(sectionKey, currentTab, currentValue);

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedStates((p) => ({ ...p, [key]: true }));
    toast({ title: "Copié !" });
    setTimeout(() => setCopiedStates((p) => ({ ...p, [key]: false })), 2000);
  };

  if (streaming && isActive && actualKeys.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-primary/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (actualKeys.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actualKeys.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {actualKeys.map((k) => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                currentTab === k
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {labelsMap[k] ?? k.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="bg-black/30 rounded-md p-4 h-52 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap pr-12">
          {displayText}
        </div>
        <Button
          variant="ghost" size="icon"
          onClick={() => handleCopy(displayText, currentTab)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-primary"
        >
          {copiedStates[currentTab] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Constantes formulaire ───────────────────────────────────────────────────

const SECTORS = ["bijou", "luxe", "mode", "streetwear", "cosmétique", "skincare", "tech", "fitness", "décoration", "maroquinerie", "gadgets", "montres", "autre"];
const TARGET_AUDIENCES = ["femmes_18_25", "femmes_25_45", "femmes_35_50", "hommes_25_40", "mixte"];

const formSchema = z.object({
  duration_days: z.string().default("7"),
  stock: z.string().default("50"),
  problem: z.string().default(""),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Composant principal ─────────────────────────────────────────────────────

export default function Module04() {
  const { toast } = useToast();
  const { brief, updateBrief } = useBrand();
  const [sections, setSections] = useState<SectionResult[]>([]);
  const [streamState, setStreamState] = useState<StreamState>({ sections: {}, activeSection: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { duration_days: "7", stock: "50", problem: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setFormData(data);
    setShowResults(true);
    setStreamState({ sections: {}, activeSection: null });
    setSections([]);

    try {
      const benefitsList = brief.benefits.split(",").map((b) => b.trim()).filter(Boolean);
      const colorsList = brief.product_colors.split(",").map((c) => c.trim()).filter(Boolean);

      const response = await fetch(`${import.meta.env.BASE_URL}api/openai/enhance-prompts-ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getEngineHeaders() },
        body: JSON.stringify({
          ...governanceFields(brief),
          brand_name: brief.brand_name,
          sector: brief.sector,
          product_name: brief.product_name,
          product_description: brief.product_description,
          benefits: benefitsList,
          target_audience: brief.target_audience,
          colors: colorsList.length > 0 ? colorsList : brief.colors ? [brief.colors] : [],
          promo_code: brief.promo_code,
          discount: Number(brief.discount) || 20,
          duration_days: data.duration_days,
          free_shipping: Number(brief.free_shipping) || 100,
          stock: Number(data.stock),
          problem: data.problem,
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
                sections: { ...p.sections, [event.key]: { label: event.label, agent: event.agent, buffer: "", data: {}, done: false } },
              }));
            } else if (event.type === "chunk") {
              setStreamState((p) => ({
                ...p,
                sections: { ...p.sections, [event.key]: { ...p.sections[event.key], buffer: (p.sections[event.key]?.buffer ?? "") + event.content } },
              }));
            } else if (event.type === "section_done") {
              const sec: SectionResult = { key: event.key, governance: event.governance, pricing_validator: event.pricing_validator, profit_engine: event.profit_engine, label: event.label, agent: event.agent, data: event.data ?? {}, rawContent: event.rawContent ?? "" };
              finalSections.push(sec);
              setStreamState((p) => ({
                activeSection: null,
                sections: { ...p.sections, [event.key]: { label: event.label, agent: event.agent, buffer: "", data: event.data ?? {}, done: true } },
              }));
            } else if (event.type === "section_error") {
              setStreamState((p) => ({ ...p, activeSection: null, sections: { ...p.sections, [event.key]: { ...p.sections[event.key], done: true, data: {} } } }));
            }
          } catch {}
        }
      }

      setSections(finalSections);
      toast({ title: "Module 04 — 18 prompts publicitaires générés !", description: "Meta, Google, TikTok, Carousel, Ad Copy et Performance Predictor prêts." });
    } catch (err) {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const allDone = sections.length === 6;

  const handleDownloadTXT = () => {
    if (!sections.length) return;
    let txt = `================================================================================\nPROMPTS MODULE 04 — AD CREATIVES — NEO BRANDING STUDIO\nMarque: ${brief.brand_name} | Produit: ${brief.product_name} | Généré le: ${new Date().toLocaleString("fr-FR")}\n================================================================================\n\n`;
    for (const sec of sections) {
      txt += `\n--- ${sec.label.toUpperCase()} ---\nAgent: ${sec.agent}\n\n`;
      for (const [k, v] of Object.entries(sec.data)) {
        const label = (SUB_LABELS[sec.key] ?? {})[k] ?? k;
        const text = extractDisplayValue(sec.key, k, v);
        txt += `[${label}]\n${text}\n\n`;
      }
    }
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = `prompts_m04_${brief.brand_name.toLowerCase()}.txt`;
    a.click();
  };

  const handleDownloadJSON = () => {
    if (!sections.length) return;
    const output = { generated_at: new Date().toISOString(), brand_name: brief.brand_name, product: brief.product_name, sections };
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(output, null, 2));
    a.download = `prompts_m04_${brief.brand_name.toLowerCase()}.json`;
    a.click();
  };

  return (
    <AnimatePresence mode="wait">
      {!showResults ? (
        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="max-w-2xl">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Brief — Ad Creatives</CardTitle>
              <CardDescription>Définissez votre produit pour générer 6 sections publicitaires (Meta, Google Display, TikTok, Carousel, Ad Copy, Performance Predictor).</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <BriefSummaryBanner />

                {/* Problème client */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Problème client (pour carousel)</label>
                  <Input placeholder="ex: bijoux qui ternissent, manque d'élégance au quotidien..." {...form.register("problem")} className="bg-black/20" />
                </div>

                {/* Paramètres campagne spécifiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Durée campagne (jours)</label>
                    <Input placeholder="7" {...form.register("duration_days")} className="bg-black/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Stock disponible (unités)</label>
                    <Input placeholder="50" {...form.register("stock")} className="bg-black/20" />
                  </div>
                </div>

                <Button type="submit" disabled={isGenerating} className="w-full h-12 text-base font-semibold">
                  {isGenerating ? (
                    <><Brain className="w-5 h-5 mr-2 animate-pulse" /> Génération en cours...</>
                  ) : (
                    <><Brain className="w-5 h-5 mr-2" /> Générer les Ad Creatives</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          {/* Header résultats */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">{brief.brand_name} — Ad Creatives</h2>
              <p className="text-sm text-muted-foreground">{brief.product_name} · {brief.sector}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => { setShowResults(false); setSections([]); setStreamState({ sections: {}, activeSection: null }); }}>
                ← Nouveau brief
              </Button>
              {allDone && (
                <>
                  <Button variant="outline" size="sm" onClick={handleDownloadJSON}>
                    <Download className="w-4 h-4 mr-1" /> JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadTXT}>
                    <Download className="w-4 h-4 mr-1" /> TXT
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Sections résultats */}
          {SECTION_ORDER.map((key) => {
            const sec = streamState.sections[key];
            const isActive = streamState.activeSection === key;
            const isDone = sec?.done ?? false;
            const sectionData = sec?.data ?? {};

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border bg-gradient-to-br p-5 ${SECTION_COLORS[key] ?? "from-white/5 to-transparent border-white/10"}`}
              >
                {/* En-tête section */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-black/20 ${isDone ? "text-primary" : isActive ? "text-yellow-400 animate-pulse" : "text-muted-foreground/40"}`}>
                    {SECTION_ICONS[key]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-sm truncate">{sec?.label ?? key}</h3>
                      {isActive && <span className="text-xs text-yellow-400 animate-pulse">● Génération...</span>}
                      {isDone && <span className="text-xs text-green-500">✓</span>}
                    </div>
                    {sec?.agent && <p className="text-xs text-muted-foreground/60 truncate">{sec.agent}</p>}
                  </div>
                </div>

                <SubPromptTabs
                  sectionKey={key}
                  data={sectionData}
                  streaming={isGenerating}
                  streamBuffer={sec?.buffer ?? ""}
                  isActive={isActive}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
