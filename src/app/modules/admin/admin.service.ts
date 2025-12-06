// import { StatusCodes } from "http-status-codes";
// import AppError from "../../../errors/AppError";
// import { IUser } from "../user/user.interface";
// import { User } from "../user/user.model";

// const createAdminToDB = async (payload: IUser): Promise<IUser> => {
//   const createAdmin: any = await User.create(payload);
//   if (!createAdmin) {
//     throw new AppError(StatusCodes.BAD_REQUEST, "Failed to create Admin");
//   }
//   if (createAdmin) {
//     await User.findByIdAndUpdate(
//       { _id: createAdmin?._id },
//       { verified: true },
//       { new: true }
//     );
//   }
//   return createAdmin;
// };

// const deleteAdminFromDB = async (id: any): Promise<IUser | undefined> => {
//   const isExistAdmin = await User.findByIdAndDelete(id);
//   if (!isExistAdmin) {
//     throw new AppError(StatusCodes.BAD_REQUEST, "Failed to delete Admin");
//   }
//   return;
// };

// const getAdminFromDB = async (): Promise<IUser[]> => {
//   const admins = await User.find({ role: "ADMIN" }).select(
//     "name email profile contact location"
//   );
//   return admins;
// };

// export const AdminService = {
//   createAdminToDB,
//   deleteAdminFromDB,
//   getAdminFromDB,
// };
import { Admin } from "./admin.model";
import AppError from "../../../errors/AppError";
import httpStatus from "http-status";

const updateAdminProfile = async (id: string, payload: Record<string, any>) => {
  const allowedFields = ["fullName", "phoneNumber", "image"];
  const updateData: Record<string, any> = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updateData[field] = payload[field];
    }
  });
  const admin = await Admin.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!admin) throw new AppError(httpStatus.NOT_FOUND, "Admin not found");

  return admin;
};

const changePassword = async (
  id: string,
  oldPassword: string,
  newPassword: string
) => {
  const admin = await Admin.findById(id).select("+password");
  if (!admin) throw new AppError(404, "Admin not found");

  const isMatch = await admin.isPasswordMatched(oldPassword);
  if (!isMatch) throw new AppError(401, "Old password incorrect");

  admin.password = newPassword;
  await admin.save();
};

const setForgotOtp = async (email: string) => {
  const admin = await Admin.findOne({ email });
  if (!admin) throw new AppError(404, "Admin not found");

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  admin.verification = { otp, expiresAt, verified: false };
  await admin.save();

  return otp;
};

const verifyOtp = async (email: string, otp: number) => {
  const admin = await Admin.findOne({ email });
  if (!admin || !admin.verification)
    throw new AppError(404, "OTP not generated");

  if (admin.verification.verified)
    throw new AppError(400, "OTP already verified");

  if (Date.now() > new Date(admin.verification.expiresAt).getTime()) {
    throw new AppError(400, "OTP expired");
  }

  if (admin.verification.otp !== otp) throw new AppError(400, "Invalid OTP");

  admin.verification.verified = true;
  await admin.save();
};

const resetPassword = async (email: string, newPassword: string) => {
  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin || !admin.verification?.verified) {
    throw new AppError(400, "OTP not verified");
  }

  admin.password = newPassword;
  admin.verification = undefined;
  await admin.save();
};

export const adminService = {
  updateAdminProfile,
  changePassword,
  setForgotOtp,
  verifyOtp,
  resetPassword,
};
