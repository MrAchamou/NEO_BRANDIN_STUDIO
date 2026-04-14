import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  ChevronDown, ChevronUp, Sparkles, RotateCcw, Check, AlertCircle,
  MapPin, Loader2, Star, ExternalLink, History, Trash2, Clock, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBrand, BrandBrief, BRIEF_DEFAULTS } from "@/context/brand-context";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const MARKETS = [
  { value: "international",  label: "🌍 International (Générique)", currency: "€" },
  // Afrique
  { value: "cote-divoire",   label: "🇨🇮 Côte d'Ivoire",            currency: "FCFA" },
  { value: "senegal",        label: "🇸🇳 Sénégal",                  currency: "FCFA" },
  { value: "maroc",          label: "🇲🇦 Maroc",                    currency: "DH" },
  { value: "nigeria",        label: "🇳🇬 Nigeria",                  currency: "₦" },
  // Europe
  { value: "france",         label: "🇫🇷 France",                   currency: "€" },
  { value: "belgique",       label: "🇧🇪 Belgique",                 currency: "€" },
  { value: "suisse",         label: "🇨🇭 Suisse",                   currency: "CHF" },
  { value: "allemagne",      label: "🇩🇪 Allemagne",                currency: "€" },
  { value: "royaume-uni",    label: "🇬🇧 Royaume-Uni",              currency: "£" },
  // Amérique
  { value: "usa",            label: "🇺🇸 États-Unis",               currency: "$" },
  { value: "canada",         label: "🇨🇦 Canada",                   currency: "CA$" },
  // Moyen-Orient
  { value: "emirats",        label: "🇦🇪 Émirats Arabes Unis",      currency: "AED" },
];

const SECTORS = [
  { value: "bijou",        label: "Bijouterie / Accessoires" },
  { value: "luxe",         label: "Luxe / Premium" },
  { value: "cosmétique",   label: "Cosmétique / Beauté" },
  { value: "mode",         label: "Mode / Prêt-à-porter" },
  { value: "tech",         label: "Tech / Électronique" },
  { value: "fitness",      label: "Sport / Fitness" },
  { value: "décoration",   label: "Décoration / Maison" },
  { value: "maroquinerie", label: "Maroquinerie / Sacs" },
];

const TONES = [
  { value: "luxe",          label: "Luxe & Prestige" },
  { value: "premium",       label: "Premium & Élégant" },
  { value: "moderne",       label: "Moderne & Dynamique" },
  { value: "minimaliste",   label: "Minimaliste & Épuré" },
  { value: "chaleureux",    label: "Chaleureux & Bienveillant" },
  { value: "professionnel", label: "Professionnel & Sérieux" },
  { value: "streetwear",    label: "Streetwear & Audacieux" },
  { value: "écologique",    label: "Écologique & Engagé" },
];

const AUDIENCES = [
  { value: "femmes-25-45",  label: "Femmes 25-45 ans" },
  { value: "hommes-25-45",  label: "Hommes 25-45 ans" },
  { value: "mixte-25-45",   label: "Mixte 25-45 ans" },
  { value: "jeunes-18-30",  label: "Jeunes 18-30 ans" },
  { value: "csp-plus",      label: "CSP+ / Cadres" },
  { value: "managers",      label: "Managers / Entrepreneurs" },
  { value: "sportifs",      label: "Sportifs / Actifs" },
  { value: "parents",       label: "Parents / Familles" },
];

function selectCls() {
  return "flex h-10 w-full appearance-none rounded-md border border-white/10 bg-neutral-900 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary [&>option]:bg-neutral-900 [&>option]:text-white";
}

// Sections du panneau brief
const SECTIONS = [
  {
    key: "identity",
    label: "Identité",
    color: "text-amber-400",
    dot: "bg-amber-400",
    fields: ["brand_name", "sector", "tone", "values", "colors"],
  },
  {
    key: "product",
    label: "Produit",
    color: "text-violet-400",
    dot: "bg-violet-400",
    fields: ["product_name", "product_description", "product_features", "product_colors", "product_materials", "benefits", "target_audience", "unique_feature"],
  },
  {
    key: "commerce",
    label: "Commerce",
    color: "text-green-400",
    dot: "bg-green-400",
    fields: ["price", "old_price", "discount", "promo_code", "checkout_url", "shipping_info", "free_shipping"],
  },
  {
    key: "sav",
    label: "SAV",
    color: "text-orange-400",
    dot: "bg-orange-400",
    fields: ["warranty", "delivery_days", "express_delivery_days", "express_price", "return_days", "support_email", "contact_channel", "sav_response_time", "sav_message", "best_seller_1", "best_seller_2"],
  },
  {
    key: "visual",
    label: "Visuel",
    color: "text-pink-400",
    dot: "bg-pink-400",
    fields: ["primary_color", "secondary_color", "accent_color", "visual_style", "heading_font", "body_font"],
  },
  {
    key: "performance",
    label: "Performance",
    color: "text-blue-400",
    dot: "bg-blue-400",
    fields: ["ca_target", "basket_target", "conv_target", "roas_target", "target_cpa", "margin_percent"],
  },
  {
    key: "strategie",
    label: "Stratégie",
    color: "text-red-400",
    dot: "bg-red-400",
    fields: ["target_demographic", "competitors", "forbidden_keywords", "usp"],
  },
] as const;

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

  const selectedItems = selected.map(v => MARKETS.find(m => m.value === v)).filter(Boolean) as typeof MARKETS;
  const currencies = [...new Set(selectedItems.map(m => m.currency))];

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
            {m.label}
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
            {MARKETS.map(m => {
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
                  <span className="flex-1">{m.label}</span>
                  {isActive && <Check size={10} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex h-9 items-center px-3 rounded-md border border-white/10 bg-primary/10 text-xs text-primary font-mono">
        {currencies.join(" · ")} — devise{currencies.length > 1 ? "s" : ""} des marchés sélectionnés
      </div>
    </div>
  );
}

function IdentitySection({ form }: { form: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FieldRow label="Nom de la marque *">
        <Input {...form.register("brand_name")} placeholder="ex: LUXEOR" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label="Secteur *">
        <select {...form.register("sector")} className={selectCls()}>
          {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </FieldRow>
      <FieldRow label="Ton de communication">
        <select {...form.register("tone")} className={selectCls()}>
          {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </FieldRow>
      <FieldRow label="Valeurs de marque">
        <Input {...form.register("values")} placeholder="ex: excellence, prestige, authenticité" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <div className="sm:col-span-2">
        <FieldRow label="Marché / Pays cible *">
          <MarketMultiSelect form={form} />
        </FieldRow>
      </div>
      <div className="sm:col-span-2">
        <FieldRow label="Couleurs de marque (HEX ou description)">
          <Input {...form.register("colors")} placeholder="ex: #D4AF37, #1A1A1A, #FFFFFF — ou: or, noir profond, blanc" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
    </div>
  );
}

function ProductSection({ form }: { form: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FieldRow label="Nom du produit phare">
        <Input {...form.register("product_name")} placeholder="ex: Montre Élégance Or Rose" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label="Audience cible">
        <select {...form.register("target_audience")} className={selectCls()}>
          {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </FieldRow>
      <div className="sm:col-span-2">
        <FieldRow label="Description du produit">
          <Input {...form.register("product_description")} placeholder="ex: Montre automatique or rose 18k, verre saphir, bracelet cuir Hermès..." className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
      <FieldRow label="Caractéristiques clés">
        <Input {...form.register("product_features")} placeholder="ex: or 18k, verre saphir, étanche 50m" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label="Bénéfices client">
        <Input {...form.register("benefits")} placeholder="ex: élégance, précision, durabilité" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label="Couleurs produit">
        <Input {...form.register("product_colors")} placeholder="ex: or rose, noir, blanc ivoire" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label="Matériaux">
        <Input {...form.register("product_materials")} placeholder="ex: acier inoxydable, verre saphir, cuir" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <div className="sm:col-span-2">
        <FieldRow label="Caractéristique unique (différenciateur clé)">
          <Input {...form.register("unique_feature")} placeholder="ex: Seul sérum végan made in France avec vit. C stabilisée" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
    </div>
  );
}

function CommerceSection({ form }: { form: any }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <FieldRow label="Prix de vente (€)">
        <Input {...form.register("price")} type="number" placeholder="299" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label="Prix barré avant remise (€)">
        <Input {...form.register("old_price")} type="number" placeholder="399" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label="Réduction (%)">
        <Input {...form.register("discount")} type="number" placeholder="20" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label="Code promo">
        <Input {...form.register("promo_code")} placeholder="ex: LUXEOR20" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label="Livraison offerte dès (€)">
        <Input {...form.register("free_shipping")} type="number" placeholder="100" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <FieldRow label="Stock disponible">
        <Input {...form.register("stock")} type="number" placeholder="50" className="bg-black/20 h-9 text-sm" />
      </FieldRow>
      <div className="col-span-2 sm:col-span-3">
        <FieldRow label="Info livraison (texte affiché)">
          <Input {...form.register("shipping_info")} placeholder="ex: Livraison offerte dès 120€ — 2-4 jours ouvrés (Colissimo)" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
      <div className="col-span-2 sm:col-span-3">
        <FieldRow label="URL page de commande / checkout">
          <Input {...form.register("checkout_url")} placeholder="ex: https://masite.com/checkout" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
    </div>
  );
}

const VISUAL_STYLES = [
  { value: "", label: "Sélectionner un style…" },
  { value: "luxe-premium", label: "Luxe & Premium" },
  { value: "editorial", label: "Éditorial & Magazine" },
  { value: "minimaliste", label: "Minimaliste & Épuré" },
  { value: "moderne", label: "Moderne & Tech" },
  { value: "chaud-naturel", label: "Chaud & Naturel" },
  { value: "streetwear", label: "Streetwear & Urban" },
  { value: "artisanal", label: "Artisanal & Craft" },
  { value: "ecologique", label: "Écologique & Organique" },
];

function VisualSection({ form }: { form: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FieldRow label="Couleur principale (HEX) *">
          <div className="flex gap-2">
            <input type="color" {...form.register("primary_color")} className="w-10 h-9 rounded cursor-pointer border border-white/10 bg-transparent flex-shrink-0" />
            <Input {...form.register("primary_color")} className="bg-black/20 h-9 text-sm font-mono" placeholder="#D4AF37" />
          </div>
        </FieldRow>
        <FieldRow label="Couleur secondaire (HEX)">
          <div className="flex gap-2">
            <input type="color" {...form.register("secondary_color")} className="w-10 h-9 rounded cursor-pointer border border-white/10 bg-transparent flex-shrink-0" />
            <Input {...form.register("secondary_color")} className="bg-black/20 h-9 text-sm font-mono" placeholder="#9CAF88" />
          </div>
        </FieldRow>
        <FieldRow label="Couleur d'accent (HEX)">
          <div className="flex gap-2">
            <input type="color" {...form.register("accent_color")} className="w-10 h-9 rounded cursor-pointer border border-white/10 bg-transparent flex-shrink-0" />
            <Input {...form.register("accent_color")} className="bg-black/20 h-9 text-sm font-mono" placeholder="#D4A5A5" />
          </div>
        </FieldRow>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FieldRow label="Style visuel global">
          <select {...form.register("visual_style")} className={selectCls()}>
            {VISUAL_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Police titres">
          <Input {...form.register("heading_font")} placeholder="Playfair Display" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label="Police texte">
          <Input {...form.register("body_font")} placeholder="Montserrat" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
    </div>
  );
}

const CONTACT_CHANNELS = [
  { value: "", label: "Sélectionner un canal…" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram DM" },
  { value: "email-instagram", label: "Email + Instagram DM" },
  { value: "email-whatsapp", label: "Email + WhatsApp" },
  { value: "chat-live", label: "Chat en direct (site)" },
  { value: "telephone", label: "Téléphone" },
  { value: "tous", label: "Tous les canaux" },
];

function SavSection({ form }: { form: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <FieldRow label="Garantie (années)">
          <Input {...form.register("warranty")} type="number" step="any" placeholder="2" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label="Délai livraison standard (j)">
          <Input {...form.register("delivery_days")} type="number" placeholder="3" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label="Délai livraison express (j)">
          <Input {...form.register("express_delivery_days")} type="number" placeholder="1" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label="Prix livraison express (€)">
          <Input {...form.register("express_price")} type="number" step="any" placeholder="9.90" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label="Politique de retour (jours)">
          <Input {...form.register("return_days")} type="number" placeholder="30" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label="Délai réponse SAV">
          <Input {...form.register("sav_response_time")} placeholder="ex: Sous 24h ouvrées" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FieldRow label="Email support">
          <Input {...form.register("support_email")} type="email" placeholder="ex: support@mamarque.com" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label="Canal de contact principal">
          <select {...form.register("contact_channel")} className={selectCls()}>
            {CONTACT_CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Best-seller 1">
          <Input {...form.register("best_seller_1")} placeholder="ex: Robe Sorelle Signature" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
        <FieldRow label="Best-seller 2">
          <Input {...form.register("best_seller_2")} placeholder="ex: Ensemble Lin Premium" className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      </div>
      <div>
        <FieldRow label="Message type SAV (modèle de réponse client)">
          <textarea
            {...form.register("sav_message")}
            rows={3}
            placeholder="ex: Bonjour [Prénom], merci pour votre confiance ! Votre commande #[NUM] est en cours de préparation. Notre équipe revient vers vous sous 24h. — L'équipe MAISON SORELLE"
            className="flex w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
          />
        </FieldRow>
      </div>
    </div>
  );
}

function PerformanceSection({ form }: { form: any }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[
        { name: "ca_target",     label: "CA mensuel cible (€)", placeholder: "10000" },
        { name: "basket_target", label: "Panier moyen cible (€)", placeholder: "150" },
        { name: "conv_target",   label: "Taux conv. cible (%)", placeholder: "2.5" },
        { name: "roas_target",   label: "ROAS cible (x)", placeholder: "3.0" },
        { name: "target_cpa",    label: "CPA cible (€)", placeholder: "15" },
        { name: "margin_percent",label: "Marge brute (%)", placeholder: "65" },
      ].map((f) => (
        <FieldRow key={f.name} label={f.label}>
          <Input {...form.register(f.name)} type="number" step="any" placeholder={f.placeholder} className="bg-black/20 h-9 text-sm" />
        </FieldRow>
      ))}
    </div>
  );
}

function StrategieSection({ form }: { form: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-red-400/20 bg-red-400/5">
        <span className="text-red-400 text-xs mt-0.5">⚡</span>
        <p className="text-[11px] text-red-300/80 leading-relaxed">
          Ces champs sont injectés dans le <strong>Chain-of-Thought</strong> de l'IA pour des prompts ultra-calibrés à ta marque. Plus le contexte est précis, plus les prompts sont chirurgicaux.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <FieldRow label="Démographie cible précise">
          <Input
            {...form.register("target_demographic")}
            placeholder="ex: Femmes 28-42 ans, revenus 50-90k€, urbaines CSP+, intérêt mode slow & luxe accessible"
            className="bg-black/20 h-9 text-sm"
          />
        </FieldRow>
        <FieldRow label="Concurrents directs">
          <Input
            {...form.register("competitors")}
            placeholder="ex: BOSS, Calvin Klein, Sandro — se différencier sur le prix et l'authenticité"
            className="bg-black/20 h-9 text-sm"
          />
        </FieldRow>
        <FieldRow label="Mots-clés & éléments INTERDITS">
          <Input
            {...form.register("forbidden_keywords")}
            placeholder="ex: 'cheap', 'économique', couleurs flashy, visuels surchargés, emoji dans les copies"
            className="bg-black/20 h-9 text-sm"
          />
        </FieldRow>
        <FieldRow label="Proposition de valeur unique (USP)">
          <Input
            {...form.register("usp")}
            placeholder="ex: La clean beauty à la française — naturalité, traçabilité, efficacité prouvée"
            className="bg-black/20 h-9 text-sm"
          />
        </FieldRow>
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
        setError(data.error ?? "Erreur lors du scraping.");
        return;
      }

      setPlace(data.place);
      onImport(data.brief);
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
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
          <p className="text-xs font-semibold text-amber-400">Importer depuis Google My Business</p>
          <p className="text-[10px] text-muted-foreground">Collez votre lien GMB pour remplir le brief automatiquement</p>
        </div>
      </div>

      {/* Input row */}
      <div className="flex gap-2 px-4 py-3">
        <Input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); }}
          placeholder="https://maps.app.goo.gl/... ou https://www.google.com/maps/place/..."
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
            <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyse…</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" />Importer</>
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
                    {place.rating} ({place.ratingCount} avis)
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
            ✓ Brief pré-rempli — vérifiez et ajustez les champs ci-dessous
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BrandBriefPanel() {
  const { brief, savedBriefs, updateBrief, resetBrief, restoreBrief, deleteSavedBrief, completionPct, filledCount } = useBrand();
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
    // Merge imported fields into the form (only non-empty values)
    Object.entries(imported).forEach(([key, value]) => {
      if (value && typeof value === "string" && value.trim() !== "") {
        form.setValue(key as keyof BrandBrief, value, { shouldDirty: true });
      }
    });
    // Switch to identity tab so user sees what was filled
    setActiveSection("identity");
  };

  const isComplete = completionPct >= 80;
  const recentBriefs = savedBriefs.slice(0, 5);

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
              Brief Global de Marque
            </p>
            <p className="text-[11px] text-muted-foreground">
              {brief.brand_name
                ? `${brief.brand_name} · ${SECTORS.find(s => s.value === brief.sector)?.label ?? brief.sector}`
                : "Remplissez une fois, tous les modules s'adaptent automatiquement"}
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
              <Check className="w-3 h-3" />Brief complet
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
                      <p className="text-xs font-semibold text-foreground">Briefs sauvegardés automatiquement</p>
                      <p className="text-[10px] text-muted-foreground">Retrouvez et réutilisez vos derniers briefs de marque</p>
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
                              {new Date(item.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedBrief(item.id)}
                          className="p-1.5 rounded-md text-muted-foreground/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          aria-label={`Supprimer le brief ${item.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">
                      Aucun brief archivé pour l’instant. Dès que vous remplissez un brief, il est sauvegardé ici automatiquement.
                    </p>
                  </div>
                )}
              </div>

              {/* Section tabs */}
              <div className="flex gap-0.5 px-5 pt-2 pb-2 overflow-x-auto scrollbar-none border-t border-white/5">
                {SECTIONS.map((s) => (
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
                    {s.label}
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
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => { resetBrief(); form.reset({ ...BRIEF_DEFAULTS }); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Réinitialiser
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
                      Sauvegardé !
                    </motion.span>
                  )}
                  <Button size="sm" onClick={onSave} className="h-8 px-4 text-xs gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Appliquer à tous les modules
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
