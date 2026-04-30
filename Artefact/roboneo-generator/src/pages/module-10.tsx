import React, { useState } from "react";
import { getEngineHeaders } from "@/lib/ai-engine";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Download, ChevronRight, Check, BarChart2,
  Target, TrendingUp, ClipboardList, ChevronDown, ChevronUp,
  AlertTriangle, ArrowUpCircle, Calendar,
} from "lucide-react";
import GrowthBrainDashboard from "@/components/growth-brain-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBrand, governanceFields } from "@/context/brand-context";
import BriefSummaryBanner from "@/components/brief-summary-banner";

// ─── Types ────────────────────────────────────────────────────────────────────

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

const SECTION_ORDER = ["dashboard", "kpi_guide", "scaling_guide", "weekly_review"];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  dashboard:     <BarChart2 className="w-4 h-4" />,
  kpi_guide:     <Target className="w-4 h-4" />,
  scaling_guide: <TrendingUp className="w-4 h-4" />,
  weekly_review: <ClipboardList className="w-4 h-4" />,
};

const SECTION_COLORS: Record<string, string> = {
  dashboard:     "from-blue-500/10 to-transparent border-blue-500/20",
  kpi_guide:     "from-violet-500/10 to-transparent border-violet-500/20",
  scaling_guide: "from-orange-500/10 to-transparent border-orange-500/20",
  weekly_review: "from-emerald-500/10 to-transparent border-emerald-500/20",
};

const SECTION_LABELS: Record<string, string> = {
  dashboard:     "Dashboard Google Sheets",
  kpi_guide:     "Guide KPIs par Plateforme",
  scaling_guide: "Guide Scaling & Stop",
  weekly_review: "Template Analyse Hebdomadaire",
};


// ─── Stream Buffer View (loading) ─────────────────────────────────────────────

function StreamBufferView({ buffer }: { buffer: string }) {
  return (
    <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
      {buffer}
      <span className="inline-block w-2 h-4 bg-blue-400/80 animate-pulse ml-0.5 align-middle" />
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [openTab, setOpenTab] = useState<number | null>(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { toast } = useToast();

  const tabs = (data.tabs as any[]) ?? [];
  const alerts = (data.alert_system as any[]) ?? [];
  const setup = (data.setup_instructions as string[]) ?? [];

  if (streaming && isActive && tabs.length === 0) return <StreamBufferView buffer={streamBuffer} />;
  if (tabs.length === 0) return null;

  const copyFormula = (formula: string, idx: number) => {
    navigator.clipboard.writeText(formula);
    setCopiedIdx(idx);
    toast({ description: "Formule copiée !" });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-4">
      {setup.length > 0 && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wider">Configuration</p>
          <ol className="space-y-1.5">
            {setup.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/80">
                <span className="text-blue-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="space-y-2">
        {tabs.map((tab: any, i: number) => (
          <div key={i} className="border border-white/8 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/3 transition-colors"
              onClick={() => setOpenTab(openTab === i ? null : i)}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-foreground">{tab.name}</span>
                {tab.description && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">{tab.description}</span>
                )}
              </div>
              {openTab === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {openTab === i && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                    {tab.columns && tab.columns.length > 0 && (
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider">Colonnes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tab.columns.map((col: string, ci: number) => (
                            <span key={ci} className="px-2 py-0.5 text-xs bg-white/6 border border-white/10 rounded text-foreground/80">{col}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {tab.formulas && tab.formulas.length > 0 && (
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider">Formules</p>
                        <div className="space-y-1.5">
                          {tab.formulas.map((formula: string, fi: number) => (
                            <div key={fi} className="flex items-center gap-2 group">
                              <code className="flex-1 text-xs bg-black/40 border border-white/8 rounded px-2 py-1 text-green-300 font-mono">{formula}</code>
                              <button
                                onClick={() => copyFormula(formula, fi)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {copiedIdx === fi ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {tab.notes && (
                      <p className="text-xs text-muted-foreground italic border-t border-white/5 pt-2">{tab.notes}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      {alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">Système d'alertes</p>
          {alerts.map((alert: any, i: number) => (
            <div key={i} className="grid grid-cols-4 gap-2 text-xs border border-white/8 rounded-xl p-3">
              <div className="col-span-4 font-semibold text-foreground mb-1">{alert.metric}</div>
              <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-center">
                <div className="text-red-400 font-mono text-[10px] mb-1">🔴 {alert.red_threshold}</div>
                <div className="text-[10px] text-muted-foreground">{alert.action_red}</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 text-center">
                <div className="text-yellow-400 font-mono text-[10px] mb-1">🟡 {alert.orange_threshold}</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded p-2 text-center">
                <div className="text-green-400 font-mono text-[10px] mb-1">🟢 {alert.green_threshold}</div>
                <div className="text-[10px] text-muted-foreground">{alert.action_green}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── KPI Guide View ───────────────────────────────────────────────────────────

function KpiGuideView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [openPlatform, setOpenPlatform] = useState<number | null>(0);
  const { toast } = useToast();

  const platforms = (data.platforms as any[]) ?? [];
  const globalRules = (data.global_rules as string[]) ?? [];

  if (streaming && isActive && platforms.length === 0) return <StreamBufferView buffer={streamBuffer} />;
  if (platforms.length === 0) return null;

  const copyKpi = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "KPI copié !" });
  };

  return (
    <div className="space-y-3">
      {platforms.map((platform: any, pi: number) => (
        <div key={pi} className="border border-white/8 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/3 transition-colors"
            onClick={() => setOpenPlatform(openPlatform === pi ? null : pi)}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">{platform.name}</span>
              {platform.priority_kpi && (
                <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded px-2 py-0.5">
                  🎯 {platform.priority_kpi}
                </span>
              )}
            </div>
            {openPlatform === pi ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {openPlatform === pi && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/8">
                          <th className="text-left py-2 pr-3 text-muted-foreground font-normal">KPI</th>
                          <th className="text-left py-2 pr-3 text-muted-foreground font-normal">Formule</th>
                          <th className="text-center py-2 px-2 text-green-400 font-normal">Bon</th>
                          <th className="text-center py-2 px-2 text-blue-400 font-normal">Très bon</th>
                          <th className="text-center py-2 px-2 text-violet-400 font-normal">Excellent</th>
                          <th className="py-2 w-6"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(platform.kpis ?? []).map((kpi: any, ki: number) => (
                          <tr key={ki} className="border-b border-white/4 hover:bg-white/2 group">
                            <td className="py-2 pr-3 font-medium text-foreground/90">{kpi.name}</td>
                            <td className="py-2 pr-3 font-mono text-[10px] text-muted-foreground">{kpi.formula}</td>
                            <td className="py-2 px-2 text-center text-green-400">{kpi.good}</td>
                            <td className="py-2 px-2 text-center text-blue-400">{kpi.very_good}</td>
                            <td className="py-2 px-2 text-center text-violet-400">{kpi.excellent}</td>
                            <td className="py-2">
                              <button onClick={() => copyKpi(`${kpi.name}: Bon=${kpi.good}, Très bon=${kpi.very_good}, Excellent=${kpi.excellent}`)}>
                                <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {platform.common_mistakes && platform.common_mistakes.length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
                      <p className="text-[10px] text-red-400 font-semibold mb-1.5 uppercase tracking-wider">Erreurs fréquentes</p>
                      <ul className="space-y-1">
                        {platform.common_mistakes.map((m: string, mi: number) => (
                          <li key={mi} className="text-xs text-foreground/70 flex gap-1.5">
                            <span className="text-red-400 mt-0.5">⚠</span>{m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      {globalRules.length > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-2">Règles Globales</p>
          <ul className="space-y-1.5">
            {globalRules.map((rule: string, i: number) => (
              <li key={i} className="text-sm text-foreground/80 flex gap-2">
                <ChevronRight className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Scaling Guide View ───────────────────────────────────────────────────────

function ScalingGuideView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [tab, setTab] = useState<"stop" | "scale" | "phases" | "algorithm">("stop");

  const stopCriteria   = (data.stop_criteria   as any[]) ?? [];
  const scaleCriteria  = (data.scale_criteria  as any[]) ?? [];
  const phases         = (data.phases          as any[]) ?? [];
  const algorithm      = (data.decision_algorithm as any[]) ?? [];
  const quickWins      = (data.quick_wins      as string[]) ?? [];

  if (streaming && isActive && stopCriteria.length === 0) return <StreamBufferView buffer={streamBuffer} />;
  if (stopCriteria.length === 0 && scaleCriteria.length === 0) return null;

  const TABS = [
    { key: "stop",      label: "Arrêter",  icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-red-400" },
    { key: "scale",     label: "Scaler",   icon: <ArrowUpCircle className="w-3.5 h-3.5" />, color: "text-green-400" },
    { key: "phases",    label: "Phases",   icon: <TrendingUp className="w-3.5 h-3.5" />,    color: "text-blue-400" },
    { key: "algorithm", label: "Algo",     icon: <Target className="w-3.5 h-3.5" />,        color: "text-violet-400" },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t.key ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <span className={tab === t.key ? t.color : ""}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stop" && (
        <div className="space-y-2">
          {stopCriteria.map((item: any, i: number) => (
            <div key={i} className={`border rounded-xl p-3 ${
              item.severity === "immédiat" ? "border-red-500/30 bg-red-500/5" :
              item.severity === "urgent" ? "border-orange-500/30 bg-orange-500/5" :
              "border-yellow-500/20 bg-yellow-500/5"
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.condition}</p>
                  {item.delay && <p className="text-xs text-muted-foreground mt-0.5">Après : {item.delay}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium flex-shrink-0 ${
                  item.severity === "immédiat" ? "bg-red-500/20 text-red-400" :
                  item.severity === "urgent" ? "bg-orange-500/20 text-orange-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>{item.severity}</span>
              </div>
              <p className="text-xs text-foreground/70 mt-2 border-t border-white/5 pt-2">→ {item.action}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "scale" && (
        <div className="space-y-2">
          {scaleCriteria.map((item: any, i: number) => (
            <div key={i} className="border border-green-500/20 bg-green-500/5 rounded-xl p-3">
              <p className="text-sm font-semibold text-foreground">{item.condition}</p>
              <p className="text-xs text-foreground/70 mt-1">→ {item.action}</p>
              {item.increase_percent && (
                <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 bg-green-500/15 text-green-400 rounded font-medium">
                  +{item.increase_percent}% budget
                </span>
              )}
              {item.monitoring && (
                <p className="text-[11px] text-muted-foreground mt-2 border-t border-white/5 pt-2">Surveiller : {item.monitoring}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "phases" && (
        <div className="space-y-3">
          {phases.map((phase: any, i: number) => (
            <div key={i} className="border border-white/8 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{phase.name}</p>
                  <p className="text-xs text-muted-foreground">{phase.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-400">{phase.budget_per_campaign}</p>
                  <p className="text-xs text-muted-foreground">ROAS cible : {phase.roas_target}x</p>
                </div>
              </div>
              {phase.actions && phase.actions.length > 0 && (
                <ul className="space-y-1 mb-2">
                  {phase.actions.map((a: string, ai: number) => (
                    <li key={ai} className="text-xs text-foreground/80 flex gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />{a}
                    </li>
                  ))}
                </ul>
              )}
              {phase.kpis_to_watch && phase.kpis_to_watch.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {phase.kpis_to_watch.map((k: string, ki: number) => (
                    <span key={ki} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded text-muted-foreground">{k}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "algorithm" && (
        <div className="space-y-2">
          {algorithm.map((rule: any, i: number) => (
            <div key={i} className={`border rounded-xl p-3 flex items-start gap-3 ${
              rule.priority === "haute" ? "border-green-500/20 bg-green-500/5" :
              rule.priority === "critique" ? "border-red-500/20 bg-red-500/5" :
              "border-white/8 bg-white/2"
            }`}>
              <span className={`text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded ${
                rule.priority === "haute" ? "bg-green-500/20 text-green-400" :
                rule.priority === "critique" ? "bg-red-500/20 text-red-400" :
                "bg-white/10 text-muted-foreground"
              }`}>SI</span>
              <div className="flex-1">
                <p className="text-sm font-mono text-foreground/90">{rule.if}</p>
                <p className="text-xs text-muted-foreground mt-1">→ {rule.then}</p>
              </div>
            </div>
          ))}
          {quickWins.length > 0 && (
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 mt-2">
              <p className="text-xs font-semibold text-violet-400 mb-2 uppercase tracking-wider">Quick Wins</p>
              <ul className="space-y-1.5">
                {quickWins.map((win: string, i: number) => (
                  <li key={i} className="text-sm text-foreground/80 flex gap-2">
                    <span className="text-violet-400">⚡</span>{win}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Weekly Review View ───────────────────────────────────────────────────────

function WeeklyReviewView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [openSection, setOpenSection] = useState<number | null>(0);
  const { toast } = useToast();

  const sections = (data.sections as any[]) ?? [];
  const questions = (data.questions_of_the_week as string[]) ?? [];
  const checklist = data.checklist_actions as Record<string, string[]> ?? {};
  const kpiTargets = data.kpi_targets as Record<string, number> ?? {};

  if (streaming && isActive && sections.length === 0) return <StreamBufferView buffer={streamBuffer} />;
  if (sections.length === 0) return null;

  const downloadTemplate = () => {
    const lines: string[] = ["# TEMPLATE D'ANALYSE HEBDOMADAIRE\n"];
    sections.forEach((s: any) => {
      lines.push(`\n## ${s.title}`);
      if (s.fields) {
        s.fields.forEach((f: any) => {
          lines.push(`\n**${f.label}**: _${f.placeholder}_`);
          if (f.insight_prompt) lines.push(`> ${f.insight_prompt}`);
        });
      }
    });
    if (questions.length) {
      lines.push("\n\n## Questions Stratégiques de la Semaine");
      questions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "analyse-hebdomadaire.md"; a.click();
    URL.revokeObjectURL(url);
    toast({ description: "Template téléchargé !" });
  };

  const DAYS: Record<string, string> = {
    monday: "Lundi", wednesday: "Mercredi", friday: "Vendredi", sunday: "Dimanche"
  };

  return (
    <div className="space-y-4">
      {Object.keys(kpiTargets).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { key: "ca_weekly",      label: "CA/sem",     unit: "€",  color: "text-emerald-400" },
            { key: "roas_min",       label: "ROAS min",   unit: "x",  color: "text-blue-400" },
            { key: "cpa_target",     label: "CPA cible",  unit: "€",  color: "text-violet-400" },
            { key: "cpa_max",        label: "CPA max",    unit: "€",  color: "text-orange-400" },
            { key: "conv_rate_min",  label: "Conv. min",  unit: "%",  color: "text-pink-400" },
          ].map((m) => kpiTargets[m.key] != null && (
            <div key={m.key} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
              <p className={`text-lg font-bold ${m.color}`}>{kpiTargets[m.key]}{m.unit}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {sections.map((s: any, i: number) => (
          <div key={i} className="border border-white/8 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/3 transition-colors"
              onClick={() => setOpenSection(openSection === i ? null : i)}
            >
              <span className="text-sm font-semibold text-foreground">{s.title}</span>
              {openSection === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {openSection === i && s.fields && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                    {s.fields.map((f: any, fi: number) => (
                      <div key={fi} className="border border-white/6 rounded-lg p-3">
                        <p className="text-xs font-semibold text-foreground/90 mb-1">{f.label}</p>
                        <p className="text-xs text-muted-foreground italic">{f.placeholder}</p>
                        {f.formula && (
                          <code className="block text-[10px] text-green-300 font-mono mt-1.5 bg-black/30 rounded px-2 py-1">{f.formula}</code>
                        )}
                        {f.insight_prompt && (
                          <p className="text-[10px] text-blue-400 mt-1.5 border-t border-white/5 pt-1.5">💡 {f.insight_prompt}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {Object.keys(checklist).length > 0 && (
        <div className="bg-white/2 border border-white/8 rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3">Checklist Hebdomadaire</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(checklist).map(([day, actions]) => (
              <div key={day}>
                <p className="text-[11px] text-emerald-400 font-semibold mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{DAYS[day] ?? day}
                </p>
                <ul className="space-y-1">
                  {(actions as string[]).map((a, ai) => (
                    <li key={ai} className="text-[11px] text-foreground/70 flex gap-1">
                      <span className="text-emerald-400 flex-shrink-0">□</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Questions Stratégiques</p>
          <ul className="space-y-1.5">
            {questions.map((q: string, i: number) => (
              <li key={i} className="text-sm text-foreground/80 flex gap-2">
                <span className="text-blue-400 font-bold">{i + 1}.</span>{q}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button variant="outline" size="sm" className="gap-2" onClick={downloadTemplate}>
        <Download className="w-4 h-4" />
        Télécharger le template (.md)
      </Button>
    </div>
  );
}

// ─── Section Router ────────────────────────────────────────────────────────────

function SectionView({ sectionKey, data, streamBuffer, streaming, isActive }: {
  sectionKey: string;
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  switch (sectionKey) {
    case "dashboard":     return <DashboardView    data={data} streamBuffer={streamBuffer} streaming={streaming} isActive={isActive} />;
    case "kpi_guide":     return <KpiGuideView     data={data} streamBuffer={streamBuffer} streaming={streaming} isActive={isActive} />;
    case "scaling_guide": return <ScalingGuideView data={data} streamBuffer={streamBuffer} streaming={streaming} isActive={isActive} />;
    case "weekly_review": return <WeeklyReviewView data={data} streamBuffer={streamBuffer} streaming={streaming} isActive={isActive} />;
    default:
      return (
        <pre className="text-xs text-foreground/70 whitespace-pre-wrap bg-black/20 rounded-xl p-4 max-h-60 overflow-y-auto">
          {streamBuffer || JSON.stringify(data, null, 2)}
        </pre>
      );
  }
}

// ─── HTML Export ──────────────────────────────────────────────────────────────

function generateModule10Html(brandName: string, sstate: StreamState): string {
  const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const css = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0d0d0d;color:#e5e5e5;font-family:'Segoe UI',system-ui,sans-serif;padding:2rem;line-height:1.6}
    h1{font-size:1.5rem;font-weight:700;margin-bottom:.25rem;color:#fff}
    .subtitle{color:#666;font-size:.875rem;margin-bottom:2rem}
    details{background:#141414;border:1px solid #222;border-radius:.75rem;margin-bottom:1rem;overflow:hidden}
    details[open]>summary{border-bottom:1px solid #222}
    summary{cursor:pointer;padding:1rem 1.25rem;font-weight:600;font-size:.95rem;list-style:none;display:flex;align-items:center;gap:.75rem;user-select:none}
    summary::after{content:'▸';margin-left:auto;transition:transform .2s}
    details[open]>summary::after{transform:rotate(90deg)}
    .sc{padding:1.25rem}
    .card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:.5rem;padding:1rem;margin-bottom:.75rem}
    .label{font-size:.625rem;text-transform:uppercase;letter-spacing:.08em;color:#666;margin-bottom:.35rem}
    .val{font-size:.875rem;color:#ccc}
    .blue{color:#60a5fa}.violet{color:#a78bfa}.orange{color:#fb923c}.green{color:#4ade80}.red{color:#f87171}.yellow{color:#facc15}.emerald{color:#34d399}
    .badge{font-size:.7rem;font-weight:600;padding:.2rem .6rem;border-radius:.3rem;background:#222;color:#aaa}
    .mono{font-family:monospace;font-size:.75rem;background:#0a0a0a;border:1px solid #222;border-radius:.3rem;padding:.2rem .5rem}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
    .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem}
    table{width:100%;border-collapse:collapse;font-size:.8rem;margin-top:.5rem}
    th{text-align:left;padding:.4rem .5rem;color:#777;font-weight:400;border-bottom:1px solid #222}
    td{padding:.4rem .5rem;border-bottom:1px solid #1a1a1a;color:#ccc}
    .tag{display:inline-block;font-size:.7rem;padding:.1rem .4rem;border-radius:.25rem;background:#222;color:#aaa;margin:.1rem}
    .section-wrap{background:#1a1a1a;border:1px solid #222;border-radius:.75rem;margin-bottom:2rem;overflow:hidden}
    .section-title{padding:1rem 1.25rem;font-weight:700;font-size:1rem;border-bottom:1px solid #222}
    @media print{body{background:#fff;color:#000}details{border-color:#ccc}}
  `;

  const getSec = (key: string) => sstate.sections[key];

  const renderDashboard = () => {
    const sec = getSec("dashboard");
    if (!sec?.done) return "<p style='color:#666'>Section non générée.</p>";
    const d = sec.data;
    const tabs = (d.tabs as any[]) ?? [];
    const setup = (d.setup_instructions as string[]) ?? [];
    const alerts = (d.alert_system as any[]) ?? [];
    let html = "";
    if (setup.length) html += `<div class="card"><div class="label">Configuration</div><ol style="padding-left:1.2rem">${setup.map((s: string, i: number) => `<li style="margin:.3rem 0;font-size:.875rem">${i + 1}. ${esc(s)}</li>`).join("")}</ol></div>`;
    html += tabs.map((tab: any, i: number) => `
      <details open>
        <summary><span class="blue">${i + 1}</span> ${esc(tab.name)} ${tab.description ? `<span class="badge">${esc(tab.description)}</span>` : ""}</summary>
        <div class="sc">
          ${tab.columns?.length ? `<div class="card"><div class="label">Colonnes</div><div>${(tab.columns as string[]).map((c: string) => `<span class="tag">${esc(c)}</span>`).join("")}</div></div>` : ""}
          ${tab.formulas?.length ? `<div class="card"><div class="label">Formules</div>${(tab.formulas as string[]).map((f: string) => `<code class="mono" style="display:block;margin:.3rem 0;padding:.3rem .6rem">${esc(f)}</code>`).join("")}</div>` : ""}
          ${tab.notes ? `<div class="card" style="border-style:dashed"><div class="label">Notes</div><div class="val" style="font-style:italic">${esc(tab.notes)}</div></div>` : ""}
        </div>
      </details>`).join("");
    if (alerts.length) {
      html += `<div class="card"><div class="label" style="margin-bottom:.75rem">Système d'alertes</div>`;
      html += alerts.map((a: any) => `<div style="margin-bottom:.75rem;padding:.75rem;background:#111;border-radius:.5rem;border:1px solid #2a2a2a"><strong style="font-size:.875rem">${esc(a.metric)}</strong><div class="grid2" style="margin-top:.5rem"><div style="background:#1f0a0a;border:1px solid #4b0000;border-radius:.3rem;padding:.5rem;text-align:center"><div class="red" style="font-family:monospace;font-size:.75rem">🔴 ${esc(a.red_threshold)}</div><div style="color:#aaa;font-size:.7rem;margin-top:.25rem">${esc(a.action_red ?? "")}</div></div><div style="background:#0a1f0a;border:1px solid #004b00;border-radius:.3rem;padding:.5rem;text-align:center"><div class="green" style="font-family:monospace;font-size:.75rem">🟢 ${esc(a.green_threshold)}</div><div style="color:#aaa;font-size:.7rem;margin-top:.25rem">${esc(a.action_green ?? "")}</div></div></div></div>`).join("");
      html += "</div>";
    }
    return html;
  };

  const renderKpiGuide = () => {
    const sec = getSec("kpi_guide");
    if (!sec?.done) return "<p style='color:#666'>Section non générée.</p>";
    const d = sec.data;
    const platforms = (d.platforms as any[]) ?? [];
    const globalRules = (d.global_rules as string[]) ?? [];
    let html = platforms.map((p: any) => `
      <details open>
        <summary>${esc(p.name)} ${p.priority_kpi ? `<span class="badge violet">🎯 ${esc(p.priority_kpi)}</span>` : ""}</summary>
        <div class="sc">
          <table><thead><tr><th>KPI</th><th>Formule</th><th class="green">Bon</th><th class="blue">Très bon</th><th class="violet">Excellent</th></tr></thead><tbody>
            ${(p.kpis ?? []).map((k: any) => `<tr><td><strong>${esc(k.name)}</strong></td><td class="mono">${esc(k.formula)}</td><td class="green">${esc(k.good)}</td><td class="blue">${esc(k.very_good)}</td><td class="violet">${esc(k.excellent)}</td></tr>`).join("")}
          </tbody></table>
          ${p.common_mistakes?.length ? `<div class="card" style="margin-top:.75rem;border-color:#4b0000;background:#1a0a0a"><div class="label red">Erreurs fréquentes</div><ul style="padding-left:1.2rem">${(p.common_mistakes as string[]).map((m: string) => `<li style="font-size:.8rem;margin:.2rem 0;color:#ccc">⚠ ${esc(m)}</li>`).join("")}</ul></div>` : ""}
        </div>
      </details>`).join("");
    if (globalRules.length) html += `<div class="card"><div class="label">Règles globales</div><ul style="padding-left:1.2rem">${globalRules.map((r: string) => `<li style="font-size:.875rem;margin:.3rem 0;color:#ccc">${esc(r)}</li>`).join("")}</ul></div>`;
    return html;
  };

  const renderScalingGuide = () => {
    const sec = getSec("scaling_guide");
    if (!sec?.done) return "<p style='color:#666'>Section non générée.</p>";
    const d = sec.data;
    const stop = (d.stop_criteria as any[]) ?? [];
    const scale = (d.scale_criteria as any[]) ?? [];
    const phases = (d.phases as any[]) ?? [];
    const algo = (d.decision_algorithm as any[]) ?? [];
    const qw = (d.quick_wins as string[]) ?? [];
    const sev = (s: string) => s === "immédiat" ? "red" : s === "urgent" ? "orange" : "yellow";
    return `
      ${stop.length ? `<details open><summary class="red">Critères d'arrêt</summary><div class="sc">${stop.map((c: any) => `<div class="card" style="border-left:3px solid currentColor;border-color:#${c.severity==="immédiat"?"ef4444":c.severity==="urgent"?"f97316":"eab308"}"><div style="display:flex;justify-content:space-between;margin-bottom:.3rem"><strong>${esc(c.condition)}</strong><span class="badge ${sev(c.severity)}">${esc(c.severity)}</span></div>${c.delay?`<div style="font-size:.8rem;color:#999">Après : ${esc(c.delay)}</div>`:""}<div style="margin-top:.5rem;font-size:.8rem;color:#aaa">→ ${esc(c.action)}</div></div>`).join("")}</div></details>` : ""}
      ${scale.length ? `<details open><summary class="green">Critères de scaling</summary><div class="sc">${scale.map((c: any) => `<div class="card" style="border-left:3px solid #22c55e"><strong>${esc(c.condition)}</strong>${c.increase_percent?`<span class="badge green" style="margin-left:.5rem">+${esc(c.increase_percent)}% budget</span>`:""}<div style="margin-top:.4rem;font-size:.8rem;color:#aaa">→ ${esc(c.action)}</div>${c.monitoring?`<div style="font-size:.75rem;color:#777;margin-top:.3rem">Surveiller : ${esc(c.monitoring)}</div>`:""}</div>`).join("")}</div></details>` : ""}
      ${phases.length ? `<details open><summary class="blue">Phases de scaling</summary><div class="sc">${phases.map((p: any) => `<div class="card"><div style="display:flex;justify-content:space-between;margin-bottom:.5rem"><div><strong>${esc(p.name)}</strong><div style="font-size:.8rem;color:#777">${esc(p.duration)}</div></div><div style="text-align:right"><div class="blue">${esc(p.budget_per_campaign)}</div><div style="font-size:.75rem;color:#aaa">ROAS cible : ${esc(p.roas_target)}x</div></div></div>${p.actions?.length?`<ul style="font-size:.8rem;padding-left:1.2rem;margin-bottom:.4rem">${(p.actions as string[]).map((a: string) => `<li style="margin:.2rem 0;color:#ccc">${esc(a)}</li>`).join("")}</ul>`:""} ${p.kpis_to_watch?.length?`<div>${(p.kpis_to_watch as string[]).map((k: string) => `<span class="tag">${esc(k)}</span>`).join("")}</div>`:""}</div>`).join("")}</div></details>` : ""}
      ${algo.length ? `<details open><summary class="violet">Algorithme décisionnel</summary><div class="sc">${algo.map((r: any) => `<div class="card" style="display:flex;gap:.75rem"><span class="badge ${r.priority==="haute"?"green":r.priority==="critique"?"red":""}">SI</span><div><div class="mono" style="display:inline">${esc(r.if)}</div><div style="font-size:.8rem;color:#aaa;margin-top:.3rem">→ ${esc(r.then)}</div></div></div>`).join("")}</div></details>` : ""}
      ${qw.length ? `<div class="card" style="border-color:#4b1d7f;background:#1a0a2a"><div class="label violet">Quick Wins</div><ul style="padding-left:1.2rem">${qw.map((w: string) => `<li style="font-size:.875rem;margin:.3rem 0;color:#ccc">⚡ ${esc(w)}</li>`).join("")}</ul></div>` : ""}`;
  };

  const renderWeeklyReview = () => {
    const sec = getSec("weekly_review");
    if (!sec?.done) return "<p style='color:#666'>Section non générée.</p>";
    const d = sec.data;
    const sections = (d.sections as any[]) ?? [];
    const kpiTargets = d.kpi_targets as Record<string, number> ?? {};
    const checklist = d.checklist_actions as Record<string, string[]> ?? {};
    const questions = (d.questions_of_the_week as string[]) ?? [];
    const DAYS: Record<string, string> = { monday: "Lundi", wednesday: "Mercredi", friday: "Vendredi", sunday: "Dimanche" };
    let html = "";
    if (Object.keys(kpiTargets).length) {
      const metrics = [
        { key: "ca_weekly", label: "CA/sem", unit: "€" }, { key: "roas_min", label: "ROAS min", unit: "x" },
        { key: "cpa_target", label: "CPA cible", unit: "€" }, { key: "cpa_max", label: "CPA max", unit: "€" },
        { key: "conv_rate_min", label: "Conv. min", unit: "%" },
      ];
      html += `<div class="grid2" style="margin-bottom:1rem">${metrics.filter(m => kpiTargets[m.key] != null).map(m => `<div class="card" style="text-align:center"><div style="font-size:1.25rem;font-weight:700;color:#34d399">${kpiTargets[m.key]}${m.unit}</div><div class="label" style="margin-top:.25rem">${m.label}</div></div>`).join("")}</div>`;
    }
    html += sections.map((s: any) => `
      <details open>
        <summary>${esc(s.title)}</summary>
        <div class="sc">${(s.fields ?? []).map((f: any) => `<div class="card"><div class="label">${esc(f.label)}</div><div class="val" style="font-style:italic;color:#888">${esc(f.placeholder)}</div>${f.formula ? `<code class="mono" style="display:block;margin-top:.4rem">${esc(f.formula)}</code>` : ""}${f.insight_prompt ? `<div style="font-size:.75rem;color:#60a5fa;margin-top:.5rem;padding-top:.5rem;border-top:1px solid #222">💡 ${esc(f.insight_prompt)}</div>` : ""}</div>`).join("")}</div>
      </details>`).join("");
    if (Object.keys(checklist).length) {
      html += `<div class="card"><div class="label" style="margin-bottom:.75rem">Checklist Hebdomadaire</div><div class="grid4">`;
      for (const [day, actions] of Object.entries(checklist)) {
        html += `<div><div class="emerald" style="font-size:.8rem;font-weight:600;margin-bottom:.5rem">📅 ${esc(DAYS[day] ?? day)}</div><ul style="list-style:none">${(actions as string[]).map((a: string) => `<li style="font-size:.75rem;color:#ccc;margin:.2rem 0">□ ${esc(a)}</li>`).join("")}</ul></div>`;
      }
      html += `</div></div>`;
    }
    if (questions.length) html += `<div class="card" style="border-color:#1e3a5f;background:#0a1525"><div class="label blue" style="margin-bottom:.5rem">Questions Stratégiques</div><ol style="padding-left:1.2rem">${questions.map((q: string) => `<li style="font-size:.875rem;margin:.35rem 0;color:#ccc">${esc(q)}</li>`).join("")}</ol></div>`;
    return html;
  };

  const now = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Performance Tracker — ${esc(brandName)}</title>
<style>${css}</style>
</head>
<body>
<h1>📊 Performance Tracker</h1>
<p class="subtitle">Marque : <strong>${esc(brandName)}</strong> · Généré le ${now} · RoboNeo Branding Studio</p>

<div class="section-wrap">
  <div class="section-title"><span style="color:#60a5fa">①</span> ${esc(SECTION_LABELS.dashboard)}</div>
  <div style="padding:1.25rem">${renderDashboard()}</div>
</div>
<div class="section-wrap">
  <div class="section-title"><span style="color:#a78bfa">②</span> ${esc(SECTION_LABELS.kpi_guide)}</div>
  <div style="padding:1.25rem">${renderKpiGuide()}</div>
</div>
<div class="section-wrap">
  <div class="section-title"><span style="color:#fb923c">③</span> ${esc(SECTION_LABELS.scaling_guide)}</div>
  <div style="padding:1.25rem">${renderScalingGuide()}</div>
</div>
<div class="section-wrap">
  <div class="section-title"><span style="color:#34d399">④</span> ${esc(SECTION_LABELS.weekly_review)}</div>
  <div style="padding:1.25rem">${renderWeeklyReview()}</div>
</div>
</body>
</html>`;
}

function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Module10() {
  const { toast } = useToast();
  const { brief } = useBrand();

  const [streamState, setStreamState] = useState<StreamState>({
    sections: {},
    activeSection: null,
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete]   = useState(false);
  const [activeView, setActiveView]   = useState<string>("dashboard");

  async function onSubmit() {
    if (!brief.brand_name) {
      toast({ title: "Brief incomplet", description: "Remplissez au minimum le nom de marque dans le Brief Global.", variant: "destructive" });
      return;
    }
    setIsStreaming(true);
    setIsComplete(false);
    setStreamState({ sections: {}, activeSection: null });

    try {
      const response = await fetch("/api/openai/enhance-prompts-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getEngineHeaders() },
        body: JSON.stringify({
          ...governanceFields(brief),
          brand_name:    brief.brand_name,
          sector:        brief.sector,
          ca_target:     brief.ca_target ? Number(brief.ca_target) : undefined,
          basket_target: brief.basket_target ? Number(brief.basket_target) : undefined,
          conv_target:   brief.conv_target ? Number(brief.conv_target) : undefined,
          roas_target:   brief.roas_target ? Number(brief.roas_target) : undefined,
          target_cpa:    brief.target_cpa ? Number(brief.target_cpa) : undefined,
          market:        brief.market,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Erreur réseau");
      }

      const reader   = response.body.getReader();
      const decoder  = new TextDecoder();
      let buffer     = "";

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
              setStreamState((prev) => ({
                activeSection: event.key,
                sections: {
                  ...prev.sections,
                  [event.key]: {
                    label:  SECTION_LABELS[event.key] ?? event.key,
                    agent:  "",
                    buffer: "",
                    data:   {},
                    done:   false,
                  },
                },
              }));
              setActiveView(event.key);
            } else if (event.type === "chunk") {
              setStreamState((prev) => ({
                ...prev,
                sections: {
                  ...prev.sections,
                  [event.key]: {
                    ...prev.sections[event.key],
                    buffer: (prev.sections[event.key]?.buffer ?? "") + (event.content ?? ""),
                  },
                },
              }));
            } else if (event.type === "section_done") {
              setStreamState((prev) => ({
                ...prev,
                activeSection: null,
                sections: {
                  ...prev.sections,
                  [event.key]: {
                    ...prev.sections[event.key],
                    agent:  event.agent ?? "",
                    data:   (event.data as Record<string, unknown>) ?? {},
                    done:   true,
                  },
                },
              }));
            } else if (event.type === "done") {
              setIsStreaming(false);
              setIsComplete(true);
            } else if (event.type === "error") {
              toast({ variant: "destructive", description: `Erreur : ${event.message}` });
            }
          } catch {
            // ignore malformed events
          }
        }
      }
    } catch {
      toast({ variant: "destructive", description: "Erreur de connexion au serveur." });
      setIsStreaming(false);
    }
  }

  const hasResults = Object.keys(streamState.sections).length > 0;

  return (
    <div className="space-y-8">
      {/* Brief recap + action */}
      <BriefSummaryBanner />
      <Card className="border-blue-500/20 bg-blue-500/3">
        <CardHeader>
          <CardTitle className="text-base">Performance Tracker</CardTitle>
          <CardDescription>
            Génère KPIs calibrés, seuils d'alerte et guides d'optimisation à partir du Brief Global.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onSubmit}
            disabled={isStreaming}
            className="w-full bg-blue-500 hover:bg-blue-400 text-black font-semibold"
          >
            {isStreaming ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Génération en cours…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Générer les outils de performance
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Growth Brain Dashboard — Agency Mode */}
      <GrowthBrainDashboard />

      {/* Results */}
      <AnimatePresence>
        {hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Tab Nav */}
            <div className="flex gap-1 flex-wrap border-b border-white/8 pb-3">
              {SECTION_ORDER.map((key) => {
                const sec = streamState.sections[key];
                if (!sec) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveView(key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium transition-all relative ${
                      activeView === key
                        ? "text-foreground bg-white/8 border border-white/10 border-b-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/4"
                    }`}
                  >
                    <span className={activeView === key ? "text-blue-400" : "text-muted-foreground"}>
                      {SECTION_ICONS[key]}
                    </span>
                    {sec.label ?? SECTION_LABELS[key]}
                    {sec.done ? (
                      <Check className="w-3 h-3 text-green-400 ml-0.5" />
                    ) : streamState.activeSection === key ? (
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse ml-0.5" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Active Section */}
            {SECTION_ORDER.map((key) => {
              const sec = streamState.sections[key];
              if (!sec || activeView !== key) return null;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gradient-to-b ${SECTION_COLORS[key]} rounded-2xl border p-5`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400">{SECTION_ICONS[key]}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{sec.label}</p>
                        {sec.agent && <p className="text-[11px] text-muted-foreground">{sec.agent}</p>}
                      </div>
                    </div>
                    {!sec.done && streamState.activeSection === key && (
                      <span className="flex items-center gap-1.5 text-xs text-blue-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Génération…
                      </span>
                    )}
                    {sec.done && <Check className="w-4 h-4 text-green-400" />}
                  </div>
                  <SectionView
                    sectionKey={key}
                    data={sec.data}
                    streamBuffer={sec.buffer}
                    streaming={isStreaming}
                    isActive={streamState.activeSection === key}
                  />
                </motion.div>
              );
            })}

            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between gap-3 bg-green-500/8 border border-green-500/20 rounded-2xl px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Performance Tracker complet ✓</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dashboard · KPIs · Guide Scaling · Analyse Hebdo — tous vos outils sont prêts.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 flex-shrink-0"
                  onClick={() => downloadHtml(
                    `performance-tracker-${brief.brand_name?.toLowerCase().replace(/\s+/g, "-") ?? "rapport"}.html`,
                    generateModule10Html(brief.brand_name ?? "Marque", streamState)
                  )}
                >
                  <Download className="w-4 h-4" />
                  Rapport HTML
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
