import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  ChevronDown, ChevronUp, Sparkles, RotateCcw, Check, AlertCircle,
  MapPin, Loader2, Star, ExternalLink, History, Trash2, Clock, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBrand, BrandBrief, BRIEF_DEFAULTS } from "@/context/brand-context";
import { useT } from "@/i18n";

// ─── Static keys ───────────────────────────────────────────────────────────────
// Les valeurs (codes) restent stables ; les libellés sont traduits via i18n.

const MARKET_KEYS: Array<{ value: string; currency: string }> = [
  { value: "international",  currency: "€" },
  { value: "cote-divoire",   currency: "FCFA" },
  { value: "senegal",        currency: "FCFA" },
  { value: "maroc",          currency: "DH" },
  { value: "nigeria",        currency: "₦" },
  { value: "france",         currency: "€" },
  { value: "belgique",       currency: "€" },
  { value: "suisse",         currency: "CHF" },
  { value: "allemagne",      currency: "€" },
  { value: "royaume-uni",    currency: "£" },
  { value: "usa",            currency: "$" },
  { value: "canada",         currency: "CA$" },
  { value: "emirats",        currency: "AED" },
];

const SECTOR_KEYS = ["bijou", "luxe", "cosmétique", "mode", "tech", "fitness", "décoration", "maroquinerie"];
const TONE_KEYS = ["luxe", "premium", "moderne", "minimaliste", "chaleureux", "professionnel", "streetwear", "écologique"];
const AUDIENCE_KEYS = ["femmes-25-45", "hommes-25-45", "mixte-25-45", "jeunes-18-30", "csp-plus", "managers", "sportifs", "parents"];
const GROWTH_MODE_KEYS = ["premium_brand", "balanced_growth", "aggressive_dtc"];
const CURRENCY_KEYS = ["EUR", "USD", "GBP", "CHF", "CAD", "AED", "MAD", "XOF", "NGN"];
const REGION_KEYS = ["eu", "global", "na", "apac", "mena"];
const VISUAL_STYLE_KEYS = ["", "luxe-premium", "editorial", "minimaliste", "moderne", "chaud-naturel", "streetwear", "artisanal", "ecologique"];
const CONTACT_CHANNEL_KEYS = ["", "email", "whatsapp", "instagram", "email-instagram", "email-whatsapp", "chat-live", "telephone", "tous"];

const SECTION_KEYS = [
  { key: "identity",    color: "text-amber-400",  dot: "bg-amber-400" },
  { key: "product",     color: "text-violet-400", dot: "bg-violet-400" },
  { key: "commerce",    color: "text-green-400",  dot: "bg-green-400" },
  { key: "sav",         color: "text-orange-400", dot: "bg-orange-400" },
  { key: "visual",      color: "text-pink-400",   dot: "bg-pink-400" },
  { key: "performance", color: "text-blue-400",   dot: "bg-blue-400" },
  { key: "strategie",   color: "text-red-400",    dot: "bg-red-400" },
  { key: "gouvernance", color: "text-cyan-400",   dot: "bg-cyan-400" },
] as const;

function selectCls() {
  return "flex h-10 w-full appearance-none rounded-md border border-white/10 bg-neutral-900 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary [&>option]:bg-neutral-900 [&>option]:text-white";
}

// Petit helper pour rendre des **bold** simples dans une chaîne i18n
function richText(str: string, baseCls = "") {
  const parts = str.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className={baseCls}>{p.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{p}</React.Fragment>,
  );
}

// ─── Field renderers ───────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function MarketMultiSelect({ form }: { form: any }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const raw: string = form.watch("market") || "international";
  const selected = raw.split(",").map(v => v.trim()).filter(Boolean);

  function toggle(value: string) {
    let next: string[];
    if (selected.includes(value)) {
      next = selected.filter(v => v !== value);
      if (next.length === 0) next = ["international"];
    } else {
      next = [...selected.filter(v => v !== "international"), value];
      if (next.length === 0) next = ["international"];
    }
    form.setValue("market", next.join(","), { shouldDirty: true });
  }

  const selectedItems = selected
    .map(v => MARKET_KEYS.find(m => m.value === v))
    .filter(Boolean) as typeof MARKET_KEYS;
  const currencies = [...new Set(selectedItems.map(m => m.currency))];
  const currencyLabel = currencies.length > 1
    ? t("brief_panel.fields.currencies_label_plural", { currencies: currencies.join(" · ") })
    : t("brief_panel.fields.currencies_label", { currencies: currencies.join(" · ") });

  return (
    <div className="space-y-2">
      <div
        className="flex min-h-10 w-full cursor-pointer flex-wrap gap-1.5 rounded-md border border-white/10 bg-neutral-900 px-2 py-1.5"
        onClick={() => setOpen(o => !o)}
      >
        {selectedItems.map(m => (
          <span
            key={m.value}
            className="inline-flex items-center gap-1 rounded bg-primary/20 px-2 py-0.5 text-xs text-primary"
            onClick={e => { e.stopPropagation(); toggle(m.value); }}
          >
            {t(`brief_panel.lists.markets.${m.value}`)}
            <X size={10} className="opacity-60 hover:opacity-100" />
          </span>
        ))}
        <span className="ml-auto flex items-center text-white/30 text-xs">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>
      {open && (
        <div className="rounded-md border border-white/10 bg-neutral-950 p-2 shadow-xl">
          <div className="grid grid-cols-2 gap-1">
            {MARKET_KEYS.map(m => {
              const isActive = selected.includes(m.value);
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => toggle(m.value)}
                  className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex-1">{t(`brief_panel.lists.markets.${m.value}`)}</span>
                  {isActive && <Check size={10} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex h-9 items-center px-3 rounded-md border border-white/10 bg-primary/10 text-xs text-primary font-mono">
        {currencyLabel}
      </div>
    </div>
  );
}

function IdentitySection({ form }: { form: any }) {
  const { t } = useT();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FieldRow label={t("brief_panel.fields.brand_name")}>
        <Input {...form.register("brand_name")} placeholder={t("brief_panel.fields.brand_name_ph")} className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label={t("brief_panel.fields.sector")}>
        <select {...form.register("sector")} className={selectCls()}>
          {SECTOR_KEYS.map((s) => <option key={s} value={s}>{t(`brief_panel.lists.sectors.${s}`)}</option>)}
        </select>
      </FieldRow>
      <FieldRow label={t("brief_panel.fields.tone")}>
        <select {...form.register("tone")} className={selectCls()}>
          {TONE_KEYS.map((tn) => <option key={tn} value={tn}>{t(`brief_panel.lists.tones.${tn}`)}</option>)}
        </select>
      </FieldRow>
      <FieldRow label={t("brief_panel.fields.values")}>
        <Input {...form.register("values")} placeholder={t("brief_panel.fields.values_ph")} className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <div className="sm:col-span-2">
        <FieldRow label={t("brief_panel.fields.market")}>
          <MarketMultiSelect form={form} />
        </FieldRow>
      </div>
      <div className="sm:col-span-2">
        <FieldRow label={t("brief_panel.fields.colors")}>
          <Input {...form.register("colors")} placeholder={t("brief_panel.fields.colors_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
    </div>
  );
}

function ProductSection({ form }: { form: any }) {
  const { t } = useT();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FieldRow label={t("brief_panel.fields.product_name")}>
        <Input {...form.register("product_name")} placeholder={t("brief_panel.fields.product_name_ph")} className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label={t("brief_panel.fields.target_audience")}>
        <select {...form.register("target_audience")} className={selectCls()}>
          {AUDIENCE_KEYS.map((a) => <option key={a} value={a}>{t(`brief_panel.lists.audiences.${a}`)}</option>)}
        </select>
      </FieldRow>
      <div className="sm:col-span-2">
        <FieldRow label={t("brief_panel.fields.product_description")}>
          <Input {...form.register("product_description")} placeholder={t("brief_panel.fields.product_description_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
      <FieldRow label={t("brief_panel.fields.product_features")}>
        <Input {...form.register("product_features")} placeholder={t("brief_panel.fields.product_features_ph")} className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label={t("brief_panel.fields.benefits")}>
        <Input {...form.register("benefits")} placeholder={t("brief_panel.fields.benefits_ph")} className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label={t("brief_panel.fields.product_colors")}>
        <Input {...form.register("product_colors")} placeholder={t("brief_panel.fields.product_colors_ph")} className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label={t("brief_panel.fields.product_materials")}>
        <Input {...form.register("product_materials")} placeholder={t("brief_panel.fields.product_materials_ph")} className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <div className="sm:col-span-2">
        <FieldRow label={t("brief_panel.fields.unique_feature")}>
          <Input {...form.register("unique_feature")} placeholder={t("brief_panel.fields.unique_feature_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
    </div>
  );
}

function CommerceSection({ form }: { form: any }) {
  const { t } = useT();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <FieldRow label={t("brief_panel.fields.price")}>
        <Input {...form.register("price")} type="number" placeholder="299" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label={t("brief_panel.fields.old_price")}>
        <Input {...form.register("old_price")} type="number" placeholder="399" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label={t("brief_panel.fields.discount")}>
        <Input {...form.register("discount")} type="number" placeholder="20" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label={t("brief_panel.fields.promo_code")}>
        <Input {...form.register("promo_code")} placeholder={t("brief_panel.fields.promo_code_ph")} className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label={t("brief_panel.fields.free_shipping")}>
        <Input {...form.register("free_shipping")} type="number" placeholder="100" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label={t("brief_panel.fields.stock")}>
        <Input {...form.register("stock")} type="number" placeholder="50" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <div className="col-span-2 sm:col-span-3">
        <FieldRow label={t("brief_panel.fields.shipping_info")}>
          <Input {...form.register("shipping_info")} placeholder={t("brief_panel.fields.shipping_info_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
      <div className="col-span-2 sm:col-span-3">
        <FieldRow label={t("brief_panel.fields.checkout_url")}>
          <Input {...form.register("checkout_url")} placeholder={t("brief_panel.fields.checkout_url_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
    </div>
  );
}

function VisualSection({ form }: { form: any }) {
  const { t } = useT();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FieldRow label={t("brief_panel.fields.primary_color")}>
          <div className="flex gap-2">
            <input type="color" {...form.register("primary_color")} className="w-10 h-9 rounded cursor-pointer border border-white/10 bg-transparent flex-shrink-0" />
            <Input {...form.register("primary_color")} className="bg-black/20 h-9 text-sm font-mono" placeholder="#D4AF37" />
          </div>
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.secondary_color")}>
          <div className="flex gap-2">
            <input type="color" {...form.register("secondary_color")} className="w-10 h-9 rounded cursor-pointer border border-white/10 bg-transparent flex-shrink-0" />
            <Input {...form.register("secondary_color")} className="bg-black/20 h-9 text-sm font-mono" placeholder="#9CAF88" />
          </div>
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.accent_color")}>
          <div className="flex gap-2">
            <input type="color" {...form.register("accent_color")} className="w-10 h-9 rounded cursor-pointer border border-white/10 bg-transparent flex-shrink-0" />
            <Input {...form.register("accent_color")} className="bg-black/20 h-9 text-sm font-mono" placeholder="#D4A5A5" />
          </div>
        </FieldRow>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FieldRow label={t("brief_panel.fields.visual_style")}>
          <select {...form.register("visual_style")} className={selectCls()}>
            {VISUAL_STYLE_KEYS.map((s) => <option key={s} value={s}>{t(`brief_panel.lists.visual_styles.${s}`)}</option>)}
          </select>
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.heading_font")}>
          <Input {...form.register("heading_font")} placeholder="Playfair Display" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.body_font")}>
          <Input {...form.register("body_font")} placeholder="Montserrat" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
    </div>
  );
}

function SavSection({ form }: { form: any }) {
  const { t } = useT();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <FieldRow label={t("brief_panel.fields.warranty")}>
          <Input {...form.register("warranty")} type="number" step="any" placeholder="2" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.delivery_days")}>
          <Input {...form.register("delivery_days")} type="number" placeholder="3" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.express_delivery_days")}>
          <Input {...form.register("express_delivery_days")} type="number" placeholder="1" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.express_price")}>
          <Input {...form.register("express_price")} type="number" step="any" placeholder="9.90" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.return_days")}>
          <Input {...form.register("return_days")} type="number" placeholder="30" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.sav_response_time")}>
          <Input {...form.register("sav_response_time")} placeholder={t("brief_panel.fields.sav_response_time_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FieldRow label={t("brief_panel.fields.support_email")}>
          <Input {...form.register("support_email")} type="email" placeholder={t("brief_panel.fields.support_email_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.contact_channel")}>
          <select {...form.register("contact_channel")} className={selectCls()}>
            {CONTACT_CHANNEL_KEYS.map((c) => <option key={c} value={c}>{t(`brief_panel.lists.contact_channels.${c}`)}</option>)}
          </select>
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.best_seller_1")}>
          <Input {...form.register("best_seller_1")} placeholder={t("brief_panel.fields.best_seller_1_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.best_seller_2")}>
          <Input {...form.register("best_seller_2")} placeholder={t("brief_panel.fields.best_seller_2_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
      <div>
        <FieldRow label={t("brief_panel.fields.sav_message")}>
          <textarea
            {...form.register("sav_message")}
            rows={3}
            placeholder={t("brief_panel.fields.sav_message_ph")}
            className="flex w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
          />
        </FieldRow>
      </div>
    </div>
  );
}

function PerformanceSection({ form }: { form: any }) {
  const { t } = useT();
  const fields: Array<{ name: string; key: string; placeholder: string }> = [
    { name: "ca_target",     key: "ca_target",     placeholder: "10000" },
    { name: "basket_target", key: "basket_target", placeholder: "150" },
    { name: "conv_target",   key: "conv_target",   placeholder: "2.5" },
    { name: "roas_target",   key: "roas_target",   placeholder: "3.0" },
    { name: "target_cpa",    key: "target_cpa",    placeholder: "15" },
    { name: "margin_percent",key: "margin_percent",placeholder: "65" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {fields.map((f) => (
        <FieldRow key={f.name} label={t(`brief_panel.fields.${f.key}`)}>
          <Input {...form.register(f.name)} type="number" step="any" placeholder={f.placeholder} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      ))}
    </div>
  );
}

function StrategieSection({ form }: { form: any }) {
  const { t } = useT();
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-red-400/20 bg-red-400/5">
        <span className="text-red-400 text-xs mt-0.5">⚡</span>
        <p className="text-[11px] text-red-300/80 leading-relaxed">
          {richText(t("brief_panel.infos.strategie"))}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <FieldRow label={t("brief_panel.fields.target_demographic")}>
          <Input {...form.register("target_demographic")} placeholder={t("brief_panel.fields.target_demographic_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.competitors")}>
          <Input {...form.register("competitors")} placeholder={t("brief_panel.fields.competitors_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.forbidden_keywords")}>
          <Input {...form.register("forbidden_keywords")} placeholder={t("brief_panel.fields.forbidden_keywords_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.usp")}>
          <Input {...form.register("usp")} placeholder={t("brief_panel.fields.usp_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
    </div>
  );
}

function ToggleField({ form, name, label, hint }: { form: any; name: string; label: string; hint?: string }) {
  const { t } = useT();
  const value = String(form.watch(name) ?? "true") === "true";
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</label>
      <button
        type="button"
        onClick={() => form.setValue(name, value ? "false" : "true", { shouldDirty: true })}
        className={`h-9 w-full rounded-md border px-3 text-xs font-medium transition-colors text-left ${
          value
            ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
            : "border-white/10 bg-neutral-900 text-muted-foreground"
        }`}
      >
        {value ? t("brief_panel.toggle.allowed") : t("brief_panel.toggle.forbidden")}
        {hint && <span className="ml-2 text-[10px] opacity-60">— {hint}</span>}
      </button>
    </div>
  );
}

function GouvernanceSection({ form }: { form: any }) {
  const { t } = useT();
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-cyan-400/20 bg-cyan-400/5">
        <span className="text-cyan-400 text-xs mt-0.5">🔒</span>
        <p className="text-[11px] text-cyan-300/80 leading-relaxed">
          {richText(t("brief_panel.infos.gouvernance"))}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FieldRow label={t("brief_panel.fields.region")}>
          <select {...form.register("region")} className={selectCls()}>
            {REGION_KEYS.map((r) => <option key={r} value={r}>{t(`brief_panel.lists.regions.${r}`)}</option>)}
          </select>
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.currency")}>
          <select {...form.register("currency")} className={selectCls()}>
            {CURRENCY_KEYS.map((c) => <option key={c} value={c}>{t(`brief_panel.lists.currencies.${c}`)}</option>)}
          </select>
        </FieldRow>
        <div className="sm:col-span-2">
          <FieldRow label={t("brief_panel.fields.growth_mode")}>
            <select {...form.register("growth_mode")} className={selectCls()}>
              {GROWTH_MODE_KEYS.map((g) => <option key={g} value={g}>{t(`brief_panel.lists.growth_modes.${g}`)}</option>)}
            </select>
          </FieldRow>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FieldRow label={t("brief_panel.fields.packaging")}>
          <Input {...form.register("packaging")} placeholder={t("brief_panel.fields.packaging_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.origin")}>
          <Input {...form.register("origin")} placeholder={t("brief_panel.fields.origin_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <div className="sm:col-span-2">
          <FieldRow label={t("brief_panel.fields.certifications")}>
            <Input {...form.register("certifications")} placeholder={t("brief_panel.fields.certifications_ph")} className="bg-black/20 h-9 text-sm" />
          </FieldRow>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <FieldRow label={t("brief_panel.fields.claims_allowed")}>
          <Input {...form.register("claims_allowed")} placeholder={t("brief_panel.fields.claims_allowed_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.claims_forbidden")}>
          <Input {...form.register("claims_forbidden")} placeholder={t("brief_panel.fields.claims_forbidden_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label={t("brief_panel.fields.voice_forbidden_words")}>
          <Input {...form.register("voice_forbidden_words")} placeholder={t("brief_panel.fields.voice_forbidden_words_ph")} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ToggleField
          form={form}
          name="urgency_allowed"
          label={t("brief_panel.fields.urgency_allowed")}
          hint={t("brief_panel.fields.urgency_allowed_hint")}
        />
        <ToggleField
          form={form}
          name="emojis_allowed"
          label={t("brief_panel.fields.emojis_allowed")}
        />
      </div>

      <div className="pt-2 border-t border-white/5">
        <p className="text-[11px] text-cyan-300/70 mb-2 font-semibold">{t("brief_panel.infos.profit_engine_title")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FieldRow label={t("brief_panel.fields.repeat_purchase_rate")}>
            <Input {...form.register("repeat_purchase_rate")} type="number" step="any" placeholder="35" className="bg-black/20 h-9 text-sm" />
          </FieldRow>
          <FieldRow label={t("brief_panel.fields.avg_orders_per_year")}>
            <Input {...form.register("avg_orders_per_year")} type="number" step="any" placeholder="2.4" className="bg-black/20 h-9 text-sm" />
          </FieldRow>
          <FieldRow label={t("brief_panel.fields.fixed_costs_monthly")}>
            <Input {...form.register("fixed_costs_monthly")} type="number" step="any" placeholder="2500" className="bg-black/20 h-9 text-sm" />
          </FieldRow>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          {t("brief_panel.infos.profit_engine_hint")}
        </p>
      </div>
    </div>
  );
}

// ─── GMB Import Block ──────────────────────────────────────────────────────────

interface GmbPlace {
  name?: string;
  address?: string;
  rating?: number;
  ratingCount?: number;
  category?: string;
  website?: string;
  phoneNumber?: string;
}

interface GmbImportProps {
  onImport: (brief: Partial<BrandBrief>) => void;
}

function GmbImportBlock({ onImport }: GmbImportProps) {
  const { t } = useT();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [place, setPlace] = useState<GmbPlace | null>(null);

  const handleImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setPlace(null);

    try {
      const res = await fetch("/api/scrape-gmb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t("brief_panel.gmb.error_default"));
        return;
      }

      setPlace(data.place);
      onImport(data.brief);
    } catch {
      setError(t("brief_panel.gmb.error_network"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-5 my-4 rounded-xl border border-amber-400/20 bg-amber-400/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-400/10">
        <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-400">{t("brief_panel.gmb.title")}</p>
          <p className="text-[10px] text-muted-foreground">{t("brief_panel.gmb.subtitle")}</p>
        </div>
      </div>

      {/* Input row */}
      <div className="flex gap-2 px-4 py-3">
        <Input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); }}
          placeholder={t("brief_panel.gmb.placeholder")}
          className="bg-black/30 h-9 text-xs border-white/10 flex-1"
          onKeyDown={(e) => e.key === "Enter" && !loading && handleImport()}
        />
        <Button
          onClick={handleImport}
          disabled={loading || !url.trim()}
          size="sm"
          className="h-9 px-3 text-xs gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold shrink-0"
        >
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" />{t("brief_panel.gmb.btn_loading")}</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" />{t("brief_panel.gmb.btn_import")}</>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 mx-4 mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-red-400">{error}</p>
        </div>
      )}

      {/* Success card */}
      {place && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-3 px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <p className="text-xs font-semibold text-green-400 truncate">{place.name}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {place.category && (
                  <span className="text-[10px] text-muted-foreground">{place.category}</span>
                )}
                {place.rating && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                    {place.rating} ({t("brief_panel.gmb.reviews", { count: place.ratingCount ?? 0 })})
                  </span>
                )}
                {place.address && (
                  <span className="text-[10px] text-muted-foreground truncate">{place.address}</span>
                )}
              </div>
            </div>
            {place.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <p className="text-[10px] text-green-400/70 mt-1.5">
            {t("brief_panel.gmb.success_hint")}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BrandBriefPanel() {
  const { brief, savedBriefs, updateBrief, resetBrief, restoreBrief, deleteSavedBrief, completionPct, filledCount } = useBrand();
  const { t, uiLocale } = useT();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("identity");
  const [saved, setSaved] = useState(false);

  const form = useForm<BrandBrief>({
    defaultValues: brief,
  });

  // Sync form when brief changes externally (e.g. from a module)
  React.useEffect(() => {
    form.reset(brief);
  }, [brief]);

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      updateBrief(values as Partial<BrandBrief>);
    });
    return () => subscription.unsubscribe();
  }, [form, updateBrief]);

  const onSave = form.handleSubmit((values) => {
    updateBrief(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  });

  const handleGmbImport = (imported: Partial<BrandBrief>) => {
    Object.entries(imported).forEach(([key, value]) => {
      if (value && typeof value === "string" && value.trim() !== "") {
        form.setValue(key as keyof BrandBrief, value, { shouldDirty: true });
      }
    });
    setActiveSection("identity");
  };

  const isComplete = completionPct >= 80;
  const recentBriefs = savedBriefs.slice(0, 5);

  // Map locale → BCP 47 pour l'affichage de la date
  const dateLocale = useMemo(() => {
    const map: Record<string, string> = {
      fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", it: "it-IT", pt: "pt-PT",
    };
    return map[uiLocale] ?? "en-US";
  }, [uiLocale]);

  const sectorLabel = brief.sector ? t(`brief_panel.lists.sectors.${brief.sector}`) : "";

  return (
    <div className="mb-6 rounded-2xl border border-white/8 bg-card/40 backdrop-blur-sm overflow-hidden">
      {/* Header (always visible) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">
              {t("brief.title_global")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {brief.brand_name
                ? `${brief.brand_name} · ${sectorLabel || brief.sector}`
                : t("brief.subtitle_global")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Completion indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${isComplete ? "bg-green-400" : "bg-primary"}`}
              />
            </div>
            <span className={`text-xs font-mono ${isComplete ? "text-green-400" : "text-muted-foreground"}`}>
              {completionPct}%
            </span>
          </div>
          {isComplete ? (
            <span className="flex items-center gap-1 text-[11px] text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
              <Check className="w-3 h-3" />{t("brief_panel.completion_complete")}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
              <AlertCircle className="w-3 h-3" />{filledCount}/10
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5">
              {/* GMB Import */}
              <GmbImportBlock onImport={handleGmbImport} />

              {/* Autosaved briefs */}
              <div className="mx-5 mb-4 rounded-xl border border-white/8 bg-black/15 overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{t("brief_panel.saved_briefs_title")}</p>
                      <p className="text-[10px] text-muted-foreground">{t("brief_panel.saved_briefs_subtitle")}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60">{savedBriefs.length}/12</span>
                </div>

                {recentBriefs.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {recentBriefs.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            restoreBrief(item.id);
                            form.reset(item.brief);
                            setSaved(true);
                            setTimeout(() => setSaved(false), 2000);
                          }}
                          className="flex-1 min-w-0 text-left group"
                        >
                          <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                            {item.subtitle && <span className="truncate">{item.subtitle}</span>}
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(item.updatedAt).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedBrief(item.id)}
                          className="p-1.5 rounded-md text-muted-foreground/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          aria-label={t("brief_panel.saved_briefs_delete", { title: item.title })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">
                      {t("brief_panel.saved_briefs_empty")}
                    </p>
                  </div>
                )}
              </div>

              {/* Section tabs */}
              <div className="flex gap-0.5 px-5 pt-2 pb-2 overflow-x-auto scrollbar-none border-t border-white/5">
                {SECTION_KEYS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(s.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      activeSection === s.key
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeSection === s.key ? s.dot : "bg-white/20"}`} />
                    {t(`brief_panel.sections.${s.key}`)}
                  </button>
                ))}
              </div>

              {/* Section content */}
              <div className="px-5 pb-5 pt-2">
                {activeSection === "identity"    && <IdentitySection    form={form} />}
                {activeSection === "product"     && <ProductSection     form={form} />}
                {activeSection === "commerce"    && <CommerceSection    form={form} />}
                {activeSection === "sav"         && <SavSection         form={form} />}
                {activeSection === "visual"      && <VisualSection      form={form} />}
                {activeSection === "performance" && <PerformanceSection form={form} />}
                {activeSection === "strategie"   && <StrategieSection   form={form} />}
                {activeSection === "gouvernance" && <GouvernanceSection form={form} />}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => { resetBrief(); form.reset({ ...BRIEF_DEFAULTS }); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t("brief_panel.reset_button")}
                </button>
                <div className="flex items-center gap-3">
                  {saved && (
                    <motion.span
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1 text-xs text-green-400"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t("brief_panel.saved_toast")}
                    </motion.span>
                  )}
                  <Button size="sm" onClick={onSave} className="h-8 px-4 text-xs gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    {t("brief_panel.save_button")}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
