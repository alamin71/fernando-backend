import { model, Schema } from "mongoose";
import { IStreamChat, StreamChatModel } from "./streamChat.interface";
import config from "../../../config";

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

// Optional TTL (in days). If CHAT_TTL_DAYS not set or 0, keep forever.
const ttlDays = Number(config.chat?.ttl_days || 0);
if (ttlDays > 0) {
  streamChatSchema.index(
    { createdAt: 1 },
    {
      expireAfterSeconds: ttlDays * 24 * 60 * 60,
    }
  );
}

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

// If TTL disabled but an old TTL index exists, attempt to drop it once at runtime.
if (!ttlDays) {
  // Best-effort cleanup; ignore errors if index doesn't exist or permissions restricted.
  (async () => {
    try {
      const indexes = await StreamChat.collection.indexes();
      const ttlIdx = indexes.find(
        (i: any) =>
          i.name === "createdAt_1" && typeof i.expireAfterSeconds === "number"
      );
      if (ttlIdx) {
        await StreamChat.collection.dropIndex("createdAt_1");
      }
    } catch {}
  })();
}
