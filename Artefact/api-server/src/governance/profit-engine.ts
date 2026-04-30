/**
 * GOVERNANCE — Dynamic Profit Engine
 *
 * Calcule LTV, CAC, ratio LTV/CAC, break-even, payback period, profit/order
 * et CPA dynamique en fonction du Brand Lock + des objectifs Performance.
 *
 * Aucun chiffre n'est inventé : si les inputs sont incomplets, le moteur
 * retourne des champs `null` (jamais d'estimation hallucinée).
 */

import type { BrandLock } from "./types";
import { getGrowthProfile } from "./growth-modes";

export interface ProfitInputs {
  aov?: number;                       // panier moyen
  margin_percent?: number;            // marge brute %
  repeat_purchase_rate?: number;      // % clients qui repassent commande
  avg_orders_per_year?: number;       // fréquence moyenne par an
  cac?: number;                       // coût d'acquisition client
  fixed_costs_monthly?: number;       // coûts fixes mensuels
}

export interface ProfitOutputs {
  aov: number | null;
  gross_profit_per_order: number | null;
  ltv: number | null;
  ltv_cac_ratio: number | null;
  payback_period_orders: number | null;
  break_even_orders_monthly: number | null;
  max_cpa_dynamic: number | null;
  target_cpa_dynamic: number | null;
  acquisition_ratio: number;
  formula_explanations: string[];
}

function safeNumber(value: number | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  return Number.isFinite(value) ? value : undefined;
}

export function computeProfit(lock: BrandLock, raw: ProfitInputs): ProfitOutputs {
  const profile = getGrowthProfile(lock.mode);

  const aov = safeNumber(raw.aov ?? lock.product.price);
  const marginPct = safeNumber(raw.margin_percent ?? lock.product.margin_percent);
  const margin = marginPct !== undefined ? marginPct / 100 : undefined;
  const repeat = safeNumber(raw.repeat_purchase_rate);
  const ordersPerYear = safeNumber(raw.avg_orders_per_year);
  const cac = safeNumber(raw.cac);

  const acquisitionRatio = profile.acquisition_ratio;

  // Profit brut par commande
  const grossPerOrder = aov !== undefined && margin !== undefined ? aov * margin : null;

  // LTV : AOV × (1 + repeatRate × ordersPerYear) — modèle simple et transparent
  let ltv: number | null = null;
  if (aov !== undefined && repeat !== undefined && ordersPerYear !== undefined) {
    const repeatFraction = repeat > 1 ? repeat / 100 : repeat;
    ltv = aov * (1 + repeatFraction * ordersPerYear);
  }

  const ltvCacRatio = ltv !== null && cac !== undefined && cac > 0 ? ltv / cac : null;

  // Payback period en commandes : CAC / profit par commande
  const payback = cac !== undefined && grossPerOrder && grossPerOrder > 0
    ? cac / grossPerOrder
    : null;

  // CPA max dynamique : AOV × marge × ratio acquisition
  const maxCpa = aov !== undefined && margin !== undefined
    ? aov * margin * acquisitionRatio
    : null;

  // CPA cible : 60% du CPA max (marge de sécurité)
  const targetCpa = maxCpa !== null ? maxCpa * 0.6 : null;

  // Break-even mensuel = coûts fixes / profit par commande
  const breakEven = grossPerOrder && grossPerOrder > 0 && raw.fixed_costs_monthly
    ? raw.fixed_costs_monthly / grossPerOrder
    : null;

  const explanations: string[] = [];
  if (grossPerOrder !== null) {
    explanations.push(`Gross profit per order = AOV × margin = ${aov} × ${(margin! * 100).toFixed(0)}% = ${grossPerOrder.toFixed(2)}`);
  }
  if (ltv !== null) {
    explanations.push(`LTV = AOV × (1 + repeat_rate × orders_per_year) = ${ltv.toFixed(2)}`);
  }
  if (ltvCacRatio !== null) {
    explanations.push(`LTV / CAC = ${ltv!.toFixed(2)} / ${cac} = ${ltvCacRatio.toFixed(2)}`);
  }
  if (maxCpa !== null) {
    explanations.push(
      `Max CPA = AOV × margin × acquisition_ratio(${acquisitionRatio}) = ${maxCpa.toFixed(2)}`,
    );
  }
  if (targetCpa !== null) {
    explanations.push(`Target CPA = max CPA × 0.6 = ${targetCpa.toFixed(2)}`);
  }
  if (breakEven !== null) {
    explanations.push(`Break-even monthly orders = fixed_costs / gross_per_order = ${breakEven.toFixed(1)}`);
  }

  return {
    aov: aov ?? null,
    gross_profit_per_order: grossPerOrder !== null ? round2(grossPerOrder) : null,
    ltv: ltv !== null ? round2(ltv) : null,
    ltv_cac_ratio: ltvCacRatio !== null ? round2(ltvCacRatio) : null,
    payback_period_orders: payback !== null ? round2(payback) : null,
    break_even_orders_monthly: breakEven !== null ? round2(breakEven) : null,
    max_cpa_dynamic: maxCpa !== null ? round2(maxCpa) : null,
    target_cpa_dynamic: targetCpa !== null ? round2(targetCpa) : null,
    acquisition_ratio: acquisitionRatio,
    formula_explanations: explanations,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Vérifie la cohérence d'un bundle : la somme des prix moins la remise doit
 * matcher le prix du bundle annoncé. Tolérance ± 0.01.
 */
export interface BundleCheck {
  ok: boolean;
  expected: number;
  diff: number;
}
export function checkBundlePrice(
  productPrices: number[],
  discountPercent: number,
  bundlePriceClaimed: number,
): BundleCheck {
  const sum = productPrices.reduce((a, b) => a + b, 0);
  const expected = round2(sum * (1 - discountPercent / 100));
  const diff = round2(bundlePriceClaimed - expected);
  return { ok: Math.abs(diff) < 0.02, expected, diff };
}
