import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import AppError from "../../../errors/AppError";
import { User } from "../user/user.model";
import QueryBuilder from "../../builder/QueryBuilder";

// Get all creators with search, filter, sort, pagination
const getAllCreators = catchAsync(async (req: Request, res: Response) => {
  const queryBuilder = new QueryBuilder<any>(
    User.find({ role: "creator" }).select(
      "username channelName email image createdAt creatorStats"
    ),
    req.query
  )
    .search(["username", "channelName", "email"])
    .filter()
    .sort()
    .paginate();

  const creators = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  // Format response data
  const formattedCreators = creators.map((creator: any) => ({
    _id: creator._id,
    channelName: creator.channelName || "",
    username: creator.username || "",
    email: creator.email || "",
    image: creator.image || "",
    joinedOn: creator.createdAt,
    followers: creator.creatorStats?.totalFollowers || 0,
    views: creator.creatorStats?.totalStreamViews || 0,
    likes: creator.creatorStats?.totalLikes || 0,
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Creators retrieved successfully",
    data: formattedCreators,
    meta,
  });
});

// Delete creator
const deleteCreator = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const creator = await User.findOne({ _id: id, role: "creator" });
  if (!creator) {
    throw new AppError(httpStatus.NOT_FOUND, "Creator not found");
  }

  // Soft delete
  creator.isDeleted = true;
  await creator.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Creator deleted successfully",
    data: {
      _id: creator._id,
      username: creator.username,
      channelName: creator.channelName,
    },
  });
});

// Export creators data (CSV format)
const exportCreators = catchAsync(async (req: Request, res: Response) => {
  const creators = await User.find({ role: "creator", isDeleted: false })
    .select("username channelName email createdAt creatorStats")
    .lean();

  // Format for CSV
  const csvData = creators.map((creator: any) => ({
    "Channel Name": creator.channelName || "",
    "User Name": creator.username || "",
    Email: creator.email || "",
    "Joined On": new Date(creator.createdAt).toLocaleDateString(),
    Followers: creator.creatorStats?.totalFollowers || 0,
    Views: creator.creatorStats?.totalStreamViews || 0,
    Likes: creator.creatorStats?.totalLikes || 0,
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Creators data exported successfully",
    data: csvData,
  });
});

// Get single creator details
const getCreatorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const creator = await User.findOne({ _id: id, role: "creator" }).select(
    "username channelName email image createdAt updatedAt creatorStats profileData status verified"
  );

  if (!creator) {
    throw new AppError(httpStatus.NOT_FOUND, "Creator not found");
  }

  const formattedCreator = {
    _id: creator._id,
    channelName: creator.channelName || "",
    username: creator.username || "",
    email: creator.email || "",
    image: creator.image || "",
    joinedOn: creator.createdAt,
    followers: (creator as any).creatorStats?.totalFollowers || 0,
    views: (creator as any).creatorStats?.totalStreamViews || 0,
    likes: (creator as any).creatorStats?.totalLikes || 0,
    totalStreams: (creator as any).creatorStats?.totalStreams || 0,
    status: creator.status,
    verified: creator.verified,
    profileData: creator.profileData,
  };

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Creator details retrieved successfully",
    data: formattedCreator,
  });
});

// Bulk delete creators
const bulkDeleteCreators = catchAsync(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide an array of creator IDs"
    );
  }

  const result = await User.updateMany(
    { _id: { $in: ids }, role: "creator" },
    { isDeleted: true }
  );

  if (result.modifiedCount === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No creators found to delete");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${result.modifiedCount} creators deleted successfully`,
    data: { deletedCount: result.modifiedCount },
  });
});

export const creatorsControllers = {
  getAllCreators,
  deleteCreator,
  exportCreators,
  getCreatorById,
  bulkDeleteCreators,
};
