import { Router } from "express";
import auth from "../../middleware/auth";
import upload from "../../middleware/fileUpload";
import validateZodSchema from "../../middleware/validateZodSchema";
import { streamValidation, chatValidation } from "./stream.validation";
import { streamControllers, streamChatControllers } from "./stream.controller";

const router = Router();

// ==================== STREAM LIFECYCLE ====================

/**
 * 🔴 START LIVE STREAM (Go Live)
 * POST /api/v1/streams/go-live
 * Purpose: Creator streams শুরু করবে (title, thumbnail, settings সহ)
 * Auth: Creator only
 * Body: title, description, thumbnail (file), categoryId, isPublic, whoCanMessage, isMature
 */
router.post(
  "/go-live",
  auth("creator"),
  upload.single("thumbnail"),
  validateZodSchema(streamValidation.createStreamSchema),
  streamControllers.startLive,
);

/**
 * ⚫ END LIVE STREAM (Stop Stream)
 * PATCH /api/v1/streams/:id/stop-live
 * Purpose: Creator stream বন্ধ করবে (optional: recording URL দিয়ে)
 * Auth: Creator only (must own the stream)
 * Body: recordingUrl, playbackUrl, durationSeconds (all optional)
 */
router.patch(
  "/:id/stop-live",
  auth("creator"),
  validateZodSchema(streamValidation.endStreamSchema),
  streamControllers.endLive,
);

/**
 * ⚫ END LIVE STREAM (Stop Stream)
 * PATCH /api/v1/streams/:id/stop-live
 * Purpose: Creator stream বন্ধ করবে (optional: recording URL দিয়ে)
 * Auth: Creator only (must own the stream)
 * Body: recordingUrl, playbackUrl, durationSeconds (all optional)
 */
router.patch(
  "/:id/stop-live",
  auth("creator"),
  validateZodSchema(streamValidation.endStreamSchema),
  streamControllers.endLive,
);

/**
 * ✏️ UPDATE STREAM SETTINGS
 * PATCH /api/v1/streams/:id/settings
 * Purpose: Live stream চলাকালীন settings update (title, privacy, etc.)
 * Auth: Creator only (must own the stream)
 * Body: title, description, thumbnail, isPublic, whoCanMessage, isMature (all optional)
 */
router.patch(
  "/:id/settings",
  auth("creator"),
  upload.single("thumbnail"),
  validateZodSchema(streamValidation.updateStreamSchema),
  streamControllers.updateStream,
);

// ==================== DISCOVER STREAMS ====================

/**
 * 🎬 GET IVS INGEST CONFIG (For Web Broadcast)
 * GET /api/v1/streams/ingest-config
 * Purpose: Creator web broadcast এর জন্য IVS ingest endpoint + stream key
 * Auth: Creator only
 */
router.get(
  "/ingest-config",
  auth("creator"),
  streamControllers.getIngestConfig,
);

// ==================== CHAT ROUTES ====================

// Get chat messages (public)
router.get(
  "/:id/chat",
  validateZodSchema(chatValidation.getMessages),
  streamChatControllers.getChatMessages,
);

// Send a chat message (auth required)
router.post(
  "/:id/chat",
  auth(),
  validateZodSchema(chatValidation.sendMessage),
  streamChatControllers.postChatMessage,
);

// Delete a chat message (owner only)
router.delete(
  "/:id/chat/:messageId",
  auth("creator"),
  streamChatControllers.deleteChatMessage,
);

/**
 * 🔴 GET LIVE STREAMS (Currently Broadcasting)
 * GET /api/v1/streams/currently-live
 * Purpose: এখন যেসব stream LIVE আছে তার list (public feed)
 * Auth: Not required
 * Query: page, limit, categoryId, search
 */
router.get("/currently-live", streamControllers.getLiveStreams);

/**
 * 📹 GET RECORDED STREAMS (Past Streams with Recordings)
 * GET /api/v1/streams/recordings
 * Purpose: যেসব stream শেষ হয়েছে এবং recording আছে
 * Auth: Not required
 * Query: page, limit, creatorId, categoryId, search
 */
router.get("/recordings", streamControllers.getRecordedStreams);

/**
 * 📊 GET MY STREAMS (Creator's Own Streams)
 * GET /api/v1/streams/my-streams
 * Purpose: Creator নিজের সব stream দেখবে (LIVE/OFFLINE/SCHEDULED)
 * Auth: Creator only
 * Query: page, limit, status (LIVE|OFFLINE|SCHEDULED)
 */
router.get("/my-streams", auth("creator"), streamControllers.getCreatorStreams);

/**
 * ❤️ GET MY LIKED STREAMS (Viewer's Liked Streams)
 * GET /api/v1/streams/my-liked
 * Purpose: User নিজের liked streams দেখবে
 * Auth: Required (any authenticated user)
 * Query: page, limit
 */
router.get("/my-liked", auth(), streamControllers.getLikedStreams);

// ==================== VIEWER INTERACTIONS ====================

/**
 * 👁️ JOIN STREAM (Increment Viewer Count)
 * POST /api/v1/streams/:id/join
 * Purpose: Viewer stream e join করেছে (view count বাড়াবে)
 * Auth: Optional (authenticated users tracked for analytics)
 */
router.post("/:id/join", streamControllers.incrementViewCount);

/**
 * 👋 LEAVE STREAM (Decrement Viewer Count)
 * DELETE /api/v1/streams/:id/leave
 * Purpose: Viewer stream থেকে চলে গেছে (viewer count কমাবে)
 * Auth: Not required
 */
router.delete("/:id/leave", streamControllers.decrementViewCount);

/**
 * ❤️ LIKE/UNLIKE STREAM
 * POST /api/v1/streams/:id/like
 * Purpose: Stream like/unlike toggle করা
 * Auth: Required (any authenticated user)
 */
router.post("/:id/like", auth(), streamControllers.toggleLike);

/**
 * 👎 DISLIKE/REMOVE DISLIKE STREAM
 * POST /api/v1/streams/:id/dislike
 * Purpose: Stream dislike/remove dislike toggle করা
 * Auth: Required (any authenticated user)
 */
router.post("/:id/dislike", auth(), streamControllers.toggleDislike);

// ==================== ANALYTICS & RECORDINGS ====================

/**
 * 📊 GET STREAM ANALYTICS (Performance Stats)
 * GET /api/v1/streams/:id/analytics
 * Purpose: Creator নিজের stream এর detailed analytics দেখবে
 * Auth: Creator only (must own the stream)
 */
router.get(
  "/:id/analytics",
  auth("creator"),
  streamControllers.getStreamAnalytics,
);

/**
 * 🎬 GET STREAM RECORDING (Watch Recording)
 * GET /api/v1/streams/:id/watch
 * Purpose: Recorded stream এর video URL পাওয়া (playback এর জন্য)
 * Auth: Not required
 */
router.get("/:id/watch", streamControllers.getStreamRecording);

/**
 * 🎬 GET PLAYBACK URL ONLY
 * GET /api/v1/streams/:id/playback
 * Purpose: খালি HLS playback URL পাওয়া (direct video player integration এর জন্য)
 * Auth: Not required
 */
router.get("/:id/playback", streamControllers.getPlaybackUrl);

/**
 * 📤 UPLOAD STREAM RECORDING (Save to S3)
 * POST /api/v1/streams/:id/upload-recording
 * Purpose: Stream শেষে recording file S3 এ upload করা
 * Auth: Creator only (must own the stream)
 * Body: recording (video file - multipart/form-data)
 */
router.post(
  "/:id/upload-recording",
  auth("creator"),
  upload.single("recording"),
  streamControllers.uploadRecording,
);

// ==================== STREAM DETAILS ====================

/**
 * 📺 GET STREAM BY ID (Full Details)
 * GET /api/v1/streams/:id
 * Purpose: একটা specific stream এর complete info (creator, analytics, status)
 * Auth: Not required
 */
// Place after more specific routes to avoid catching them
router.get("/:id", streamControllers.getStreamById);

export const streamRoutes = router;
