/**
 * AI ENGINE CONFIG — Dialog de configuration du moteur AI dual-mode.
 *
 * Mode A : Replit Managed (par défaut, aucune clé requise).
 * Mode B : Professional OpenRouter (BYOK — clé jamais persistée serveur).
 *
 * UX : la clé est saisie en input password, validée via /api/ai-engine/validate,
 * puis stockée en sessionStorage du navigateur uniquement (effacée à la
 * fermeture de l'onglet). Affichage masqué après sauvegarde.
 */

import React, { useEffect, useState } from "react";
import {
  Cpu, Lock, KeyRound, ShieldCheck, ShieldAlert, RefreshCw,
  CheckCircle2, Eye, EyeOff, Trash2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  loadEngineConfig, saveEngineConfig, clearEngineConfig,
  validateOpenRouterKey, OPENROUTER_MODELS, type AIEngineConfig,
} from "@/lib/ai-engine";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function maskKey(k: string): string {
  if (!k) return "";
  if (k.length <= 8) return "•".repeat(k.length);
  return `${k.slice(0, 4)}${"•".repeat(Math.max(8, k.length - 8))}${k.slice(-4)}`;
}

export default function AIEngineConfig({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [current, setCurrent] = useState<AIEngineConfig>(() => loadEngineConfig());

  const [proEnabled, setProEnabled] = useState(false);
  const [model, setModel] = useState<string>(OPENROUTER_MODELS[0].id);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);

  // Sync state when dialog opens
  useEffect(() => {
    if (!open) return;
    const cfg = loadEngineConfig();
    setCurrent(cfg);
    setProEnabled(cfg.mode === "professional_openrouter");
    setModel(cfg.model || OPENROUTER_MODELS[0].id);
    setKeyInput(""); // jamais pré-rempli pour des raisons de sécurité
    setShowKey(false);
  }, [open]);

  const isPro = current.mode === "professional_openrouter";

  async function handleActivate() {
    if (!proEnabled) {
      // Désactivation du mode pro
      clearEngineConfig();
      setCurrent(loadEngineConfig());
      toast({
        title: "Mode Replit Managed activé",
        description: "Les modèles AI sont désormais gérés par AI BRAND OS.",
      });
      onOpenChange(false);
      return;
    }

    const trimmed = keyInput.trim();
    if (!trimmed) {
      toast({
        title: "Clé requise",
        description: "Saisis ta clé OpenRouter pour activer le mode professionnel.",
        variant: "destructive",
      });
      return;
    }

    setValidating(true);
    const result = await validateOpenRouterKey(trimmed);
    setValidating(false);

    if (!result.valid) {
      toast({
        title: "Clé refusée",
        description: result.reason ?? "OpenRouter n'a pas validé cette clé.",
        variant: "destructive",
      });
      return;
    }

    const modelLabel =
      OPENROUTER_MODELS.find((m) => m.id === model)?.label ?? model;

    saveEngineConfig({
      mode: "professional_openrouter",
      model,
      key: trimmed,
      modelLabel,
    });
    setCurrent(loadEngineConfig());
    setKeyInput("");
    toast({
      title: "Mode Professional activé",
      description: `Modèle : ${modelLabel}${result.credit_left != null ? ` · Crédit restant : ${result.credit_left}` : ""}`,
    });
    onOpenChange(false);
  }

  function handleClear() {
    clearEngineConfig();
    setCurrent(loadEngineConfig());
    setProEnabled(false);
    setKeyInput("");
    toast({
      title: "Clé OpenRouter effacée",
      description: "Retour au mode Replit Managed.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-400" />
            Configuration du moteur AI
          </DialogTitle>
          <DialogDescription>
            Choisis comment AI BRAND OS exécute la génération. La gouvernance
            (brand lock, sector engine, compliance, voice, claims) reste
            appliquée quel que soit le mode.
          </DialogDescription>
        </DialogHeader>

        {/* État courant */}
        <div className={`rounded-lg border px-3 py-2.5 text-xs flex items-start gap-2 ${
          isPro
            ? "border-violet-500/30 bg-violet-500/5 text-violet-200"
            : "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
        }`}>
          <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">
              Actif : {isPro
                ? `Professional · ${current.modelLabel ?? current.model}`
                : "Replit Managed"}
            </p>
            {isPro && current.key && (
              <p className="font-mono text-[11px] opacity-80">
                Clé : {maskKey(current.key)}
              </p>
            )}
          </div>
        </div>

        {/* Mode A — Replit Managed */}
        <div className="rounded-lg border border-white/10 bg-white/3 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-sm font-semibold">Replit Managed (par défaut)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Modèles AI gérés directement par AI BRAND OS via l'infrastructure
            Replit. Aucune configuration requise. Idéal pour les workflows
            agence standard.
          </p>
        </div>

        {/* Mode B — Professional OpenRouter */}
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/4 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-sm font-semibold">Professional (OpenRouter)</span>
            </div>
            <Switch
              checked={proEnabled}
              onCheckedChange={setProEnabled}
              data-testid="switch-pro-mode"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Branche ta propre clé OpenRouter pour choisir librement le modèle.
            La clé n'est jamais stockée côté serveur ni loggée — elle reste
            uniquement dans la session de ce navigateur.
          </p>

          {proEnabled && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">
                  Clé OpenRouter
                </label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="sk-or-v1-…"
                    className="pr-9 font-mono text-xs"
                    data-testid="input-openrouter-key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showKey ? "Masquer la clé" : "Afficher la clé"}
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground/70">
                  Obtiens une clé sur openrouter.ai. Format : <span className="font-mono">sk-or-v1-…</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">
                  Modèle
                </label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger data-testid="select-openrouter-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPENROUTER_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 flex items-start gap-2">
                <ShieldAlert className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-amber-200/80 leading-snug">
                  Clé stockée uniquement dans <strong>sessionStorage</strong>{" "}
                  (effacée à la fermeture de l'onglet). Jamais envoyée hors des
                  appels AI BRAND OS.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          {isPro && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
              onClick={handleClear}
              data-testid="button-clear-key"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Effacer la clé
            </Button>
          )}
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={validating}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleActivate}
            disabled={validating}
            className="gap-1.5"
            data-testid="button-activate-engine"
          >
            {validating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            {proEnabled ? "Valider et activer" : "Confirmer Replit Managed"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
