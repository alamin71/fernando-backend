import { StatusCodes } from "http-status-codes";
import { User } from "./user.model";
import { IUser } from "./user.interface";
import AppError from "../../../errors/AppError";
import { JwtPayload } from "jsonwebtoken";
// import  unlinkFile  from "../../../shared/unlinkFile"; // adjust your path
// import bcrypt from "bcrypt";

const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  const newUser = await User.create(payload);
  return newUser;
};

// ---------------- GET USER PROFILE ----------------
const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser>> => {
  const id = user.id;
  if (!id)
    throw new AppError(StatusCodes.UNAUTHORIZED, "User ID missing in token");

  const isExistUser: IUser | null = await User.isExistUserById(id);
  if (!isExistUser)
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist");

  return isExistUser;
};

// ---------------- UPDATE PROFILE ----------------
const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const id = user.id;
  if (!id)
    throw new AppError(StatusCodes.UNAUTHORIZED, "User ID missing in token");

  const isExistUser: IUser | null = await User.isExistUserById(id);
  if (!isExistUser)
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist");

  // Unlink old image if new image provided
  // if (payload.image && isExistUser.image) {
  //   unlinkFile(isExistUser.image);
  // }

  const updatedUser: IUser | null = await User.findOneAndUpdate(
    { _id: id },
    payload,
    {
      new: true,
    }
  );

  return updatedUser;
};

// ---------------- VERIFY PASSWORD ----------------
const verifyUserPassword = async (
  userId: string,
  password: string
): Promise<boolean> => {
  if (!userId) throw new AppError(StatusCodes.UNAUTHORIZED, "User ID required");

  const user: IUser | null = await User.findById(userId).select("+password");
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  if (!user.password)
    throw new AppError(StatusCodes.BAD_REQUEST, "User has no password set");

  const isPasswordValid = await User.isMatchPassword(
    password,
    user.password as string
  );
  return isPasswordValid;
};

// ---------------- DELETE USER ----------------
const deleteUser = async (userId: string): Promise<boolean> => {
  if (!userId) throw new AppError(StatusCodes.UNAUTHORIZED, "User ID required");

  const isExistUser: IUser | null = await User.isExistUserById(userId);
  if (!isExistUser)
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist");

  await User.findByIdAndUpdate(userId, { $set: { isDeleted: true } });
  return true;
};

// ---------------- CREATE VENDOR (example) ----------------
const createVendorToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  const newVendor = await User.create(payload);
  return newVendor;
};

// ============ CHANNEL CUSTOMIZATION ============

// Update channel photos
const updateChannelPhotos = async (
  userId: string,
  photoData: { profilePhoto?: string; coverPhoto?: string }
): Promise<Partial<IUser>> => {
  const user = await User.findByIdAndUpdate(userId, photoData, { new: true });
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  return user;
};

// Update channel info
const updateChannelInfo = async (
  userId: string,
  infoData: { channelName?: string; username?: string; description?: string }
): Promise<Partial<IUser>> => {
  const user = await User.findByIdAndUpdate(userId, infoData, { new: true });
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  return user;
};

// Add social account
const addSocialAccount = async (
  userId: string,
  socialData: { platform: string; url: string; displayName: string }
): Promise<IUser | null> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $push: { socialAccounts: socialData } },
    { new: true }
  );
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  return user;
};

// Update social account
const updateSocialAccount = async (
  userId: string,
  socialId: string,
  updateData: { url?: string; displayName?: string }
): Promise<IUser | null> => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "socialAccounts.$[elem].url": updateData.url,
        "socialAccounts.$[elem].displayName": updateData.displayName,
      },
    },
    {
      arrayFilters: [{ "elem._id": socialId }],
      new: true,
    }
  );
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  return user;
};

// Delete social account
const deleteSocialAccount = async (
  userId: string,
  socialId: string
): Promise<IUser | null> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { socialAccounts: { _id: socialId } } },
    { new: true }
  );
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  return user;
};

// Get channel details
const getChannelDetails = async (userId: string): Promise<Partial<IUser>> => {
  const user = await User.findById(userId)
    .select(
      "channelName username description profilePhoto coverPhoto socialAccounts creatorStats"
    )
    .populate("followers", "username image")
    .lean();

  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  const followerCount = await User.findById(userId).countDocuments({
    _id: { $in: (user as any).followers },
  });

  return {
    ...user,
    followerCount,
  };
};

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  verifyUserPassword,
  deleteUser,
  createVendorToDB,
  updateChannelPhotos,
  updateChannelInfo,
  addSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
  getChannelDetails,
};
