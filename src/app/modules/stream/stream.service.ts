import { Stream } from "./stream.model";
import { StreamAnalytics } from "./streamAnalytics.model";
import { User } from "../user/user.model";
import AppError from "../../../errors/AppError";
import httpStatus from "http-status";
import crypto from "crypto";
import { StreamChat } from "./streamChat.model";
import {
  IvsClient,
  ListRecordingConfigurationsCommand,
  ListStreamsCommand,
} from "@aws-sdk/client-ivs";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import config from "../../../config";

const generateStreamKey = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

// Initialize IVS Client
const ivsClient = new IvsClient({
  region: config.aws.region || "ap-south-1",
  credentials: {
    accessKeyId: config.aws.accessKeyId || "",
    secretAccessKey: config.aws.secretAccessKey || "",
  },
});

// Initialize S3 Client
const s3Client = new S3Client({
  region: config.aws.region || "ap-south-1",
  credentials: {
    accessKeyId: config.aws.accessKeyId || "",
    secretAccessKey: config.aws.secretAccessKey || "",
  },
});

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
  },
) => {
  // Verify creator exists and is active
  const creator = await User.findById(creatorId);
  if (!creator) {
    throw new AppError(httpStatus.NOT_FOUND, "Creator not found");
  }

  // Check if creator already has an active LIVE stream
  const existingLiveStream = await Stream.findOne({
    creatorId,
    status: "LIVE",
  });

  if (existingLiveStream) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You already have an active live stream",
    );
  }

  // Create stream
  // Database streamKey: random unique key for tracking (not used for actual streaming)
  // IVS streamKey: from config (used in OBS)
  const dbStreamKey = generateStreamKey();

  // Get IVS config
  const playbackUrl = config.ivs.playbackUrl || "";
  const ingestEndpoint = config.ivs.ingestEndpoint || "";
  const ivsStreamKey = config.ivs.streamKey || dbStreamKey;

  const stream = await Stream.create({
    creatorId,
    title: payload.title,
    description: payload.description || "",
    categoryId: payload.categoryId || null,
    thumbnail: payload.thumbnail || "",
    streamKey: dbStreamKey,
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
    playbackUrl: playbackUrl, // Save playback URL to database
  });

  // Update creator stats
  await User.findByIdAndUpdate(
    creatorId,
    {
      $inc: { "creatorStats.totalStreams": 1 },
    },
    { new: true },
  );

  return {
    streamId: stream._id,
    streamKey: ivsStreamKey,
    title: stream.title,
    description: stream.description,
    categoryId: stream.categoryId,
    thumbnail: stream.thumbnail,
    status: stream.status,
    isPublic: stream.isPublic,
    whoCanMessage: stream.whoCanMessage,
    isMature: stream.isMature,
    startedAt: stream.startedAt,

    // For creator (OBS/streaming software)
    ingestEndpoint,

    // For viewers (public watch URL)
    playbackUrl,
    watchUrl: `/watch/${stream._id}`, // Frontend route
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
  },
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

  // Auto-detect recording path from S3 if not provided
  if (!payload?.recordingUrl && stream.startedAt) {
    const channelId = config.ivs.channelArn?.split("/").pop() || "2DmwQzILLrtf";
    const accountId = "504956988903";
    const startDate = new Date(stream.startedAt);

    // Try to find actual recording in S3 (with session folder)
    const actualPath = await findRecordingPath(accountId, channelId, startDate);

    if (actualPath) {
      updateData.recordingUrl = actualPath;
    } else {
      // Fallback: approximate path (may be incomplete)
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, "0");
      const day = String(startDate.getDate()).padStart(2, "0");
      const hour = String(startDate.getHours()).padStart(2, "0");
      const minute = String(startDate.getMinutes()).padStart(2, "0");
      updateData.recordingUrl = `/ivs/v1/${accountId}/${channelId}/${year}/${month}/${day}/${hour}/${minute}`;
    }
  } else if (stream.startedAt) {
    // Compute duration from start/ended timestamps if not provided
    updateData.durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - stream.startedAt.getTime()) / 1000),
    );
  }

  const updatedStream = await Stream.findByIdAndUpdate(streamId, updateData, {
    new: true,
  });

  return {
    streamId: updatedStream?._id,
    status: updatedStream?.status,
    endedAt: updatedStream?.endedAt,
    recordingUrl: updatedStream?.recordingUrl,
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
  },
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

// Update stream settings
const updateStream = async (
  streamId: string,
  creatorId: string,
  payload: Partial<{
    title: string;
    description: string;
    categoryId: string;
    thumbnail: string;
    isPublic: boolean;
    whoCanMessage: "everyone" | "followers";
    isMature: boolean;
  }>,
) => {
  const stream = await Stream.findById(streamId);

  if (!stream) {
    throw new AppError(httpStatus.NOT_FOUND, "Stream not found");
  }

  if (stream.creatorId.toString() !== creatorId) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized");
  }

  const updatedStream = await Stream.findByIdAndUpdate(streamId, payload, {
    new: true,
    runValidators: true,
  })
    .populate("creatorId", "username channelName image")
    .populate("categoryId", "name");

  return updatedStream;
};

// Increment view count and return enriched stream details (similar to getStreamById)
const incrementViewCount = async (streamId: string, userId?: string) => {
  const stream = await Stream.findById(streamId);

  if (!stream) {
    throw new AppError(httpStatus.NOT_FOUND, "Stream not found");
  }

  if (stream.status !== "LIVE") {
    throw new AppError(httpStatus.BAD_REQUEST, "Stream is not live");
  }

  // Update stream stats
  await Stream.findByIdAndUpdate(
    streamId,
    {
      $inc: { totalViews: 1, currentViewers: 1 },
      $max: { peakViewers: (stream.currentViewers || 0) + 1 },
    },
    { new: true },
  );

  // Update analytics
  await StreamAnalytics.findOneAndUpdate(
    { streamId },
    {
      $inc: { viewCount: 1, uniqueViewers: userId ? 1 : 0 },
      $max: {
        peakConcurrentViewers: (stream.currentViewers || 0) + 1,
      },
    },
    { upsert: true },
  );

  // Re-fetch enriched stream details for response (same shape as getStreamById)
  const populatedStream = await Stream.findById(streamId)
    .populate("creatorId", "username channelName image creatorStats")
    .populate("categoryId", "name");

  const analytics = await StreamAnalytics.findOne({ streamId });

  return {
    stream: populatedStream,
    analytics,
  };
};

// Decrement viewer count (when viewer leaves) and return enriched payload
const decrementViewCount = async (streamId: string) => {
  const stream = await Stream.findById(streamId);

  if (!stream) {
    throw new AppError(httpStatus.NOT_FOUND, "Stream not found");
  }

  // Drop viewer count but never below zero
  await Stream.findByIdAndUpdate(streamId, {
    $inc: { currentViewers: -1 },
    $max: { currentViewers: 0 },
  });

  // Return same enriched shape as join/getStreamById
  const populatedStream = await Stream.findById(streamId)
    .populate("creatorId", "username channelName image creatorStats")
    .populate("categoryId", "name");

  const analytics = await StreamAnalytics.findOne({ streamId });

  return {
    stream: populatedStream,
    analytics,
  };
};

// Toggle like on stream
const toggleLike = async (streamId: string, userId: string) => {
  const stream = await Stream.findById(streamId);

  if (!stream) {
    throw new AppError(httpStatus.NOT_FOUND, "Stream not found");
  }

  // Check if user already liked this stream
  const user = await User.findById(userId);
  const hasLiked = user?.likedStreams?.includes(streamId);

  if (hasLiked) {
    // Unlike
    await User.findByIdAndUpdate(userId, {
      $pull: { likedStreams: streamId },
    });
    await Stream.findByIdAndUpdate(streamId, {
      $inc: { totalLikes: -1 },
      $max: { totalLikes: 0 },
    });
    await StreamAnalytics.findOneAndUpdate(
      { streamId },
      { $inc: { likes: -1 }, $max: { likes: 0 } },
    );

    return { liked: false, totalLikes: Math.max(0, stream.totalLikes - 1) };
  } else {
    // Like
    await User.findByIdAndUpdate(userId, {
      $addToSet: { likedStreams: streamId },
    });
    await Stream.findByIdAndUpdate(streamId, {
      $inc: { totalLikes: 1 },
    });
    await StreamAnalytics.findOneAndUpdate(
      { streamId },
      { $inc: { likes: 1 } },
      { upsert: true },
    );

    return { liked: true, totalLikes: stream.totalLikes + 1 };
  }
};

// Get user's liked streams
const getLikedStreams = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
) => {
  const skip = (page - 1) * limit;

  // Get user and their liked streams
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const likedStreamIds = user.likedStreams || [];

  // Get total count
  const total = likedStreamIds.length;

  // Get paginated liked streams
  const streams = await Stream.find({
    _id: { $in: likedStreamIds },
  })
    .populate("creatorId", "name email profilePhoto")
    .populate("categoryId", "name")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return {
    streams,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get stream analytics
const getStreamAnalytics = async (streamId: string, creatorId: string) => {
  const stream = await Stream.findById(streamId);

  if (!stream) {
    throw new AppError(httpStatus.NOT_FOUND, "Stream not found");
  }

  if (stream.creatorId.toString() !== creatorId) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized");
  }

  const analytics = await StreamAnalytics.findOne({ streamId });

  return {
    streamId: stream._id,
    title: stream.title,
    status: stream.status,
    startedAt: stream.startedAt,
    endedAt: stream.endedAt,
    durationSeconds: stream.durationSeconds,
    currentViewers: stream.currentViewers,
    peakViewers: stream.peakViewers,
    totalViews: stream.totalViews,
    totalLikes: stream.totalLikes,
    totalComments: stream.totalComments,
    analytics: analytics || {},
  };
};

// Helper: Generate playback URL from recording URL
const generatePlaybackUrl = (recordingUrl: string): string => {
  if (!recordingUrl) return "";

  // If it's already a full S3 URL, return as is
  if (recordingUrl.includes("s3") || recordingUrl.includes("amazonaws")) {
    return recordingUrl;
  }

  // If it's a relative IVS path, construct full S3 URL
  const bucket = config.aws.bucket || "fernando-buckets";
  const region = config.aws.region || "us-east-1";

  if (recordingUrl.startsWith("/")) {
    return `https://${bucket}.s3.${region}.amazonaws.com${recordingUrl}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${recordingUrl}`;
};

// Helper: Find actual IVS recording path in S3
const findRecordingPath = async (
  accountId: string,
  channelId: string,
  startDate: Date,
): Promise<string | null> => {
  try {
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, "0");
    const day = String(startDate.getDate()).padStart(2, "0");
    const hour = String(startDate.getHours()).padStart(2, "0");
    const minute = String(startDate.getMinutes()).padStart(2, "0");

    const prefix = `ivs/v1/${accountId}/${channelId}/${year}/${month}/${day}/${hour}/${minute}/`;
    const bucket = config.aws.bucket || "fernando-buckets";

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 10,
    });

    const response = await s3Client.send(command);

    // Find master.m3u8 file
    const masterFile = response.Contents?.find((obj) =>
      obj.Key?.endsWith("/media/hls/master.m3u8"),
    );

    if (masterFile?.Key) {
      // Extract session folder path (remove /media/hls/master.m3u8)
      const sessionPath = masterFile.Key.replace("/media/hls/master.m3u8", "");
      return `/${sessionPath}`;
    }

    return null;
  } catch (error) {
    console.error("Failed to find recording path:", error);
    return null;
  }
};

// Get recorded/archived streams (completed streams with recordings)
const getRecordedStreams = async (filters: {
  page: number;
  limit: number;
  creatorId?: string;
  categoryId?: string;
  search?: string;
}) => {
  const { page, limit, creatorId, categoryId, search } = filters;

  const filterObj: any = {
    status: "OFFLINE",
    recordingUrl: { $exists: true, $ne: "" }, // Only streams with recordings
  };

  if (creatorId) {
    filterObj.creatorId = creatorId;
  }

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
    .sort({ endedAt: -1 }) // Latest ended streams first
    .lean();

  // Add playbackUrl to each stream
  const streamsWithPlayback = streams.map((stream: any) => ({
    ...stream,
    playbackUrl: stream.recordingUrl
      ? `${generatePlaybackUrl(stream.recordingUrl)}/media/hls/master.m3u8`
      : "",
  }));

  const total = await Stream.countDocuments(filterObj);

  return {
    streams: streamsWithPlayback,
    total,
    page,
    limit,
  };
};

// Get recording URL for a specific stream
const getStreamRecording = async (streamId: string) => {
  const stream = await Stream.findById(streamId)
    .populate("creatorId", "username channelName image")
    .populate("categoryId", "name")
    .select("-streamKey");

  if (!stream) {
    throw new AppError(httpStatus.NOT_FOUND, "Stream not found");
  }

  if (!stream.recordingUrl) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Recording not available for this stream",
    );
  }

  const playbackUrl = stream.recordingUrl
    ? `${generatePlaybackUrl(stream.recordingUrl)}/media/hls/master.m3u8`
    : "";

  return {
    streamId: stream._id,
    title: stream.title,
    description: stream.description,
    thumbnail: stream.thumbnail,
    recordingUrl: stream.recordingUrl,
    playbackUrl,
    durationSeconds: stream.durationSeconds,
    totalViews: stream.totalViews,
    totalLikes: stream.totalLikes,
    startedAt: stream.startedAt,
    endedAt: stream.endedAt,
    creatorId: stream.creatorId,
    categoryId: stream.categoryId,
  };
};

export const streamService = {
  startLive,
  endLive,
  getStreamById,
  getLiveStreams,
  getCreatorStreams,
  updateStream,
  incrementViewCount,
  decrementViewCount,
  toggleLike,
  getLikedStreams,
  getStreamAnalytics,
  getRecordedStreams,
  getStreamRecording,
};

// ================= CHAT SERVICES =================
export const streamChatService = {
  async sendMessage(streamId: string, userId: string, message: string) {
    // basic guard: stream must be live or recently ended
    const stream = await Stream.findById(streamId).select(
      "whoCanMessage status",
    );
    if (!stream) throw new AppError(httpStatus.NOT_FOUND, "Stream not found");

    // Optional: enforce followers-only messaging
    // Skipped for MVP; can be added by checking User followers list

    const doc = await StreamChat.create({
      streamId,
      userId,
      message,
      messageType: "TEXT",
    });
    return await StreamChat.findById(doc._id)
      .populate("userId", "username image")
      .lean();
  },

  async getMessages(streamId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      StreamChat.find({ streamId })
        .populate("userId", "username image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StreamChat.countDocuments({ streamId }),
    ]);

    return { items, total, page, limit };
  },

  async deleteMessage(
    streamId: string,
    messageId: string,
    requesterId: string,
  ) {
    const stream = await Stream.findById(streamId).select("creatorId");
    if (!stream) throw new AppError(httpStatus.NOT_FOUND, "Stream not found");

    // Only stream owner can delete for now
    if (String(stream.creatorId) !== String(requesterId)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Only owner can delete chat messages",
      );
    }

    await StreamChat.deleteOne({ _id: messageId, streamId });
    return { success: true };
  },
};

// Delete stream (Admin only)
const deleteStream = async (streamId: string) => {
  const stream = await Stream.findById(streamId);

  if (!stream) {
    throw new AppError(httpStatus.NOT_FOUND, "Stream not found");
  }

  // Delete associated data
  await Promise.all([
    StreamChat.deleteMany({ streamId }),
    StreamAnalytics.deleteOne({ streamId }),
    Stream.findByIdAndDelete(streamId),
  ]);

  // Update creator stats
  await User.findByIdAndUpdate(stream.creatorId, {
    $inc: { "creatorStats.totalStreams": -1 },
  });

  return { message: "Stream deleted successfully" };
};

export { deleteStream };
