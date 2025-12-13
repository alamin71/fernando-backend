import { Router } from "express";
import adminAuth from "../../middleware/adminAuth";
import { settingsControllers } from "./settings.controller";
import validateRequest from "../../middleware/validateRequest";
import { settingsValidation } from "./settings.validation";

const router = Router();

/**
 * POST /api/v1/admin/settings/privacy-policy
 * Update privacy policy content
 * Admin authentication required
 */
router.post(
  "/privacy-policy",
  adminAuth,
  validateRequest(settingsValidation.updateContentValidation),
  settingsControllers.updatePrivacyPolicy
);

/**
 * POST /api/v1/admin/settings/terms-and-conditions
 * Update terms and conditions content
 * Admin authentication required
 */
router.post(
  "/terms-and-conditions",
  adminAuth,
  validateRequest(settingsValidation.updateContentValidation),
  settingsControllers.updateTermsAndConditions
);

/**
 * GET /api/v1/admin/settings/privacy-policy
 * Get privacy policy content
 * Public endpoint
 */
router.get("/privacy-policy", settingsControllers.getPrivacyPolicy);

/**
 * GET /api/v1/admin/settings/terms-and-conditions
 * Get terms and conditions content
 * Public endpoint
 */
router.get("/terms-and-conditions", settingsControllers.getTermsAndConditions);

/**
 * GET /api/v1/admin/settings
 * Get all settings (privacy policy + terms and conditions)
 * Public endpoint
 */
router.get("/", settingsControllers.getAllSettings);

export const settingsRoutes = router;
