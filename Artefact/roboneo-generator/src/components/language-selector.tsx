/**
 * LANGUAGE SELECTOR — Dropdown global pour switcher la langue.
 *
 * Sépare deux notions :
 *  - UI language : langue de l'interface (immédiate, sans reload).
 *  - Output language : langue dans laquelle l'IA génère les contenus
 *    (transmise dans les prompts via header X-Output-Lang).
 */

import React from "react";
import { Languages, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useT, SUPPORTED_LOCALES, type Locale } from "@/i18n";

interface Props {
  /** "compact" pour le header, "full" pour les paramètres. */
  variant?: "compact" | "full";
}

export default function LanguageSelector({ variant = "compact" }: Props) {
  const { uiLocale, outputLocale, setUILocale, setOutputLocale, t } = useT();

  const current = SUPPORTED_LOCALES.find((l) => l.code === uiLocale) ?? SUPPORTED_LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`group inline-flex items-center gap-1.5 rounded-full border transition-all ${
            variant === "compact"
              ? "px-2.5 py-1 bg-white/5 border-white/10 hover:bg-white/10 text-[11px]"
              : "px-3 py-1.5 bg-white/5 border-white/10 hover:bg-white/10 text-xs"
          }`}
          data-testid="button-language-selector"
          aria-label={t("language_selector.label")}
        >
          <Languages className="w-3 h-3 text-muted-foreground" />
          <span className="text-base leading-none" aria-hidden>{current.flag}</span>
          <span className="font-mono uppercase tracking-wider text-foreground/80">
            {current.code}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("language_selector.ui_language")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={uiLocale}
          onValueChange={(v) => setUILocale(v as Locale)}
        >
          {SUPPORTED_LOCALES.map((l) => (
            <DropdownMenuRadioItem
              key={l.code}
              value={l.code}
              className="gap-2"
              data-testid={`radio-ui-${l.code}`}
            >
              <span className="text-base leading-none" aria-hidden>{l.flag}</span>
              <span>{l.native}</span>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono uppercase">
                {l.code}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("language_selector.output_language")}
        </DropdownMenuLabel>
        <p className="px-2 pb-1 text-[10px] text-muted-foreground/70 leading-snug">
          {t("language_selector.output_language_hint")}
        </p>
        <DropdownMenuRadioGroup
          value={outputLocale}
          onValueChange={(v) => setOutputLocale(v as Locale)}
        >
          {SUPPORTED_LOCALES.map((l) => (
            <DropdownMenuRadioItem
              key={l.code}
              value={l.code}
              className="gap-2"
              data-testid={`radio-output-${l.code}`}
            >
              <span className="text-base leading-none" aria-hidden>{l.flag}</span>
              <span>{l.native}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
