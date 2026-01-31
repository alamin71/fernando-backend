import { model, Schema } from "mongoose";
import { IStream, StreamModel } from "./stream.interface";

const streamSchema = new Schema<IStream, StreamModel>(
  {
    creatorId: {
      type: Schema.Types.ObjectId as any,
      ref: "User",
      required: false,
      index: true,
    },
    title: { type: String, required: true, index: true },
    description: { type: String, default: "" },
    categoryId: {
      type: Schema.Types.ObjectId as any,
      ref: "StreamCategory",
      index: true,
    },
    thumbnail: { type: String, default: "" },
    streamKey: { type: String, required: true, unique: true, select: false },
    status: {
      type: String,
      enum: ["LIVE", "OFFLINE", "SCHEDULED"],
      default: "OFFLINE",
      index: true,
    },
    isPublic: { type: Boolean, default: true, index: true },
    // Recording and playback
    recordingUrl: { type: String, default: "" },
    playbackUrl: { type: String, default: "" },
    durationSeconds: { type: Number, default: 0 },
    whoCanMessage: {
      type: String,
      enum: ["everyone", "followers"],
      default: "everyone",
    },
    isMature: { type: Boolean, default: false },
    startedAt: { type: Date, index: true },
    endedAt: { type: Date },
    scheduledAt: { type: Date },

    // Cached stats for performance
    currentViewers: { type: Number, default: 0 },
    peakViewers: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0, index: true },
    totalLikes: { type: Number, default: 0 },
    totalDislikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },

    // WebRTC
    rtcServerUrl: { type: String },
    streamUrl: { type: String },

    // Report tracking
    isReported: { type: Boolean, default: false, index: true },

    // Deletion tracking
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// Indexes for query optimization
streamSchema.index({ creatorId: 1, status: 1 }); // Find creator's live streams
streamSchema.index({ status: 1, startedAt: -1 }); // Find active streams (home feed)
streamSchema.index({ categoryId: 1, status: 1 }); // Category filter
streamSchema.index({ createdAt: -1 }); // Latest streams
streamSchema.index({ totalViews: -1 }); // Popular streams

// TTL index for 3-month data retention (delete offline streams after 90 days)
streamSchema.index(
  { endedAt: 1 },
  { expireAfterSeconds: 7776000, sparse: true }, // 90 days
);

streamSchema.statics.findLiveStreams = async function () {
  return await this.find({ status: "LIVE" })
    .populate("creatorId", "username image channelName creatorStats")
    .populate("categoryId", "name")
    .lean();
};

streamSchema.statics.findByCreator = async function (creatorId: string) {
  return await this.find({ creatorId })
    .sort({ startedAt: -1 })
    .select("-streamKey")
    .lean();
};

export const Stream = model<IStream, StreamModel>("Stream", streamSchema);
