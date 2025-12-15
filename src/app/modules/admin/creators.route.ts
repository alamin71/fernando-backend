import { Router } from "express";
import adminAuth from "../../middleware/adminAuth";
import { creatorsControllers } from "./creators.controller";

const router = Router();

/**
 * GET /api/v1/admin/creators
 * Get all creators with search, filter, sort, pagination
 * Admin authentication required
 */
router.get("/", adminAuth, creatorsControllers.getAllCreators);

/**
 * GET /api/v1/admin/creators/export
 * Export all creators data
 * Admin authentication required
 */
router.get("/export", adminAuth, creatorsControllers.exportCreators);

/**
 * GET /api/v1/admin/creators/:id
 * Get single creator details
 * Admin authentication required
 */
router.get("/:id", adminAuth, creatorsControllers.getCreatorById);

/**
 * DELETE /api/v1/admin/creators/:id
 * Delete single creator (soft delete)
 * Admin authentication required
 */
router.delete("/:id", adminAuth, creatorsControllers.deleteCreator);

/**
 * POST /api/v1/admin/creators/bulk-delete
 * Delete multiple creators (soft delete)
 * Admin authentication required
 */
router.post("/bulk-delete", adminAuth, creatorsControllers.bulkDeleteCreators);

export const creatorsRoutes = router;
