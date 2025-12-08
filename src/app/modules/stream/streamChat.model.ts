import { model, Schema } from "mongoose";
import { IStreamChat, StreamChatModel } from "./streamChat.interface";

const streamChatSchema = new Schema<IStreamChat, StreamChatModel>(
  {
    streamId: {
      type: Schema.Types.ObjectId as any,
      ref: "Stream",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId as any, ref: "User", required: true },
    message: { type: String, required: true, maxlength: 500 },
    messageType: { type: String, enum: ["TEXT", "SYSTEM"], default: "TEXT" },
  },
  { timestamps: true }
);

// Index for fast chat retrieval
streamChatSchema.index({ streamId: 1, createdAt: -1 });

// TTL index - delete chat messages after 3 months
streamChatSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Limit chat history per stream (keep only last 1000 messages in memory)
streamChatSchema.statics.getRecentChat = async function (
  streamId: string,
  limit: number = 50
) {
  return await this.find({ streamId })
    .populate("userId", "username image")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const StreamChat = model<IStreamChat, StreamChatModel>(
  "StreamChat",
  streamChatSchema
);
