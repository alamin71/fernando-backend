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

/**
 * PATCH /api/v1/streams/:id
 * Update stream settings
 * Auth required
 */
router.patch(
  "/:id",
  auth("creator"),
  upload.single("thumbnail"),
  validateZodSchema(streamValidation.updateStreamSchema),
  streamControllers.updateStream
);

/**
 * POST /api/v1/streams/:id/view
 * Increment view count when viewer joins
 */
router.post("/:id/view", streamControllers.incrementViewCount);

/**
 * DELETE /api/v1/streams/:id/view
 * Decrement viewer count when viewer leaves
 */
router.delete("/:id/view", streamControllers.decrementViewCount);

/**
 * POST /api/v1/streams/:id/like
 * Toggle like on stream
 * Auth required
 */
router.post("/:id/like", auth("creator"), streamControllers.toggleLike);

/**
 * GET /api/v1/streams/:id/analytics
 * Get stream analytics (creator only)
 * Auth required
 */
router.get(
  "/:id/analytics",
  auth("creator"),
  streamControllers.getStreamAnalytics
);

/**
 * GET /api/v1/streams/:id
 * Get stream details with analytics
 */
// Place after more specific routes to avoid catching them
router.get("/:id", streamControllers.getStreamById);

export const streamRoutes = router;
