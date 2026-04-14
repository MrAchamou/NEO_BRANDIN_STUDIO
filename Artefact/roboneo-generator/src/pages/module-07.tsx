import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Download, Check, Brain,
  Rocket, Globe, BookOpen, CalendarDays,
  Sparkles, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBrand } from "@/context/brand-context";
import BriefSummaryBanner from "@/components/brief-summary-banner";

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
  landing_page: "Landing Page — Prompt IA + Cahier des Charges",
  user_guide: "Guide d'Utilisation",
  calendar: "Calendrier 30 Jours",
};

// ─── Rendu spécialisé par section ────────────────────────────────────────────

function LandingPageView({ data, streamBuffer, streaming, isActive, brief }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
  brief: Record<string, unknown>;
}) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCdc, setCopiedCdc] = useState(false);
  const [expandedCdc, setExpandedCdc] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [improvedData, setImprovedData] = useState<{
    refined: string;
    score: number;
    winner: "gpt" | "claude" | "tie";
    improvements: string[];
  } | null>(null);
  const { toast } = useToast();

  const aiPrompt = (data.ai_prompt as string) ?? "";
  const cahier = data.cahier_des_charges as Record<string, unknown> | undefined;
  const meta = data.meta as Record<string, unknown> | undefined;

  if (streaming && isActive && !aiPrompt) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-xs text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-blue-400/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (!aiPrompt && !cahier) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-32 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  const activePrompt = improvedData?.refined ?? aiPrompt;

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(activePrompt);
    setCopiedPrompt(true);
    toast({ title: "Prompt IA copié !" });
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyCdc = async () => {
    const txt = cahier ? JSON.stringify(cahier, null, 2) : "";
    await navigator.clipboard.writeText(txt);
    setCopiedCdc(true);
    toast({ title: "Cahier des charges copié !" });
    setTimeout(() => setCopiedCdc(false), 2000);
  };

  const handleDownload = () => {
    const content = `# LANDING PAGE — PROMPT IA + CAHIER DES CHARGES\n# ${brief.brand_name ?? ""} — ${brief.product_name ?? ""}\n\n${"=".repeat(70)}\n## PROMPT IA (coller dans v0.dev / Cursor / Claude Artifacts)\n${"=".repeat(70)}\n\n${activePrompt}\n\n${"=".repeat(70)}\n## CAHIER DES CHARGES COMPLET\n${"=".repeat(70)}\n\n${cahier ? JSON.stringify(cahier, null, 2) : ""}`;
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
    a.download = `landing_page_cahier_charges_${String(brief.brand_name ?? "brand").toLowerCase().replace(/\s+/g, "_")}.txt`;
    a.click();
  };

  const handleImprove = async () => {
    if (!aiPrompt) return;
    setIsImproving(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/openai/review-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: activePrompt,
          section_key: "landing_page_cahier_des_charges",
          brand_name: brief.brand_name,
          sector: brief.sector,
          tone: brief.tone,
          values: brief.values,
          target_demographic: brief.target_demographic,
          competitors: brief.competitors,
          forbidden_keywords: brief.forbidden_keywords,
          colors: brief.primary_color,
        }),
      });
      if (!res.ok) throw new Error("Erreur API amélioration");
      const result = await res.json() as {
        refined: string;
        score: number;
        winner: "gpt" | "claude" | "tie";
        improvements: string[];
      };
      setImprovedData(result);
      toast({
        title: `✨ Amélioré par ${result.winner === "gpt" ? "GPT" : result.winner === "claude" ? "Claude" : "GPT + Claude"} — Score ${result.score}/10`,
        description: `${result.improvements.length} améliorations appliquées`,
      });
    } catch {
      toast({ title: "Erreur amélioration", description: "GPT et Claude n'ont pas pu améliorer le prompt.", variant: "destructive" });
    } finally {
      setIsImproving(false);
    }
  };

  const winnerColor = improvedData?.winner === "gpt"
    ? "text-green-400 border-green-500/30 bg-green-500/10"
    : improvedData?.winner === "claude"
    ? "text-purple-400 border-purple-500/30 bg-purple-500/10"
    : "text-blue-400 border-blue-500/30 bg-blue-500/10";

  return (
    <div className="space-y-4">
      {/* Meta SEO */}
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

      {/* Outils recommandés */}
      {(meta?.recommended_tools as string[] | undefined) && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Outils IA :</span>
          {(meta!.recommended_tools as string[]).map((tool) => (
            <span key={tool} className="text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
              {tool}
            </span>
          ))}
        </div>
      )}

      {/* Badge winner si amélioré */}
      {improvedData && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${winnerColor}`}>
          <Sparkles className="w-4 h-4" />
          <span>
            GOD TIER — Amélioré par {improvedData.winner === "gpt" ? "🤖 GPT Challenger" : improvedData.winner === "claude" ? "🟣 Claude Critique" : "🤖 GPT + 🟣 Claude"} — Score {improvedData.score}/10
          </span>
        </div>
      )}

      {/* Améliorations appliquées */}
      {improvedData && improvedData.improvements.length > 0 && (
        <div className="bg-black/20 rounded-lg p-3 border border-white/5 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Améliorations appliquées</p>
          {improvedData.improvements.map((imp, i) => (
            <p key={i} className="text-xs text-foreground/70 flex gap-2">
              <span className="text-green-400 flex-shrink-0">✓</span>
              <span>{imp}</span>
            </p>
          ))}
        </div>
      )}

      {/* Prompt IA */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Prompt IA — Prêt à coller
          </p>
          <Button variant="ghost" size="sm" onClick={handleCopyPrompt} className="h-7 text-xs text-muted-foreground hover:text-blue-400">
            {copiedPrompt ? <Check className="w-3.5 h-3.5 mr-1 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            Copier prompt
          </Button>
        </div>
        <div className="bg-black/40 rounded-lg p-4 h-40 overflow-y-auto text-sm text-foreground/80 leading-relaxed border border-blue-500/10 whitespace-pre-wrap font-mono">
          {activePrompt}
        </div>
      </div>

      {/* Cahier des charges */}
      {cahier && (
        <div>
          <button
            onClick={() => setExpandedCdc(!expandedCdc)}
            className="w-full flex items-center justify-between text-xs font-semibold text-foreground/70 uppercase tracking-wider hover:text-foreground transition-colors py-1.5"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              Cahier des charges complet
            </span>
            {expandedCdc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expandedCdc && (
            <div className="mt-2 space-y-3">
              {/* Objectif stratégique */}
              {cahier.objectif_strategique && (
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">🎯 Objectif stratégique</p>
                  <p className="text-sm text-foreground/80">{cahier.objectif_strategique as string}</p>
                </div>
              )}

              {/* Architecture */}
              {cahier.architecture_page && (
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-2">🏗 Architecture de la page</p>
                  {(cahier.architecture_page as Record<string, unknown>).above_fold && (
                    <div className="mb-2">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Above the fold</p>
                      <p className="text-xs text-foreground/70">{(cahier.architecture_page as any).above_fold}</p>
                    </div>
                  )}
                  {Array.isArray((cahier.architecture_page as any).sections_ordonnees) && (
                    <div className="space-y-0.5 mt-2">
                      {((cahier.architecture_page as any).sections_ordonnees as string[]).map((s, i) => (
                        <p key={i} className="text-xs text-foreground/70 border-l-2 border-blue-500/30 pl-2">{s}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Copywriting */}
              {cahier.copywriting_exact && (
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-2">✍️ Copywriting exact</p>
                  {Object.entries(cahier.copywriting_exact as Record<string, string>).map(([k, v]) => (
                    <div key={k} className="mb-1.5">
                      <p className="text-[10px] text-muted-foreground capitalize">{k.replace(/_/g, " ")}</p>
                      <p className="text-xs text-foreground/80 font-medium">"{v}"</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Design system */}
              {cahier.design_system && (
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-2">🎨 Design System</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(cahier.design_system as Record<string, string>).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] text-muted-foreground capitalize">{k.replace(/_/g, " ")}</p>
                        <p className="text-xs text-foreground/70 font-mono">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Éléments de conversion */}
              {cahier.elements_conversion && (
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-2">🔥 Éléments de conversion</p>
                  {Object.entries(cahier.elements_conversion as Record<string, string>).map(([k, v]) => (
                    <div key={k} className="mb-1.5">
                      <p className="text-[10px] text-muted-foreground capitalize">{k.replace(/_/g, " ")}</p>
                      <p className="text-xs text-foreground/70">{v}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Checklist lancement */}
              {Array.isArray(cahier.checklist_lancement) && (
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-2">✅ Checklist de lancement</p>
                  <div className="space-y-0.5">
                    {(cahier.checklist_lancement as string[]).map((item, i) => (
                      <p key={i} className="text-xs text-foreground/70">{item}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          onClick={handleImprove}
          disabled={isImproving || !aiPrompt}
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 font-semibold"
        >
          {isImproving ? (
            <><Brain className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> GPT + Claude améliorent...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Améliorer — GOD TIER</>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyCdc} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
          {copiedCdc ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
          Copier CDC
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
          <Download className="w-3.5 h-3.5 mr-1.5" /> Télécharger .txt
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
      toast({ title: "Brief incomplet", description: "Remplissez au minimum le nom de marque et le produit dans le Brief Global.", variant: "destructive" });
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
          brand_name: brief.brand_name,
          product_name: brief.product_name,
          sector: brief.sector,
          tone: brief.tone,
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
    if (!sections.length) return;
    let txt = `================================================================================\nPACK MODULE 07 — LAUNCH READY — NEO BRANDING STUDIO\nMarque: ${brief.brand_name} | Produit: ${brief.product_name} | Généré le: ${new Date().toLocaleString("fr-FR")}\n================================================================================\n\n`;
    for (const sec of sections) {
      txt += `\n${"=".repeat(60)}\n${sec.label.toUpperCase()}\nAgent: ${sec.agent}\n${"=".repeat(60)}\n\n`;
      txt += sec.rawContent + "\n";
    }
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = `launch_pack_${brief.brand_name.toLowerCase()}.txt`;
    a.click();
  };

  const handleDownloadJSON = () => {
    if (!sections.length) return;
    const output = { generated_at: new Date().toISOString(), brand_name: brief.brand_name, product_name: brief.product_name, sections };
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
                Génère un <strong>Prompt IA + Cahier des Charges GOD-TIER</strong> pour votre landing page (prêt pour v0.dev, Cursor AI, Framer…), un guide stratégique et un calendrier 30 jours personnalisé. Bouton "Améliorer" pour optimiser le CDC avec GPT + Claude jusqu'au niveau parfait.
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
