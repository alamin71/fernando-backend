import { Router } from "express";
import auth from "../../middleware/auth";
import upload from "../../middleware/fileUpload";
import validateZodSchema from "../../middleware/validateZodSchema";
import { streamValidation } from "./stream.validation";
import { streamControllers } from "./stream.controller";

const router = Router();

/**
 * POST /api/v1/streams/start
 * Creator starts a live stream
 * Auth required
 */
router.post(
  "/start",
  auth("creator"),
  upload.single("thumbnail"),
  validateZodSchema(streamValidation.createStreamSchema),
  streamControllers.startLive
);

/**
 * PATCH /api/v1/streams/:id/end
 * Creator ends their live stream
 * Auth required
 */
router.patch(
  "/:id/end",
  auth("creator"),
  validateZodSchema(streamValidation.endStreamSchema),
  streamControllers.endLive
);

/**
 * GET /api/v1/streams/:id
 * Get stream details with analytics
 */
// Place after more specific routes to avoid catching them
router.get("/:id", streamControllers.getStreamById);

/**
 * GET /api/v1/streams/live
 * Get all live streams (for viewers)
 * Supports filtering by category and search
 */
router.get("/live", streamControllers.getLiveStreams);

/**
 * GET /api/v1/streams/my-streams
 * Get creator's all streams
 * Auth required
 */
router.get("/my-streams", auth("creator"), streamControllers.getCreatorStreams);

export const streamRoutes = router;
