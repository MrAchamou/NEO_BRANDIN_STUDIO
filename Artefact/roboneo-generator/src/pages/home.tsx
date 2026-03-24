import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Lock, ChevronRight, Palette, Camera, Video,
  ShoppingBag, MessageSquare, BarChart2, Mail, Share2,
  Globe, Users, Music2, Zap, FileText, Rocket
} from "lucide-react";
import Module01 from "./module-01";
import Module02 from "./module-02";
import Module03 from "./module-03";
import Module04 from "./module-04";
import Module05 from "./module-05";
import Module06 from "./module-06";
import Module07 from "./module-07";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleOutput {
  label: string;
  icon: string;
}

interface ModuleDef {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  available: boolean;
  component?: React.ComponentType;
  prompts?: number;
  outputs: ModuleOutput[];
}

// ─── Définition des modules ───────────────────────────────────────────────────

const MODULES: ModuleDef[] = [
  {
    id: "brand-identity",
    number: "01",
    title: "Brand Identity",
    subtitle: "Logo, Palette, Typo, Charte",
    description: "Crée l'ADN visuel de ta marque — logo, couleurs, typographie et charte graphique complète.",
    icon: <Palette className="w-5 h-5" />,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    gradientFrom: "from-amber-500/20",
    gradientTo: "to-transparent",
    borderColor: "border-amber-400/30",
    available: true,
    component: Module01,
    prompts: 4,
    outputs: [
      { label: "Logo", icon: "✦" },
      { label: "Palette", icon: "◉" },
      { label: "Typo", icon: "Aa" },
      { label: "Charte", icon: "▤" },
    ],
  },
  {
    id: "visual-content",
    number: "02",
    title: "Visual Content",
    subtitle: "Photos, Lifestyle, Carousel",
    description: "Génère tous les visuels produit — shots studio, lifestyle, détails textures, before/after, try-on et carrousels.",
    icon: <Camera className="w-5 h-5" />,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    gradientFrom: "from-rose-500/20",
    gradientTo: "to-transparent",
    borderColor: "border-rose-400/30",
    available: true,
    component: Module02,
    prompts: 19,
    outputs: [
      { label: "Photo", icon: "📷" },
      { label: "Lifestyle", icon: "✦" },
      { label: "Détail", icon: "🔍" },
      { label: "B/A", icon: "⟷" },
      { label: "Try-On", icon: "◈" },
      { label: "Carousel", icon: "▦" },
    ],
  },
  {
    id: "video-content",
    number: "03",
    title: "Video Content",
    subtitle: "Reels, TikTok, YouTube",
    description: "Scripts, shot-lists et briefs créatifs pour tous les formats vidéo — shorts, longs formats, teasers et miniatures.",
    icon: <Video className="w-5 h-5" />,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    gradientFrom: "from-purple-500/20",
    gradientTo: "to-transparent",
    borderColor: "border-purple-400/30",
    available: true,
    component: Module03,
    prompts: 14,
    outputs: [
      { label: "Script", icon: "✎" },
      { label: "TikTok", icon: "▶" },
      { label: "YouTube", icon: "▷" },
      { label: "Teaser", icon: "✦" },
      { label: "Thumb", icon: "▣" },
      { label: "Voix off", icon: "🎤" },
    ],
  },
  {
    id: "ad-creatives",
    number: "04",
    title: "Ad Creatives",
    subtitle: "Meta, Google, TikTok Ads",
    description: "Toutes les créations publicitaires — Meta Ads, Google Display 6 formats, TikTok Ads, Carousel et Ad Copy 4 variantes.",
    icon: <Zap className="w-5 h-5" />,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    gradientFrom: "from-orange-500/20",
    gradientTo: "to-transparent",
    borderColor: "border-orange-400/30",
    available: true,
    component: Module04,
    prompts: 18,
    outputs: [
      { label: "Meta", icon: "ƒ" },
      { label: "Google", icon: "⬡" },
      { label: "TikTok", icon: "♪" },
      { label: "Carousel", icon: "▦" },
      { label: "Ad Copy", icon: "✎" },
      { label: "CTR", icon: "📊" },
    ],
  },
  {
    id: "brand-sound",
    number: "05",
    title: "Brand Sound",
    subtitle: "Jingle, BGM, Voix Off",
    description: "Identité sonore complète — jingle, musiques de fond 15s/30s/60s, effets sonores, voix ElevenLabs et synchronisation vidéo.",
    icon: <Music2 className="w-5 h-5" />,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    gradientFrom: "from-violet-500/20",
    gradientTo: "to-transparent",
    borderColor: "border-violet-400/30",
    available: true,
    component: Module05,
    prompts: 16,
    outputs: [
      { label: "Jingle", icon: "♩" },
      { label: "BGM", icon: "♫" },
      { label: "SFX", icon: "◉" },
      { label: "Voix off", icon: "🎤" },
      { label: "Beat Sync", icon: "⏱" },
    ],
  },
  {
    id: "copy-content",
    number: "06",
    title: "Copy & Content",
    subtitle: "Fiche produit, captions, emails",
    description: "Génère tout le contenu textuel de ta marque — fiche produit complète, captions multi-plateformes, hashtags optimisés, séquence d'emails et reviews clients réalistes.",
    icon: <FileText className="w-5 h-5" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    gradientFrom: "from-emerald-500/20",
    gradientTo: "to-transparent",
    borderColor: "border-emerald-400/30",
    available: true,
    component: Module06,
    prompts: 22,
    outputs: [
      { label: "Fiche", icon: "📄" },
      { label: "Captions", icon: "✍" },
      { label: "Hashtags", icon: "#" },
      { label: "Emails", icon: "✉" },
      { label: "Reviews", icon: "⭐" },
    ],
  },
  {
    id: "launch-ready",
    number: "07",
    title: "Launch Ready",
    subtitle: "Landing page, guide, calendrier",
    description: "Génère tout pour lancer ta marque : landing page HTML prête à déployer, guide d'utilisation complet (quel fichier, quelle plateforme, quand publier) et calendrier de publication 30 jours optimisé.",
    icon: <Rocket className="w-5 h-5" />,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    gradientFrom: "from-blue-500/20",
    gradientTo: "to-transparent",
    borderColor: "border-blue-400/30",
    available: true,
    component: Module07,
    prompts: 18,
    outputs: [
      { label: "Landing", icon: "🌐" },
      { label: "Guide", icon: "📖" },
      { label: "Calendrier", icon: "📅" },
    ],
  },
  {
    id: "social-media",
    number: "08",
    title: "Social Media",
    subtitle: "Posts, stories, stratégie",
    description: "Stratégie de contenu et prompts pour tous les réseaux sociaux.",
    icon: <Share2 className="w-5 h-5" />,
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
    gradientFrom: "from-pink-500/20",
    gradientTo: "to-transparent",
    borderColor: "border-pink-400/30",
    available: false,
    outputs: [
      { label: "Posts", icon: "▣" },
      { label: "Stories", icon: "◎" },
      { label: "Stratégie", icon: "▤" },
    ],
  },
  {
    id: "web-landing",
    number: "09",
    title: "Web & Landing",
    subtitle: "Pages de vente, hero sections",
    description: "Pages de vente haute conversion, hero sections et textes web.",
    icon: <Globe className="w-5 h-5" />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10",
    gradientFrom: "from-indigo-500/20",
    gradientTo: "to-transparent",
    borderColor: "border-indigo-400/30",
    available: false,
    outputs: [
      { label: "Landing", icon: "▣" },
      { label: "Hero", icon: "✦" },
      { label: "CTA", icon: "▶" },
    ],
  },
  {
    id: "influencer",
    number: "10",
    title: "Influencer Kit",
    subtitle: "Media kit, pitch decks",
    description: "Media kit créateurs, pitch decks et briefs influenceurs complets.",
    icon: <Users className="w-5 h-5" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    gradientFrom: "from-yellow-500/20",
    gradientTo: "to-transparent",
    borderColor: "border-yellow-400/30",
    available: false,
    outputs: [
      { label: "Media Kit", icon: "▤" },
      { label: "Pitch", icon: "✎" },
      { label: "Bio", icon: "◉" },
    ],
  },
];

const AVAILABLE_COUNT = MODULES.filter((m) => m.available).length;

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <aside className="flex flex-col gap-1.5 py-1">
      {MODULES.map((mod) => {
        const isActive = activeId === mod.id;
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
                      BIENTÔT
                    </span>
                  )}
                </div>
                <p className={`text-sm font-semibold leading-tight truncate transition-colors ${
                  isActive ? mod.color : mod.available ? "text-foreground" : "text-muted-foreground/40"
                }`}>
                  {mod.title}
                </p>

                {/* Output pills */}
                {mod.available && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {mod.outputs.slice(0, 4).map((out) => (
                      <span key={out.label} className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border font-medium transition-colors ${
                        isActive
                          ? `${mod.bgColor} ${mod.borderColor} ${mod.color}`
                          : "bg-white/5 border-white/10 text-muted-foreground/60"
                      }`}>
                        <span className="opacity-70">{out.icon}</span>
                        <span>{out.label}</span>
                      </span>
                    ))}
                    {mod.outputs.length > 4 && (
                      <span className="text-[9px] text-muted-foreground/40 px-1">+{mod.outputs.length - 4}</span>
                    )}
                  </div>
                )}

                {!mod.available && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {mod.outputs.slice(0, 3).map((out) => (
                      <span key={out.label} className="text-[9px] px-1.5 py-0.5 rounded-full border bg-white/3 border-white/8 text-muted-foreground/30 font-medium">
                        {out.label}
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
            <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Module</span>
            {mod.prompts && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${mod.bgColor} ${mod.borderColor} ${mod.color}`}>
                {mod.prompts} prompts
              </span>
            )}
          </div>
          <h2 className={`text-2xl font-bold leading-tight ${mod.color}`}>{mod.title}</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xl">{mod.description}</p>

          {/* Output pills row */}
          <div className="flex flex-wrap gap-2 mt-3">
            {mod.outputs.map((out) => (
              <span key={out.label} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium ${mod.bgColor} ${mod.borderColor} ${mod.color}`}>
                <span className="text-base leading-none">{out.icon}</span>
                <span>{out.label}</span>
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
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 text-muted-foreground/30 text-sm">
        <Lock className="w-3.5 h-3.5" />
        <span>08–10</span>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Home() {
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
                <span>Powered by RoboNeo.com</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-serif gold-gradient-text leading-tight">
                Neo Branding Studio
              </h1>
              <p className="text-muted-foreground text-sm mt-1.5 max-w-xl">
                Génère des prompts chirurgicaux pour créer tous les assets de ta marque — 10 modules, GPT-5.2 temps réel.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground/60 font-mono">v1.7.0</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-400">GPT-5.2 Connecté</span>
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
                <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">Modules</p>
                <span className="text-xs font-mono text-muted-foreground/40">{AVAILABLE_COUNT}/10</span>
              </div>

              <Sidebar activeId={activeModuleId} onSelect={setActiveModuleId} />

              {/* Progress bar */}
              <div className="mt-3 px-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground/50">Progression</span>
                  <span className="text-xs font-semibold text-primary">{AVAILABLE_COUNT}/10</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(AVAILABLE_COUNT / 10) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-primary to-violet-400"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/35 mt-1.5">Modules 08–10 bientôt disponibles</p>
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
                <ModuleHeader mod={activeModule} />

                {ActiveComponent ? (
                  <ActiveComponent />
                ) : (
                  <div className="flex items-center justify-center h-64 text-center rounded-2xl border border-white/5 bg-white/2">
                    <div>
                      <Lock className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-muted-foreground/60 font-medium">Module bientôt disponible</p>
                      <p className="text-xs text-muted-foreground/30 mt-1">Les modules 06–10 arrivent prochainement.</p>
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
