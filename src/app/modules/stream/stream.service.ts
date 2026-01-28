import { Stream } from "./stream.model";
import { StreamAnalytics } from "./streamAnalytics.model";
import { User } from "../user/user.model";
import AppError from "../../../errors/AppError";
import httpStatus from "http-status";
import crypto from "crypto";
import mongoose from "mongoose";
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

// Helper: Extract accountId from IVS Channel ARN
const getAccountIdFromArn = (): string => {
  const arn =
    config.ivs.channelArn ||
    "arn:aws:ivs:us-east-1:504956988903:channel/2DmwQzILLrtf";
  const parts = arn.split(":");
  return parts[4] || "504956988903";
};

// Helper: Extract channelId from IVS Channel ARN
const getChannelIdFromArn = (): string => {
  const arn =
    config.ivs.channelArn ||
    "arn:aws:ivs:us-east-1:504956988903:channel/2DmwQzILLrtf";
  return arn.split("/").pop() || "2DmwQzILLrtf";
};

// Initialize IVS Client
const ivsClient = new IvsClient({
  region: config.aws.region || "us-east-1",
  credentials: {
    accessKeyId: config.aws.accessKeyId || "",
    secretAccessKey: config.aws.secretAccessKey || "",
  },
});

// Initialize S3 Client
const s3Client = new S3Client({
  region: config.aws.region || "us-east-1",
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
    }
    // If recording not found in S3 yet, don't set a fallback URL
    // It will be populated later via webhook or re-fetch when viewing
  }

  // Compute duration from start/ended timestamps if not provided
  if (stream.startedAt) {
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

  // If stream is offline and has no recording URL yet, try to find it in S3
  if (stream.status === "OFFLINE" && !stream.recordingUrl && stream.startedAt) {
    const channelId = getChannelIdFromArn();
    const accountId = getAccountIdFromArn();
    const recordingPath = await findRecordingPath(
      accountId,
      channelId,
      stream.startedAt,
    );

    if (recordingPath) {
      // Update the stream with the found recording path
      await Stream.findByIdAndUpdate(streamId, { recordingUrl: recordingPath });
      stream.recordingUrl = recordingPath;
    }
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

// Helper: Generate signed URL for secure playback
const generateSignedPlaybackUrl = async (
  recordingUrl: string,
  expiresIn: number = 3600,
): Promise<string> => {
  if (!recordingUrl) return "";

  try {
    const bucket = config.aws.bucket || "fernando-buckets";
    const region = config.aws.region || "us-east-1";

    // Normalize the recording URL
    let s3Key = recordingUrl;

    // If it's already a full S3 URL, extract the key
    if (recordingUrl.includes("s3") || recordingUrl.includes("amazonaws")) {
      const urlMatch = recordingUrl.match(/amazonaws\.com\/(.+)/);
      if (urlMatch) {
        s3Key = urlMatch[1];
      }
    }

    // Remove leading slash if present
    s3Key = s3Key.startsWith("/") ? s3Key.substring(1) : s3Key;

    // Construct the HLS master playlist URL
    const masterPlaylistUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}${s3Key.endsWith("/") ? "" : "/"}media/hls/master.m3u8`;

    return masterPlaylistUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    // Fallback to regular URL
    return generatePlaybackUrl(recordingUrl);
  }
};

// Helper: Generate playback URL from recording URL
const generatePlaybackUrl = (recordingUrl: string): string => {
  if (!recordingUrl) return "";

  const bucket = config.aws.bucket || "fernando-buckets";
  const region = config.aws.region || "us-east-1";

  // If it's already a full S3 URL with master.m3u8, return as is
  if (
    recordingUrl.includes("s3") ||
    (recordingUrl.includes("amazonaws") && recordingUrl.includes("master.m3u8"))
  ) {
    return recordingUrl;
  }

  // Remove leading slash if present
  let cleanUrl = recordingUrl.startsWith("/")
    ? recordingUrl.substring(1)
    : recordingUrl;

  // Remove trailing slash if present
  cleanUrl = cleanUrl.endsWith("/")
    ? cleanUrl.substring(0, cleanUrl.length - 1)
    : cleanUrl;

  // Construct full S3 URL with master.m3u8
  if (recordingUrl.includes("amazonaws")) {
    // Already a full URL, just append the playlist file
    return `${cleanUrl}${cleanUrl.endsWith("/") ? "" : "/"}media/hls/master.m3u8`;
  }

  // Relative IVS path
  return `https://${bucket}.s3.${region}.amazonaws.com/${cleanUrl}/media/hls/master.m3u8`;
};

// Helper: Find actual IVS recording path in S3
const findRecordingPath = async (
  accountId: string,
  channelId: string,
  startDate: Date,
): Promise<string | null> => {
  try {
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1);
    const day = String(startDate.getDate());
    const bucket = config.aws.bucket || "fernando-buckets";

    // IVS uses inconsistent path formats - try both zero-padded and non-zero-padded
    const prefixesToTry = [
      // Non-zero-padded (what IVS actually uses most of the time)
      `ivs/v1/${accountId}/${channelId}/${year}/${month}/${day}/`,
      // Zero-padded (for consistency)
      `ivs/v1/${accountId}/${channelId}/${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}/`,
    ];

    for (const datePrefix of prefixesToTry) {
      console.log(`Searching S3 with prefix: ${datePrefix}`);

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: datePrefix,
        MaxKeys: 100,
      });

      const response = await s3Client.send(command);

      // Find any master.m3u8 file (first match)
      const masterFile = response.Contents?.find((obj) =>
        obj.Key?.endsWith("/media/hls/master.m3u8"),
      );

      if (masterFile?.Key) {
        // Extract session folder path (remove /media/hls/master.m3u8)
        const sessionPath = masterFile.Key.replace(
          "/media/hls/master.m3u8",
          "",
        );
        console.log(`✅ Found recording: ${sessionPath}`);
        return `/${sessionPath}`;
      }
    }

    console.log(`❌ No recording found for date: ${year}/${month}/${day}`);
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

  try {
    // Strategy: Get all recordings from S3, then match with database streams
    const bucket = config.aws.bucket || "fernando-buckets";
    const channelId = getChannelIdFromArn();
    const accountId = getAccountIdFromArn();
    const basePrefix = `ivs/v1/${accountId}/${channelId}/`;

    console.log(
      `[getRecordedStreams] Fetching all IVS recordings from: ${basePrefix}`,
    );

    // List all master.m3u8 files in the IVS folder
    const s3Recordings: Array<{ path: string; modifiedAt: Date }> = [];
    let continuationToken: string | undefined;

    // Paginate through S3 to get all recordings
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: basePrefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await s3Client.send(command);

      // Find all master.m3u8 files
      response.Contents?.forEach((obj) => {
        if (obj.Key?.endsWith("/media/hls/master.m3u8")) {
          const sessionPath = obj.Key.replace("/media/hls/master.m3u8", "");
          s3Recordings.push({
            path: `/${sessionPath}`,
            modifiedAt: obj.LastModified || new Date(),
          });
        }
      });

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    console.log(
      `[getRecordedStreams] Found ${s3Recordings.length} recordings in S3`,
    );

    // Sort by modified date descending (newest first)
    s3Recordings.sort(
      (a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime(),
    );

    // Now match S3 recordings with database streams
    const streamDataMap = new Map<string, any>();

    // Get all OFFLINE streams and map them by date
    const allOfflineStreams = await Stream.find({
      status: "OFFLINE",
      isDeleted: false,
    })
      .populate("creatorId", "username channelName image creatorStats")
      .populate("categoryId", "name")
      .select("-streamKey")
      .lean();

    // Create a map of streams by their start date (simple YYYY-MM-DD format)
    const streamsByDate = new Map<string, any[]>();
    allOfflineStreams.forEach((stream: any) => {
      if (stream.startedAt) {
        const date = new Date(stream.startedAt);
        const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
        if (!streamsByDate.has(dateKey)) {
          streamsByDate.set(dateKey, []);
        }
        streamsByDate.get(dateKey)!.push(stream);
      }
    });

    // Build final results by enriching S3 recordings with database data
    const enrichedRecordings = s3Recordings
      .map((recording) => {
        // Try to extract date from recording path
        // Path format: /ivs/v1/{accountId}/{channelId}/{year}/{month}/{day}/{hour}/{minute}/{sessionId}
        const pathParts = recording.path.split("/");
        const year = pathParts[5];
        const month = pathParts[6];
        const day = pathParts[7];
        const hour = pathParts[8];
        const minute = pathParts[9];

        // Try to find matching stream in database
        const dateKey = `${year}/${month}/${day}/${hour}/${minute}`;
        let matchedStream = streamDataMap.get(dateKey)?.[0];

        // If no exact match, try broader search by date
        if (!matchedStream && year && month && day) {
          const dateKeyBroad = `${year}/${month}/${day}`;
          const streamsOnDate = allOfflineStreams.filter((s: any) => {
            const sDate = new Date(s.startedAt);
            return (
              sDate.getFullYear() === parseInt(year) &&
              sDate.getMonth() + 1 === parseInt(month) &&
              sDate.getDate() === parseInt(day)
            );
          });

          if (streamsOnDate.length > 0) {
            // Pick the one closest to the recorded time
            matchedStream = streamsOnDate.reduce((prev: any, curr: any) => {
              const currTime = new Date(curr.startedAt).getTime();
              const prevTime = new Date(prev.startedAt).getTime();
              const recordingTime = recording.modifiedAt.getTime();

              const currDiff = Math.abs(currTime - recordingTime);
              const prevDiff = Math.abs(prevTime - recordingTime);

              return currDiff < prevDiff ? curr : prev;
            });
          }
        }

        // Apply filters
        if (
          creatorId &&
          matchedStream?.creatorId?.toString() !== creatorId.toString()
        ) {
          return null;
        }

        if (
          categoryId &&
          matchedStream?.categoryId?.toString() !== categoryId.toString()
        ) {
          return null;
        }

        if (search && matchedStream) {
          const searchLower = search.toLowerCase();
          const matchesSearch =
            (matchedStream.title &&
              matchedStream.title.toLowerCase().includes(searchLower)) ||
            (matchedStream.description &&
              matchedStream.description.toLowerCase().includes(searchLower));
          if (!matchesSearch) {
            return null;
          }
        }

        // Only return if there's a matched stream in database
        if (!matchedStream) {
          return null;
        }

        // Build the enriched object
        const streamId = matchedStream._id;
        return {
          streamId: streamId?.toString(),
          _id: streamId,
          title: matchedStream.title || "Live Stream",
          description: matchedStream.description || "",
          thumbnail: matchedStream.thumbnail || "",
          recordingUrl: recording.path,
          playbackUrl: generatePlaybackUrl(recording.path),
          durationSeconds: matchedStream.durationSeconds || 0,
          totalViews: matchedStream.totalViews || 0,
          totalLikes: matchedStream.totalLikes || 0,
          startedAt: matchedStream.startedAt || recording.modifiedAt,
          endedAt: matchedStream.endedAt || recording.modifiedAt,
          creatorId: matchedStream.creatorId || null,
          categoryId: matchedStream.categoryId || null,
        };
      })
      .filter((item) => item !== null);

    // Apply pagination
    const paginatedRecordings = enrichedRecordings.slice(
      (page - 1) * limit,
      page * limit,
    );

    return {
      streams: paginatedRecordings,
      total: enrichedRecordings.length,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error getting recorded streams:", error);
    throw error;
  }
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

  // Mark as deleted instead of hard delete (soft delete)
  stream.isDeleted = true;
  await stream.save();

  // Delete associated chat messages and analytics
  await Promise.all([
    StreamChat.deleteMany({ streamId }),
    StreamAnalytics.deleteOne({ streamId }),
  ]);

  // Also delete from S3 if recording exists
  if (stream.recordingUrl) {
    try {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const bucket = config.aws.bucket || "fernando-buckets";

      // Remove leading slash and construct the S3 key
      let s3Key = stream.recordingUrl.startsWith("/")
        ? stream.recordingUrl.substring(1)
        : stream.recordingUrl;

      // Delete the master.m3u8 file
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: `${s3Key}/media/hls/master.m3u8`,
      });
      await s3Client.send(deleteCommand);

      console.log(`[deleteStream] Deleted S3 recording: ${s3Key}`);
    } catch (error) {
      console.error(`[deleteStream] Error deleting S3 recording:`, error);
      // Don't throw error, just log it
    }
  }

  // Update creator stats
  await User.findByIdAndUpdate(stream.creatorId, {
    $inc: { "creatorStats.totalStreams": -1 },
  });

  return { message: "Stream deleted successfully" };
};

export { deleteStream };
