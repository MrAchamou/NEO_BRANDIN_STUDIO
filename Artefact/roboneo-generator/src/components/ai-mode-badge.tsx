/**
 * AI MODE BADGE — Indicateur discret du moteur AI actif (header).
 *
 * Cliquable → ouvre AIEngineConfig.
 *  🟢 AI Mode: Replit Managed
 *  🟣 AI Mode: Professional (OpenRouter) · <Modèle>
 */

import React, { useEffect, useState } from "react";
import { Cpu, KeyRound } from "lucide-react";
import AIEngineConfig from "@/components/ai-engine-config";
import {
  loadEngineConfig, onEngineChange, type AIEngineConfig as Cfg,
} from "@/lib/ai-engine";
import { useT } from "@/i18n";

export default function AIModeBadge() {
  const { t } = useT();
  const [cfg, setCfg] = useState<Cfg>(() => loadEngineConfig());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = onEngineChange(() => setCfg(loadEngineConfig()));
    return unsub;
  }, []);

  const isPro = cfg.mode === "professional_openrouter";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
          isPro
            ? "bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/15"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15"
        }`}
        data-testid="button-ai-mode-badge"
        title={t("ai_engine.dialog_title")}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isPro ? "bg-violet-400" : "bg-emerald-400"
          } animate-pulse`}
        />
        {isPro ? (
          <KeyRound className="w-3 h-3" />
        ) : (
          <Cpu className="w-3 h-3" />
        )}
        <span className="font-mono uppercase tracking-wider">
          {isPro
            ? `${t("ai_engine.badge_pro")} · ${cfg.modelLabel ?? cfg.model.split("/").pop()}`
            : t("ai_engine.badge_replit")}
        </span>
      </button>

      <AIEngineConfig open={open} onOpenChange={setOpen} />
    </>
  );
}
