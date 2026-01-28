import { model, Schema } from "mongoose";
import { IFollow, FollowModel } from "./follow.interface";

const followSchema = new Schema<IFollow, FollowModel>(
  {
    followerId: {
      type: Schema.Types.ObjectId as any,
      ref: "User",
      required: true,
      index: true,
    },
    followingId: {
      type: Schema.Types.ObjectId as any,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Prevent duplicate follows
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

followSchema.statics.getFollowingStreams = async function (
  userId: string,
  limit: number = 20,
) {
  // Get users that current user follows, then get their live streams
  return await this.aggregate([
    { $match: { followerId: userId } },
    {
      $lookup: {
        from: "users",
        localField: "followingId",
        foreignField: "_id",
        as: "creator",
      },
    },
    {
      $lookup: {
        from: "streams",
        localField: "followingId",
        foreignField: "creatorId",
        as: "streams",
      },
    },
    { $unwind: "$streams" },
    { $match: { "streams.status": "LIVE" } },
    { $limit: limit },
  ]);
};

export const Follow = model<IFollow, FollowModel>("Follow", followSchema);
