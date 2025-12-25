import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { followService } from "./follow.service";

// Follow a creator
const followCreator = catchAsync(async (req, res) => {
  const followerId = (req.user as any)?.id;
  const { creatorId } = req.params;

  const result = await followService.followCreator(followerId, creatorId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: result.message,
    data: null,
  });
});

// Unfollow a creator
const unfollowCreator = catchAsync(async (req, res) => {
  const followerId = (req.user as any)?.id;
  const { creatorId } = req.params;

  const result = await followService.unfollowCreator(followerId, creatorId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: null,
  });
});

// Get user's followers
const getFollowers = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const result = await followService.getFollowers(userId, { page, limit });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Followers retrieved successfully",
    data: result.followers,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPage: Math.ceil(result.total / result.limit),
    },
  });
});

// Get user's following
const getFollowing = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const result = await followService.getFollowing(userId, { page, limit });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Following retrieved successfully",
    data: result.following,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPage: Math.ceil(result.total / result.limit),
    },
  });
});

// Check follow status
const checkFollowStatus = catchAsync(async (req, res) => {
  const followerId = (req.user as any)?.id;
  const { creatorId } = req.params;

  const result = await followService.checkFollowStatus(followerId, creatorId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Follow status retrieved",
    data: result,
  });
});

export const followController = {
  followCreator,
  unfollowCreator,
  getFollowers,
  getFollowing,
  checkFollowStatus,
};
