import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { SignOptions } from "jsonwebtoken";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import config from "../../../config";
import AppError from "../../../errors/AppError";
import { uploadToS3 } from "../../../utils/fileHelper";
import { adminService } from "./admin.service";
import { Admin } from "./admin.model";
import { User } from "../user/user.model";
import { Stream } from "../stream/stream.model";
import { StreamAnalytics } from "../stream/streamAnalytics.model";
import { jwtHelper } from "../../../helpers/jwtHelper";
import QueryBuilder from "../../builder/QueryBuilder";
import { Types } from "mongoose";

// -------------------- Admin Auth --------------------
const adminLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) throw new AppError(httpStatus.NOT_FOUND, "Admin not found");

  const isMatch = await admin.isPasswordMatched(password);
  if (!isMatch)
    throw new AppError(httpStatus.UNAUTHORIZED, "Incorrect password");

  const payload = {
    id: admin._id,
    role: admin.role,
    email: admin.email,
    fullName: admin.fullName,
  };

  // Access token with 2h expiry
  const accessToken = jwt.sign(
    payload,
    config.jwt.jwt_secret as string,
    { expiresIn: "2h" } as SignOptions
  );

  // Refresh token using configured secret/expiry
  const refreshToken = jwtHelper.createRefreshToken(payload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin login successful",
    data: {
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        fullName: admin.fullName,
      },
      accessToken,
      refreshToken,
      expiresIn: "2h",
    },
  });
});

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const admin = await Admin.findById(req.user.id).select("-password");
  if (!admin) {
    throw new AppError(httpStatus.NOT_FOUND, "Admin not found");
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin profile retrieved successfully",
    data: admin,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  let image;
  if (req.file) {
    image = await uploadToS3(req.file, "admin-profile/");
  }

  const result = await adminService.updateAdminProfile(req.user.id, {
    ...req.body,
    ...(image && { image }),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated",
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  await adminService.changePassword(
    req.user.id,
    req.body.oldPassword,
    req.body.newPassword
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully",
    data: {},
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const otp = await adminService.setForgotOtp(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP sent successfully, please verify before reset password",
    data: process.env.NODE_ENV === "development" ? { otp } : {},
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!otp) {
    throw new AppError(400, "OTP is required");
  }

  let resolvedEmail = email;

  if (email) {
    await adminService.verifyOtp(email, otp);
  } else {
    const admin = await Admin.findOne({
      "verification.otp": otp,
    });

    if (!admin || !admin.verification) {
      throw new AppError(400, "Invalid OTP");
    }

    if (admin.verification.verified) {
      throw new AppError(400, "OTP already verified");
    }

    if (Date.now() > new Date(admin.verification.expiresAt).getTime()) {
      throw new AppError(400, "OTP expired");
    }

    admin.verification.verified = true;
    await admin.save();
    resolvedEmail = admin.email;
  }

  const token = jwt.sign(
    { email: resolvedEmail },
    config.jwt.jwt_secret as string,
    {
      expiresIn: "15m",
    } as SignOptions
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP verified. Use this token to reset password.",
    data: { token },
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    throw new AppError(400, "Password and confirm password are required");
  }

  if (newPassword !== confirmPassword)
    throw new AppError(400, "Passwords do not match");

  let resolvedEmail = email;

  if (!resolvedEmail) {
    const bearer = req.headers.authorization;
    const resetHeader = (req.headers["x-reset-token"] as string) || undefined;
    const token = bearer?.startsWith("Bearer ")
      ? bearer.split(" ")[1]
      : resetHeader;
    if (!token) throw new AppError(400, "Reset token is required");

    try {
      const decoded: any = jwt.verify(token, config.jwt.jwt_secret as string);
      resolvedEmail = decoded.email;
    } catch (err) {
      throw new AppError(400, "Invalid or expired reset token");
    }
  }

  await adminService.resetPassword(resolvedEmail, newPassword);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password reset successful",
    data: {},
  });
});

// -------------------- Dashboard Stats --------------------
const getPlatformStats = catchAsync(async (req: Request, res: Response) => {
  const totalUsers = await User.countDocuments({ role: "creator" });
  const totalCreators = totalUsers;
  const totalStreams = await Stream.countDocuments();
  const liveStreams = await Stream.countDocuments({ status: "LIVE" });
  const reportedStreams = await Stream.countDocuments({ isReported: true });
  const scheduledStreams = await Stream.countDocuments({ status: "SCHEDULED" });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Platform stats fetched successfully",
    data: {
      totalUsers,
      totalCreators,
      totalStreams,
      liveStreams,
      reportedStreams,
      scheduledStreams,
    },
  });
});

const getGrowthOverview = catchAsync(async (req: Request, res: Response) => {
  // Optional month/year filters (1-12, e.g., month=12&year=2025)
  const monthParam = Number(req.query.month);
  const yearParam = Number(req.query.year);
  const hasMonthFilter =
    Number.isFinite(monthParam) &&
    Number.isFinite(yearParam) &&
    monthParam >= 1 &&
    monthParam <= 12 &&
    yearParam >= 1970;

  const monthStart = hasMonthFilter
    ? new Date(yearParam, monthParam - 1, 1)
    : null;
  const monthEnd = hasMonthFilter ? new Date(yearParam, monthParam, 1) : null;

  // Last 12 months (month-wise) for creators
  const monthlyStart = new Date();
  monthlyStart.setMonth(monthlyStart.getMonth() - 11); // include current month and previous 11
  monthlyStart.setDate(1);

  // Last 30 days for live streams (day-wise)
  const dailyStart = new Date();
  dailyStart.setDate(dailyStart.getDate() - 30);

  // Last month window (previous calendar month)
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const lastMonthStart = new Date(currentMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  // If month/year provided, override ranges to that month
  const creatorsRangeMatch = hasMonthFilter
    ? {
        $match: {
          role: "creator",
          createdAt: { $gte: monthStart, $lt: monthEnd },
        },
      }
    : { $match: { role: "creator", createdAt: { $gte: monthlyStart } } };

  const liveStreamsRangeMatch = hasMonthFilter
    ? {
        $match: {
          status: "LIVE",
          startedAt: { $gte: monthStart, $lt: monthEnd },
        },
      }
    : { $match: { status: "LIVE", startedAt: { $gte: dailyStart } } };

  // Adjust "last month" window relative to provided month/year if present
  const computedCurrentMonthStart = hasMonthFilter
    ? new Date(yearParam, monthParam - 1, 1)
    : currentMonthStart;
  const computedLastMonthStart = new Date(computedCurrentMonthStart);
  computedLastMonthStart.setMonth(computedLastMonthStart.getMonth() - 1);
  const computedMonthEnd = hasMonthFilter
    ? new Date(yearParam, monthParam, 1)
    : new Date(computedCurrentMonthStart.getTime() + 31 * 24 * 60 * 60 * 1000); // rough, not critical

  const [
    monthlyCreators,
    liveStreams,
    totalCreators,
    totalLiveStreamers,
    newCreatorsLastMonth,
    liveStreamsLastMonth,
  ] = await Promise.all([
    // Month-wise creator signup counts
    User.aggregate([
      creatorsRangeMatch,
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Day-wise live streams (last 30 days)
    Stream.aggregate([
      liveStreamsRangeMatch,
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Total creators (all-time)
    User.countDocuments({ role: "creator" }),
    // Total live streamers right now (distinct creators who are live)
    Stream.distinct("creatorId", { status: "LIVE" }),
    // New creators last month (previous calendar month)
    User.countDocuments({
      role: "creator",
      createdAt: {
        $gte: computedLastMonthStart,
        $lt: computedCurrentMonthStart,
      },
    }),
    // Streams started last month (any status)
    Stream.countDocuments({
      startedAt: {
        $gte: computedLastMonthStart,
        $lt: computedCurrentMonthStart,
      },
    }),
  ]);

  const totalLiveStreamerCount = Array.isArray(totalLiveStreamers)
    ? totalLiveStreamers.length
    : 0;

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Growth overview data fetched successfully",
    data: {
      totalCreators,
      totalLiveStreamers: totalLiveStreamerCount,
      newCreatorsLastMonth,
      liveStreamsLastMonth,
      monthlyCreators,
      liveStreams,
    },
  });
});

const getRecentCreators = catchAsync(async (req: Request, res: Response) => {
  const creators = await User.find({ role: "creator" })
    .select("_id channelName username createdAt creatorStats image")
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Recently joined creators fetched successfully",
    data: creators,
  });
});

// -------------------- Streams --------------------
const listStreams = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const search = req.query.search as string | undefined;

  const filter: any = { isDeleted: false };
  if (status) filter.status = status;
  if (categoryId) filter.categoryId = categoryId;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const streams = await Stream.find(filter)
    .populate("creatorId", "username image channelName")
    .populate("categoryId", "name")
    .select(
      "_id title status creatorId categoryId startedAt endedAt totalViews totalLikes totalComments thumbnail isPublic"
    )
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();
  const total = await Stream.countDocuments(filter);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Streams fetched successfully",
    data: {
      streams,
      total,
      page,
      limit,
    },
  });
});

const getStreamAnalytics = catchAsync(async (req: Request, res: Response) => {
  const streamId = req.params.id;
  const analytics = await StreamAnalytics.findOne({ streamId }).lean();
  if (!analytics) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Stream analytics not found",
      data: null,
    });
  }
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Stream analytics fetched successfully",
    data: analytics,
  });
});

// -------------------- Creators --------------------
const getAllCreators = catchAsync(async (req: Request, res: Response) => {
  const queryBuilder = new QueryBuilder<any>(
    User.find({ role: "creator" }).select(
      "username channelName email image createdAt creatorStats isBlocked status"
    ),
    req.query
  )
    .search(["username", "channelName", "email"])
    .filter()
    .sort()
    .paginate();

  const creators = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

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
    isBlocked: creator.isBlocked || false,
    status: creator.status || "ACTIVE",
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Creators retrieved successfully",
    data: formattedCreators,
    meta,
  });
});

const deleteCreator = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const creator = await User.findOne({ _id: id, role: "creator" });
  if (!creator) {
    throw new AppError(httpStatus.NOT_FOUND, "Creator not found");
  }

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

// Block a creator
const blockCreator = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid creator id");
  }

  const creator = await User.findOneAndUpdate(
    { _id: id, role: "creator" },
    { isBlocked: true },
    { new: true }
  ).select("_id username channelName email isBlocked status");

  if (!creator) {
    throw new AppError(httpStatus.NOT_FOUND, "Creator not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Creator blocked successfully",
    data: creator,
  });
});

// Unblock a creator
const unblockCreator = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid creator id");
  }

  const creator = await User.findOneAndUpdate(
    { _id: id, role: "creator" },
    { isBlocked: false },
    { new: true }
  ).select("_id username channelName email isBlocked status");

  if (!creator) {
    throw new AppError(httpStatus.NOT_FOUND, "Creator not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Creator unblocked successfully",
    data: creator,
  });
});

const exportCreators = catchAsync(async (req: Request, res: Response) => {
  const creators = await User.find({ role: "creator", isDeleted: false })
    .select("username channelName email createdAt creatorStats")
    .lean();

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

const deleteStream = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { deleteStream: deleteStreamService } = await import(
    "../stream/stream.service"
  );
  const result = await deleteStreamService(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const adminControllers = {
  adminLogin,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getProfile,
  getPlatformStats,
  listStreams,
  getStreamAnalytics,
  getGrowthOverview,
  getRecentCreators,
  getAllCreators,
  deleteCreator,
  exportCreators,
  getCreatorById,
  bulkDeleteCreators,
  blockCreator,
  unblockCreator,
  deleteStream,
};
