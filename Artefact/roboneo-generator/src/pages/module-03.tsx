import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Download, ChevronRight, Check, RefreshCw, Brain, FileText,
  Video, Film, Clapperboard, Mic, Image, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBrand } from "@/context/brand-context";
import BriefSummaryBanner from "@/components/brief-summary-banner";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SectionResult {
  key: string;
  label: string;
  agent: string;
  data: Record<string, unknown>;
  rawContent: string;
}

interface StreamState {
  sections: Record<string, { label: string; agent: string; buffer: string; data: Record<string, unknown>; done: boolean }>;
  activeSection: string | null;
}

// ─── Config sections ─────────────────────────────────────────────────────────

const SECTION_ORDER = ["scripts", "short_videos", "long_video", "teaser", "thumbnails", "voice_over"];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  scripts: <Clapperboard className="w-4 h-4" />,
  short_videos: <Video className="w-4 h-4" />,
  long_video: <Film className="w-4 h-4" />,
  teaser: <Play className="w-4 h-4" />,
  thumbnails: <Image className="w-4 h-4" />,
  voice_over: <Mic className="w-4 h-4" />,
};

const SECTION_COLORS: Record<string, string> = {
  scripts: "from-violet-500/10 to-transparent border-violet-500/20",
  short_videos: "from-pink-500/10 to-transparent border-pink-500/20",
  long_video: "from-red-500/10 to-transparent border-red-500/20",
  teaser: "from-orange-500/10 to-transparent border-orange-500/20",
  thumbnails: "from-yellow-500/10 to-transparent border-yellow-500/20",
  voice_over: "from-teal-500/10 to-transparent border-teal-500/20",
};

const SECTION_SUBCOUNTS: Record<string, number> = {
  scripts: 3,
  short_videos: 2,
  long_video: 1,
  teaser: 2,
  thumbnails: 3,
  voice_over: 3,
};

// Labels lisibles pour les sous-clés
const SUB_LABELS: Record<string, Record<string, string>> = {
  scripts: { "15s": "Script 15s (AIDA)", "30s": "Script 30s (PASOP)", "60s": "Script 60s (Story)" },
  short_videos: { tiktok_15s: "TikTok / Reel 15s", tiktok_30s: "TikTok / Reel 30s" },
  long_video: { youtube_60s: "YouTube 60s" },
  teaser: { vertical: "Vertical 9:16", horizontal: "Horizontal 16:9" },
  thumbnails: { variant_a: "Variante A", variant_b: "Variante B", variant_c: "Variante C" },
  voice_over: { script_15s: "Voix Off 15s", script_30s: "Voix Off 30s", script_60s: "Voix Off 60s" },
};

// Pour les scripts, afficher le full_script du sous-objet
function extractDisplayValue(sectionKey: string, subKey: string, value: unknown): string {
  if (sectionKey === "scripts" && typeof value === "object" && value !== null) {
    const obj = value as Record<string, string>;
    return obj.full_script ?? JSON.stringify(obj, null, 2);
  }
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
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
  const displayKeys = Object.keys(labelsMap).filter((k) => data[k] !== undefined || Object.keys(data).length === 0);
  const actualKeys = displayKeys.length > 0 ? displayKeys : Object.keys(data).filter((k) => typeof data[k] === "string" || typeof data[k] === "object");
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

  // Cas spécial voix_over: afficher la recommandation de voix en haut
  const voiceCard = sectionKey === "voice_over" && data.recommended_voice ? (
    <div className="mb-3 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center gap-3">
      <Mic className="w-4 h-4 text-teal-400 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-teal-300">
          Voix recommandée: <span className="font-bold">{String(data.recommended_voice)}</span> (ElevenLabs)
        </p>
        <p className="text-xs text-muted-foreground">{String(data.voice_description ?? "")} — {String(data.voice_tone ?? "")}</p>
      </div>
    </div>
  ) : null;

  // Cas spécial teaser: afficher le style et les effets
  const teaserBadge = sectionKey === "teaser" && data.style ? (
    <div className="mb-3 flex items-center gap-2 flex-wrap">
      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 font-mono">
        Style: {String(data.style).toUpperCase()}
      </span>
      {data.effects && (
        <span className="text-xs text-muted-foreground">{String(data.effects)}</span>
      )}
    </div>
  ) : null;

  // Cas spécial thumbnails: afficher le type
  const thumbnailBadge = sectionKey === "thumbnails" && data.type ? (
    <div className="mb-3">
      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 font-mono">
        Type: {String(data.type).replace(/_/g, " ").toUpperCase()}
      </span>
    </div>
  ) : null;

  return (
    <div className="space-y-3">
      {voiceCard}
      {teaserBadge}
      {thumbnailBadge}

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
              {labelsMap[k] ?? k}
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap pr-12">
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

      {/* Scripts: afficher aussi les sections individuelles */}
      {sectionKey === "scripts" && currentValue && typeof currentValue === "object" && (
        <details className="mt-1">
          <summary className="text-xs text-muted-foreground/60 cursor-pointer hover:text-muted-foreground">
            Voir les sections du script...
          </summary>
          <div className="mt-2 space-y-1.5">
            {Object.entries(currentValue as Record<string, string>)
              .filter(([k]) => k !== "full_script")
              .map(([k, v]) => (
                <div key={k} className="flex gap-2 text-xs">
                  <span className="text-primary/60 font-mono uppercase min-w-[80px]">{k}</span>
                  <span className="text-foreground/60">{v}</span>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ─── Constantes formulaire ───────────────────────────────────────────────────

const SECTORS = ["bijou", "luxe", "mode", "streetwear", "cosmétique", "skincare", "tech", "fitness", "décoration", "maroquinerie", "gadgets", "montres", "autre"];
const TARGET_AUDIENCES = ["femmes_18_25", "femmes_25_45", "femmes_35_50", "hommes_25_40", "mixte"];
const TEASER_STYLES = ["auto", "luxe", "cinematic", "glitch", "kinetic", "minimal"];
const THUMBNAIL_TYPES = ["auto", "product_focus", "before_after", "tutorial", "review", "unboxing"];

const formSchema = z.object({
  year: z.string().default("2020"),
  duration_days: z.string().default("7"),
  teaser_style: z.string().default("auto"),
  thumbnail_type: z.string().default("auto"),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Composant principal ─────────────────────────────────────────────────────

export default function Module03() {
  const { toast } = useToast();
  const { brief, updateBrief } = useBrand();
  const [sections, setSections] = useState<SectionResult[]>([]);
  const [streamState, setStreamState] = useState<StreamState>({ sections: {}, activeSection: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { year: "2020", duration_days: "7", teaser_style: "auto", thumbnail_type: "auto" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setFormData(data);
    setShowResults(true);
    setStreamState({ sections: {}, activeSection: null });
    setSections([]);

    try {
      const features = brief.product_features.split(",").map((f) => f.trim()).filter(Boolean);
      const benefitsList = brief.benefits.split(",").map((b) => b.trim()).filter(Boolean);

      const response = await fetch(`${import.meta.env.BASE_URL}api/openai/enhance-prompts-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: brief.brand_name,
          sector: brief.sector,
          product_name: brief.product_name,
          product_description: brief.product_description,
          product_features: features,
          benefits: benefitsList,
          target_audience: brief.target_audience,
          year: data.year,
          promo_code: brief.promo_code,
          duration_days: data.duration_days,
          teaser_style: data.teaser_style === "auto" ? null : data.teaser_style,
          thumbnail_type: data.thumbnail_type === "auto" ? null : data.thumbnail_type,
          brand_colors: brief.colors || undefined,
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
              const sec: SectionResult = { key: event.key, label: event.label, agent: event.agent, data: event.data ?? {}, rawContent: event.rawContent ?? "" };
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
      toast({ title: "Module 03 — 14 prompts vidéo générés !", description: "Scripts, vidéos, teaser, miniatures et voix off prêts." });
    } catch (err) {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const allDone = sections.length === 6;

  const handleDownloadTXT = () => {
    if (!sections.length) return;
    let txt = `================================================================================\nPROMPTS MODULE 03 — VIDEO CONTENT — NEO BRANDING STUDIO\nMarque: ${brief.brand_name} | Produit: ${brief.product_name} | Généré le: ${new Date().toLocaleString("fr-FR")}\n================================================================================\n\n`;
    for (const sec of sections) {
      txt += `\n--- ${sec.label.toUpperCase()} ---\nAgent: ${sec.agent}\n\n`;
      for (const [k, v] of Object.entries(sec.data)) {
        if (typeof v === "string") {
          const label = (SUB_LABELS[sec.key] ?? {})[k] ?? k;
          txt += `[${label}]\n${v}\n\n`;
        } else if (typeof v === "object" && v !== null && sec.key === "scripts") {
          const obj = v as Record<string, string>;
          const label = (SUB_LABELS[sec.key] ?? {})[k] ?? k;
          txt += `[${label}]\n${obj.full_script ?? JSON.stringify(obj)}\n\n`;
        }
      }
    }
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = `prompts_m03_${brief.brand_name.toLowerCase()}.txt`;
    a.click();
  };

  const handleDownloadJSON = () => {
    if (!sections.length) return;
    const output = { generated_at: new Date().toISOString(), brand_name: brief.brand_name, product: brief.product_name, sections };
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(output, null, 2));
    a.download = `prompts_m03_${brief.brand_name.toLowerCase()}.json`;
    a.click();
  };

  return (
    <AnimatePresence mode="wait">
      {!showResults ? (
        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="max-w-2xl">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Brief — Video Content</CardTitle>
              <CardDescription>Définissez le produit pour générer 6 sections vidéo (scripts, TikTok, YouTube, teaser, miniatures, voix off).</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <BriefSummaryBanner />

                {/* Paramètres spécifiques vidéo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Année de création</label>
                    <Input placeholder="ex: 2018" {...form.register("year")} className="bg-black/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Durée offre (jours)</label>
                    <Input placeholder="7" {...form.register("duration_days")} className="bg-black/20" />
                  </div>
                </div>

                {/* Style teaser + miniature */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Style du teaser</label>
                    <div className="relative">
                      <select {...form.register("teaser_style")} className="flex h-11 w-full appearance-none rounded-md border border-white/10 bg-neutral-900 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors [&>option]:bg-neutral-900 [&>option]:text-white">
                        {TEASER_STYLES.map((s) => <option key={s} value={s} className="bg-card">{s === "auto" ? "✨ Auto-détection" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Type de miniature</label>
                    <div className="relative">
                      <select {...form.register("thumbnail_type")} className="flex h-11 w-full appearance-none rounded-md border border-white/10 bg-neutral-900 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors [&>option]:bg-neutral-900 [&>option]:text-white">
                        {THUMBNAIL_TYPES.map((t) => <option key={t} value={t} className="bg-card">{t === "auto" ? "✨ Auto-détection" : t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* AI toggle info */}
                <div className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-black/20">
                  <Brain className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">GPT-5.2 — 6 sections, 14 prompts</p>
                    <p className="text-xs text-muted-foreground">Scripts 15s/30s/60s · TikTok · YouTube · Teaser · Miniatures · Voix Off ElevenLabs</p>
                  </div>
                </div>

                <Button type="submit" variant="luxury" size="lg" className="w-full sm:w-auto" disabled={isGenerating}>
                  {isGenerating
                    ? <><RefreshCw className="mr-2 h-5 w-5 animate-spin" />GPT génère les vidéos...</>
                    : <><Brain className="mr-2 h-5 w-5" />Générer les 14 Prompts Vidéo</>
                  }
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          {/* Header résultats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-serif">Prompts Video Content</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                  <Brain className="w-3 h-3" /> IA — 14 prompts
                </span>
              </div>
              <p className="text-muted-foreground">
                <span className="text-primary font-semibold">{brief.brand_name}</span>
                {" — "}{brief.product_name}
                {isGenerating && <span className="ml-2 text-xs text-primary animate-pulse">● Génération en cours...</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => { setShowResults(false); setSections([]); setStreamState({ sections: {}, activeSection: null }); }} disabled={isGenerating}>
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

          {/* Barre de progression */}
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

          {/* Grille de cartes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {SECTION_ORDER.map((key, index) => {
              const streamSec = streamState.sections[key];
              const doneSec = sections.find((s) => s.key === key);
              const isActive = streamState.activeSection === key;
              const isDone = streamSec?.done ?? false;
              const colorClass = SECTION_COLORS[key] ?? "";

              const sectionLabel = streamSec?.label ?? doneSec?.label ?? key;
              const sectionAgent = streamSec?.agent ?? doneSec?.agent ?? "—";
              const sectionData = doneSec?.data ?? streamSec?.data ?? {};
              const streamBuffer = streamSec?.buffer ?? "";
              const subCount = SECTION_SUBCOUNTS[key] ?? 1;

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
                            {isActive ? <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              : isDone ? <Check className="w-3 h-3 text-green-500" />
                              : <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                            {sectionAgent}
                          </CardDescription>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">{subCount} prompt{subCount > 1 ? "s" : ""}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-4">
                      <SubPromptTabs
                        sectionKey={key}
                        data={sectionData as Record<string, unknown>}
                        streaming={isGenerating}
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
              <p className="text-sm font-medium text-green-400">Génération terminée — 14 prompts vidéo prêts pour RoboNeo.com</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
