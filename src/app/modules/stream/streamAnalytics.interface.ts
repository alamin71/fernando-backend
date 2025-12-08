import { Model } from "mongoose";

export interface IStreamAnalytics {
  _id?: string;
  streamId: string; // Reference to Stream
  userId?: string; // Reference to User (for user-level analytics)
  viewCount: number;
  watchDuration: number; // in seconds
  uniqueViewers: number;
  peakConcurrentViewers: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type StreamAnalyticsModel = Model<IStreamAnalytics>;
