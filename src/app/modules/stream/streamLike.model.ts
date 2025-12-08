import { model, Schema } from "mongoose";
import { IStreamLike, StreamLikeModel } from "./streamLike.interface";

const streamLikeSchema = new Schema<IStreamLike, StreamLikeModel>(
  {
    streamId: {
      type: Schema.Types.ObjectId as any,
      ref: "Stream",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId as any, ref: "User", required: true },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate likes
streamLikeSchema.index({ streamId: 1, userId: 1 }, { unique: true });

// TTL index - delete after 3 months
streamLikeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

streamLikeSchema.statics.getLikeCount = async function (streamId: string) {
  return await this.countDocuments({ streamId });
};

streamLikeSchema.statics.isLiked = async function (
  streamId: string,
  userId: string
) {
  return await this.findOne({ streamId, userId });
};

export const StreamLike = model<IStreamLike, StreamLikeModel>(
  "StreamLike",
  streamLikeSchema
);
