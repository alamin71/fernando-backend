import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { Follow } from "./follow.model";
import { User } from "../user/user.model";

// Follow a creator
const followCreator = async (followerId: string, followingId: string) => {
  if (followerId === followingId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You cannot follow yourself");
  }

  const creator = await User.findById(followingId);
  if (!creator) {
    throw new AppError(StatusCodes.NOT_FOUND, "Creator not found");
  }

  // Check if already following
  const existing = await Follow.findOne({ followerId, followingId });
  if (existing) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "You are already following this creator"
    );
  }

  // Create follow relationship
  await Follow.create({ followerId, followingId });

  // Update User followers/following arrays
  await User.findByIdAndUpdate(followerId, {
    $addToSet: { following: followingId },
  });
  await User.findByIdAndUpdate(followingId, {
    $addToSet: { followers: followerId },
    $inc: { "creatorStats.totalFollowers": 1 },
  });

  return { message: "Followed successfully" };
};

// Unfollow a creator
const unfollowCreator = async (followerId: string, followingId: string) => {
  const follow = await Follow.findOneAndDelete({ followerId, followingId });

  if (!follow) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "You are not following this creator"
    );
  }

  // Update User followers/following arrays
  await User.findByIdAndUpdate(followerId, {
    $pull: { following: followingId },
  });
  await User.findByIdAndUpdate(followingId, {
    $pull: { followers: followerId },
    $inc: { "creatorStats.totalFollowers": -1 },
  });

  return { message: "Unfollowed successfully" };
};

// Get creator's followers
const getFollowers = async (
  creatorId: string,
  filters: { page: number; limit: number }
) => {
  const { page, limit } = filters;

  const followers = await Follow.find({ followingId: creatorId })
    .populate("followerId", "username channelName image")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await Follow.countDocuments({ followingId: creatorId });

  return {
    followers: followers.map((f: any) => f.followerId),
    total,
    page,
    limit,
  };
};

// Get creator's following
const getFollowing = async (
  creatorId: string,
  filters: { page: number; limit: number }
) => {
  const { page, limit } = filters;

  const following = await Follow.find({ followerId: creatorId })
    .populate("followingId", "username channelName image")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await Follow.countDocuments({ followerId: creatorId });

  return {
    following: following.map((f: any) => f.followingId),
    total,
    page,
    limit,
  };
};

// Check if user follows creator
const checkFollowStatus = async (followerId: string, followingId: string) => {
  const follow = await Follow.findOne({ followerId, followingId });
  return { isFollowing: !!follow };
};

export const followService = {
  followCreator,
  unfollowCreator,
  getFollowers,
  getFollowing,
  checkFollowStatus,
};
