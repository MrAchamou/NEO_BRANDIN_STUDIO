/**
 * Growth Brain Dashboard — AI BRAND OS v3.x Agency Mode
 *
 * Dashboard interactif temps réel pour les métriques de croissance :
 * Risk Meter, Scenario Simulator, Weekly Brief, Channel Optimizer.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, TrendingUp, Activity, BarChart2,
  Zap, ArrowUpRight, ArrowDownRight, RefreshCw,
  ChevronDown, ChevronUp, Eye, Target, Layers,
  Download, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getEngineHeaders } from "@/lib/ai-engine";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RiskMeterResult {
  scaling_risk_index: "Low" | "Medium" | "High";
  creative_fatigue_score: number;
  profit_stability_index: number;
  retention_health_score: number;
  composite_risk_score: number;
  agency_summary: {
    headline: string;
    bullets: string[];
    action_urgency: "none" | "watch" | "act" | "urgent";
  };
}

interface SimulationResult {
  scenario: string;
  change_description: string;
  projected_roas: number;
  projected_cpa: number;
  projected_ltv_impact_pct: number;
  risk_adjustment: "lower" | "neutral" | "higher";
  confidence: "low" | "medium" | "high";
  rationale: string;
}

interface ChannelRecommendation {
  channel: string;
  current_share_pct: number;
  recommended_share_pct: number;
  delta_pct: number;
  action: string;
  rationale: string;
}

interface WeeklyBrief {
  title: string;
  generated_at: string;
  performance_overview: {
    outlook: string;
    profit_sustainability: string;
    risk_index: string;
  };
  scaling_opportunities: string[];
  risk_flags: string[];
  creative_analysis: string[];
  retention_update: { m1: string; m3: string; health: string };
  profit_check: { ltv_cac_ratio: number; profitability: string; break_even_months: number };
  recommended_action: { action: string; scale_percent: number | null; rationale: string[] };
  agency_footer: string;
}

// ─── Couleurs par niveau de risque ───────────────────────────────────────────

const RISK_COLORS = {
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  High: "text-red-400 bg-red-500/10 border-red-500/30",
};

const OUTLOOK_COLORS: Record<string, string> = {
  very_bullish: "text-emerald-400",
  bullish: "text-green-400",
  neutral: "text-amber-400",
  bearish: "text-red-400",
};

const OUTLOOK_LABELS: Record<string, string> = {
  very_bullish: "Très haussier",
  bullish: "Haussier",
  neutral: "Neutre",
  bearish: "Baissier",
};

// ─── Gauge circulaire ─────────────────────────────────────────────────────────

function RadialGauge({ value, max = 100, color, label, sublabel }: {
  value: number; max?: number; color: string; label: string; sublabel?: string;
}) {
  const pct = Math.min(value / max, 1);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="36" y="40" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">
          {value}
        </text>
      </svg>
      <span className="text-[11px] font-medium text-foreground/80 text-center leading-tight">{label}</span>
      {sublabel && <span className="text-[10px] text-muted-foreground text-center">{sublabel}</span>}
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">{value}/100</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Channel Badge ────────────────────────────────────────────────────────────

function ChannelBadge({ rec }: { rec: ChannelRecommendation }) {
  const action_styles: Record<string, string> = {
    increase: "text-emerald-400 border-emerald-500/30 bg-emerald-500/8",
    reduce: "text-amber-400 border-amber-500/30 bg-amber-500/8",
    pause: "text-red-400 border-red-500/30 bg-red-500/8",
    maintain: "text-blue-400 border-blue-500/30 bg-blue-500/8",
    invest: "text-violet-400 border-violet-500/30 bg-violet-500/8",
  };

  const arrow = rec.delta_pct > 0
    ? <ArrowUpRight className="w-3 h-3 text-emerald-400" />
    : rec.delta_pct < 0
      ? <ArrowDownRight className="w-3 h-3 text-amber-400" />
      : null;

  return (
    <div className={`border rounded-xl p-3 ${action_styles[rec.action] ?? "border-white/10"}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold capitalize">{rec.channel}</span>
        <div className="flex items-center gap-1 text-xs font-mono">
          {arrow}
          <span>{rec.current_share_pct}% → {rec.recommended_share_pct}%</span>
        </div>
      </div>
      <p className="text-[11px] text-foreground/60 leading-snug">{rec.rationale}</p>
    </div>
  );
}

// ─── Données de démo ──────────────────────────────────────────────────────────

const DEMO_PAYLOAD = {
  order_metrics: {
    avg_order_value: 85,
    purchase_frequency_per_year: 3.2,
    customer_lifespan_years: 2,
    gross_margin_percent: 58,
    cac: 38,
    refund_rate_percent: 4,
  },
  cohort_data: {
    cohort_month: "2024-01",
    customers_acquired: 620,
    revenue_month_0: 52700,
    revenue_month_1: 36000,
    revenue_month_2: 28000,
    revenue_month_3: 21000,
  },
  creative_metrics: [
    { period_label: "W1", ctr: 0.028, frequency: 2.1, roas: 4.1, spend: 6000, revenue: 24600 },
    { period_label: "W2", ctr: 0.019, frequency: 3.4, roas: 3.0, spend: 6000, revenue: 18000 },
    { period_label: "W3", ctr: 0.011, frequency: 5.1, roas: 2.0, spend: 6000, revenue: 12000 },
  ],
  sector: "cosmetics",
  weeks_running: 5,
  current_margin_stable: true,
};

const DEMO_CHANNELS = {
  channels: [
    { channel: "meta", roas: 2.0, ctr: 0.011, frequency: 5.1, budget_share_pct: 50 },
    { channel: "google", roas: 4.2, ctr: 0.038, budget_share_pct: 25 },
    { channel: "tiktok", roas: 3.1, ctr: 0.022, frequency: 2.8, budget_share_pct: 15 },
    { channel: "email", budget_share_pct: 10 },
  ],
};

// ─── Composant principal ──────────────────────────────────────────────────────

export default function GrowthBrainDashboard() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"risk" | "simulate" | "brief" | "channels">("risk");
  const [loading, setLoading] = useState(false);

  const [riskData, setRiskData] = useState<RiskMeterResult | null>(null);
  const [simData, setSimData] = useState<Record<string, SimulationResult> | null>(null);
  const [briefData, setBriefData] = useState<WeeklyBrief | null>(null);
  const [channelData, setChannelData] = useState<ChannelRecommendation[] | null>(null);

  const [expanded, setExpanded] = useState(false);

  async function fetchRiskMeter() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/growth/risk-meter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEMO_PAYLOAD),
      });
      const d = await r.json();
      setRiskData(d.risk_meter);
      setActiveTab("risk");
    } catch {
      toast({ title: "Erreur Growth Brain", description: "Serveur inaccessible", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchSimulations() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/growth/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...DEMO_PAYLOAD, current_roas: 3.0, current_cpa: 38, current_budget: 6000 }),
      });
      const d = await r.json();
      setSimData(d.simulations);
      setActiveTab("simulate");
    } catch {
      toast({ title: "Erreur Simulations", description: "Serveur inaccessible", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchWeeklyBrief() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/growth/weekly-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...DEMO_PAYLOAD, output_mode: "client_ready" }),
      });
      const d = await r.json();
      setBriefData(d);
      setActiveTab("brief");
    } catch {
      toast({ title: "Erreur Weekly Brief", description: "Serveur inaccessible", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const [exporting, setExporting] = useState<"html" | "pdf" | null>(null);

  async function exportBrief(format: "html" | "pdf") {
    setExporting(format);
    try {
      const url =
        `${API}/api/growth/weekly-brief/export?format=${format}` +
        (format === "html" ? "&download=1" : "");

      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getEngineHeaders() },
        body: JSON.stringify(DEMO_PAYLOAD),
      });

      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      const html = await r.text();
      const dateStamp = new Date().toISOString().slice(0, 10);

      if (format === "html") {
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `brief-strategique-${dateStamp}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        toast({ title: "Brief HTML téléchargé", description: `brief-strategique-${dateStamp}.html` });
      } else {
        const win = window.open("", "_blank", "noopener,noreferrer");
        if (!win) {
          toast({
            title: "Pop-up bloqué",
            description: "Autorise les pop-ups pour générer le PDF.",
            variant: "destructive",
          });
          return;
        }
        win.document.open();
        win.document.write(html);
        win.document.close();
        toast({ title: "PDF prêt", description: "La fenêtre d'impression va s'ouvrir." });
      }
    } catch (err) {
      toast({
        title: "Erreur export",
        description: err instanceof Error ? err.message : "Impossible de générer le brief",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  }

  async function fetchChannels() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/growth/channel-optimizer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEMO_CHANNELS),
      });
      const d = await r.json();
      setChannelData(d.recommendations);
      setActiveTab("channels");
    } catch {
      toast({ title: "Erreur Channel Optimizer", description: "Serveur inaccessible", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const hasAnyData = riskData || simData || briefData || channelData;

  return (
    <Card className="border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <Activity className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground">Growth Decision Brain</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Agency Mode — Risk, Scenarios, Brief hebdo, Canaux</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <CardContent className="pt-0 space-y-4">
              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                  onClick={fetchRiskMeter}
                  disabled={loading}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Risk Meter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs"
                  onClick={fetchSimulations}
                  disabled={loading}
                >
                  <Zap className="w-3 h-3" />
                  Simuler
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs"
                  onClick={fetchWeeklyBrief}
                  disabled={loading}
                >
                  <TrendingUp className="w-3 h-3" />
                  Brief Hebdo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs"
                  onClick={fetchChannels}
                  disabled={loading}
                >
                  <Layers className="w-3 h-3" />
                  Canaux
                </Button>
              </div>

              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Calcul en cours…
                </div>
              )}

              {/* Tab nav */}
              {hasAnyData && (
                <div className="flex gap-1 bg-white/3 rounded-lg p-1">
                  {riskData && (
                    <button
                      onClick={() => setActiveTab("risk")}
                      className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-colors ${activeTab === "risk" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Risk
                    </button>
                  )}
                  {simData && (
                    <button
                      onClick={() => setActiveTab("simulate")}
                      className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-colors ${activeTab === "simulate" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Scénarios
                    </button>
                  )}
                  {briefData && (
                    <button
                      onClick={() => setActiveTab("brief")}
                      className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-colors ${activeTab === "brief" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Brief
                    </button>
                  )}
                  {channelData && (
                    <button
                      onClick={() => setActiveTab("channels")}
                      className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-colors ${activeTab === "channels" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Canaux
                    </button>
                  )}
                </div>
              )}

              {/* ── RISK METER ─────────────────────────────────────────────── */}
              {activeTab === "risk" && riskData && (
                <motion.div key="risk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Headline */}
                  <div className={`border rounded-xl px-4 py-3 text-sm font-medium ${RISK_COLORS[riskData.scaling_risk_index]}`}>
                    {riskData.agency_summary.headline}
                  </div>

                  {/* Gauges */}
                  <div className="grid grid-cols-4 gap-2">
                    <RadialGauge
                      value={riskData.creative_fatigue_score}
                      color={riskData.creative_fatigue_score > 60 ? "#ef4444" : riskData.creative_fatigue_score > 40 ? "#f59e0b" : "#10b981"}
                      label="Fatigue"
                      sublabel="Créative"
                    />
                    <RadialGauge
                      value={riskData.profit_stability_index}
                      color={riskData.profit_stability_index > 65 ? "#10b981" : riskData.profit_stability_index > 40 ? "#f59e0b" : "#ef4444"}
                      label="Stabilité"
                      sublabel="Profit"
                    />
                    <RadialGauge
                      value={riskData.retention_health_score}
                      color={riskData.retention_health_score > 55 ? "#10b981" : riskData.retention_health_score > 30 ? "#f59e0b" : "#ef4444"}
                      label="Rétention"
                      sublabel="Santé"
                    />
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <div className={`text-2xl font-bold px-3 py-1 rounded-lg border ${RISK_COLORS[riskData.scaling_risk_index]}`}>
                        {riskData.scaling_risk_index}
                      </div>
                      <span className="text-[11px] text-muted-foreground text-center">Risque<br/>Scaling</span>
                    </div>
                  </div>

                  {/* Bullets */}
                  <div className="space-y-1.5">
                    {riskData.agency_summary.bullets.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-foreground/70">
                        <Eye className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── SIMULATIONS ────────────────────────────────────────────── */}
              {activeTab === "simulate" && simData && (
                <motion.div key="simulate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {Object.entries(simData).map(([key, sim]) => {
                    const roas_up = sim.projected_roas > 3.0;
                    const roas_color = roas_up ? "text-emerald-400" : "text-red-400";
                    const roas_icon = roas_up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />;

                    return (
                      <div key={key} className="border border-white/8 rounded-xl p-3.5 bg-white/2 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-foreground">{sim.change_description}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            sim.confidence === "high" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/8" :
                            sim.confidence === "medium" ? "border-blue-500/30 text-blue-400 bg-blue-500/8" :
                            "border-amber-500/30 text-amber-400 bg-amber-500/8"
                          }`}>
                            {sim.confidence === "high" ? "Haute" : sim.confidence === "medium" ? "Moyenne" : "Faible"} confiance
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white/4 rounded-lg p-2 text-center">
                            <div className={`flex items-center justify-center gap-0.5 text-base font-bold ${roas_color}`}>
                              {roas_icon}
                              {sim.projected_roas}x
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">ROAS projeté</div>
                          </div>
                          <div className="bg-white/4 rounded-lg p-2 text-center">
                            <div className="text-base font-bold text-foreground">{sim.projected_cpa}€</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">CPA projeté</div>
                          </div>
                          <div className="bg-white/4 rounded-lg p-2 text-center">
                            <div className={`text-base font-bold ${sim.projected_ltv_impact_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {sim.projected_ltv_impact_pct >= 0 ? "+" : ""}{sim.projected_ltv_impact_pct}%
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">Impact LTV</div>
                          </div>
                        </div>
                        <p className="text-[11px] text-foreground/60 leading-snug">{sim.rationale}</p>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* ── WEEKLY BRIEF ───────────────────────────────────────────── */}
              {activeTab === "brief" && briefData && (
                <motion.div key="brief" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{briefData.title}</span>
                    <span className={`text-xs font-medium ${OUTLOOK_COLORS[briefData.performance_overview.outlook] ?? "text-muted-foreground"}`}>
                      {OUTLOOK_LABELS[briefData.performance_overview.outlook] ?? briefData.performance_overview.outlook}
                    </span>
                  </div>

                  {/* Boutons export client-ready */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs"
                      onClick={() => exportBrief("html")}
                      disabled={exporting !== null}
                      data-testid="button-export-brief-html"
                    >
                      {exporting === "html" ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                      Télécharger HTML
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-violet-500/30 text-violet-300 hover:bg-violet-500/10 text-xs"
                      onClick={() => exportBrief("pdf")}
                      disabled={exporting !== null}
                      data-testid="button-export-brief-pdf"
                    >
                      {exporting === "pdf" ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <FileText className="w-3 h-3" />
                      )}
                      Télécharger PDF
                    </Button>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/4 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-foreground">{briefData.profit_check.ltv_cac_ratio}x</div>
                      <div className="text-[10px] text-muted-foreground">LTV/CAC</div>
                    </div>
                    <div className="bg-white/4 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-foreground">{briefData.profit_check.break_even_months}m</div>
                      <div className="text-[10px] text-muted-foreground">Break-even</div>
                    </div>
                    <div className={`rounded-lg p-2.5 text-center ${RISK_COLORS[briefData.performance_overview.risk_index as "Low" | "Medium" | "High"] ?? "bg-white/4"}`}>
                      <div className="text-lg font-bold">{briefData.performance_overview.risk_index}</div>
                      <div className="text-[10px]">Risque</div>
                    </div>
                  </div>

                  {/* Rétention */}
                  <div className="border border-white/8 rounded-xl p-3 bg-white/2 space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Rétention</p>
                    <ScoreBar value={parseInt(briefData.retention_update.m1)} color="#6366f1" label="M+1" />
                    <ScoreBar value={parseInt(briefData.retention_update.m3)} color="#8b5cf6" label="M+3" />
                  </div>

                  {/* Opportunités */}
                  {briefData.scaling_opportunities.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Opportunités</p>
                      {briefData.scaling_opportunities.map((s, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-foreground/70">
                          <TrendingUp className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action */}
                  <div className="border border-violet-500/20 bg-violet-500/5 rounded-xl px-3 py-2.5">
                    <p className="text-xs font-semibold text-violet-300 mb-1">
                      Action recommandée — {briefData.recommended_action.action}
                      {briefData.recommended_action.scale_percent ? ` (+${briefData.recommended_action.scale_percent}%)` : ""}
                    </p>
                    {briefData.recommended_action.rationale.slice(0, 2).map((r, i) => (
                      <p key={i} className="text-[11px] text-foreground/60">{r}</p>
                    ))}
                  </div>

                  <p className="text-[10px] text-muted-foreground text-right">{briefData.agency_footer}</p>
                </motion.div>
              )}

              {/* ── CHANNELS ────────────────────────────────────────────────── */}
              {activeTab === "channels" && channelData && (
                <motion.div key="channels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  {channelData.map((rec, i) => (
                    <ChannelBadge key={i} rec={rec} />
                  ))}
                </motion.div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
