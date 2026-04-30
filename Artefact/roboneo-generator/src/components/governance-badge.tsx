import React from "react";
import { ShieldCheck, AlertTriangle, Info } from "lucide-react";

export interface GovernanceFinding {
  type: string;
  severity: "info" | "warn" | "error";
  message: string;
  hint?: string;
}

export interface GovernanceSummary {
  ok: boolean;
  blocked: boolean;
  passes: string[];
  findings: GovernanceFinding[];
  patches_applied: string[];
  notes: string[];
}

const SEV_STYLE: Record<GovernanceFinding["severity"], string> = {
  info: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  warn: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  error: "border-red-500/30 bg-red-500/10 text-red-300",
};

export default function GovernanceBadge({ summary }: { summary?: GovernanceSummary | null }) {
  if (!summary) return null;
  const findingsCount = summary.findings.length;
  const patchesCount = summary.patches_applied.length;

  const headerCls = summary.blocked
    ? "border-red-500/30 bg-red-500/10 text-red-300"
    : findingsCount > 0
    ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
    : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";

  const Icon = summary.blocked ? AlertTriangle : findingsCount > 0 ? AlertTriangle : ShieldCheck;
  const headline = summary.blocked
    ? "Gouvernance — contenu bloqué"
    : findingsCount > 0
    ? `Gouvernance — ${findingsCount} alerte${findingsCount > 1 ? "s" : ""}${patchesCount ? `, ${patchesCount} patch${patchesCount > 1 ? "s" : ""}` : ""}`
    : "Gouvernance — conforme";

  return (
    <details className={`mt-3 rounded-lg border ${headerCls} text-xs`}>
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 font-semibold list-none">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1">{headline}</span>
        <span className="text-[10px] opacity-70">{summary.passes.length} passes ✓</span>
      </summary>
      <div className="px-3 pb-3 pt-1 space-y-2">
        {summary.findings.length > 0 && (
          <ul className="space-y-1">
            {summary.findings.map((f, i) => (
              <li key={i} className={`rounded border px-2 py-1.5 ${SEV_STYLE[f.severity]}`}>
                <div className="flex items-start gap-1.5">
                  <span className="font-mono text-[10px] uppercase opacity-70">{f.type}</span>
                  <span className="flex-1">{f.message}</span>
                </div>
                {f.hint && <div className="mt-0.5 pl-1 text-[10px] opacity-70">→ {f.hint}</div>}
              </li>
            ))}
          </ul>
        )}
        {summary.patches_applied.length > 0 && (
          <div className="rounded border border-emerald-400/20 bg-emerald-400/5 px-2 py-1.5 text-emerald-300">
            <div className="flex items-center gap-1.5 font-semibold">
              <Info className="w-3 h-3" />Auto-patches appliqués
            </div>
            <ul className="mt-1 list-disc pl-4 text-[11px] opacity-90">
              {summary.patches_applied.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}
        {summary.notes.length > 0 && (
          <p className="text-[10px] opacity-70">{summary.notes.join(" · ")}</p>
        )}
      </div>
    </details>
  );
}
