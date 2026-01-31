import { Model } from "mongoose";

export interface IStream {
  _id?: string;
  creatorId: string; // Reference to User (Creator)
  title: string;
  description: string;
  categoryId?: string; // Reference to StreamCategory
  thumbnail?: string;
  streamKey: string; // Unique key for WebRTC broadcast
  status: "LIVE" | "OFFLINE" | "SCHEDULED"; // Current stream status
  isPublic: boolean;
  whoCanMessage?: "everyone" | "followers";
  isMature?: boolean;
  recordingUrl?: string;
  playbackUrl?: string;
  durationSeconds?: number;
  startedAt?: Date;
  endedAt?: Date;
  scheduledAt?: Date; // For scheduled streams

  // Live stats (cached for performance)
  currentViewers: number;
  peakViewers: number;
  totalViews: number;
  totalLikes: number;
  totalDislikes: number;
  totalComments: number;

  // WebRTC specific
  rtcServerUrl?: string; // SFU/MCU server endpoint
  streamUrl?: string; // HLS/RTMP fallback URL

  // Report tracking
  isReported?: boolean;

  // Deletion tracking
  isDeleted?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type StreamModel = Model<IStream>;
