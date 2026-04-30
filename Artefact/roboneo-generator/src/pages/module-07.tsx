import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Download, Check, Brain,
  Rocket, Globe, BookOpen, CalendarDays,
  Sparkles, ExternalLink, Zap, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBrand, governanceFields } from "@/context/brand-context";
import BriefSummaryBanner from "@/components/brief-summary-banner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewResult {
  refined: string;
  score: number;
  gpt_score: number;
  claude_score: number;
  improvements: string[];
}

interface SectionResult {
  key: string;
  label: string;
  agent: string;
  data: Record<string, unknown>;
  rawContent: string;
  reviewResult?: ReviewResult;
  governance?: any;
  pricing_validator?: any;
  profit_engine?: any;
}

interface SectionState {
  label: string;
  agent: string;
  buffer: string;
  data: Record<string, unknown>;
  done: boolean;
  reviewing: boolean;
  reviewResult?: ReviewResult;
  reviewError?: string;
}

interface StreamState {
  sections: Record<string, SectionState>;
  activeSection: string | null;
}

interface RecommendedModel {
  name: string;
  icon: string;
  why: string;
  url: string;
  badge?: string;
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
  landing_page: "Landing Page — Prompt IA + Cahier des Charges GOD-TIER",
  user_guide: "Guide d'Utilisation",
  calendar: "Calendrier 30 Jours",
};

// ─── Landing Page View ────────────────────────────────────────────────────────

function LandingPageView({
  data,
  streamBuffer,
  streaming,
  isActive,
  reviewing,
  reviewResult,
  reviewError,
  brief,
}: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
  reviewing: boolean;
  reviewResult?: ReviewResult;
  reviewError?: string;
  brief: Record<string, unknown>;
}) {
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [copiedFinal, setCopiedFinal] = useState(false);
  const { toast } = useToast();

  const combinedDocument = (data.combined_document as string) ?? "";
  const recommendedModels = (data.recommended_models as RecommendedModel[]) ?? [];
  const meta = data.meta as Record<string, unknown> | undefined;

  // Active content: if review done, use refined; otherwise use Cerebras output
  const activeDocument = reviewResult?.refined ?? combinedDocument;

  // ── Loading state ──
  if (streaming && isActive && !combinedDocument) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-xs text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-blue-400/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (!combinedDocument) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-32 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  const handleCopyDoc = async () => {
    await navigator.clipboard.writeText(combinedDocument);
    setCopiedDoc(true);
    toast({ title: "Document Cerebras copié !" });
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  const handleCopyFinal = async () => {
    await navigator.clipboard.writeText(activeDocument);
    setCopiedFinal(true);
    toast({ title: "✨ Document GOD-TIER copié !" });
    setTimeout(() => setCopiedFinal(false), 2000);
  };

  const handleDownload = () => {
    const header = `# LANDING PAGE — PROMPT IA + CAHIER DES CHARGES GOD-TIER\n# ${brief.brand_name ?? ""} — ${brief.product_name ?? ""}\n# Généré par Neo Branding Studio\n${"=".repeat(70)}\n\n`;
    const reviewSection = reviewResult
      ? `${"=".repeat(70)}\n# OPTIMISATION GPT → AUDIT CLAUDE — Score final: ${reviewResult.score}/10\n# GPT: ${reviewResult.gpt_score}/10 | Claude: ${reviewResult.claude_score}/10\n${"=".repeat(70)}\n\nAméliorations appliquées:\n${reviewResult.improvements.map((i) => `• ${i}`).join("\n")}\n\n`
      : "";
    const content = header + reviewSection + activeDocument;
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
    a.download = `landing_page_god_tier_${String(brief.brand_name ?? "brand").toLowerCase().replace(/\s+/g, "_")}.txt`;
    a.click();
  };

  const optimizerBadgeStyle = "text-purple-400 border-purple-500/30 bg-purple-500/10";
  const optimizerLabel = "🤖 GPT Optimizer → 🟣 Claude Auditor";

  return (
    <div className="space-y-4">

      {/* ── Modèles IA recommandés ─────────────────────────────────────────── */}
      {recommendedModels.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-blue-400" />
            Modèles IA idéaux pour ce document
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {recommendedModels.map((model) => (
              <a
                key={model.name}
                href={model.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1 bg-black/30 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 rounded-lg p-3 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{model.icon}</span>
                    <span className="text-sm font-semibold text-foreground group-hover:text-blue-300 transition-colors">
                      {model.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {model.badge && (
                      <span className="text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        {model.badge}
                      </span>
                    )}
                    <ExternalLink className="w-3 h-3 text-muted-foreground/40 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground/70 leading-snug">{model.why}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Review en cours ────────────────────────────────────────────────── */}
      {reviewing && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-purple-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
        >
          <Brain className="w-4 h-4 text-purple-400 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">GPT optimise, Claude audite la couverture finale...</p>
            <p className="text-xs text-muted-foreground">Optimisation séquentielle vers le niveau 10/10 — GOD TIER</p>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </motion.div>
      )}

      {/* ── Badge optimisation après review ─────────────────────────────────── */}
      {reviewResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-2"
        >
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-semibold ${optimizerBadgeStyle}`}>
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>
              GOD TIER — Optimisé par {optimizerLabel} — Score final {reviewResult.score}/10
              <span className="ml-2 text-[11px] font-normal opacity-70">
                (GPT: {reviewResult.gpt_score}/10 · Claude: {reviewResult.claude_score}/10)
              </span>
            </span>
          </div>

          {reviewResult.improvements.length > 0 && (
            <div className="bg-black/20 rounded-lg p-3 border border-white/5 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Améliorations appliquées</p>
              {reviewResult.improvements.map((imp, i) => (
                <p key={i} className="text-xs text-foreground/70 flex gap-2">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  <span>{imp}</span>
                </p>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Review error ───────────────────────────────────────────────────── */}
      {reviewError && !reviewResult && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-400">
          <span>⚠</span>
          <span>{reviewError} — Document original conservé.</span>
        </div>
      )}

      {/* ── Document principal ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {reviewResult ? "Document GOD-TIER — Prêt à exécuter" : "Document Cerebras — Génération en cours"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={reviewResult ? handleCopyFinal : handleCopyDoc}
            className="h-7 text-xs text-muted-foreground hover:text-blue-400"
          >
            {(reviewResult ? copiedFinal : copiedDoc) ? (
              <Check className="w-3.5 h-3.5 mr-1 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1" />
            )}
            {reviewResult ? "Copier GOD-TIER" : "Copier document"}
          </Button>
        </div>
        <div className="bg-black/40 rounded-lg p-4 h-64 overflow-y-auto text-sm text-foreground/80 leading-relaxed border border-blue-500/10 whitespace-pre-wrap font-mono">
          {activeDocument}
          {reviewing && !reviewResult && (
            <span className="inline-block w-2 h-4 bg-purple-400/60 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>

      {/* ── Meta SEO ───────────────────────────────────────────────────────── */}
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

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={!activeDocument}
          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" /> Télécharger .txt
        </Button>
      </div>
    </div>
  );
}

// ─── User Guide View ──────────────────────────────────────────────────────────

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

// ─── Calendar View ────────────────────────────────────────────────────────────

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

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Module07() {
  const { toast } = useToast();
  const [sections, setSections] = useState<SectionResult[]>([]);
  const [streamState, setStreamState] = useState<StreamState>({ sections: {}, activeSection: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const { brief } = useBrand();

  const onSubmit = async () => {
    if (!brief.brand_name || !brief.product_name) {
      toast({
        title: "Brief incomplet",
        description: "Remplissez au minimum le nom de marque et le produit dans le Brief Global.",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    setShowResults(true);
    setStreamState({ sections: {}, activeSection: null });
    setSections([]);

    try {
      const toList = (str: string) => str.split(",").map((v) => v.trim()).filter(Boolean);

      const response = await fetch(`${import.meta.env.BASE_URL}api/openai/enhance-prompts-launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...governanceFields(brief),
          brand_name: brief.brand_name,
          product_name: brief.product_name,
          sector: brief.sector,
          tone: brief.tone,
          values: brief.values,
          target_demographic: brief.target_demographic,
          competitors: brief.competitors,
          forbidden_keywords: brief.forbidden_keywords,
          colors: brief.primary_color,
          product_description: brief.product_description,
          features: toList(brief.product_features),
          benefits: toList(brief.benefits),
          price: Number(brief.price) || 299,
          old_price: Number(brief.old_price) || 399,
          discount: Number(brief.discount) || 20,
          promo_code: brief.promo_code || undefined,
          checkout_url: brief.checkout_url || undefined,
          shipping_info: brief.shipping_info,
          primary_color: brief.primary_color,
          heading_font: brief.heading_font,
          body_font: brief.body_font,
          market: brief.market,
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
                  [event.key]: {
                    label: event.label,
                    agent: event.agent,
                    buffer: "",
                    data: {},
                    done: false,
                    reviewing: false,
                  },
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
                key: event.key, governance: event.governance, pricing_validator: event.pricing_validator, profit_engine: event.profit_engine,
                label: event.label,
                agent: event.agent,
                data: event.data ?? {},
                rawContent: event.rawContent ?? "",
              };
              if (event.key !== "landing_page") {
                finalSections.push(sec);
              }
              setStreamState((p) => ({
                activeSection: null,
                sections: {
                  ...p.sections,
                  [event.key]: {
                    label: event.label,
                    agent: event.agent,
                    buffer: "",
                    data: event.data ?? {},
                    done: event.key !== "landing_page",
                    reviewing: false,
                  },
                },
              }));

            } else if (event.type === "review_start") {
              setStreamState((p) => ({
                ...p,
                sections: {
                  ...p.sections,
                  [event.key]: {
                    ...p.sections[event.key],
                    reviewing: true,
                  },
                },
              }));

            } else if (event.type === "review_done") {
              const reviewResult: ReviewResult = {
                refined: event.refined,
                score: event.score,
                gpt_score: event.gpt_score,
                claude_score: event.claude_score,
                improvements: event.improvements,
              };
              setStreamState((p) => ({
                ...p,
                sections: {
                  ...p.sections,
                  [event.key]: {
                    ...p.sections[event.key],
                    reviewing: false,
                    done: true,
                    reviewResult,
                  },
                },
              }));
              // Also push final section to results
              const prevSec = finalSections.find((s) => s.key === event.key);
              const baseData = prevSec?.data ?? {};
              const sec: SectionResult = {
                key: event.key, governance: event.governance, pricing_validator: event.pricing_validator, profit_engine: event.profit_engine,
                label: streamState.sections[event.key]?.label ?? "",
                agent: streamState.sections[event.key]?.agent ?? "",
                data: baseData,
                rawContent: event.refined,
                reviewResult,
              };
              finalSections.push(sec);

            } else if (event.type === "review_error") {
              setStreamState((p) => ({
                ...p,
                sections: {
                  ...p.sections,
                  [event.key]: {
                    ...p.sections[event.key],
                    reviewing: false,
                    done: true,
                    reviewError: event.message,
                  },
                },
              }));
              const baseData = {};
              finalSections.push({
                key: event.key,
                label: streamState.sections[event.key]?.label ?? "",
                agent: streamState.sections[event.key]?.agent ?? "",
                data: baseData,
                rawContent: "",
              });

            } else if (event.type === "section_error") {
              setStreamState((p) => ({
                ...p,
                activeSection: null,
                sections: {
                  ...p.sections,
                  [event.key]: {
                    ...p.sections[event.key],
                    done: true,
                    reviewing: false,
                    data: {},
                  },
                },
              }));
            }
          } catch {}
        }
      }

      setSections(finalSections);
      toast({
        title: "Module 07 — Launch Ready généré !",
        description: "Landing page GOD-TIER, guide et calendrier 30 jours prêts.",
      });
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const allDone = SECTION_ORDER.every((k) => streamState.sections[k]?.done);

  const handleDownloadAll = () => {
    if (!sections.length) return;
    let txt = `================================================================================\nPACK MODULE 07 — LAUNCH READY — NEO BRANDING STUDIO\nMarque: ${brief.brand_name} | Produit: ${brief.product_name} | Généré le: ${new Date().toLocaleString("fr-FR")}\n================================================================================\n\n`;
    for (const sec of sections) {
      txt += `\n${"=".repeat(60)}\n${sec.label.toUpperCase()}\nAgent: ${sec.agent}\n${"=".repeat(60)}\n\n`;
      if (sec.reviewResult) {
        txt += `[GPT: ${sec.reviewResult.gpt_score}/10 | Claude: ${sec.reviewResult.claude_score}/10 | Score final: ${sec.reviewResult.score}/10 | Chaîne: GPT → Claude]\n\n`;
        txt += sec.reviewResult.refined + "\n";
      } else {
        txt += sec.rawContent + "\n";
      }
    }
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = `launch_pack_${brief.brand_name.toLowerCase()}.txt`;
    a.click();
  };

  const handleDownloadJSON = () => {
    if (!sections.length) return;
    const output = {
      generated_at: new Date().toISOString(),
      brand_name: brief.brand_name,
      product_name: brief.product_name,
      sections: sections.map((s) => ({
        ...s,
        final_document: s.reviewResult?.refined ?? s.rawContent,
      })),
    };
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(output, null, 2));
    a.download = `launch_pack_${brief.brand_name.toLowerCase()}.json`;
    a.click();
  };

  return (
    <AnimatePresence mode="wait">
      {!showResults ? (
        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="max-w-2xl">
          <BriefSummaryBanner />
          <Card className="border-white/10 mt-4">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Launch Ready</CardTitle>
              <CardDescription>
                Génère un <strong>Prompt IA + Cahier des Charges GOD-TIER fusionnés</strong> pour votre landing page — prêt à coller directement dans v0.dev, Cursor, Claude ou Framer. GPT optimise automatiquement le document, puis Claude l'audite pour compléter ce qui manque et viser le niveau 10/10. Inclut un guide stratégique et un calendrier 30 jours personnalisé.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onSubmit} disabled={isGenerating} className="w-full h-12 text-base font-semibold">
                {isGenerating ? (
                  <><Brain className="w-5 h-5 mr-2 animate-pulse" /> Génération en cours...</>
                ) : (
                  <><Rocket className="w-5 h-5 mr-2" /> Générer le Pack Launch Ready</>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          {/* Header résultats */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">{brief.brand_name} — {brief.product_name}</h2>
              <p className="text-sm text-muted-foreground">{brief.sector} · Ton {brief.tone} · {brief.price}€</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowResults(false);
                  setSections([]);
                  setStreamState({ sections: {}, activeSection: null });
                }}
              >
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
            const isReviewing = sec?.reviewing ?? false;
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
                    <div className={`p-2 rounded-lg ${isDone ? "bg-primary/20" : isActive || isReviewing ? "bg-white/10 animate-pulse" : "bg-white/5"}`}>
                      {SECTION_ICONS[key]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{SECTION_LABELS[key]}</p>
                      <p className="text-xs text-muted-foreground">{sec?.agent ?? "En attente..."}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive && !isReviewing && (
                      <span className="text-xs text-primary animate-pulse font-medium">Génération Cerebras...</span>
                    )}
                    {isReviewing && (
                      <span className="text-xs text-purple-400 animate-pulse font-medium flex items-center gap-1">
                        <Brain className="w-3 h-3" /> GPT + Claude...
                      </span>
                    )}
                    {isDone && !isReviewing && (
                      <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        {sec?.reviewResult ? `GOD-TIER ${sec.reviewResult.score}/10` : "Généré"}
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
                    reviewing={isReviewing}
                    reviewResult={sec?.reviewResult}
                    reviewError={sec?.reviewError}
                    brief={brief as unknown as Record<string, unknown>}
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
                  {SECTION_ORDER.filter((k) => streamState.sections[k]?.done).length}/{SECTION_ORDER.length} sections complètes
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
