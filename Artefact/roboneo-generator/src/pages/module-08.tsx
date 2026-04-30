import React, { useState } from "react";
import { getEngineHeaders } from "@/lib/ai-engine";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Download, Check, Brain,
  MessageCircle, HelpCircle, ShieldAlert, ThumbsDown,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBrand, governanceFields } from "@/context/brand-context";
import BriefSummaryBanner from "@/components/brief-summary-banner";

// ─── Types ────────────────────────────────────────────────────────────────────

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

const SECTION_ORDER = ["faq", "objections", "negative_comments"];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  faq: <HelpCircle className="w-4 h-4" />,
  objections: <ShieldAlert className="w-4 h-4" />,
  negative_comments: <ThumbsDown className="w-4 h-4" />,
};

const SECTION_COLORS: Record<string, string> = {
  faq: "from-cyan-500/10 to-transparent border-cyan-500/20",
  objections: "from-orange-500/10 to-transparent border-orange-500/20",
  negative_comments: "from-red-500/10 to-transparent border-red-500/20",
};

const SECTION_LABELS: Record<string, string> = {
  faq: "FAQ Service Client (20 questions)",
  objections: "Gestion des Objections (8 scripts)",
  negative_comments: "Réponses Commentaires Négatifs (5 situations)",
};

// ─── FAQ View ─────────────────────────────────────────────────────────────────

function FAQView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Tous");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const questions = (data.questions as any[]) ?? [];

  if (streaming && isActive && questions.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-cyan-400/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-32 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  const categories = ["Tous", ...Array.from(new Set(questions.map((q) => q.category).filter(Boolean)))];
  const filtered = activeCategory === "Tous" ? questions : questions.filter((q) => q.category === activeCategory);

  const handleCopyAll = async () => {
    const txt = questions.map((q, i) => `${i + 1}. Q: ${q.question}\n   R: ${q.answer}`).join("\n\n");
    await navigator.clipboard.writeText(txt);
    setCopied(true);
    toast({ title: "FAQ copiée !" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const txt = questions.map((q, i) =>
      `Question ${i + 1} [${q.category ?? ""}]\nQ: ${q.question}\nR: ${q.answer}\nBouton rapide: ${q.quick_reply ?? ""}`
    ).join("\n\n---\n\n");
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = "faq_chatbot.txt";
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-cyan-500 text-white"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleCopyAll} className="h-7 text-xs text-muted-foreground hover:text-cyan-400">
            {copied ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
            Copier tout
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 text-xs text-muted-foreground hover:text-cyan-400">
            <Download className="w-3 h-3 mr-1" /> TXT
          </Button>
        </div>
      </div>
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {filtered.map((q, i) => (
          <div key={q.id ?? i} className="bg-black/20 rounded-lg border border-white/5 hover:border-cyan-500/20 transition-colors">
            <button
              className="w-full text-left p-3 flex items-start justify-between gap-3"
              onClick={() => setOpenId(openId === (q.id ?? i) ? null : (q.id ?? i))}
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {q.category && (
                  <span className="flex-shrink-0 text-[10px] font-semibold text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded mt-0.5">{q.category}</span>
                )}
                <span className="text-sm font-medium text-foreground leading-snug">{q.question}</span>
              </div>
              {openId === (q.id ?? i)
                ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                : <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground mt-0.5" />}
            </button>
            <AnimatePresence>
              {openId === (q.id ?? i) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-0 space-y-2 border-t border-white/5">
                    <p className="text-sm text-foreground/80 leading-relaxed pt-2">{q.answer}</p>
                    {q.quick_reply && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Bouton rapide:</span>
                        <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">{q.quick_reply}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-right text-muted-foreground/40">{questions.length} questions générées</p>
    </div>
  );
}

// ─── Objections View ──────────────────────────────────────────────────────────

function ObjectionsView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [openId, setOpenId] = useState<number | null>(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();

  const scripts = (data.scripts as any[]) ?? [];

  if (streaming && isActive && scripts.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-orange-400/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-32 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  const handleCopy = async (script: any, id: number) => {
    const txt = `OBJECTION: ${script.scenario}\nDéclencheur: "${script.trigger}"\n\nRÉPONSE:\n${script.response}\n\nRELANCE: ${script.follow_up}\n\nCONSEIL AGENT: ${script.tip ?? ""}`;
    await navigator.clipboard.writeText(txt);
    setCopiedId(id);
    toast({ title: "Script copié !" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
      {scripts.map((s, i) => (
        <div key={s.id ?? i} className="bg-black/20 rounded-lg border border-white/5 hover:border-orange-500/20 transition-colors">
          <button
            className="w-full text-left p-3 flex items-center justify-between gap-3"
            onClick={() => setOpenId(openId === (s.id ?? i) ? null : (s.id ?? i))}
          >
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center text-xs font-bold text-orange-400">
                {s.id ?? i + 1}
              </span>
              <span className="text-sm font-medium text-foreground">{s.scenario}</span>
            </div>
            {openId === (s.id ?? i)
              ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {openId === (s.id ?? i) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
                  {s.trigger && (
                    <div className="bg-black/30 rounded p-2 border-l-2 border-orange-400/40">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Le client dit :</p>
                      <p className="text-sm text-foreground/70 italic">"{s.trigger}"</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Réponse :</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{s.response}</p>
                  </div>
                  {s.follow_up && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Relance :</span>
                      <span className="text-sm text-orange-400 italic">{s.follow_up}</span>
                    </div>
                  )}
                  {s.tip && (
                    <div className="bg-orange-500/5 rounded p-2 border border-orange-500/10">
                      <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">Conseil agent :</p>
                      <p className="text-xs text-muted-foreground">{s.tip}</p>
                    </div>
                  )}
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleCopy(s, s.id ?? i)}
                    className="h-7 text-xs text-muted-foreground hover:text-orange-400"
                  >
                    {copiedId === (s.id ?? i) ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
                    Copier le script
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ─── Negative Comments View ───────────────────────────────────────────────────

function NegativeCommentsView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeView, setActiveView] = useState<"public" | "private">("public");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { toast } = useToast();

  const situations = (data.situations as any[]) ?? [];

  if (streaming && isActive && situations.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-red-400/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (situations.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-32 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  const current = situations[activeIdx];

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({ title: "Réponse copiée !" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Situation tabs */}
      <div className="flex flex-wrap gap-1.5">
        {situations.map((s, i) => (
          <button
            key={i}
            onClick={() => { setActiveIdx(i); setActiveView("public"); }}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeIdx === i
                ? "bg-red-500 text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            {i + 1}. {(s.situation_title ?? s.type ?? "Situation").slice(0, 20)}
          </button>
        ))}
      </div>

      {current && (
        <div className="space-y-3">
          {/* Example comment */}
          {current.example_comment && (
            <div className="bg-black/30 rounded p-2.5 border-l-2 border-red-400/40">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Commentaire exemple :</p>
              <p className="text-sm text-foreground/70 italic">"{current.example_comment}"</p>
            </div>
          )}

          {/* Public / Private toggle */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveView("public")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeView === "public" ? "bg-red-500 text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              🌐 Réponse publique
            </button>
            <button
              onClick={() => setActiveView("private")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeView === "private" ? "bg-red-500 text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              🔒 Message privé
            </button>
          </div>

          <div className="relative">
            <div className="bg-black/30 rounded-md p-4 min-h-24 border border-red-500/10 text-sm text-foreground/80 leading-relaxed pr-10">
              {activeView === "public" ? current.public_response : current.private_message}
            </div>
            <Button
              variant="ghost" size="icon"
              onClick={() => handleCopy(activeView === "public" ? current.public_response : current.private_message, `${activeIdx}-${activeView}`)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-red-400"
            >
              {copiedKey === `${activeIdx}-${activeView}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* Dos and Don'ts */}
          {(current.dos || current.donts) && (
            <div className="grid grid-cols-2 gap-2">
              {current.dos && current.dos.length > 0 && (
                <div className="bg-green-500/5 rounded p-2 border border-green-500/10">
                  <p className="text-[10px] text-green-400 uppercase tracking-wider mb-1.5">À faire ✓</p>
                  {(current.dos as string[]).map((d, i) => (
                    <p key={i} className="text-xs text-foreground/70 leading-snug">• {d}</p>
                  ))}
                </div>
              )}
              {current.donts && current.donts.length > 0 && (
                <div className="bg-red-500/5 rounded p-2 border border-red-500/10">
                  <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1.5">À éviter ✗</p>
                  {(current.donts as string[]).map((d, i) => (
                    <p key={i} className="text-xs text-foreground/70 leading-snug">• {d}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Formulaire ───────────────────────────────────────────────────────────────

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Module08() {
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
      const response = await fetch(`${import.meta.env.BASE_URL}api/openai/enhance-prompts-chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getEngineHeaders() },
        body: JSON.stringify({
          ...governanceFields(brief),
          brand_name: brief.brand_name,
          product_name: brief.product_name,
          sector: brief.sector,
          tone: brief.tone,
          product_description: brief.product_description,
          ingredients: brief.ingredients || undefined,
          material: brief.product_materials || undefined,
          warranty: Number(brief.warranty) || 2,
          delivery_days_local: Number(brief.delivery_days_local) || Number(brief.delivery_days) || 3,
          delivery_days_international: Number(brief.delivery_days_international) || 7,
          express_delivery_days: Number(brief.express_delivery_days) || 1,
          express_price: Number(brief.express_price) || 9.90,
          return_days: Number(brief.return_days) || 30,
          discount: Number(brief.discount) || 20,
          promo_code: brief.promo_code || undefined,
          price: Number(brief.price) || 299,
          currency: brief.currency || "FCFA",
          free_shipping: Number(brief.free_shipping) || 100,
          support_email: brief.support_email || undefined,
          unique_feature: brief.unique_feature || undefined,
          best_seller_1: brief.best_seller_1 || undefined,
          best_seller_2: brief.best_seller_2 || undefined,
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
                key: event.key, governance: event.governance, pricing_validator: event.pricing_validator, profit_engine: event.profit_engine,
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
      toast({ title: "Module 08 — Chatbot Script généré !", description: "FAQ, objections et réponses commentaires prêts." });
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const allDone = sections.length === SECTION_ORDER.length;

  const handleDownloadJSON = () => {
    if (!sections.length) return;
    const output = { generated_at: new Date().toISOString(), brand_name: brief.brand_name, product_name: brief.product_name, sections };
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(output, null, 2));
    a.download = `chatbot_${brief.brand_name.toLowerCase()}.json`;
    a.click();
  };

  const handleDownloadTXT = () => {
    if (!sections.length) return;
    let txt = `================================================================================\nCHATBOT SCRIPT MODULE 08 — NEO BRANDING STUDIO\nMarque: ${brief.brand_name} | Produit: ${brief.product_name} | Généré le: ${new Date().toLocaleString("fr-FR")}\n================================================================================\n\n`;
    for (const sec of sections) {
      txt += `\n${"=".repeat(60)}\n${sec.label.toUpperCase()}\nAgent: ${sec.agent}\n${"=".repeat(60)}\n\n`;
      txt += sec.rawContent + "\n";
    }
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = `chatbot_${brief.brand_name.toLowerCase()}.txt`;
    a.click();
  };

  return (
    <AnimatePresence mode="wait">
      {!showResults ? (
        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="max-w-2xl">
          <BriefSummaryBanner />
          <Card className="border-white/10 mt-4">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Chatbot Script</CardTitle>
              <CardDescription>
                Génère 20 questions/réponses FAQ, 8 scripts de gestion des objections et 5 réponses professionnelles aux commentaires négatifs à partir de votre Brief Global.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onSubmit} disabled={isGenerating} className="w-full h-12 text-base font-semibold">
                {isGenerating ? (
                  <><Brain className="w-5 h-5 mr-2 animate-pulse" /> Génération en cours...</>
                ) : (
                  <><MessageCircle className="w-5 h-5 mr-2" /> Générer le Chatbot Script</>
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
                className={`rounded-xl border bg-gradient-to-br ${SECTION_COLORS[key]} p-5 space-y-4`}
              >
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
                    {isActive && <span className="text-xs text-primary animate-pulse font-medium">Génération...</span>}
                    {isDone && (
                      <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                        <Check className="w-3.5 h-3.5" /> Généré
                      </span>
                    )}
                  </div>
                </div>

                {key === "faq" && (
                  <FAQView data={sectionData} streamBuffer={sec?.buffer ?? ""} streaming={isGenerating} isActive={isActive} />
                )}
                {key === "objections" && (
                  <ObjectionsView data={sectionData} streamBuffer={sec?.buffer ?? ""} streaming={isGenerating} isActive={isActive} />
                )}
                {key === "negative_comments" && (
                  <NegativeCommentsView data={sectionData} streamBuffer={sec?.buffer ?? ""} streaming={isGenerating} isActive={isActive} />
                )}
              </motion.div>
            );
          })}

          {isGenerating && (
            <div className="fixed bottom-6 right-6 bg-card border border-white/10 rounded-xl p-4 shadow-2xl flex items-center gap-3 z-50">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-foreground">Génération en cours...</p>
                <p className="text-xs text-muted-foreground">{sections.length}/{SECTION_ORDER.length} sections complètes</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
