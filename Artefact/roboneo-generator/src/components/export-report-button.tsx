/**
 * Export Report Button
 *
 * Deux variantes :
 *  1. <ExportModuleReportButton /> — exporte UN module (rapport déjà construit)
 *  2. <ExportAllReportsButton />   — agrège tous les modules présents dans le
 *     ModuleReportsContext et exporte un dossier complet.
 *
 * Les boutons appellent le générateur HTML "cabinet privé" (lib/report-export.ts)
 * et déclenchent le téléchargement.
 */

import { FileText, FolderDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateModuleReportHTML,
  generateCombinedReportHTML,
  downloadHTML,
  type ModuleReport,
} from "@/lib/report-export";
import { useT, getCurrentUILocale } from "@/i18n";
import { useBrand } from "@/context/brand-context";
import { useModuleReports } from "@/context/module-reports-context";
import { useToast } from "@/hooks/use-toast";

function safeName(input: string): string {
  return (input || "brand")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "brand";
}

export function ExportModuleReportButton({
  report,
  variant = "secondary",
  size = "sm",
  className,
  iconOnly = false,
}: {
  report: ModuleReport | null | undefined;
  variant?: "default" | "secondary" | "outline" | "ghost" | "luxury";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  iconOnly?: boolean;
}) {
  const { t } = useT();
  const { brief } = useBrand();
  const { toast } = useToast();

  const handleClick = () => {
    if (!report) return;
    const locale = getCurrentUILocale();
    const html = generateModuleReportHTML(report, brief.brand_name, locale);
    const fname = `dossier_m${report.moduleNumber}_${safeName(brief.brand_name)}_${locale}.html`;
    downloadHTML(fname, html);
    toast({ title: t("export.module_downloaded_title"), description: t("export.module_downloaded_desc", { name: report.moduleName }) });
  };

  return (
    <Button
      variant={variant as any}
      size={size as any}
      onClick={handleClick}
      disabled={!report}
      className={className}
      title={t("export.module_button")}
    >
      <FileText className="w-4 h-4" />
      {!iconOnly && <span className="ml-2">{t("export.module_button")}</span>}
    </Button>
  );
}

export function ExportAllReportsButton({
  variant = "luxury",
  size = "sm",
  className,
  iconOnly = false,
}: {
  variant?: "default" | "secondary" | "outline" | "ghost" | "luxury";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  iconOnly?: boolean;
}) {
  const { t } = useT();
  const { brief } = useBrand();
  const { orderedReports, hasAny } = useModuleReports();
  const { toast } = useToast();

  const handleClick = () => {
    if (!orderedReports.length) {
      toast({ title: t("export.empty_title"), description: t("export.empty_desc"), variant: "destructive" });
      return;
    }
    const locale = getCurrentUILocale();
    const html = generateCombinedReportHTML(orderedReports, brief.brand_name, locale);
    const fname = `dossier_complet_${safeName(brief.brand_name)}_${locale}.html`;
    downloadHTML(fname, html);
    toast({
      title: t("export.all_downloaded_title"),
      description: t("export.all_downloaded_desc", { count: orderedReports.length }),
    });
  };

  return (
    <Button
      variant={variant as any}
      size={size as any}
      onClick={handleClick}
      disabled={!hasAny}
      className={className}
      title={t("export.all_button")}
    >
      <FolderDown className="w-4 h-4" />
      {!iconOnly && <span className="ml-2">{t("export.all_button")} {hasAny && `(${orderedReports.length})`}</span>}
    </Button>
  );
}
