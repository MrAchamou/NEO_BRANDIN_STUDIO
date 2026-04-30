import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BrandBrief {
  // Identité (partagée par tous les modules)
  brand_name: string;
  sector: string;
  tone: string;
  values: string;

  // Produit (modules 02-09)
  product_name: string;
  product_description: string;
  product_features: string;
  product_colors: string;
  product_materials: string;
  benefits: string;
  target_audience: string;
  unique_feature: string;

  // Commerce (modules 04, 06, 07, 08, 09)
  price: string;
  old_price: string;
  discount: string;
  promo_code: string;
  product_price: string;
  margin_percent: string;
  shipping_info: string;
  free_shipping: string;
  checkout_url: string;
  stock: string;

  // SAV (module 08)
  delivery_days: string;
  express_delivery_days: string;
  express_price: string;
  return_days: string;
  warranty: string;
  support_email: string;
  contact_channel: string;
  sav_response_time: string;
  sav_message: string;
  best_seller_1: string;
  best_seller_2: string;

  // Visuel (modules 04, 07)
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  visual_style: string;
  heading_font: string;
  body_font: string;

  // Performance (module 10)
  ca_target: string;
  basket_target: string;
  conv_target: string;
  roas_target: string;
  target_cpa: string;

  // Stratégie avancée (amélioration qualité prompts)
  target_demographic: string;
  competitors: string;
  forbidden_keywords: string;
  usp: string;

  // Couleurs de marque (priorité absolue sur auto-détection)
  colors: string;

  // Marché / Pays cible (adapte devise, délais, contexte local)
  market: string;

  // ─── Gouvernance & Conformité (v2 — Fact Lock + Compliance + Voice) ────
  // ─── Sector Intelligence (v2.1 — config-driven sector × region) ────────
  region: string;                  // eu, global, na, apac… → résout le profil sectoriel
  growth_mode: string;             // premium_brand | balanced_growth | aggressive_dtc
  currency: string;                // EUR, USD, FCFA…
  packaging: string;               // ex. "Verre ambré 50 ml, étui carton FSC"
  origin: string;                  // ex. "Provence, France"
  certifications: string;          // ex. "ECOCERT COSMOS, Vegan Society"
  claims_allowed: string;          // claims explicitement autorisés
  claims_forbidden: string;        // claims explicitement interdits
  voice_forbidden_words: string;   // mots interdits supplémentaires
  urgency_allowed: string;         // "true" | "false"
  emojis_allowed: string;          // "true" | "false"

  // Profit Engine (module 10)
  repeat_purchase_rate: string;    // % de clients qui repassent commande
  avg_orders_per_year: string;     // fréquence moyenne par an
  fixed_costs_monthly: string;     // coûts fixes mensuels
}

export type BriefField = keyof BrandBrief;

// ─── Governance payload helper ────────────────────────────────────────────────
// Spread this into every API body so the backend receives everything needed by
// `extractBriefInputFromBody` (Brand Lock, Compliance, Profit Engine, etc.).
export function governanceFields(brief: BrandBrief): Record<string, unknown> {
  const num = (v: string) => {
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const list = (v: string) =>
    v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  return {
    region: brief.region || brief.market || undefined,
    market: brief.market || undefined,
    growth_mode: brief.growth_mode || undefined,
    currency: brief.currency || undefined,
    packaging: brief.packaging || undefined,
    origin: brief.origin || undefined,
    certifications: list(brief.certifications),
    claims_allowed: list(brief.claims_allowed),
    claims_forbidden: list(brief.claims_forbidden),
    voice_forbidden_words: list(brief.voice_forbidden_words),
    urgency_allowed: brief.urgency_allowed === "" ? undefined : brief.urgency_allowed !== "false",
    emojis_allowed: brief.emojis_allowed === "" ? undefined : brief.emojis_allowed !== "false",
    repeat_purchase_rate: num(brief.repeat_purchase_rate),
    avg_orders_per_year: num(brief.avg_orders_per_year),
    fixed_costs_monthly: num(brief.fixed_costs_monthly),
    margin_percent: num(brief.margin_percent),
    product_price: num(brief.product_price) ?? num(brief.price),
  };
}

export interface SavedBrandBrief {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  updatedAt: string;
  brief: BrandBrief;
}

export const BRIEF_DEFAULTS: BrandBrief = {
  brand_name: "",
  sector: "luxe",
  tone: "luxe",
  values: "",
  product_name: "",
  product_description: "",
  product_features: "",
  product_colors: "",
  product_materials: "",
  benefits: "",
  target_audience: "femmes-25-45",
  unique_feature: "",
  price: "",
  old_price: "",
  discount: "20",
  promo_code: "",
  product_price: "",
  margin_percent: "65",
  shipping_info: "Livraison offerte dès 100€",
  free_shipping: "100",
  checkout_url: "",
  stock: "50",
  delivery_days: "3",
  express_delivery_days: "1",
  express_price: "9.90",
  return_days: "30",
  warranty: "2",
  support_email: "",
  contact_channel: "",
  sav_response_time: "24h",
  sav_message: "",
  best_seller_1: "",
  best_seller_2: "",
  primary_color: "#D4AF37",
  secondary_color: "",
  accent_color: "",
  visual_style: "",
  heading_font: "Playfair Display",
  body_font: "Montserrat",
  ca_target: "",
  basket_target: "",
  conv_target: "",
  roas_target: "",
  target_cpa: "",
  target_demographic: "",
  competitors: "",
  forbidden_keywords: "",
  usp: "",
  colors: "",
  market: "international",
  region: "eu",
  growth_mode: "balanced_growth",
  currency: "EUR",
  packaging: "",
  origin: "",
  certifications: "",
  claims_allowed: "",
  claims_forbidden: "",
  voice_forbidden_words: "",
  urgency_allowed: "true",
  emojis_allowed: "true",
  repeat_purchase_rate: "",
  avg_orders_per_year: "",
  fixed_costs_monthly: "",
};

// Champs "importants" dont la complétude est mesurée
export const COMPLETION_FIELDS: BriefField[] = [
  "brand_name", "sector", "tone", "values",
  "product_name", "product_description", "product_features", "benefits",
  "price", "discount", "target_demographic", "usp",
];

// ─── Context ───────────────────────────────────────────────────────────────────

interface BrandContextValue {
  brief: BrandBrief;
  savedBriefs: SavedBrandBrief[];
  updateBrief: (patch: Partial<BrandBrief>) => void;
  resetBrief: () => void;
  restoreBrief: (id: string) => void;
  deleteSavedBrief: (id: string) => void;
  completionPct: number;
  filledCount: number;
}

const BrandContext = createContext<BrandContextValue | null>(null);

const STORAGE_KEY = "roboneo_brand_brief_v1";
const HISTORY_KEY = "roboneo_brand_brief_history_v1";
const ACTIVE_HISTORY_ID_KEY = "roboneo_active_brand_brief_id_v1";
const MAX_SAVED_BRIEFS = 12;

function loadFromStorage(): BrandBrief {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...BRIEF_DEFAULTS };
    return { ...BRIEF_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...BRIEF_DEFAULTS };
  }
}

function loadHistory(): SavedBrandBrief[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item?.id && item?.brief)
      .map((item) => ({
        id: String(item.id),
        title: String(item.title ?? item.brief.brand_name ?? "Brief sans nom"),
        subtitle: String(item.subtitle ?? item.brief.product_name ?? ""),
        createdAt: String(item.createdAt ?? new Date().toISOString()),
        updatedAt: String(item.updatedAt ?? new Date().toISOString()),
        brief: { ...BRIEF_DEFAULTS, ...item.brief },
      }));
  } catch {
    return [];
  }
}

function getStoredActiveId(): string {
  try {
    const stored = localStorage.getItem(ACTIVE_HISTORY_ID_KEY);
    if (stored) return stored;
  } catch {}
  return crypto.randomUUID();
}

function getBriefTitle(brief: BrandBrief): string {
  return brief.brand_name.trim() || brief.product_name.trim() || "Brief sans nom";
}

function getBriefSubtitle(brief: BrandBrief): string {
  const parts = [brief.product_name, brief.sector, brief.tone]
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.join(" · ");
}

function isBriefWorthSaving(brief: BrandBrief): boolean {
  return COMPLETION_FIELDS.some((field) => {
    const value = brief[field];
    const defaultValue = BRIEF_DEFAULTS[field];
    return value.trim() !== "" && value !== defaultValue;
  });
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brief, setBrief] = useState<BrandBrief>(loadFromStorage);
  const [savedBriefs, setSavedBriefs] = useState<SavedBrandBrief[]>(loadHistory);
  const [activeHistoryId, setActiveHistoryId] = useState(getStoredActiveId);

  const updateBrief = useCallback((patch: Partial<BrandBrief>) => {
    setBrief((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [k, v] of Object.entries(patch)) {
        if (v !== undefined && v !== null) {
          const value = String(v);
          if ((next as any)[k] !== value) {
            (next as any)[k] = value;
            changed = true;
          }
        }
      }
      if (!changed) return prev;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const resetBrief = useCallback(() => {
    const fresh = { ...BRIEF_DEFAULTS };
    const nextId = crypto.randomUUID();
    setBrief(fresh);
    setActiveHistoryId(nextId);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    try { localStorage.setItem(ACTIVE_HISTORY_ID_KEY, nextId); } catch {}
  }, []);

  const restoreBrief = useCallback((id: string) => {
    const saved = savedBriefs.find((item) => item.id === id);
    if (!saved) return;
    const restored = { ...BRIEF_DEFAULTS, ...saved.brief };
    setBrief(restored);
    setActiveHistoryId(id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
      localStorage.setItem(ACTIVE_HISTORY_ID_KEY, id);
    } catch {}
  }, [savedBriefs]);

  const deleteSavedBrief = useCallback((id: string) => {
    setSavedBriefs((prev) => {
      const next = prev.filter((item) => item.id !== id);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    if (id === activeHistoryId) {
      const nextId = crypto.randomUUID();
      setActiveHistoryId(nextId);
      try { localStorage.setItem(ACTIVE_HISTORY_ID_KEY, nextId); } catch {}
    }
  }, [activeHistoryId]);

  useEffect(() => {
    if (!isBriefWorthSaving(brief)) return;

    const timeout = window.setTimeout(() => {
      const now = new Date().toISOString();
      setSavedBriefs((prev) => {
        const existing = prev.find((item) => item.id === activeHistoryId);
        const current: SavedBrandBrief = {
          id: activeHistoryId,
          title: getBriefTitle(brief),
          subtitle: getBriefSubtitle(brief),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          brief,
        };
        const next = [current, ...prev.filter((item) => item.id !== activeHistoryId)]
          .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
          .slice(0, MAX_SAVED_BRIEFS);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
          localStorage.setItem(ACTIVE_HISTORY_ID_KEY, activeHistoryId);
        } catch {}
        return next;
      });
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [activeHistoryId, brief]);

  const filledCount = COMPLETION_FIELDS.filter((f) => brief[f] && String(brief[f]).trim() !== "").length;
  const completionPct = Math.round((filledCount / COMPLETION_FIELDS.length) * 100);

  return (
    <BrandContext.Provider value={{ brief, savedBriefs, updateBrief, resetBrief, restoreBrief, deleteSavedBrief, completionPct, filledCount }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used inside BrandProvider");
  return ctx;
}
