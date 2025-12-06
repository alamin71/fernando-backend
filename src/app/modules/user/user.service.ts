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
  if (!id) throw new AppError(StatusCodes.UNAUTHORIZED, "User ID missing in token");

  const isExistUser: IUser | null = await User.isExistUserById(id);
  if (!isExistUser) throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist");

  return isExistUser;
};

// ---------------- UPDATE PROFILE ----------------
const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const id = user.id;
  if (!id) throw new AppError(StatusCodes.UNAUTHORIZED, "User ID missing in token");

  const isExistUser: IUser | null = await User.isExistUserById(id);
  if (!isExistUser) throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist");

  // Unlink old image if new image provided
  // if (payload.image && isExistUser.image) {
  //   unlinkFile(isExistUser.image);
  // }

  const updatedUser: IUser | null = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updatedUser;
};

// ---------------- VERIFY PASSWORD ----------------
const verifyUserPassword = async (userId: string, password: string): Promise<boolean> => {
  if (!userId) throw new AppError(StatusCodes.UNAUTHORIZED, "User ID required");

  const user: IUser | null = await User.findById(userId).select("+password");
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  const isPasswordValid = await User.isMatchPassword(password, user.password);
  return isPasswordValid;
};

// ---------------- DELETE USER ----------------
const deleteUser = async (userId: string): Promise<boolean> => {
  if (!userId) throw new AppError(StatusCodes.UNAUTHORIZED, "User ID required");

  const isExistUser: IUser | null = await User.isExistUserById(userId);
  if (!isExistUser) throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist");

  await User.findByIdAndUpdate(userId, { $set: { isDeleted: true } });
  return true;
};

// ---------------- CREATE VENDOR (example) ----------------
const createVendorToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  const newVendor = await User.create(payload);
  return newVendor;
};

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  verifyUserPassword,
  deleteUser,
  createVendorToDB,
};
