/**
 * Module Reports Context
 *
 * Stockage en mémoire (et localStorage best-effort) des rapports générés
 * par chaque module pendant la session. Permet l'export combiné de tous
 * les modules en un seul dossier HTML.
 */

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import type { ModuleReport } from "@/lib/report-export";

const STORAGE_KEY = "aibrandos.module_reports.v1";

interface ModuleReportsContextValue {
  reports: Record<string, ModuleReport>;
  setReport: (id: string, report: ModuleReport) => void;
  clearReport: (id: string) => void;
  clearAll: () => void;
  orderedReports: ModuleReport[];
  hasAny: boolean;
}

const Ctx = createContext<ModuleReportsContextValue | null>(null);

function loadInitial(): Record<string, ModuleReport> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ModuleReport>;
  } catch {
    return {};
  }
}

export function ModuleReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Record<string, ModuleReport>>(() => loadInitial());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch {}
  }, [reports]);

  const setReport = useCallback((id: string, report: ModuleReport) => {
    setReports((p) => ({ ...p, [id]: report }));
  }, []);

  const clearReport = useCallback((id: string) => {
    setReports((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setReports({});
  }, []);

  const orderedReports = useMemo(() => {
    return Object.values(reports).sort((a, b) =>
      a.moduleNumber.localeCompare(b.moduleNumber, undefined, { numeric: true }),
    );
  }, [reports]);

  const value = useMemo<ModuleReportsContextValue>(
    () => ({ reports, setReport, clearReport, clearAll, orderedReports, hasAny: orderedReports.length > 0 }),
    [reports, setReport, clearReport, clearAll, orderedReports],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useModuleReports(): ModuleReportsContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useModuleReports must be used inside <ModuleReportsProvider>");
  return ctx;
}
