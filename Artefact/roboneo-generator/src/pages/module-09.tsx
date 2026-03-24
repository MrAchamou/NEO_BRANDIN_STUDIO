import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Download, ChevronRight, Check, ShoppingCart,
  Package, Tag, Mail, ChevronDown, ChevronUp, Gift, Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionResult {
  key: string;
  label: string;
  agent: string;
  data: Record<string, unknown>;
  rawContent: string;
}

interface StreamState {
  sections: Record<string, {
    label: string;
    agent: string;
    buffer: string;
    data: Record<string, unknown>;
    done: boolean;
  }>;
  activeSection: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SECTION_ORDER = ["cross_sell", "bundles", "upsell_copy", "email_sequences"];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  cross_sell: <ShoppingCart className="w-4 h-4" />,
  bundles: <Package className="w-4 h-4" />,
  upsell_copy: <Tag className="w-4 h-4" />,
  email_sequences: <Mail className="w-4 h-4" />,
};

const SECTION_COLORS: Record<string, string> = {
  cross_sell: "from-green-500/10 to-transparent border-green-500/20",
  bundles: "from-yellow-500/10 to-transparent border-yellow-500/20",
  upsell_copy: "from-pink-500/10 to-transparent border-pink-500/20",
  email_sequences: "from-blue-500/10 to-transparent border-blue-500/20",
};

const SECTION_LABELS: Record<string, string> = {
  cross_sell: "Produits Complémentaires (3 idées)",
  bundles: "Offres Groupées (3 bundles)",
  upsell_copy: "Copy Upsell/Cross-sell",
  email_sequences: "Séquences Email (3 emails)",
};

// ─── Cross-sell View ──────────────────────────────────────────────────────────

function CrossSellView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [openId, setOpenId] = useState<number | null>(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();

  const ideas = (data.ideas as any[]) ?? [];

  if (streaming && isActive && ideas.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-green-400/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-32 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  const handleCopy = async (idea: any, id: number) => {
    const txt = `PRODUIT COMPLÉMENTAIRE #${id}\n${idea.product_name}\n${idea.description}\nPrix: ${idea.price_range}\nJustification: ${idea.justification}\nPlacement: ${idea.placement}\n\nVISUEL PROMPT:\n${idea.visual_prompt}`;
    await navigator.clipboard.writeText(txt);
    setCopiedId(id);
    toast({ title: "Idée copiée !" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadAll = () => {
    const txt = ideas.map((idea: any, i: number) =>
      `IDÉE #${i + 1}: ${idea.product_name}\n${"─".repeat(40)}\nDescription: ${idea.description}\nPrix: ${idea.price_range}\nMarge: ${idea.margin}\nRéduction bundle: -${idea.bundle_discount}%\nPlacement: ${idea.placement}\nJustification: ${idea.justification}\n\nPROMPT VISUEL:\n${idea.visual_prompt}`
    ).join("\n\n" + "═".repeat(50) + "\n\n");
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = "cross_sell_ideas.txt";
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleDownloadAll} className="h-7 text-xs text-muted-foreground hover:text-green-400">
          <Download className="w-3 h-3 mr-1" /> Exporter tout
        </Button>
      </div>
      <div className="space-y-2">
        {ideas.map((idea: any, i: number) => (
          <div key={i} className="bg-black/20 rounded-lg border border-white/5 hover:border-green-500/20 transition-colors">
            <button
              className="w-full text-left p-3 flex items-center justify-between gap-3"
              onClick={() => setOpenId(openId === i ? null : i)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center text-xs font-bold text-green-400">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{idea.product_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-green-400 font-mono">{idea.price_range}</span>
                    <span className="text-xs text-muted-foreground/40">•</span>
                    <span className="text-xs text-muted-foreground/60">Marge {idea.margin}</span>
                    <span className="text-xs text-muted-foreground/40">•</span>
                    <span className="text-xs text-yellow-400/80">-{idea.bundle_discount}% en bundle</span>
                  </div>
                </div>
              </div>
              {openId === i
                ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {openId === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-1 space-y-3 border-t border-white/5">
                    <p className="text-sm text-foreground/80 leading-relaxed">{idea.description}</p>

                    <div className="bg-green-500/5 rounded p-2.5 border border-green-500/10">
                      <p className="text-[10px] text-green-400 uppercase tracking-wider mb-1">Justification :</p>
                      <p className="text-xs text-foreground/70">{idea.justification}</p>
                    </div>

                    {idea.placement && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Placement :</span>
                        <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">{idea.placement}</span>
                      </div>
                    )}

                    {idea.visual_prompt && (
                      <div className="bg-black/30 rounded p-2.5 border border-white/5">
                        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1.5">Prompt visuel RoboNeo :</p>
                        <p className="text-xs text-foreground/60 leading-relaxed font-mono">{idea.visual_prompt}</p>
                      </div>
                    )}

                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleCopy(idea, i)}
                      className="h-7 text-xs text-muted-foreground hover:text-green-400"
                    >
                      {copiedId === i ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
                      Copier
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-right text-muted-foreground/40">{ideas.length} produits complémentaires générés</p>
    </div>
  );
}

// ─── Bundles View ─────────────────────────────────────────────────────────────

function BundlesView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { toast } = useToast();

  const offers = (data.offers as any[]) ?? [];

  if (streaming && isActive && offers.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-yellow-400/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-32 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  const BUNDLE_TYPE_COLORS: Record<string, string> = {
    standard: "bg-green-500 text-white",
    premium: "bg-yellow-500 text-black",
    gift: "bg-pink-500 text-white",
  };

  const current = offers[activeIdx];

  const handleCopy = async (offer: any, key: string) => {
    const txt = `BUNDLE: ${offer.name}\n${offer.tagline ?? ""}\nPrix original: ${offer.original_price}€\nPrix bundle: ${offer.bundle_price}€ (-${offer.discount_percent}%)\nÉconomie: ${offer.savings}€\nProduits: ${(offer.products ?? []).join(" + ")}\nCTA: ${offer.cta}\nPour: ${offer.best_for}\n\nPROMPT VISUEL:\n${offer.visual_prompt ?? ""}`;
    await navigator.clipboard.writeText(txt);
    setCopiedKey(key);
    toast({ title: "Bundle copié !" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Bundle tabs */}
      <div className="flex flex-wrap gap-1.5">
        {offers.map((offer: any, i: number) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeIdx === i
                ? BUNDLE_TYPE_COLORS[offer.type ?? "standard"] ?? "bg-yellow-500 text-black"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            {offer.type === "gift" && <Gift className="w-3 h-3" />}
            {offer.type === "premium" && <Percent className="w-3 h-3" />}
            {offer.type === "standard" && <Package className="w-3 h-3" />}
            {offer.name}
          </button>
        ))}
      </div>

      {current && (
        <div className="space-y-3">
          {/* Pricing card */}
          <div className="bg-black/30 rounded-xl border border-yellow-500/15 p-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-lg font-bold text-foreground">{current.name}</p>
                {current.tagline && (
                  <p className="text-sm text-muted-foreground mt-0.5">{current.tagline}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-black text-yellow-400">{current.bundle_price}€</span>
                  <span className="text-sm text-muted-foreground/50 line-through">{current.original_price}€</span>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
                    -{current.discount_percent}%
                  </span>
                </div>
                <p className="text-xs text-green-400 mt-1">✓ Économie de {current.savings}€</p>
              </div>
              <Button
                variant="ghost" size="sm"
                onClick={() => handleCopy(current, `bundle-${activeIdx}`)}
                className="h-7 text-xs text-muted-foreground hover:text-yellow-400"
              >
                {copiedKey === `bundle-${activeIdx}` ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
                Copier
              </Button>
            </div>

            {/* Products list */}
            {current.products && current.products.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1.5">Contenu du pack :</p>
                {(current.products as string[]).map((prod: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-yellow-500/10 flex items-center justify-center text-[9px] font-bold text-yellow-400">{i + 1}</span>
                    <span className="text-sm text-foreground/80">{prod}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA & for whom */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-yellow-500/5 rounded-lg p-2.5 border border-yellow-500/10">
              <p className="text-[10px] text-yellow-400 uppercase tracking-wider mb-1">Bouton CTA :</p>
              <p className="text-sm text-foreground/80 font-medium">"{current.cta}"</p>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1">Idéal pour :</p>
              <p className="text-sm text-foreground/70">{current.best_for}</p>
            </div>
          </div>

          {/* Visual prompt */}
          {current.visual_prompt && (
            <div className="bg-black/30 rounded p-2.5 border border-white/5">
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1.5">Prompt visuel RoboNeo :</p>
              <p className="text-xs text-foreground/60 leading-relaxed font-mono">{current.visual_prompt}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Upsell Copy View ─────────────────────────────────────────────────────────

function UpsellCopyView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"product_page" | "cart_page" | "post_purchase" | "checkout_bump">("product_page");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { toast } = useToast();

  const hasData = data.product_page || data.cart_page || data.post_purchase || data.checkout_bump;

  if (streaming && isActive && !hasData) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-pink-400/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-32 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  const TABS = [
    { key: "product_page" as const, label: "Page Produit" },
    { key: "cart_page" as const, label: "Panier" },
    { key: "post_purchase" as const, label: "Post-Achat" },
    { key: "checkout_bump" as const, label: "Order Bump" },
  ];

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({ title: "Copy copiée !" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const renderField = (label: string, value: string, key: string, accent = "pink") => (
    <div className="relative bg-black/20 rounded-lg p-3 border border-white/5">
      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-sm text-foreground/85 leading-relaxed pr-8">{value}</p>
      <button
        onClick={() => handleCopy(value, key)}
        className="absolute top-2 right-2 text-muted-foreground/30 hover:text-pink-400 transition-colors"
      >
        {copiedKey === key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-pink-500 text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {activeTab === "product_page" && data.product_page && (() => {
          const pp = data.product_page as any;
          return (
            <>
              {pp.title && renderField("Titre", pp.title, "pp-title")}
              {pp.subtitle && renderField("Sous-titre", pp.subtitle, "pp-subtitle")}
              {pp.cta && renderField("Bouton CTA", pp.cta, "pp-cta")}
              {pp.badge && renderField("Badge", pp.badge, "pp-badge")}
              {pp.benefit && renderField("Bénéfice", pp.benefit, "pp-benefit")}
            </>
          );
        })()}

        {activeTab === "cart_page" && Array.isArray(data.cart_page) && (
          <div className="space-y-3">
            {(data.cart_page as any[]).map((item: any, i: number) => (
              <div key={i} className="border border-white/8 rounded-lg p-3 bg-black/10 space-y-2">
                <p className="text-[10px] text-pink-400/70 uppercase tracking-wider">Suggestion #{i + 1}</p>
                {item.title && renderField("Titre", item.title, `cart-title-${i}`)}
                {item.description && renderField("Description", item.description, `cart-desc-${i}`)}
                {item.cta && renderField("Bouton", item.cta, `cart-cta-${i}`)}
                {item.urgency && renderField("Urgence / Rareté", item.urgency, `cart-urgency-${i}`)}
              </div>
            ))}
          </div>
        )}

        {activeTab === "post_purchase" && data.post_purchase && (() => {
          const pp = data.post_purchase as any;
          return (
            <>
              {pp.title && renderField("Titre", pp.title, "ppa-title")}
              {pp.description && renderField("Description", pp.description, "ppa-desc")}
              {pp.cta && renderField("Bouton CTA", pp.cta, "ppa-cta")}
              {pp.expiry && renderField("Durée de validité", pp.expiry, "ppa-expiry")}
              {pp.subject_email && renderField("Objet email", pp.subject_email, "ppa-email")}
              {pp.discount && (
                <div className="bg-pink-500/10 rounded-lg p-2.5 border border-pink-500/15">
                  <p className="text-sm text-pink-400 font-bold">Réduction : -{pp.discount}%</p>
                </div>
              )}
            </>
          );
        })()}

        {activeTab === "checkout_bump" && data.checkout_bump && (() => {
          const cb = data.checkout_bump as any;
          return (
            <>
              {cb.title && renderField("Titre bump", cb.title, "cb-title")}
              {cb.description && renderField("Description", cb.description, "cb-desc")}
              {cb.price_display && renderField("Affichage prix", cb.price_display, "cb-price")}
              {cb.cta && renderField("Oui (j'accepte)", cb.cta, "cb-cta")}
              {cb.not_interested && renderField("Non (je refuse)", cb.not_interested, "cb-no")}
            </>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Email Sequences View ─────────────────────────────────────────────────────

function EmailSequencesView({ data, streamBuffer, streaming, isActive }: {
  data: Record<string, unknown>;
  streamBuffer: string;
  streaming: boolean;
  isActive: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { toast } = useToast();

  const sequences = (data.sequences as any[]) ?? [];

  if (streaming && isActive && sequences.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-44 overflow-y-auto font-mono text-sm text-foreground/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
        {streamBuffer}
        <span className="inline-block w-2 h-4 bg-blue-400/80 animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  if (sequences.length === 0) {
    return (
      <div className="bg-black/30 rounded-md p-4 h-32 flex items-center justify-center border border-white/5">
        <span className="text-muted-foreground/40 italic text-sm">En attente de génération...</span>
      </div>
    );
  }

  const current = sequences[activeIdx];

  const handleCopy = async (seq: any, key: string) => {
    const txt = `EMAIL #${seq.id} — ${seq.timing}\nDéclencheur: ${seq.trigger}\n\nOBJET: ${seq.subject}\nPrévisu: ${seq.preview}\n\nTITRE: ${seq.headline}\n\nCORPS:\n${seq.body}\n\nCTA: ${seq.cta}\nLien secondaire: ${seq.secondary_cta}\n\nOBJECTIF: ${seq.goal}`;
    await navigator.clipboard.writeText(txt);
    setCopiedKey(key);
    toast({ title: "Email copié !" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadAll = () => {
    const txt = sequences.map((s: any) =>
      `EMAIL #${s.id} — ${s.timing}\n${"─".repeat(40)}\nDéclencheur: ${s.trigger}\nOBJET: ${s.subject}\nPrévisu: ${s.preview}\n\nTITRE: ${s.headline}\n\nCORPS:\n${s.body}\n\nCTA: ${s.cta}\nLien secondaire: ${s.secondary_cta}\nObjectif: ${s.goal}`
    ).join("\n\n" + "═".repeat(50) + "\n\n");
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = "email_upsell_sequence.txt";
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap gap-1.5">
          {sequences.map((s: any, i: number) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeIdx === i
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {s.timing ?? `Email ${i + 1}`}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={handleDownloadAll} className="h-7 text-xs text-muted-foreground hover:text-blue-400">
          <Download className="w-3 h-3 mr-1" /> TXT
        </Button>
      </div>

      {current && (
        <div className="space-y-2">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-500/5 rounded-lg p-2.5 border border-blue-500/10">
              <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Envoi</p>
              <p className="text-sm text-foreground/80 font-medium">{current.timing}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1">Déclencheur</p>
              <p className="text-sm text-foreground/70">{current.trigger}</p>
            </div>
          </div>

          {/* Subject line */}
          <div className="relative bg-blue-500/5 rounded-lg p-3 border border-blue-500/15">
            <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Objet de l'email :</p>
            <p className="text-sm font-semibold text-foreground pr-8">{current.subject}</p>
            {current.preview && (
              <p className="text-xs text-muted-foreground/60 mt-1 italic">{current.preview}</p>
            )}
            <button
              onClick={() => handleCopy(current, `email-${activeIdx}`)}
              className="absolute top-2 right-2 text-muted-foreground/30 hover:text-blue-400 transition-colors"
            >
              {copiedKey === `email-${activeIdx}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Body */}
          {current.headline && (
            <div className="bg-black/20 rounded-lg p-3 border border-white/5 space-y-2">
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Contenu :</p>
              <p className="text-sm font-bold text-foreground">{current.headline}</p>
              <p className="text-sm text-foreground/75 leading-relaxed">{current.body}</p>
            </div>
          )}

          {/* CTAs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-500/10 rounded-lg p-2.5 border border-blue-500/15">
              <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">CTA Principal :</p>
              <p className="text-sm font-semibold text-foreground">{current.cta}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1">Lien secondaire :</p>
              <p className="text-sm text-foreground/70">{current.secondary_cta}</p>
            </div>
          </div>

          {/* Goal */}
          {current.goal && (
            <div className="bg-green-500/5 rounded-lg p-2.5 border border-green-500/10">
              <p className="text-[10px] text-green-400 uppercase tracking-wider mb-1">Objectif :</p>
              <p className="text-xs text-foreground/70">{current.goal}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Formulaire ───────────────────────────────────────────────────────────────

const SECTORS = ["bijou", "luxe", "mode", "streetwear", "cosmétique", "skincare", "tech", "fitness", "décoration", "maroquinerie", "gadgets", "montres", "autre"];
const TONES = ["luxe", "professionnel", "dynamique", "naturel", "fun", "sérieux", "chaleureux", "élégant"];

const formSchema = z.object({
  brand_name: z.string().min(2, "Nom de marque requis"),
  product_name: z.string().min(2, "Nom de produit requis"),
  sector: z.string().min(1),
  tone: z.string().min(1),
  product_price: z.coerce.number().min(1).default(299),
  product_features: z.string().default(""),
  values: z.string().default(""),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Module09() {
  const { toast } = useToast();
  const [sections, setSections] = useState<SectionResult[]>([]);
  const [streamState, setStreamState] = useState<StreamState>({ sections: {}, activeSection: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand_name: "", product_name: "", sector: "bijou", tone: "professionnel",
      product_price: 299, product_features: "", values: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setShowResults(true);
    setStreamState({ sections: {}, activeSection: null });
    setSections([]);

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/openai/enhance-prompts-upsell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: data.brand_name,
          product_name: data.product_name,
          sector: data.sector,
          tone: data.tone,
          product_price: data.product_price,
          product_features: data.product_features
            ? data.product_features.split(",").map(s => s.trim()).filter(Boolean)
            : [],
          values: data.values
            ? data.values.split(",").map(s => s.trim()).filter(Boolean)
            : [],
        }),
      });

      if (!response.ok || !response.body) throw new Error("Erreur API");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const finalSections: SectionResult[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "section_start") {
              setStreamState(p => ({
                activeSection: event.key,
                sections: {
                  ...p.sections,
                  [event.key]: {
                    label: SECTION_LABELS[event.key] ?? event.key,
                    agent: "",
                    buffer: "",
                    data: {},
                    done: false,
                  },
                },
              }));
            }

            if (event.type === "chunk") {
              setStreamState(p => ({
                ...p,
                sections: {
                  ...p.sections,
                  [event.key]: {
                    ...p.sections[event.key],
                    buffer: (p.sections[event.key]?.buffer ?? "") + event.content,
                  },
                },
              }));
            }

            if (event.type === "section_done") {
              const result: SectionResult = {
                key: event.key,
                label: SECTION_LABELS[event.key] ?? event.key,
                agent: event.agent,
                data: (event.data as Record<string, unknown>) ?? {},
                rawContent: event.fullContent,
              };
              finalSections.push(result);
              setSections([...finalSections]);
              setStreamState(p => ({
                ...p,
                activeSection: null,
                sections: {
                  ...p.sections,
                  [event.key]: { ...p.sections[event.key], data: result.data, agent: event.agent, done: true },
                },
              }));
            }

            if (event.type === "done") {
              setIsGenerating(false);
            }
          } catch {}
        }
      }
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de contacter l'API", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const getSectionResult = (key: string) =>
    sections.find(s => s.key === key);

  const getSectionStream = (key: string) =>
    streamState.sections[key] ?? { buffer: "", data: {}, done: false, agent: "" };

  const isSectionActive = (key: string) =>
    streamState.activeSection === key;

  const isSectionStreaming = (key: string) =>
    isSectionActive(key) || (!getSectionStream(key).done && streamState.activeSection !== null);

  return (
    <div className="space-y-6">
      {/* Form card */}
      <Card className="bg-card/40 border-green-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-green-400">Brief — Upsell & Cross-sell Kit</CardTitle>
          <CardDescription>Définissez votre produit pour générer vos stratégies de maximisation du panier.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Brand name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nom de la marque <span className="text-red-400">*</span>
                </label>
                <Input
                  {...form.register("brand_name")}
                  placeholder="ex: LUXEOR"
                  className="bg-background/50 border-white/10 focus:border-green-500/40 h-9 text-sm"
                />
                {form.formState.errors.brand_name && (
                  <p className="text-xs text-red-400">{form.formState.errors.brand_name.message}</p>
                )}
              </div>

              {/* Product name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Produit principal <span className="text-red-400">*</span>
                </label>
                <Input
                  {...form.register("product_name")}
                  placeholder="ex: Montre Élégance Or Rose"
                  className="bg-background/50 border-white/10 focus:border-green-500/40 h-9 text-sm"
                />
                {form.formState.errors.product_name && (
                  <p className="text-xs text-red-400">{form.formState.errors.product_name.message}</p>
                )}
              </div>

              {/* Sector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Secteur</label>
                <select
                  {...form.register("sector")}
                  className="w-full h-9 px-3 rounded-md bg-background/50 border border-white/10 focus:border-green-500/40 text-sm text-foreground outline-none"
                >
                  {SECTORS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>

              {/* Tone */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ton</label>
                <select
                  {...form.register("tone")}
                  className="w-full h-9 px-3 rounded-md bg-background/50 border border-white/10 focus:border-green-500/40 text-sm text-foreground outline-none"
                >
                  {TONES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Prix du produit (€)
                </label>
                <Input
                  {...form.register("product_price")}
                  type="number"
                  min={1}
                  placeholder="299"
                  className="bg-background/50 border-white/10 focus:border-green-500/40 h-9 text-sm"
                />
              </div>

              {/* Features */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Caractéristiques (séparées par des virgules)
                </label>
                <Input
                  {...form.register("product_features")}
                  placeholder="ex: or rose, verre saphir, mouvement suisse"
                  className="bg-background/50 border-white/10 focus:border-green-500/40 h-9 text-sm"
                />
              </div>

              {/* Values */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Valeurs de marque (séparées par des virgules)
                </label>
                <Input
                  {...form.register("values")}
                  placeholder="ex: élégance, exclusivité, durabilité"
                  className="bg-background/50 border-white/10 focus:border-green-500/40 h-9 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isGenerating}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-semibold"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Génération en cours...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Générer l'Upsell Kit
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {SECTION_ORDER.map((key) => {
              const result = getSectionResult(key);
              const stream = getSectionStream(key);
              const isActive = isSectionActive(key);
              const isPending = !stream.done && !isActive && streamState.activeSection !== null && !result;
              const isWaiting = !result && !stream.buffer && !isGenerating;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: SECTION_ORDER.indexOf(key) * 0.05 }}
                >
                  <Card className={`bg-gradient-to-br ${SECTION_COLORS[key]} border`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            key === "cross_sell" ? "bg-green-500/15 text-green-400" :
                            key === "bundles" ? "bg-yellow-500/15 text-yellow-400" :
                            key === "upsell_copy" ? "bg-pink-500/15 text-pink-400" :
                            "bg-blue-500/15 text-blue-400"
                          }`}>
                            {SECTION_ICONS[key]}
                          </div>
                          <div>
                            <CardTitle className="text-sm">{SECTION_LABELS[key]}</CardTitle>
                            {(result?.agent || stream.agent) && (
                              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                                Agent: {result?.agent || stream.agent}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                              Génération...
                            </span>
                          )}
                          {stream.done && (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <Check className="w-3 h-3" /> Prêt
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {key === "cross_sell" && (
                        <CrossSellView
                          data={result?.data ?? stream.data}
                          streamBuffer={stream.buffer}
                          streaming={isActive}
                          isActive={isActive}
                        />
                      )}
                      {key === "bundles" && (
                        <BundlesView
                          data={result?.data ?? stream.data}
                          streamBuffer={stream.buffer}
                          streaming={isActive}
                          isActive={isActive}
                        />
                      )}
                      {key === "upsell_copy" && (
                        <UpsellCopyView
                          data={result?.data ?? stream.data}
                          streamBuffer={stream.buffer}
                          streaming={isActive}
                          isActive={isActive}
                        />
                      )}
                      {key === "email_sequences" && (
                        <EmailSequencesView
                          data={result?.data ?? stream.data}
                          streamBuffer={stream.buffer}
                          streaming={isActive}
                          isActive={isActive}
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
