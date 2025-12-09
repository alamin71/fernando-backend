const getGrowthOverview = catchAsync(async (req: Request, res: Response) => {
  // For the last 30 days: count new creators and live streams per day
  const days = 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // New creators per day
  const creators = await User.aggregate([
    { $match: { role: "CREATOR", createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Live streams per day
  const liveStreams = await Stream.aggregate([
    { $match: { status: "LIVE", startedAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Growth overview data fetched successfully",
    data: {
      creators,
      liveStreams,
    },
  });
});

const getRecentCreators = catchAsync(async (req: Request, res: Response) => {
  // Last 10 joined creators, sorted by createdAt desc
  const creators = await User.find({ role: "CREATOR" })
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
import { StreamAnalytics } from "../stream/streamAnalytics.model";
const listStreams = catchAsync(async (req: Request, res: Response) => {
  // Query params: page, limit, status, category, search
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const search = req.query.search as string | undefined;

  const filter: any = {};
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
const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { status } = req.body;
  if (!["ACTIVE", "BLOCKED"].includes(status)) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Invalid status value",
      data: null,
    });
  }
  const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
  if (!user) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "User not found",
      data: null,
    });
  }
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `User status updated to ${status}`,
    data: user,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const user = await User.findById(userId)
    .select(
      "_id username email role status image channelName creatorStats verified profileData followers following createdAt updatedAt"
    )
    .lean();
  if (!user) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "User not found",
      data: null,
    });
  }
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile fetched successfully",
    data: user,
  });
});
import { IUser } from "../user/user.interface";
const listUsers = catchAsync(async (req: Request, res: Response) => {
  // Query params: page, limit, role, status, search
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const role = req.query.role as string | undefined;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const filter: any = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { channelName: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .select(
      "_id username email role status image channelName creatorStats verified"
    )
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const total = await User.countDocuments(filter);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users fetched successfully",
    data: {
      users,
      total,
      page,
      limit,
    },
  });
});
// import { Request, Response } from "express";
// import { StatusCodes } from "http-status-codes";
// import catchAsync from "../../../shared/catchAsync";
// import sendResponse from "../../../shared/sendResponse";
// import { AdminService } from "./admin.service";

// const createAdmin = catchAsync(async (req: Request, res: Response) => {
//   const payload = req.body;
//   const result = await AdminService.createAdminToDB(payload);

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Admin created Successfully",
//     data: result,
//   });
// });

// const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
//   const payload = req.params.id;
//   const result = await AdminService.deleteAdminFromDB(payload);

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Admin Deleted Successfully",
//     data: result,
//   });
// });

// const getAdmin = catchAsync(async (req: Request, res: Response) => {
//   const result = await AdminService.getAdminFromDB();
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Admin Retrieved Successfully",
//     data: result,
//   });
// });

// export const AdminController = {
//   deleteAdmin,
//   createAdmin,
//   getAdmin,
// };
import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { Admin } from "./../admin/admin.model";
// import jwt from "jsonwebtoken";
import jwt, { SignOptions } from "jsonwebtoken";

import config from "../../../config";
import { adminService } from "./admin.service";
import AppError from "../../../errors/AppError";
import { uploadToS3 } from "../../../utils/fileHelper";

const adminLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) throw new AppError(httpStatus.NOT_FOUND, "Admin not found");

  const isMatch = await admin.isPasswordMatched(password);
  if (!isMatch)
    throw new AppError(httpStatus.UNAUTHORIZED, "Incorrect password");

  const token = jwt.sign(
    { id: admin._id, role: admin.role },
    config.jwt.jwt_secret as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" } as SignOptions
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin login successful",
    data: {
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
      token,
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

const verifiedAdmins = new Map<string, string>();

// global in-memory Map (for demo only)
const otpStore = new Map<string, string>();

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const otp = await adminService.setForgotOtp(req.body.email);
  otpStore.set(otp.toString(), req.body.email); // store otp → email
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP sent successfully, please verify before reset password",
    data: { otp },
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { otp } = req.body;

  const email = otpStore.get(otp.toString());
  if (!email) {
    throw new AppError(400, "OTP mismatch or expired");
  }

  await adminService.verifyOtp(email, otp);
  otpStore.delete(otp.toString()); // optional cleanup
  verifiedAdmins.set(email, "VERIFIED");

  const token = jwt.sign(
    { email },
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
  const { newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword)
    throw new AppError(400, "Passwords do not match");

  // Find verified email
  const matchedEmail = [...verifiedAdmins.entries()].find(
    ([email, status]) => status === "VERIFIED"
  )?.[0];

  if (!matchedEmail) throw new AppError(400, "OTP not verified");

  await adminService.resetPassword(matchedEmail, newPassword);
  verifiedAdmins.delete(matchedEmail); // Clean up

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password reset successful",
    data: {},
  });
});

import { User } from "../user/user.model";
import { Stream } from "../stream/stream.model";

const getPlatformStats = catchAsync(async (req: Request, res: Response) => {
  // Total users
  const totalUsers = await User.countDocuments({
    role: { $in: ["USER", "CREATOR"] },
  });
  // Total creators
  const totalCreators = await User.countDocuments({ role: "CREATOR" });
  // Total streams
  const totalStreams = await Stream.countDocuments();
  // Live streams
  const liveStreams = await Stream.countDocuments({ status: "LIVE" });
  // Offline streams
  const offlineStreams = await Stream.countDocuments({ status: "OFFLINE" });
  // Scheduled streams
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
      offlineStreams,
      scheduledStreams,
    },
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
  listUsers,
  updateUserStatus,
  getUserById,
  listStreams,
  getStreamAnalytics,
  getGrowthOverview,
  getRecentCreators,
};
