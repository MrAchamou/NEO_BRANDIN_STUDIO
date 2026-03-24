import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lock, ChevronRight, Palette, Camera, Video, ShoppingBag, MessageSquare, BarChart2, Mail, Share2, Globe, Users, Music2 } from "lucide-react";
import Module01 from "./module-01";
import Module02 from "./module-02";
import Module03 from "./module-03";
import Module04 from "./module-04";
import Module05 from "./module-05";

// ─── Définition des modules ──────────────────────────────────────────────────

interface ModuleDef {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  available: boolean;
  component?: React.ComponentType;
  prompts?: number;
}

const MODULES: ModuleDef[] = [
  {
    id: "brand-identity",
    number: "01",
    title: "Brand Identity",
    subtitle: "Logo, Palette, Typo, Charte",
    icon: <Palette className="w-5 h-5" />,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10 border-amber-400/20",
    available: true,
    component: Module01,
    prompts: 4,
  },
  {
    id: "visual-content",
    number: "02",
    title: "Visual Content",
    subtitle: "Photos produit, Lifestyle, Carousel",
    icon: <Camera className="w-5 h-5" />,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10 border-rose-400/20",
    available: true,
    component: Module02,
    prompts: 19,
  },
  {
    id: "video-content",
    number: "03",
    title: "Video Content",
    subtitle: "Reels, TikTok, YouTube Shorts",
    icon: <Video className="w-5 h-5" />,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10 border-purple-400/20",
    available: true,
    component: Module03,
    prompts: 14,
  },
  {
    id: "ad-creatives",
    number: "04",
    title: "Ad Creatives",
    subtitle: "Meta, Google Display, TikTok",
    icon: <ShoppingBag className="w-5 h-5" />,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10 border-orange-400/20",
    available: true,
    component: Module04,
    prompts: 18,
  },
  {
    id: "brand-sound",
    number: "05",
    title: "Brand Sound",
    subtitle: "Jingle, BGM, Voix Off ElevenLabs",
    icon: <Music2 className="w-5 h-5" />,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10 border-violet-400/20",
    available: true,
    component: Module05,
    prompts: 16,
  },
  {
    id: "analytics-reports",
    number: "06",
    title: "Analytics Reports",
    subtitle: "Rapports visuels, dashboards",
    icon: <BarChart2 className="w-5 h-5" />,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10 border-blue-400/20",
    available: false,
  },
  {
    id: "email-campaigns",
    number: "07",
    title: "Email Campaigns",
    subtitle: "Newsletters, séquences email",
    icon: <Mail className="w-5 h-5" />,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10 border-orange-400/20",
    available: false,
  },
  {
    id: "social-media",
    number: "08",
    title: "Social Media",
    subtitle: "Posts, stories, stratégie contenu",
    icon: <Share2 className="w-5 h-5" />,
    color: "text-pink-400",
    bgColor: "bg-pink-400/10 border-pink-400/20",
    available: false,
  },
  {
    id: "web-landing",
    number: "09",
    title: "Web & Landing",
    subtitle: "Pages de vente, hero sections",
    icon: <Globe className="w-5 h-5" />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10 border-indigo-400/20",
    available: false,
  },
  {
    id: "influencer",
    number: "10",
    title: "Influencer Kit",
    subtitle: "Media kit, pitch decks créateurs",
    icon: <Users className="w-5 h-5" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10 border-yellow-400/20",
    available: false,
  },
];

// ─── Composant sidebar ───────────────────────────────────────────────────────

function Sidebar({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <aside className="flex flex-col gap-1 py-2">
      {MODULES.map((mod) => {
        const isActive = activeId === mod.id;
        return (
          <button
            key={mod.id}
            onClick={() => mod.available && onSelect(mod.id)}
            disabled={!mod.available}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
              isActive
                ? "bg-primary/15 border border-primary/30 text-foreground"
                : mod.available
                ? "hover:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent"
                : "opacity-30 cursor-not-allowed border border-transparent text-muted-foreground"
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center border text-xs font-bold ${isActive ? `${mod.bgColor} ${mod.color}` : "bg-white/5 border-white/10 text-muted-foreground"}`}>
              {mod.available ? mod.icon : <Lock className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground/60">MOD-{mod.number}</span>
                {mod.prompts && isActive && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{mod.prompts}p</span>
                )}
              </div>
              <p className="text-sm font-medium leading-tight truncate">{mod.title}</p>
              <p className="text-xs text-muted-foreground/60 truncate leading-tight">{mod.subtitle}</p>
            </div>
            {isActive && <ChevronRight className={`w-4 h-4 flex-shrink-0 ${mod.color}`} />}
          </button>
        );
      })}
    </aside>
  );
}

// ─── Composant mobile nav (tabs horizontaux) ─────────────────────────────────

function MobileNav({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const available = MODULES.filter((m) => m.available);
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none lg:hidden">
      {available.map((mod) => (
        <button
          key={mod.id}
          onClick={() => onSelect(mod.id)}
          className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
            activeId === mod.id
              ? `${mod.bgColor} ${mod.color} border-opacity-50`
              : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          {mod.icon}
          <span>MOD-{mod.number}</span>
        </button>
      ))}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 text-muted-foreground/30 text-sm">
        <Lock className="w-3.5 h-3.5" />
        <span>03–10</span>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

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
              <span className="text-xs text-muted-foreground/60 font-mono">v1.2.0</span>
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
          {/* Sidebar — desktop only */}
          <div className="hidden lg:block w-60 flex-shrink-0 sticky top-6 self-start">
            <div className="bg-card/50 border border-white/5 rounded-xl p-2 backdrop-blur-sm">
              <div className="px-2 py-1.5 mb-1">
                <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Modules</p>
              </div>
              <Sidebar activeId={activeModuleId} onSelect={setActiveModuleId} />
              <div className="mt-3 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
                <p className="text-xs text-muted-foreground/50">
                  <span className="font-medium text-primary">2/10</span> modules disponibles
                </p>
                <p className="text-xs text-muted-foreground/40 mt-0.5">Modules 03–10 bientôt</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Module header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${activeModule.bgColor} ${activeModule.color}`}>
                {activeModule.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">MODULE {activeModule.number}</span>
                  {activeModule.prompts && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${activeModule.bgColor} ${activeModule.color} font-medium`}>
                      {activeModule.prompts} prompts
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-foreground leading-tight">{activeModule.title}</h2>
                <p className="text-xs text-muted-foreground">{activeModule.subtitle}</p>
              </div>
            </div>

            {/* Module content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModuleId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {ActiveComponent ? <ActiveComponent /> : (
                  <div className="flex items-center justify-center h-64 text-center">
                    <div>
                      <Lock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">Ce module arrive bientôt.</p>
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
