import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Download, ChevronRight, Check, Brain,
  Rocket, Globe, BookOpen, CalendarDays, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionResult {
  key: string;
  label: string;
  agent: string;
  data: Record<string, unknown>;
  rawContent: string;
}

interface StreamState {
  sections: Record<string, {
    label: string;
    agent: string;
    buffer: string;
    data: Record<string, unknown>;
    done: boolean;
  }>;
  activeSection: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SECTION_ORDER = ["landing_page", "user_guide", "calendar"];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  landing_page: <Globe className="w-4 h-4" />,
  user_guide: <BookOpen className="w-4 h-4" />,
  calendar: <CalendarDays className="w-4 h-4" />,
};

const SECTION_COLORS: Record<string, string> = {
  landing_page: "from-blue-500/10 to-transparent border-blue-500/20",
  user_guide: "from-indigo-500/10 to-transparent border-indigo-500/20",
  calendar: "from-violet-500/10 to-transparent border-violet-500/20",
};

const SECTION_LABELS: Record<string, string> = {
  landing_page: "Landing Page HTML",
  user_guide: "Guide d'Utilisation",
  calendar: "Calendrier 30 Jours",
};

// ─── Rendu spécialisé par section ────────────────────────────────────────────

function LandingPageView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const html = (data.html as string) ?? "";
  const meta = data.meta as Record<string, unknown> | undefined;

  if (streaming && isActive && !html) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-xs text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-blue-400/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (!html) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-32 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    toast({ title: "HTML copié !" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreview = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    a.download = "landing_page.html";
    a.click();
  };

  return (
    <div className="space-y-3">
      {meta && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {meta.title && (
            <div className="bg-black/20 rounded p-2 border border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Titre SEO</p>
              <p className="text-sm text-foreground">{meta.title as string}</p>
            </div>
          )}
          {meta.description && (
            <div className="bg-black/20 rounded p-2 border border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Meta Description</p>
              <p className="text-sm text-foreground">{meta.description as string}</p>
            </div>
          )}
        </div>
      )}
      <div className="relative">
        <div className="bg-black/30 rounded-md p-4 h-48 overflow-y-auto font-mono text-xs text-foreground/70 leading-relaxed border border-blue-500/10 whitespace-pre-wrap pr-10">
          {html.slice(0, 2000)}{html.length > 2000 ? "\n\n... [code tronqué — cliquer Télécharger pour le fichier complet]" : ""}
        </div>
        <Button variant="ghost" size="icon" onClick={handleCopy} className="absolute top-2 right-2 text-muted-foreground hover:text-blue-400">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handlePreview} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Prévisualiser
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
          <Download className="w-3.5 h-3.5 mr-1.5" /> Télécharger index.html
        </Button>
      </div>
    </div>
  );
}

function UserGuideView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [activeTab, setActiveTab] = useState<string>("introduction");
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const tabs = [
    { key: "introduction", label: "Introduction" },
    { key: "folder_structure", label: "Structure" },
    { key: "calendar_summary", label: "Calendrier" },
    { key: "platform_guide", label: "Plateformes" },
    { key: "optimization_tips", label: "Conseils" },
  ];

  if (streaming && isActive && Object.keys(data).length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-indigo-400/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (Object.keys(data).length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-32 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  const getContent = (key: string): string => {
    const val = data[key];
    if (!val) return "—";
    if (typeof val === "string") return val;
    if (Array.isArray(val)) return val.map((v, i) => `${i + 1}. ${v}`).join("\n");
    if (typeof val === "object") {
      const obj = val as Record<string, unknown>;
      if (key === "calendar_summary") {
        return Object.entries(obj).map(([week, info]) => {
          const w = info as Record<string, unknown>;
          const actions = Array.isArray(w.actions) ? w.actions.map((a, i) => `  J${i + 1}. ${a}`).join("\n") : "";
          return `📅 ${week.replace("_", " ").toUpperCase()} — ${w.theme ?? ""}\n${actions}`;
        }).join("\n\n");
      }
      if (key === "platform_guide") {
        return Object.entries(obj).map(([platform, guide]) =>
          `🔸 ${platform.toUpperCase()}\n${guide}`
        ).join("\n\n");
      }
      return JSON.stringify(obj, null, 2);
    }
    return String(val);
  };

  const handleCopy = async (key: string) => {
    const text = getContent(key);
    await navigator.clipboard.writeText(text);
    setCopiedStates((p) => ({ ...p, [key]: true }));
    toast({ title: "Copié !" });
    setTimeout(() => setCopiedStates((p) => ({ ...p, [key]: false })), 2000);
  };

  const displayText = getContent(activeTab);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tabs.filter((t) => data[t.key] !== undefined).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === t.key
                ? "bg-indigo-500 text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <div className="bg-black/30 rounded-md p-4 h-56 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-indigo-500/10 whitespace-pre-wrap pr-12">
          {displayText}
        </div>
        <Button variant="ghost" size="icon" onClick={() => handleCopy(activeTab)} className="absolute top-2 right-2 text-muted-foreground hover:text-indigo-400">
          {copiedStates[activeTab] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

function CalendarView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (streaming && isActive && Object.keys(data).length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-violet-400/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  const days = (data.days as any[]) ?? [];

  if (days.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-32 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  const weeks = [1, 2, 3, 4];
  const weekDays = days.filter((d) => d.week === activeWeek);

  const priorityColor: Record<string, string> = {
    high: "text-red-400",
    medium: "text-yellow-400",
    low: "text-green-400",
  };

  const handleCopy = async () => {
    const txt = days.map((d) =>
      `J${d.day} | ${d.platform ?? ""} | ${d.action} | ${d.file_to_use ?? ""}`
    ).join("\n");
    await navigator.clipboard.writeText(txt);
    setCopied(true);
    toast({ title: "Calendrier copié !" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    a.download = `calendrier_30j_${(data.brand as string ?? "brand").toLowerCase()}.json`;
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {weeks.map((w) => (
            <button
              key={w}
              onClick={() => setActiveWeek(w)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeWeek === w
                  ? "bg-violet-500 text-white"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              Sem. {w}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs text-muted-foreground hover:text-violet-400">
            {copied ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
            Copier
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownloadJSON} className="h-7 text-xs text-muted-foreground hover:text-violet-400">
            <Download className="w-3 h-3 mr-1" /> JSON
          </Button>
        </div>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {weekDays.map((d) => (
          <div
            key={d.day}
            className="bg-black/20 rounded-lg p-2.5 border border-white/5 hover:border-violet-500/20 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <div className="flex-shrink-0 w-8 h-8 rounded bg-violet-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-violet-400">J{d.day}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground leading-tight">{d.action}</p>
                  {d.priority && (
                    <span className={`text-[10px] font-semibold uppercase ${priorityColor[d.priority] ?? "text-muted-foreground"}`}>
                      {d.priority}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {d.platform && (
                    <span className="text-[11px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
                      {d.platform}
                    </span>
                  )}
                  {d.file_to_use && (
                    <span className="text-[11px] text-violet-400/70 font-mono truncate">
                      {d.file_to_use}
                    </span>
                  )}
                </div>
                {d.tip && (
                  <p className="text-[11px] text-muted-foreground/60 mt-1 italic">{d.tip}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/40 text-right">{days.length} jours planifiés</p>
    </div>
  );
}

// ─── Formulaire ───────────────────────────────────────────────────────────────

const SECTORS = ["bijou", "luxe", "mode", "streetwear", "cosmétique", "skincare", "tech", "fitness", "décoration", "maroquinerie", "gadgets", "montres", "autre"];
const TONES = ["luxe", "professionnel", "dynamique", "naturel", "fun", "sérieux", "chaleureux", "élégant"];

const formSchema = z.object({
  brand_name: z.string().min(2, "Nom de marque requis"),
  product_name: z.string().min(2, "Nom de produit requis"),
  sector: z.string().min(1),
  tone: z.string().min(1),
  product_description: z.string().default(""),
  features: z.string().default(""),
  benefits: z.string().default(""),
  price: z.coerce.number().min(1).default(299),
  old_price: z.coerce.number().min(1).default(399),
  discount: z.coerce.number().min(1).max(99).default(20),
  promo_code: z.string().default(""),
  checkout_url: z.string().default(""),
  shipping_info: z.string().default("Livraison offerte dès 100€"),
  primary_color: z.string().default("#D4AF37"),
  heading_font: z.string().default("Playfair Display"),
  body_font: z.string().default("Montserrat"),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Module07() {
  const { toast } = useToast();
  const [sections, setSections] = useState<SectionResult[]>([]);
  const [streamState, setStreamState] = useState<StreamState>({ sections: {}, activeSection: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand_name: "", product_name: "", sector: "bijou", tone: "luxe",
      product_description: "", features: "", benefits: "",
      price: 299, old_price: 399, discount: 20, promo_code: "",
      checkout_url: "", shipping_info: "Livraison offerte dès 100€",
      primary_color: "#D4AF37", heading_font: "Playfair Display", body_font: "Montserrat",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setFormData(data);
    setShowResults(true);
    setStreamState({ sections: {}, activeSection: null });
    setSections([]);

    try {
      const toList = (str: string) => str.split(",").map((v) => v.trim()).filter(Boolean);

      const response = await fetch(`${import.meta.env.BASE_URL}api/openai/enhance-prompts-launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: data.brand_name,
          product_name: data.product_name,
          sector: data.sector,
          tone: data.tone,
          product_description: data.product_description,
          features: toList(data.features),
          benefits: toList(data.benefits),
          price: data.price,
          old_price: data.old_price,
          discount: data.discount,
          promo_code: data.promo_code || undefined,
          checkout_url: data.checkout_url || undefined,
          shipping_info: data.shipping_info,
          primary_color: data.primary_color,
          heading_font: data.heading_font,
          body_font: data.body_font,
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
                  [event.key]: {
                    ...p.sections[event.key],
                    buffer: (p.sections[event.key]?.buffer ?? "") + event.content,
                  },
                },
              }));
            } else if (event.type === "section_done") {
              const sec: SectionResult = {
                key: event.key,
                label: event.label,
                agent: event.agent,
                data: event.data ?? {},
                rawContent: event.rawContent ?? "",
              };
              finalSections.push(sec);
              setStreamState((p) => ({
                activeSection: null,
                sections: {
                  ...p.sections,
                  [event.key]: {
                    label: event.label, agent: event.agent,
                    buffer: "", data: event.data ?? {}, done: true,
                  },
                },
              }));
            } else if (event.type === "section_error") {
              setStreamState((p) => ({
                ...p, activeSection: null,
                sections: { ...p.sections, [event.key]: { ...p.sections[event.key], done: true, data: {} } },
              }));
            }
          } catch {}
        }
      }

      setSections(finalSections);
      toast({ title: "Module 07 — Launch Ready généré !", description: "Landing page, guide et calendrier 30 jours prêts." });
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const allDone = sections.length === SECTION_ORDER.length;

  const handleDownloadAll = () => {
    if (!sections.length || !formData) return;
    let txt = `================================================================================\nPACK MODULE 07 — LAUNCH READY — NEO BRANDING STUDIO\nMarque: ${formData.brand_name} | Produit: ${formData.product_name} | Généré le: ${new Date().toLocaleString("fr-FR")}\n================================================================================\n\n`;
    for (const sec of sections) {
      txt += `\n${"=".repeat(60)}\n${sec.label.toUpperCase()}\nAgent: ${sec.agent}\n${"=".repeat(60)}\n\n`;
      txt += sec.rawContent + "\n";
    }
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = `launch_pack_${formData.brand_name.toLowerCase()}.txt`;
    a.click();
  };

  const handleDownloadJSON = () => {
    if (!sections.length || !formData) return;
    const output = { generated_at: new Date().toISOString(), brand_name: formData.brand_name, product_name: formData.product_name, sections };
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(output, null, 2));
    a.download = `launch_pack_${formData.brand_name.toLowerCase()}.json`;
    a.click();
  };

  const selectClass = "flex h-11 w-full appearance-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors";

  return (
    <AnimatePresence mode="wait">
      {!showResults ? (
        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="max-w-2xl">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Brief — Launch Ready</CardTitle>
              <CardDescription>
                Définissez votre marque et votre produit pour générer : une landing page HTML complète prête à déployer, un guide d'utilisation avec calendrier 30 jours, et un plan de publication jour par jour.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Marque + Produit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom de la marque <span className="text-primary">*</span></label>
                    <Input placeholder="ex: LUXEOR" {...form.register("brand_name")} className="bg-black/20" />
                    {form.formState.errors.brand_name && <p className="text-destructive text-xs">{form.formState.errors.brand_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom du produit <span className="text-primary">*</span></label>
                    <Input placeholder="ex: Montre Élégance Or Rose" {...form.register("product_name")} className="bg-black/20" />
                    {form.formState.errors.product_name && <p className="text-destructive text-xs">{form.formState.errors.product_name.message}</p>}
                  </div>
                </div>

                {/* Secteur + Ton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Secteur <span className="text-primary">*</span></label>
                    <div className="relative">
                      <select {...form.register("sector")} className={selectClass}>
                        {SECTORS.map((s) => <option key={s} value={s} className="bg-card">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Ton de communication</label>
                    <div className="relative">
                      <select {...form.register("tone")} className={selectClass}>
                        {TONES.map((t) => <option key={t} value={t} className="bg-card">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description du produit</label>
                  <Input placeholder="ex: Montre automatique or rose, verre saphir, bracelet cuir..." {...form.register("product_description")} className="bg-black/20" />
                </div>

                {/* Caractéristiques + Bénéfices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Caractéristiques clés</label>
                    <Input placeholder="ex: or rose 18 carats, verre saphir, mouvement suisse" {...form.register("features")} className="bg-black/20" />
                    <p className="text-xs text-muted-foreground">Séparées par virgules</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Bénéfices</label>
                    <Input placeholder="ex: élégance, précision, durabilité" {...form.register("benefits")} className="bg-black/20" />
                    <p className="text-xs text-muted-foreground">Séparés par virgules</p>
                  </div>
                </div>

                {/* Prix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Prix (€)</label>
                    <Input type="number" min={1} placeholder="299" {...form.register("price")} className="bg-black/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Prix barré (€)</label>
                    <Input type="number" min={1} placeholder="399" {...form.register("old_price")} className="bg-black/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Remise (%)</label>
                    <Input type="number" min={1} max={99} placeholder="20" {...form.register("discount")} className="bg-black/20" />
                  </div>
                </div>

                {/* Code promo + Checkout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Code promo (optionnel)</label>
                    <Input placeholder="ex: LUXEOR20 — auto si vide" {...form.register("promo_code")} className="bg-black/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">URL de checkout</label>
                    <Input placeholder="ex: https://monsite.com/checkout" {...form.register("checkout_url")} className="bg-black/20" />
                  </div>
                </div>

                {/* Livraison */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Info livraison</label>
                  <Input placeholder="ex: Livraison offerte dès 100€ · Retours 30 jours" {...form.register("shipping_info")} className="bg-black/20" />
                </div>

                {/* Design */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Design de la landing page</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Couleur principale</label>
                      <div className="flex items-center gap-2">
                        <input type="color" {...form.register("primary_color")} className="w-10 h-10 rounded cursor-pointer border border-white/10 bg-transparent" />
                        <Input {...form.register("primary_color")} className="bg-black/20 font-mono text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Police titres</label>
                      <Input placeholder="Playfair Display" {...form.register("heading_font")} className="bg-black/20 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Police corps</label>
                      <Input placeholder="Montserrat" {...form.register("body_font")} className="bg-black/20 text-sm" />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={isGenerating} className="w-full h-12 text-base font-semibold">
                  {isGenerating ? (
                    <><Brain className="w-5 h-5 mr-2 animate-pulse" /> Génération en cours...</>
                  ) : (
                    <><Rocket className="w-5 h-5 mr-2" /> Générer le Pack Launch Ready</>
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
              <h2 className="text-xl font-bold text-foreground">{formData?.brand_name} — {formData?.product_name}</h2>
              <p className="text-sm text-muted-foreground">{formData?.sector} · Ton {formData?.tone} · {formData?.price}€</p>
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
                  <Button variant="outline" size="sm" onClick={handleDownloadAll}>
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
                className={`rounded-xl border bg-gradient-to-br ${SECTION_COLORS[key]} p-5 space-y-4`}
              >
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDone ? "bg-primary/20" : isActive ? "bg-white/10 animate-pulse" : "bg-white/5"}`}>
                      {SECTION_ICONS[key]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{SECTION_LABELS[key]}</p>
                      <p className="text-xs text-muted-foreground">{sec?.agent ?? "En attente..."}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="text-xs text-primary animate-pulse font-medium">Génération...</span>
                    )}
                    {isDone && (
                      <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                        <Check className="w-3.5 h-3.5" /> Généré
                      </span>
                    )}
                  </div>
                </div>

                {/* Section content */}
                {key === "landing_page" && (
                  <LandingPageView
                    data={sectionData}
                    streamBuffer={sec?.buffer ?? ""}
                    streaming={isGenerating}
                    isActive={isActive}
                  />
                )}
                {key === "user_guide" && (
                  <UserGuideView
                    data={sectionData}
                    streamBuffer={sec?.buffer ?? ""}
                    streaming={isGenerating}
                    isActive={isActive}
                  />
                )}
                {key === "calendar" && (
                  <CalendarView
                    data={sectionData}
                    streamBuffer={sec?.buffer ?? ""}
                    streaming={isGenerating}
                    isActive={isActive}
                  />
                )}
              </motion.div>
            );
          })}

          {/* Barre de progression */}
          {isGenerating && (
            <div className="fixed bottom-6 right-6 bg-card border border-white/10 rounded-xl p-4 shadow-2xl flex items-center gap-3 z-50">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-foreground">Génération en cours...</p>
                <p className="text-xs text-muted-foreground">
                  {sections.length}/{SECTION_ORDER.length} sections complètes
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
