import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Download, ChevronRight, Check, Brain, Music2, Radio, Mic2, AudioLines, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Config sections ──────────────────────────────────────────────────────────

const SECTION_ORDER = ["jingle", "background_music", "sound_effects", "voice_over", "beat_sync"];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  jingle: <Music2 className="w-4 h-4" />,
  background_music: <Radio className="w-4 h-4" />,
  sound_effects: <AudioLines className="w-4 h-4" />,
  voice_over: <Mic2 className="w-4 h-4" />,
  beat_sync: <Activity className="w-4 h-4" />,
};

const SECTION_COLORS: Record<string, string> = {
  jingle: "from-violet-500/10 to-transparent border-violet-500/20",
  background_music: "from-blue-500/10 to-transparent border-blue-500/20",
  sound_effects: "from-amber-500/10 to-transparent border-amber-500/20",
  voice_over: "from-pink-500/10 to-transparent border-pink-500/20",
  beat_sync: "from-cyan-500/10 to-transparent border-cyan-500/20",
};

const SUB_LABELS: Record<string, Record<string, string>> = {
  jingle: {
    creative_brief: "Brief créatif",
    technical_prompt: "Prompt technique (Suno/Udio)",
    variations: "Variations (10s / 3s / 1s)",
    vocal_integration: "Intégration du nom de marque",
    usage_recommandations: "Recommandations d'usage",
  },
  background_music: {
    "15s": "15s — TikTok & Reels",
    "30s": "30s — Meta Ads",
    "60s": "60s — YouTube & Web",
  },
  sound_effects: {
    ui_click: "Clic UI",
    ui_notification: "Notification",
    ui_success: "Succès / Validation",
    transition_whoosh: "Whoosh Transition",
    transition_sweep: "Sweep Élégant",
    impact_soft: "Impact Logo",
  },
  voice_over: {
    primary_voice: "Voix Principale",
    secondary_voice: "Voix Alternative",
    script_template_30s: "Script Template 30s",
    script_directions: "Directions artistiques",
  },
  beat_sync: {
    beat_detection: "Sync Vidéo / Beat Detection",
    ugc_cleaning: "Nettoyage Audio UGC",
    vocal_separation: "Séparation Vocale (Stems)",
    mastering: "Mastering & Normalisation",
  },
};

function extractDisplayValue(sectionKey: string, subKey: string, value: unknown): string {
  if (value === null || value === undefined) return "Non activé pour cette session";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    // background_music: prompt + usage + sync_points
    if (sectionKey === "background_music" && obj.prompt) {
      return `PROMPT:\n${obj.prompt}\n\nUSAGE: ${obj.usage ?? ""}\n\nPOINTS DE SYNC: ${obj.sync_points ?? ""}`;
    }
    // sound_effects: prompt + durée + caractère
    if (sectionKey === "sound_effects" && obj.prompt) {
      return `PROMPT:\n${obj.prompt}\n\nDurée: ${obj.duree ?? ""} | Caractère: ${obj.caractere ?? ""}`;
    }
    // voice_over: primary / secondary / script
    if (sectionKey === "voice_over") {
      if (subKey === "primary_voice" || subKey === "secondary_voice") {
        return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join("\n");
      }
    }
    // beat_sync
    if (sectionKey === "beat_sync" && obj.guide) {
      return `${obj.guide}\n\nOutils: ${Array.isArray(obj.tools) ? obj.tools.join(", ") : ""}\n\nBPM: ${JSON.stringify(obj.bpm_recommendations ?? {})}`;
    }
    if (sectionKey === "beat_sync" && obj.lufs_by_platform) {
      return `Plateformes: ${JSON.stringify(obj.lufs_by_platform)}\n\nChecklist:\n${Array.isArray(obj.checklist) ? obj.checklist.map((c, i) => `${i + 1}. ${c}`).join("\n") : ""}`;
    }
    // jingle: variations object
    if (subKey === "variations") {
      return Object.entries(obj).map(([k, v]) => `▸ ${k.replace(/_/g, " ").toUpperCase()}\n${v}`).join("\n\n");
    }
    return JSON.stringify(obj, null, 2);
  }
  return String(value);
}

// ─── Composant SubPromptTabs ──────────────────────────────────────────────────

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
  const allKeys = Object.keys(data);
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

// ─── Formulaire ───────────────────────────────────────────────────────────────

const SECTORS = ["bijou", "luxe", "mode", "streetwear", "cosmétique", "skincare", "tech", "fitness", "décoration", "maroquinerie", "gadgets", "montres", "autre"];
const TONES = ["luxe", "professionnel", "dynamique", "naturel", "fun", "sérieux", "chaleureux", "élégant"];
const TARGET_AUDIENCES = ["femmes_18_25", "femmes_25_45", "femmes_35_50", "hommes_25_40", "mixte"];

const formSchema = z.object({
  brand_name: z.string().min(2, "Nom de marque requis"),
  sector: z.string().min(1),
  tone: z.string().min(1),
  values: z.string().default(""),
  target_audience: z.string().min(1),
  has_ugc_audio: z.boolean().default(false),
  needs_vocal_separation: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Module05() {
  const { toast } = useToast();
  const [sections, setSections] = useState<SectionResult[]>([]);
  const [streamState, setStreamState] = useState<StreamState>({ sections: {}, activeSection: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand_name: "", sector: "bijou", tone: "luxe",
      values: "", target_audience: "femmes_25_45",
      has_ugc_audio: false, needs_vocal_separation: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setFormData(data);
    setShowResults(true);
    setStreamState({ sections: {}, activeSection: null });
    setSections([]);

    try {
      const valuesList = data.values.split(",").map((v) => v.trim()).filter(Boolean);

      const response = await fetch(`${import.meta.env.BASE_URL}api/openai/enhance-prompts-sound`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: data.brand_name,
          sector: data.sector,
          tone: data.tone,
          values: valuesList,
          target_audience: data.target_audience,
          has_ugc_audio: data.has_ugc_audio,
          needs_vocal_separation: data.needs_vocal_separation,
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
      toast({ title: "Module 05 — Identité sonore complète générée !", description: "Jingle, BGM, SFX, Voix Off et Beat Sync prêts." });
    } catch (err) {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const allDone = sections.length === SECTION_ORDER.length;

  const handleDownloadTXT = () => {
    if (!sections.length || !formData) return;
    let txt = `================================================================================\nPROMPTS MODULE 05 — BRAND SOUND — NEO BRANDING STUDIO\nMarque: ${formData.brand_name} | Généré le: ${new Date().toLocaleString("fr-FR")}\n================================================================================\n\n`;
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
    a.download = `prompts_m05_${formData.brand_name.toLowerCase()}.txt`;
    a.click();
  };

  const handleDownloadJSON = () => {
    if (!sections.length || !formData) return;
    const output = { generated_at: new Date().toISOString(), brand_name: formData.brand_name, sections };
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(output, null, 2));
    a.download = `prompts_m05_${formData.brand_name.toLowerCase()}.json`;
    a.click();
  };

  return (
    <AnimatePresence mode="wait">
      {!showResults ? (
        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="max-w-2xl">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Brief — Brand Sound</CardTitle>
              <CardDescription>Définissez votre marque pour générer l'identité sonore complète : jingle, musiques de fond, effets sonores, voix off ElevenLabs et synchronisation vidéo.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Marque + secteur */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                {/* Ton + audience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Ton de marque</label>
                    <div className="relative">
                      <select {...form.register("tone")} className="flex h-11 w-full appearance-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors">
                        {TONES.map((t) => <option key={t} value={t} className="bg-card">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Audience cible</label>
                    <div className="relative">
                      <select {...form.register("target_audience")} className="flex h-11 w-full appearance-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors">
                        {TARGET_AUDIENCES.map((a) => <option key={a} value={a} className="bg-card">{a.replace(/_/g, " ")}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Valeurs */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Valeurs de marque</label>
                  <Input placeholder="ex: excellence, prestige, authenticité, élégance" {...form.register("values")} className="bg-black/20" />
                  <p className="text-xs text-muted-foreground">Séparées par virgules</p>
                </div>

                {/* Options audio */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Options Audio (optionnel)</label>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-white/10 bg-black/10 hover:bg-black/20 transition-colors">
                      <input type="checkbox" {...form.register("has_ugc_audio")} className="w-4 h-4 accent-primary" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Nettoyage audio UGC</div>
                        <div className="text-xs text-muted-foreground">J'ai des audios clients à débruiter et normaliser</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-white/10 bg-black/10 hover:bg-black/20 transition-colors">
                      <input type="checkbox" {...form.register("needs_vocal_separation")} className="w-4 h-4 accent-primary" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Séparation vocale (stems)</div>
                        <div className="text-xs text-muted-foreground">Séparer vocal, instrumental, basse, batterie</div>
                      </div>
                    </label>
                  </div>
                </div>

                <Button type="submit" disabled={isGenerating} className="w-full h-12 text-base font-semibold">
                  {isGenerating ? (
                    <><Brain className="w-5 h-5 mr-2 animate-pulse" /> Génération en cours...</>
                  ) : (
                    <><Music2 className="w-5 h-5 mr-2" /> Générer l'identité sonore</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">{formData?.brand_name} — Brand Sound</h2>
              <p className="text-sm text-muted-foreground">{formData?.sector} · Ton {formData?.tone}</p>
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

          {/* Sections */}
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
