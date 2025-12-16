import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { streamService } from "./stream.service";
import { uploadToS3 } from "../../../utils/fileHelper";

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

export const streamControllers = {
  startLive,
  endLive,
  getStreamById,
  getLiveStreams,
  getCreatorStreams,
};
