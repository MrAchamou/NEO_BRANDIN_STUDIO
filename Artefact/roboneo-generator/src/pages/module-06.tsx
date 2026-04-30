import React, { useState } from "react";
import { getEngineHeaders } from "@/lib/ai-engine";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Download, Check, Brain,
  FileText, MessageSquare, Hash, Mail, Star,
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

const SECTION_ORDER = ["product_sheet", "captions", "hashtags", "email_sequence", "client_reviews"];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  product_sheet: <FileText className="w-4 h-4" />,
  captions: <MessageSquare className="w-4 h-4" />,
  hashtags: <Hash className="w-4 h-4" />,
  email_sequence: <Mail className="w-4 h-4" />,
  client_reviews: <Star className="w-4 h-4" />,
};

const SECTION_COLORS: Record<string, string> = {
  product_sheet: "from-emerald-500/10 to-transparent border-emerald-500/20",
  captions: "from-pink-500/10 to-transparent border-pink-500/20",
  hashtags: "from-cyan-500/10 to-transparent border-cyan-500/20",
  email_sequence: "from-orange-500/10 to-transparent border-orange-500/20",
  client_reviews: "from-yellow-500/10 to-transparent border-yellow-500/20",
};

const SUB_LABELS: Record<string, Record<string, string>> = {
  product_sheet: {
    titles: "4 Titres produit",
    description: "Description longue",
    bullet_points: "Bullet Points",
    faq: "FAQ (5 questions)",
  },
  captions: {
    instagram_feed: "Instagram Feed",
    instagram_story: "Instagram Story",
    tiktok: "TikTok",
    pinterest: "Pinterest",
    facebook: "Facebook",
  },
  hashtags: {
    instagram: "Instagram (15 hashtags)",
    tiktok: "TikTok (8 hashtags)",
    pinterest: "Pinterest (20 hashtags)",
    strategy: "Stratégie Hashtag",
  },
  email_sequence: {
    launch: "Email Lancement",
    abandoned_cart: "Panier Abandonné",
    loyalty: "Fidélité",
  },
  client_reviews: {
    reviews: "10 Avis Clients",
  },
};

// ─── Formateur de contenu ─────────────────────────────────────────────────────

function formatValue(sectionKey: string, subKey: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    if (sectionKey === "client_reviews" && subKey === "reviews") {
      return (value as any[]).map((r, i) =>
        `${i + 1}. ${r.name ?? ""} — ${r.rating ?? 5}⭐\n"${r.title ?? ""}"\n${r.content ?? ""}\n📅 ${r.date ?? ""} | ${r.verified ? "✓ Achat vérifié" : ""}`
      ).join("\n\n");
    }
    if (sectionKey === "product_sheet" && subKey === "faq") {
      return (value as any[]).map((qa) => `Q: ${qa.question ?? ""}\nR: ${qa.answer ?? ""}`).join("\n\n");
    }
    return value.join("\n");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (sectionKey === "email_sequence") {
      return `OBJET: ${obj.subject ?? ""}\nPRÉHEADER: ${obj.preheader ?? ""}\n\n${obj.body ?? ""}\n\n[CTA: ${obj.cta ?? ""}]`;
    }
    return JSON.stringify(obj, null, 2);
  }

  return String(value);
}

// ─── SubPromptTabs ────────────────────────────────────────────────────────────

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
  const orderedKeys = Object.keys(labelsMap).filter((k) => allKeys.includes(k));
  const displayKeys = orderedKeys.length > 0 ? orderedKeys : allKeys;

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const currentTab = activeTab ?? displayKeys[0] ?? "";
  const currentValue = data[currentTab];
  const displayText = formatValue(sectionKey, currentTab, currentValue);

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedStates((p) => ({ ...p, [key]: true }));
    toast({ title: "Copié !" });
    setTimeout(() => setCopiedStates((p) => ({ ...p, [key]: false })), 2000);
  };

  if (streaming && isActive && displayKeys.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-primary/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (displayKeys.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayKeys.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {displayKeys.map((k) => (
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
        <div className="bg-black/30 rounded-md p-4 h-56 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap pr-12">
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

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Module06() {
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

      const response = await fetch(`${import.meta.env.BASE_URL}api/openai/enhance-prompts-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getEngineHeaders() },
        body: JSON.stringify({
          ...governanceFields(brief),
          brand_name: brief.brand_name,
          product_name: brief.product_name,
          sector: brief.sector,
          tone: brief.tone,
          product_description: brief.product_description,
          product_features: toList(brief.product_features),
          benefits: toList(brief.benefits),
          values: toList(brief.values),
          target_audience: brief.target_audience,
          discount: Number(brief.discount) || 20,
          promo_code: brief.promo_code || undefined,
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
      toast({ title: "Module 06 — Copy & Content généré !", description: "Fiche produit, captions, hashtags, emails et reviews prêts." });
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const allDone = sections.length === SECTION_ORDER.length;

  const handleDownloadTXT = () => {
    if (!sections.length) return;
    let txt = `================================================================================\nPROMPTS MODULE 06 — COPY & CONTENT — NEO BRANDING STUDIO\nMarque: ${brief.brand_name} | Produit: ${brief.product_name} | Généré le: ${new Date().toLocaleString("fr-FR")}\n================================================================================\n\n`;
    for (const sec of sections) {
      txt += `\n--- ${sec.label.toUpperCase()} ---\nAgent: ${sec.agent}\n\n`;
      for (const [k, v] of Object.entries(sec.data)) {
        const label = (SUB_LABELS[sec.key] ?? {})[k] ?? k;
        txt += `[${label}]\n${formatValue(sec.key, k, v)}\n\n`;
      }
    }
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = `prompts_m06_${brief.brand_name.toLowerCase()}.txt`;
    a.click();
  };

  const handleDownloadJSON = () => {
    if (!sections.length) return;
    const output = { generated_at: new Date().toISOString(), brand_name: brief.brand_name, product_name: brief.product_name, sections };
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(output, null, 2));
    a.download = `prompts_m06_${brief.brand_name.toLowerCase()}.json`;
    a.click();
  };

  return (
    <AnimatePresence mode="wait">
      {!showResults ? (
        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="max-w-2xl">
          <BriefSummaryBanner />
          <Card className="border-white/10 mt-4">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Copy & Content</CardTitle>
              <CardDescription>
                Génère une fiche produit complète, captions multi-plateformes, hashtags optimisés, séquence de 3 emails et 10 reviews clients réalistes à partir de votre Brief Global.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onSubmit} disabled={isGenerating} className="w-full h-12 text-base font-semibold">
                {isGenerating ? (
                  <><Brain className="w-5 h-5 mr-2 animate-pulse" /> Génération en cours...</>
                ) : (
                  <><FileText className="w-5 h-5 mr-2" /> Générer le Copy & Content</>
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
              <p className="text-sm text-muted-foreground">{brief.sector} · Ton {brief.tone} · -{brief.discount}%</p>
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

          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center"
            >
              <p className="text-emerald-400 font-semibold">✓ Copy & Content complet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Fiche produit · Captions 5 plateformes · Hashtags · 3 Emails · 10 Reviews — prêts à l'emploi
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
