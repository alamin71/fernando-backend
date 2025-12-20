import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserService } from "./user.service";
import config from "../../../config";
import bcrypt from "bcrypt";
import { uploadToS3 } from "../../../utils/fileHelper";
const createUser = catchAsync(async (req, res) => {
  const { ...userData } = req.body;
  const result = await UserService.createUserToDB(userData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User created successfully",
    data: result,
  });
});
const createVendor = catchAsync(async (req, res) => {
  const { ...userData } = req.body;
  const result = await UserService.createVendorToDB(userData);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Business User created successfully",
    data: result,
  });
});

const getUserProfile = catchAsync(async (req, res) => {
  const user: any = req.user;
  const result = await UserService.getUserProfileFromDB(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Profile data retrieved successfully",
    data: result,
  });
});

//update profile
const updateProfile = catchAsync(async (req, res) => {
  const user: any = req.user;
  if ("role" in req.body) {
    delete req.body.role;
  }
  // If password is provided
  if (req.body.password) {
    req.body.password = await bcrypt.hash(
      req.body.password,
      Number(config.bcrypt_salt_rounds)
    );
  }

  const result = await UserService.updateProfileToDB(user, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Profile updated successfully",
    data: result,
  });
});
//delete profile
const deleteProfile = catchAsync(async (req, res) => {
  const { id }: any = req.user;
  const { password } = req.body;
  const isUserVerified = await UserService.verifyUserPassword(id, password);
  if (!isUserVerified) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "Incorrect password. Please try again.",
    });
  }

  const result = await UserService.deleteUser(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Profile deleted successfully",
    data: result,
  });
});

// Update channel photos
const updateChannelPhotos = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData: any = {};

  if (req.files && typeof req.files === "object") {
    const files = req.files as { [key: string]: Express.Multer.File[] };

    if (files.profilePhoto && files.profilePhoto[0]) {
      const profileUpload = await uploadToS3(
        files.profilePhoto[0],
        "profile-photos/"
      );
      updateData.profilePhoto = profileUpload.url;
    }

    if (files.coverPhoto && files.coverPhoto[0]) {
      const coverUpload = await uploadToS3(
        files.coverPhoto[0],
        "cover-photos/"
      );
      updateData.coverPhoto = coverUpload.url;
    }
  }

  const result = await UserService.updateChannelPhotos(id, updateData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Channel photos updated successfully",
    data: result,
  });
});

// Update channel info
const updateChannelInfo = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { channelName, username, description } = req.body;

  const result = await UserService.updateChannelInfo(id, {
    channelName,
    username,
    description,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Channel info updated successfully",
    data: result,
  });
});

// Add social account
const addSocialAccount = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { platform, url, displayName } = req.body;

  const result = await UserService.addSocialAccount(id, {
    platform,
    url,
    displayName,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Social account added successfully",
    data: result,
  });
});

// Update social account
const updateSocialAccount = catchAsync(async (req, res) => {
  const { id, socialId } = req.params;
  const { url, displayName } = req.body;

  const result = await UserService.updateSocialAccount(id, socialId, {
    url,
    displayName,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Social account updated successfully",
    data: result,
  });
});

// Delete social account
const deleteSocialAccount = catchAsync(async (req, res) => {
  const { id, socialId } = req.params;

  const result = await UserService.deleteSocialAccount(id, socialId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Social account deleted successfully",
    data: result,
  });
});

// Get channel details
const getChannelDetails = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserService.getChannelDetails(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Channel details retrieved successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  getUserProfile,
  updateProfile,
  createVendor,
  deleteProfile,
  updateChannelPhotos,
  updateChannelInfo,
  addSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
  getChannelDetails,
};
