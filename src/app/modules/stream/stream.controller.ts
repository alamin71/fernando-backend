import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { streamService } from "./stream.service";
import { streamChatService } from "./stream.service";
import config from "../../../config";
import {
  uploadToS3,
  uploadStreamRecordingToS3,
} from "../../../utils/fileHelper";

// Start live stream
const startLive = catchAsync(async (req: Request, res: Response) => {
  const creatorId = req.user.id;
  const {
    title,
    description,
    categoryId,
    thumbnail,
    isPublic,
    whoCanMessage,
    isMature,
  } = req.body;

  let resolvedThumbnail = thumbnail;
  if (req.file) {
    const uploaded = await uploadToS3(req.file, "stream-thumbnails/");
    resolvedThumbnail = uploaded?.url || uploaded;
  }

  const result = await streamService.startLive(creatorId, {
    title,
    description,
    categoryId,
    thumbnail: resolvedThumbnail,
    isPublic,
    whoCanMessage,
    isMature,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Stream started successfully",
    data: result,
  });
});

// End live stream
const endLive = catchAsync(async (req: Request, res: Response) => {
  const creatorId = req.user.id;
  const { id } = req.params;
  const { recordingUrl, playbackUrl, durationSeconds } = req.body;

  const result = await streamService.endLive(id, creatorId, {
    recordingUrl,
    playbackUrl,
    durationSeconds,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stream ended successfully",
    data: result,
  });
});

// Get stream by ID
const getStreamById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id; // Optional - if user is authenticated

  const result = await streamService.getStreamById(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stream retrieved successfully",
    data: result,
  });
});

// Get all live streams
const getLiveStreams = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const categoryId = req.query.categoryId as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await streamService.getLiveStreams({
    page,
    limit,
    categoryId,
    search,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Live streams retrieved successfully",
    data: result.streams,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPage: Math.ceil(result.total / result.limit || 1),
    },
  });
});

// Get creator's streams
const getCreatorStreams = catchAsync(async (req: Request, res: Response) => {
  const creatorId = req.user.id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as
    | "LIVE"
    | "OFFLINE"
    | "SCHEDULED"
    | undefined;

  const result = await streamService.getCreatorStreams(creatorId, {
    page,
    limit,
    status,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Creator streams retrieved successfully",
    data: result.streams,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPage: Math.ceil(result.total / result.limit || 1),
    },
  });
});

// Update stream settings
const updateStream = catchAsync(async (req: Request, res: Response) => {
  const creatorId = req.user.id;
  const { id } = req.params;
  const {
    title,
    description,
    categoryId,
    thumbnail,
    isPublic,
    whoCanMessage,
    isMature,
  } = req.body;

  let resolvedThumbnail = thumbnail;
  if (req.file) {
    const uploaded = await uploadToS3(req.file, "stream-thumbnails/");
    resolvedThumbnail = uploaded?.url || uploaded;
  }

  const result = await streamService.updateStream(id, creatorId, {
    title,
    description,
    categoryId,
    thumbnail: resolvedThumbnail,
    isPublic,
    whoCanMessage,
    isMature,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stream updated successfully",
    data: result,
  });
});

// Increment view count
const incrementViewCount = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const result = await streamService.incrementViewCount(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "View count updated",
    data: result,
  });
});

// Decrement viewer count
const decrementViewCount = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await streamService.decrementViewCount(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Viewer count updated",
    data: result,
  });
});

// Toggle like on stream
const toggleLike = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await streamService.toggleLike(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.liked ? "Stream liked" : "Stream unliked",
    data: result,
  });
});

// Toggle dislike on stream
const toggleDislike = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await streamService.toggleDislike(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.disliked ? "Stream disliked" : "Stream dislike removed",
    data: result,
  });
});

// Get user's liked streams
const getLikedStreams = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const result = await streamService.getLikedStreams(
    userId,
    Number(page),
    Number(limit),
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Liked streams retrieved successfully",
    data: result,
  });
});

// Get stream analytics
const getStreamAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const creatorId = req.user.id;

  const result = await streamService.getStreamAnalytics(id, creatorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stream analytics retrieved successfully",
    data: result,
  });
});

// Get all recorded/archived streams
const getRecordedStreams = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const creatorId = req.query.creatorId as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await streamService.getRecordedStreams({
    page,
    limit,
    creatorId,
    categoryId,
    search,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recorded streams retrieved successfully",
    data: result.streams,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPage: Math.ceil(result.total / result.limit || 1),
    },
  });
});

// Get specific stream recording
const getStreamRecording = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await streamService.getStreamRecording(id);

  // Set CORS headers for video playback
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Range",
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stream recording retrieved successfully",
    data: result,
  });
});

// Get playback URL only (for direct video playback)
const getPlaybackUrl = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await streamService.getStreamRecording(id);

  // Set CORS headers for video playback
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Range",
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Playback URL retrieved successfully",
    data: {
      streamId: result.streamId,
      playbackUrl: result.playbackUrl,
      title: result.title,
    },
  });
});

// Upload stream recording to S3
const uploadRecording = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const creatorId = req.user.id;

  if (!req.file) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Recording file is required",
    });
    return;
  }

  // Upload to S3
  const uploaded = await uploadStreamRecordingToS3(req.file, id);

  // Update stream with recording URL
  const result = await streamService.endLive(id, creatorId, {
    recordingUrl: uploaded.url,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recording uploaded successfully",
    data: {
      ...result,
      recordingUrl: uploaded.url,
      recordingId: uploaded.id,
    },
  });
});

// Get IVS Ingest Configuration (for web broadcast)
const getIngestConfig = catchAsync(async (req: Request, res: Response) => {
  const ingestServer = process.env.IVS_INGEST_ENDPOINT;
  const streamKey = process.env.IVS_STREAM_KEY;
  const playbackUrl = process.env.IVS_PLAYBACK_URL;
  const channelArn = process.env.IVS_CHANNEL_ARN;

  if (!ingestServer || !streamKey || !playbackUrl) {
    sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: "IVS configuration not found",
    });
    return;
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "IVS ingest configuration retrieved",
    data: {
      ingestServer,
      streamKey,
      playbackUrl,
      channelArn,
    },
  });
});

// ============== CHAT CONTROLLERS ==============
const postChatMessage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // streamId
  const userId = req.user.id;
  const { message } = req.body;

  const result = await streamChatService.sendMessage(id, userId, message);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Message sent",
    data: result,
  });
});

const getChatMessages = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // streamId
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const result = await streamChatService.getMessages(id, page, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chat messages",
    data: result.items,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPage: Math.ceil(result.total / result.limit || 1),
    },
  });
});

const deleteChatMessage = catchAsync(async (req: Request, res: Response) => {
  const { id, messageId } = req.params; // streamId, messageId
  const requesterId = req.user.id;
  const result = await streamChatService.deleteMessage(
    id,
    messageId,
    requesterId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message deleted",
    data: result,
  });
});

export const streamControllers = {
  startLive,
  endLive,
  getStreamById,
  getLiveStreams,
  getCreatorStreams,
  updateStream,
  incrementViewCount,
  decrementViewCount,
  toggleLike,
  toggleDislike,
  getLikedStreams,
  getStreamAnalytics,
  getRecordedStreams,
  getStreamRecording,
  getPlaybackUrl,
  uploadRecording,
  getIngestConfig,
};

export const streamChatControllers = {
  postChatMessage,
  getChatMessages,
  deleteChatMessage,
};

// Delete stream (Admin only)
const deleteStream = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { deleteStream: deleteStreamService } =
    await import("./stream.service");
  const result = await deleteStreamService(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export { deleteStream };
