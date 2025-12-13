import { model, Schema } from "mongoose";
import {
  IStreamAnalytics,
  StreamAnalyticsModel,
} from "./streamAnalytics.interface";

const streamAnalyticsSchema = new Schema<
  IStreamAnalytics,
  StreamAnalyticsModel
>(
  {
    streamId: {
      type: Schema.Types.ObjectId as any,
      ref: "Stream",
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId as any,
      ref: "User",
      sparse: true,
      index: true,
    },
    viewCount: { type: Number, default: 0 },
    watchDuration: { type: Number, default: 0 }, // seconds
    uniqueViewers: { type: Number, default: 0 },
    peakConcurrentViewers: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
streamAnalyticsSchema.index({ userId: 1, createdAt: -1 });

// TTL index - auto-delete after 3 months
streamAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

streamAnalyticsSchema.statics.getStreamStats = async function (
  streamId: string
) {
  return await this.findOne({ streamId }).lean();
};

export const StreamAnalytics = model<IStreamAnalytics, StreamAnalyticsModel>(
  "StreamAnalytics",
  streamAnalyticsSchema
);
