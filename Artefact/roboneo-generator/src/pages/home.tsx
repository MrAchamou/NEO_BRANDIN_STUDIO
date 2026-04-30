import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Lock, ChevronRight, Palette, Camera, Video,
  ShoppingBag, MessageSquare, BarChart2, Mail, Share2,
  Globe, Users, Music2, Zap, FileText, Rocket, MessageCircle, ShoppingCart
} from "lucide-react";
import BrandBriefPanel from "@/components/brand-brief-panel";
import AIModeBadge from "@/components/ai-mode-badge";
import LanguageSelector from "@/components/language-selector";
import { useT } from "@/i18n";
import Module01 from "./module-01";
import Module02 from "./module-02";
import Module03 from "./module-03";
import Module04 from "./module-04";
import Module05 from "./module-05";
import Module06 from "./module-06";
import Module07 from "./module-07";
import Module08 from "./module-08";
import Module09 from "./module-09";
import Module10 from "./module-10";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleOutput {
  label: string;
  icon: string;
}

interface ModuleDef {
  id: string;
  /** Numeric id used in i18n keys (modules.<i18nKey>.name / .tagline / .variants). */
  i18nKey: string;
  number: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  available: boolean;
  component?: React.ComponentType;
  prompts?: number;
  /** Icons of variant pills (labels come from i18n). */
  outputIcons: string[];
}

// ─── Définition des modules ───────────────────────────────────────────────────

const MODULES: ModuleDef[] = [
  {
    id: "brand-identity", i18nKey: "1", number: "01",
    icon: <Palette className="w-5 h-5" />,
    color: "text-amber-400", bgColor: "bg-amber-400/10",
    gradientFrom: "from-amber-500/20", gradientTo: "to-transparent",
    borderColor: "border-amber-400/30",
    available: true, component: Module01, prompts: 4,
    outputIcons: ["✦", "◉", "Aa", "▤"],
  },
  {
    id: "visual-content", i18nKey: "2", number: "02",
    icon: <Camera className="w-5 h-5" />,
    color: "text-rose-400", bgColor: "bg-rose-400/10",
    gradientFrom: "from-rose-500/20", gradientTo: "to-transparent",
    borderColor: "border-rose-400/30",
    available: true, component: Module02, prompts: 19,
    outputIcons: ["📷", "✦", "🔍", "⟷"],
  },
  {
    id: "video-content", i18nKey: "3", number: "03",
    icon: <Video className="w-5 h-5" />,
    color: "text-purple-400", bgColor: "bg-purple-400/10",
    gradientFrom: "from-purple-500/20", gradientTo: "to-transparent",
    borderColor: "border-purple-400/30",
    available: true, component: Module03, prompts: 14,
    outputIcons: ["✎", "▶", "▷", "✦"],
  },
  {
    id: "ad-creatives", i18nKey: "4", number: "04",
    icon: <Zap className="w-5 h-5" />,
    color: "text-orange-400", bgColor: "bg-orange-400/10",
    gradientFrom: "from-orange-500/20", gradientTo: "to-transparent",
    borderColor: "border-orange-400/30",
    available: true, component: Module04, prompts: 18,
    outputIcons: ["ƒ", "⬡", "♪", "▦"],
  },
  {
    id: "brand-sound", i18nKey: "5", number: "05",
    icon: <Music2 className="w-5 h-5" />,
    color: "text-violet-400", bgColor: "bg-violet-400/10",
    gradientFrom: "from-violet-500/20", gradientTo: "to-transparent",
    borderColor: "border-violet-400/30",
    available: true, component: Module05, prompts: 16,
    outputIcons: ["♩", "♫", "◉", "🎤"],
  },
  {
    id: "copy-content", i18nKey: "6", number: "06",
    icon: <FileText className="w-5 h-5" />,
    color: "text-emerald-400", bgColor: "bg-emerald-400/10",
    gradientFrom: "from-emerald-500/20", gradientTo: "to-transparent",
    borderColor: "border-emerald-400/30",
    available: true, component: Module06, prompts: 22,
    outputIcons: ["📄", "✍", "#", "✉"],
  },
  {
    id: "launch-ready", i18nKey: "7", number: "07",
    icon: <Rocket className="w-5 h-5" />,
    color: "text-blue-400", bgColor: "bg-blue-400/10",
    gradientFrom: "from-blue-500/20", gradientTo: "to-transparent",
    borderColor: "border-blue-400/30",
    available: true, component: Module07, prompts: 18,
    outputIcons: ["🌐", "📖", "📅", "✉"],
  },
  {
    id: "chatbot-script", i18nKey: "8", number: "08",
    icon: <MessageCircle className="w-5 h-5" />,
    color: "text-cyan-400", bgColor: "bg-cyan-400/10",
    gradientFrom: "from-cyan-500/20", gradientTo: "to-transparent",
    borderColor: "border-cyan-400/30",
    available: true, component: Module08, prompts: 16,
    outputIcons: ["❓", "🛡", "💬", "📋"],
  },
  {
    id: "upsell-kit", i18nKey: "9", number: "09",
    icon: <ShoppingCart className="w-5 h-5" />,
    color: "text-green-400", bgColor: "bg-green-400/10",
    gradientFrom: "from-green-500/20", gradientTo: "to-transparent",
    borderColor: "border-green-400/30",
    available: true, component: Module09, prompts: 14,
    outputIcons: ["🛍", "📦", "✎", "✉"],
  },
  {
    id: "performance-tracker", i18nKey: "10", number: "10",
    icon: <BarChart2 className="w-5 h-5" />,
    color: "text-blue-400", bgColor: "bg-blue-400/10",
    gradientFrom: "from-blue-500/20", gradientTo: "to-transparent",
    borderColor: "border-blue-400/30",
    available: true, component: Module10, prompts: 16,
    outputIcons: ["📊", "🎯", "📈", "📋"],
  },
];

const AVAILABLE_COUNT = MODULES.filter((m) => m.available).length;

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const { t, tArray } = useT();
  return (
    <aside className="flex flex-col gap-1.5 py-1">
      {MODULES.map((mod) => {
        const isActive = activeId === mod.id;
        const title = t(`modules.${mod.i18nKey}.name`);
        const variants = tArray(`modules.${mod.i18nKey}.variants`);
        return (
          <motion.button
            key={mod.id}
            onClick={() => mod.available && onSelect(mod.id)}
            disabled={!mod.available}
            whileHover={mod.available && !isActive ? { x: 2 } : {}}
            transition={{ duration: 0.15 }}
            className={`group relative w-full text-left rounded-xl border transition-all duration-200 overflow-hidden ${
              isActive
                ? `bg-gradient-to-r ${mod.gradientFrom} ${mod.gradientTo} ${mod.borderColor}`
                : mod.available
                ? "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"
                : "bg-white/2 border-white/5 opacity-40 cursor-not-allowed"
            }`}
          >
            {/* Active glow line */}
            {isActive && (
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${mod.color.replace("text-", "bg-")} opacity-80`} />
            )}

            <div className="flex items-center gap-3 px-3 py-2.5">
              {/* Icon badge */}
              <div className={`relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                isActive
                  ? `${mod.bgColor} ${mod.borderColor} ${mod.color}`
                  : mod.available
                  ? "bg-white/5 border-white/10 text-muted-foreground group-hover:text-foreground"
                  : "bg-white/3 border-white/8 text-muted-foreground/30"
              }`}>
                {mod.available ? mod.icon : <Lock className="w-3.5 h-3.5" />}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground/50 tracking-wider">
                    {mod.number}
                  </span>
                  {mod.prompts && isActive && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${mod.bgColor} ${mod.color}`}>
                      {mod.prompts}p
                    </span>
                  )}
                  {!mod.available && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-white/5 text-muted-foreground/40 font-medium tracking-wider">
                      {t("buttons.loading")}
                    </span>
                  )}
                </div>
                <p className={`text-sm font-semibold leading-tight truncate transition-colors ${
                  isActive ? mod.color : mod.available ? "text-foreground" : "text-muted-foreground/40"
                }`}>
                  {title}
                </p>

                {/* Output pills */}
                {mod.available && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {variants.slice(0, 4).map((label, i) => (
                      <span key={label} className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border font-medium transition-colors ${
                        isActive
                          ? `${mod.bgColor} ${mod.borderColor} ${mod.color}`
                          : "bg-white/5 border-white/10 text-muted-foreground/60"
                      }`}>
                        <span className="opacity-70">{mod.outputIcons[i] ?? ""}</span>
                        <span>{label}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {isActive && (
                <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${mod.color} opacity-80`} />
              )}
            </div>
          </motion.button>
        );
      })}
    </aside>
  );
}

// ─── Module header card ───────────────────────────────────────────────────────

function ModuleHeader({ mod }: { mod: ModuleDef }) {
  const { t, tArray } = useT();
  const title = t(`modules.${mod.i18nKey}.name`);
  const description = t(`modules.${mod.i18nKey}.tagline`);
  const variants = tArray(`modules.${mod.i18nKey}.variants`);
  return (
    <motion.div
      key={mod.id}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border overflow-hidden mb-6 bg-gradient-to-br ${mod.gradientFrom} ${mod.gradientTo} ${mod.borderColor}`}
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:24px_24px]" />

      <div className="relative px-6 py-5 flex items-start gap-5">
        {/* Big number */}
        <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center border ${mod.bgColor} ${mod.borderColor}`}>
          <span className={`text-2xl font-black font-mono ${mod.color}`}>{mod.number}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">{t("modules.section_title")}</span>
            {mod.prompts && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${mod.bgColor} ${mod.borderColor} ${mod.color}`}>
                {mod.prompts} prompts
              </span>
            )}
          </div>
          <h2 className={`text-2xl font-bold leading-tight ${mod.color}`}>{title}</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xl">{description}</p>

          {/* Output pills row */}
          <div className="flex flex-wrap gap-2 mt-3">
            {variants.map((label, i) => (
              <span key={label} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium ${mod.bgColor} ${mod.borderColor} ${mod.color}`}>
                <span className="text-base leading-none">{mod.outputIcons[i] ?? ""}</span>
                <span>{label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Big icon background decoration */}
        <div className={`hidden lg:flex flex-shrink-0 w-12 h-12 rounded-xl items-center justify-center ${mod.bgColor} ${mod.color} opacity-40`}>
          <div className="scale-[2]">{mod.icon}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mobile nav ───────────────────────────────────────────────────────────────

function MobileNav({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const available = MODULES.filter((m) => m.available);
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none lg:hidden">
      {available.map((mod) => (
        <button
          key={mod.id}
          onClick={() => onSelect(mod.id)}
          className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
            activeId === mod.id
              ? `bg-gradient-to-r ${mod.gradientFrom} ${mod.gradientTo} ${mod.borderColor} ${mod.color}`
              : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/8"
          }`}
        >
          {mod.icon}
          <span>MOD-{mod.number}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Home() {
  const { t } = useT();
  const [activeModuleId, setActiveModuleId] = useState("brand-identity");
  const activeModule = MODULES.find((m) => m.id === activeModuleId)!;
  const ActiveComponent = activeModule.component;

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/luxury-bg.png`}
          alt=""
          className="w-full h-full object-cover opacity-20 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/97 to-background" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="pt-8 pb-6 border-b border-white/5">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("app.powered_by")}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-serif gold-gradient-text leading-tight">
                {t("app.title")}
              </h1>
              <p className="text-foreground/80 text-sm mt-2 max-w-2xl font-medium">
                {t("app.tagline")}
              </p>
              <p className="text-muted-foreground text-xs mt-1.5 max-w-2xl leading-relaxed">
                {t("app.subtitle")} {t("app.description")}
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <LanguageSelector />
                <AIModeBadge />
                <span className="text-xs text-muted-foreground/60 font-mono">{t("app.version_label")}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[11px] text-green-400 font-mono">Qwen-3 235B</span>
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{t("ai_models.generation")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[11px] text-blue-400 font-mono">GPT-5.2</span>
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{t("ai_models.optimization")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  <span className="text-[11px] text-orange-400 font-mono">Claude Sonnet</span>
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{t("ai_models.audit")}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="mt-4">
          <MobileNav activeId={activeModuleId} onSelect={setActiveModuleId} />
        </div>

        {/* Main layout */}
        <div className="flex gap-6 mt-4 pb-16">

          {/* Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0 sticky top-6 self-start">
            <div className="bg-card/40 border border-white/8 rounded-2xl p-2.5 backdrop-blur-sm">

              {/* Header sidebar */}
              <div className="px-2 py-2 mb-1 flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">{t("modules.section_title")}</p>
                <span className="text-xs font-mono text-muted-foreground/40">
                  {t("modules.progress_label", { done: AVAILABLE_COUNT, total: 10 })}
                </span>
              </div>

              <Sidebar activeId={activeModuleId} onSelect={setActiveModuleId} />

              {/* Progress bar */}
              <div className="mt-3 px-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground/50">{t("brief.progress_label", { percent: Math.round((AVAILABLE_COUNT / 10) * 100) })}</span>
                  <span className="text-xs font-semibold text-primary">
                    {t("modules.progress_label", { done: AVAILABLE_COUNT, total: 10 })}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(AVAILABLE_COUNT / 10) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-primary to-violet-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModuleId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <BrandBriefPanel />
                <ModuleHeader mod={activeModule} />

                {ActiveComponent ? (
                  <ActiveComponent />
                ) : (
                  <div className="flex items-center justify-center h-64 text-center rounded-2xl border border-white/5 bg-white/2">
                    <div>
                      <Lock className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-muted-foreground/60 font-medium">{t("buttons.loading")}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
