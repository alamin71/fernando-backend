import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { streamService } from "./stream.service";
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

  const result = await streamService.getStreamById(id);

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

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stream recording retrieved successfully",
    data: result,
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
  getStreamAnalytics,
  getRecordedStreams,
  getStreamRecording,
  uploadRecording,
  getIngestConfig,
};
