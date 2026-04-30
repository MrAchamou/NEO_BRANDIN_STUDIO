/**
 * BRIEF EXPORT — AI BRAND OS v3.x
 *
 * Génère le rendu HTML autonome (auto-imprimable en PDF) du brief
 * stratégique client-ready, sans dépendance externe.
 */

export interface ClientReadyBrief {
  title: string;
  generated_at: string;
  performance_overview: {
    outlook: string;
    profit_sustainability: string;
    risk_index: string;
  };
  scaling_opportunities: string[];
  risk_flags: string[];
  creative_analysis: string[];
  retention_update: { m1: string; m3: string; health: string };
  profit_check: {
    ltv_cac_ratio: number;
    profitability: string;
    break_even_months: number;
  };
  recommended_action: {
    action: string;
    scale_percent: number | null;
    rationale: string[];
  };
  agency_footer: string;
}

const OUTLOOK_LABELS: Record<string, string> = {
  very_bullish: "Très haussier",
  bullish: "Haussier",
  neutral: "Neutre",
  bearish: "Baissier",
};

const RISK_COLORS: Record<string, string> = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#ef4444",
};

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderList(items: string[], emptyMsg = "—"): string {
  if (!items || items.length === 0) {
    return `<p class="muted">${emptyMsg}</p>`;
  }
  return `<ul>${items
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("")}</ul>`;
}

/**
 * Construit le document HTML autonome (styles inline + script d'auto-print
 * optionnel pour génération PDF côté navigateur).
 */
export function renderBriefHtml(
  brief: ClientReadyBrief,
  opts: { autoPrint?: boolean; brandName?: string } = {}
): string {
  const outlook =
    OUTLOOK_LABELS[brief.performance_overview.outlook] ??
    brief.performance_overview.outlook;
  const riskColor =
    RISK_COLORS[brief.performance_overview.risk_index] ?? "#64748b";

  const action = brief.recommended_action.action;
  const scalePct = brief.recommended_action.scale_percent;
  const actionLabel = scalePct ? `${action} (+${scalePct}%)` : action;

  const generatedDate = new Date(brief.generated_at || Date.now())
    .toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const brandLine = opts.brandName
    ? `<p class="brand-line">${escapeHtml(opts.brandName)}</p>`
    : "";

  const autoPrintScript = opts.autoPrint
    ? `<script>window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 250); });</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(brief.title)} — AI BRAND OS</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    margin: 0;
    padding: 32px 40px;
    color: #0f172a;
    background: #f8fafc;
    line-height: 1.55;
  }
  .page {
    max-width: 820px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    padding: 40px 44px;
    box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
  }
  header { border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 28px; }
  .pill {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #7c3aed;
    background: #ede9fe;
    border-radius: 999px;
    padding: 4px 10px;
    margin-bottom: 14px;
  }
  h1 {
    font-size: 26px;
    margin: 0 0 6px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.01em;
  }
  .brand-line { font-size: 14px; color: #475569; margin: 4px 0 0; }
  .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 18px 0 24px;
  }
  .kpi {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px;
    text-align: center;
    background: #f8fafc;
  }
  .kpi .value { font-size: 22px; font-weight: 700; color: #0f172a; }
  .kpi .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
  .risk-badge {
    display: inline-block;
    font-weight: 700;
    font-size: 14px;
    padding: 4px 10px;
    border-radius: 8px;
    color: white;
  }
  section { margin: 22px 0; }
  section h2 {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #475569;
    margin: 0 0 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f1f5f9;
  }
  ul { margin: 0; padding-left: 20px; }
  li { margin: 4px 0; font-size: 14px; color: #1e293b; }
  .muted { color: #94a3b8; font-size: 13px; font-style: italic; margin: 0; }
  .action-box {
    border: 1px solid #c4b5fd;
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
    border-radius: 12px;
    padding: 18px 20px;
    margin: 24px 0;
  }
  .action-box .action-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6d28d9;
    margin: 0 0 6px;
  }
  .action-box .action-headline { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 10px; }
  .action-box ul li { color: #334155; font-size: 13.5px; }
  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
    color: #94a3b8;
    text-align: right;
  }
  .stat-line { font-size: 13.5px; color: #334155; margin: 4px 0; }
  .stat-line strong { color: #0f172a; }
  @media print {
    body { background: white; padding: 0; }
    .page { box-shadow: none; border-radius: 0; padding: 24px 28px; max-width: 100%; }
  }
</style>
</head>
<body>
<div class="page">
  <header>
    <span class="pill">AI BRAND OS · Brief client-ready</span>
    <h1>${escapeHtml(brief.title)}</h1>
    ${brandLine}
    <p class="meta">Généré le ${generatedDate}</p>
  </header>

  <section>
    <h2>Vue d'ensemble performance</h2>
    <div class="grid-3">
      <div class="kpi">
        <div class="value">${escapeHtml(outlook)}</div>
        <div class="label">Perspective</div>
      </div>
      <div class="kpi">
        <div class="value">${escapeHtml(brief.performance_overview.profit_sustainability)}</div>
        <div class="label">Soutenabilité profit</div>
      </div>
      <div class="kpi">
        <div class="value"><span class="risk-badge" style="background:${riskColor}">${escapeHtml(brief.performance_overview.risk_index)}</span></div>
        <div class="label">Indice de risque</div>
      </div>
    </div>
  </section>

  <section>
    <h2>Check profitabilité</h2>
    <div class="grid-3">
      <div class="kpi">
        <div class="value">${brief.profit_check.ltv_cac_ratio}x</div>
        <div class="label">LTV / CAC</div>
      </div>
      <div class="kpi">
        <div class="value">${escapeHtml(brief.profit_check.profitability)}</div>
        <div class="label">Profitabilité</div>
      </div>
      <div class="kpi">
        <div class="value">${brief.profit_check.break_even_months}m</div>
        <div class="label">Break-even</div>
      </div>
    </div>
  </section>

  <div class="row-2">
    <section>
      <h2>Opportunités de scaling</h2>
      ${renderList(brief.scaling_opportunities, "Aucune opportunité prioritaire détectée cette semaine.")}
    </section>
    <section>
      <h2>Signaux de risque</h2>
      ${renderList(brief.risk_flags, "Aucun signal de risque actif.")}
    </section>
  </div>

  <section>
    <h2>Analyse créative</h2>
    ${renderList(brief.creative_analysis, "Pas de signal créatif notable.")}
  </section>

  <section>
    <h2>Mise à jour rétention</h2>
    <p class="stat-line"><strong>M+1 :</strong> ${escapeHtml(brief.retention_update.m1)}</p>
    <p class="stat-line"><strong>M+3 :</strong> ${escapeHtml(brief.retention_update.m3)}</p>
    <p class="stat-line"><strong>Santé cohorte :</strong> ${escapeHtml(brief.retention_update.health)}</p>
  </section>

  <div class="action-box">
    <p class="action-title">Action recommandée</p>
    <p class="action-headline">${escapeHtml(actionLabel)}</p>
    ${renderList(brief.recommended_action.rationale, "—")}
  </div>

  <footer>${escapeHtml(brief.agency_footer)}</footer>
</div>
${autoPrintScript}
</body>
</html>`;
}
