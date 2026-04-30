import React from "react";
import { AlertCircle, CheckCircle2, ChevronUp } from "lucide-react";
import { useBrand } from "@/context/brand-context";
import { useT } from "@/i18n";

export default function BriefSummaryBanner() {
  const { brief, completionPct } = useBrand();
  const { t } = useT();
  const isFilled = !!brief.brand_name;

  const scrollToBrief = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isFilled) {
    return (
      <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-400/30 bg-amber-400/5">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-300 flex-1">
          {t("brief.fill_first_warning")}
        </p>
        <button
          onClick={scrollToBrief}
          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium whitespace-nowrap"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          {t("brief.go_to_brief")}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-5 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/8 bg-white/3">
      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
      <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="text-sm font-semibold text-foreground">{brief.brand_name}</span>
        {brief.sector && (
          <span className="text-xs text-muted-foreground capitalize">{brief.sector}</span>
        )}
        {brief.product_name && (
          <>
            <span className="text-xs text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground">{brief.product_name}</span>
          </>
        )}
        <span className="text-[10px] font-mono text-muted-foreground/50">
          {t("brief.progress_label", { percent: completionPct })}
        </span>
      </div>
      <button
        onClick={scrollToBrief}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
      >
        <ChevronUp className="w-3.5 h-3.5" />
        {t("buttons.edit")}
      </button>
    </div>
  );
}
