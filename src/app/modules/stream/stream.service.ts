import { Stream } from "./stream.model";
import { StreamAnalytics } from "./streamAnalytics.model";
import { User } from "../user/user.model";
import AppError from "../../../errors/AppError";
import httpStatus from "http-status";
import crypto from "crypto";

const generateStreamKey = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

// Start live stream
const startLive = async (
  creatorId: string,
  payload: {
    title: string;
    description?: string;
    categoryId?: string;
    thumbnail?: string;
    isPublic?: boolean;
    whoCanMessage?: "everyone" | "followers";
    isMature?: boolean;
  }
) => {
  // Verify creator exists and is active
  const creator = await User.findById(creatorId);
  if (!creator) {
    throw new AppError(httpStatus.NOT_FOUND, "Creator not found");
  }

  if (creator.status !== "ACTIVE") {
    throw new AppError(httpStatus.FORBIDDEN, "Your account is not active");
  }

  // Check if creator already has an active LIVE stream
  const existingLiveStream = await Stream.findOne({
    creatorId,
    status: "LIVE",
  });

  if (existingLiveStream) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You already have an active live stream"
    );
  }

  // Create stream
  const streamKey = generateStreamKey();
  const stream = await Stream.create({
    creatorId,
    title: payload.title,
    description: payload.description || "",
    categoryId: payload.categoryId || null,
    thumbnail: payload.thumbnail || "",
    streamKey,
    status: "LIVE",
    isPublic: payload.isPublic !== false,
    whoCanMessage: payload.whoCanMessage || "everyone",
    isMature: payload.isMature ?? false,
    startedAt: new Date(),
    currentViewers: 0,
    peakViewers: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  });

  // Create analytics document
  await StreamAnalytics.create({
    streamId: stream._id,
    viewCount: 0,
    watchDuration: 0,
    uniqueViewers: 0,
    peakConcurrentViewers: 0,
    likes: 0,
    comments: 0,
    shares: 0,
  });

  // Update creator stats
  await User.findByIdAndUpdate(
    creatorId,
    {
      $inc: { "creatorStats.totalStreams": 1 },
    },
    { new: true }
  );

  return {
    streamId: stream._id,
    streamKey,
    title: stream.title,
    status: stream.status,
    startedAt: stream.startedAt,
  };
};

// End live stream
const endLive = async (
  streamId: string,
  creatorId: string,
  payload?: {
    recordingUrl?: string;
    playbackUrl?: string;
    durationSeconds?: number;
  }
) => {
  const stream = await Stream.findById(streamId);

  if (!stream) {
    throw new AppError(httpStatus.NOT_FOUND, "Stream not found");
  }

  if (stream.creatorId.toString() !== creatorId) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized");
  }

  if (stream.status !== "LIVE") {
    throw new AppError(httpStatus.BAD_REQUEST, "Stream is not live");
  }

  const endedAt = new Date();

  const updateData: any = {
    status: "OFFLINE",
    endedAt,
  };

  if (payload?.recordingUrl) updateData.recordingUrl = payload.recordingUrl;
  if (payload?.playbackUrl) updateData.playbackUrl = payload.playbackUrl;
  if (typeof payload?.durationSeconds === "number") {
    updateData.durationSeconds = payload.durationSeconds;
  } else if (stream.startedAt) {
    // Compute duration from start/ended timestamps if not provided
    updateData.durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - stream.startedAt.getTime()) / 1000)
    );
  }

  const updatedStream = await Stream.findByIdAndUpdate(streamId, updateData, {
    new: true,
  });

  return {
    streamId: updatedStream?._id,
    status: updatedStream?.status,
    endedAt: updatedStream?.endedAt,
  };
};

// Get stream by ID
const getStreamById = async (streamId: string) => {
  const stream = await Stream.findById(streamId)
    .populate("creatorId", "username channelName image creatorStats")
    .populate("categoryId", "name");

  if (!stream) {
    throw new AppError(httpStatus.NOT_FOUND, "Stream not found");
  }

  const analytics = await StreamAnalytics.findOne({ streamId });

  return {
    stream,
    analytics,
  };
};

// Get all live streams
const getLiveStreams = async (filters: {
  page: number;
  limit: number;
  categoryId?: string;
  search?: string;
}) => {
  const { page, limit, categoryId, search } = filters;

  const filterObj: any = { status: "LIVE", isPublic: true };

  if (categoryId) {
    filterObj.categoryId = categoryId;
  }

  if (search) {
    filterObj.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const streams = await Stream.find(filterObj)
    .populate("creatorId", "username channelName image creatorStats")
    .populate("categoryId", "name")
    .select("-streamKey")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ startedAt: -1 })
    .lean();

  const total = await Stream.countDocuments(filterObj);

  return {
    streams,
    total,
    page,
    limit,
  };
};

// Get creator's streams
const getCreatorStreams = async (
  creatorId: string,
  filters: {
    page: number;
    limit: number;
    status?: "LIVE" | "OFFLINE" | "SCHEDULED";
  }
) => {
  const { page, limit, status } = filters;

  const filterObj: any = { creatorId };

  if (status) {
    filterObj.status = status;
  }

  const streams = await Stream.find(filterObj)
    .populate("categoryId", "name")
    .select("-streamKey")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ startedAt: -1 })
    .lean();

  const total = await Stream.countDocuments(filterObj);

  return {
    streams,
    total,
    page,
    limit,
  };
};

export const streamService = {
  startLive,
  endLive,
  getStreamById,
  getLiveStreams,
  getCreatorStreams,
};
