/**
 * ROUTE — /api/governance/profiles
 *
 * Expose la liste des profils sectoriels chargés pour que le frontend
 * puisse afficher dynamiquement quel profil est actif.
 */

import { Router } from "express";
import { listSectorProfiles } from "../governance/sector-engine";
import { getPositioningLock } from "../positioning/positioning-lock";
import { getMemoryProfile } from "../memory/memory-profile-builder";

const router = Router();

/**
 * GET /api/governance/profiles
 * Retourne la liste des profils sectoriels disponibles.
 */
router.get("/governance/profiles", (_req, res) => {
  const profiles = listSectorProfiles().map((p) => ({
    id: p.id,
    label: p.label,
    regulation: p.regulation,
    sector: p.sector,
    region: p.region,
    claim_packs: p.claim_packs,
    tone: p.tone_constraints,
    requires_wcag: p.requires_wcag_validation,
    requires_price_lock: p.requires_price_lock,
    mandatory_disclaimers_count: p.mandatory_disclaimers.length,
  }));

  res.json({ profiles, total: profiles.length });
});

/**
 * GET /api/governance/status
 * Résumé du statut de gouvernance : profil actif, mémoire, positioning lock.
 */
router.get("/governance/status", (req, res) => {
  const brandId = (req.query["brand_id"] as string) || "default";
  const profiles = listSectorProfiles();
  const posLock = getPositioningLock(brandId);
  const memProfile = getMemoryProfile(brandId);

  res.json({
    profiles_loaded: profiles.length,
    positioning_lock_active: posLock !== null,
    archetype: posLock?.archetype ?? null,
    memory_profile: memProfile,
    pipeline_version: "3.0",
  });
});

export default router;
