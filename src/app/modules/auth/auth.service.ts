import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import config from "../../../config";
import generateOTP from "../../../utils/generateOTP";
import { User } from "../user/user.model";
import AppError from "../../../errors/AppError";
import { jwtHelper } from "../../../helpers/jwtHelper";
import { emailTemplate } from "../../../shared/emailTemplate";
import { emailHelper } from "../../../helpers/emailHelper";
import { logger, errorLogger } from "../../../shared/logger";
import { USER_ROLES } from "../../../enums/user";

// -------------------- Signup --------------------
type SignupPayload = {
  email: string;
  role?: string;
  profileData?: any;
};

export const signupInit = async (payload: SignupPayload) => {
  const existing = await User.isExistUserByEmail(payload.email);
  if (existing)
    throw new AppError(StatusCodes.CONFLICT, "Email already exists");

  const assignRole =
    payload.role &&
    Object.values(USER_ROLES).includes(payload.role as USER_ROLES)
      ? payload.role
      : USER_ROLES.USER;

  let roleProfileData: any = {};
  if (assignRole === USER_ROLES.USER) {
    roleProfileData = {
      firstName: payload.profileData?.firstName || "",
      lastName: payload.profileData?.lastName || "",
      age: payload.profileData?.age || null,
      weight: payload.profileData?.weight || null,
      gender: payload.profileData?.gender || null,
    };
  } else if (assignRole === USER_ROLES.SERVICE_PROVIDER) {
    roleProfileData = {
      designation: payload.profileData?.designation || "",
      resumeUrl: payload.profileData?.resumeUrl || "",
    };
  } else if (assignRole === USER_ROLES.HOSPITALITY_VENUE) {
    roleProfileData = {
      venueName: payload.profileData?.venueName || "",
      hoursOfOperation: payload.profileData?.hoursOfOperation || "",
      capacity: payload.profileData?.capacity || null,
      displayQrCodes: payload.profileData?.displayQrCodes || false,
      inAppPromotion: payload.profileData?.inAppPromotion || false,
      allowRewards: payload.profileData?.allowRewards || false,
      allowEvents: payload.profileData?.allowEvents || false,
      venueTypes: payload.profileData?.venueTypes || [],
    };
  }

  const profileData = {
    phone: payload.profileData?.phone || "",
    location: payload.profileData?.location || "",
    ...roleProfileData,
  };

  const newUser = await User.create({
    email: payload.email,
    role: assignRole,
    profileData,
    verified: false,
  });

  // OTP generate
  const otp = generateOTP(4);
  newUser.authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 10 * 60 * 1000),
    isResetPassword: false,
  };
  await newUser.save();

  // Signup token (create before sending email so token errors don't block)
  let signupToken: string | undefined;
  try {
    signupToken = jwtHelper.createSignupToken({
      email: newUser.email as string,
    });
  } catch (err: any) {
    // Token creation failed - log and continue (non-fatal in development)
    errorLogger.error("Failed to create signup token: " + String(err));
  }

  // Send email asynchronously (do not await) and log any failure to avoid hanging the request
  const senderName = newUser.profileData?.firstName || newUser.email;
  emailHelper
    .sendEmail(
      emailTemplate.createAccount({
        name: senderName,
        otp,
        email: newUser.email as string,
      })
    )
    .then(() => logger.info(`Signup email queued for ${newUser.email}`))
    .catch((err) => errorLogger.error("Signup email error: " + String(err)));

  return {
    message: "Signup initiated. OTP sent to email",
    email: newUser.email,
    role: newUser.role,
    profileData: newUser.profileData,
    otp,
    signupToken,
  };
};

// -------------------- Verify OTP --------------------
export const signupVerifyOtp = async (email: string, otp: string) => {
  const user = await User.findOne({ email }).select("+authentication");
  if (!user || !user.authentication) {
    throw new AppError(StatusCodes.NOT_FOUND, "User or OTP not found");
  }

  if (String(user.authentication.oneTimeCode) !== otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP");
  }

  if (
    user.authentication.expireAt &&
    new Date() > new Date(user.authentication.expireAt)
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP expired");
  }

  user.verified = true;
  user.authentication = undefined;
  await user.save();

  // Log for debugging
  logger.info(`User ${user.email} verified: ${user.verified}`);

  return {
    message: "Account verified successfully. Please login to continue.",
    email: user.email as string,
    verified: user.verified,
  };
};

// -------------------- Resend OTP --------------------
export const resendSignupOtp = async (signupToken: string) => {
  if (!signupToken)
    throw new AppError(StatusCodes.UNAUTHORIZED, "No signup token");

  const decoded = jwtHelper.verifySignupToken(signupToken) as { email: string };
  const email = decoded.email;

  const user = await User.findOne({ email });
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  const otp = generateOTP(4);
  user.authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 10 * 60 * 1000),
    isResetPassword: false,
  };
  await user.save();

  await emailHelper.sendEmail(
    emailTemplate.createAccount({
      name: user.name,
      otp,
      email: user.email as string,
    })
  );

  return {
    message: "OTP resent to email",
    ...(process.env.NODE_ENV === "development" && { otp }),
  };
};

// -------------------- Login --------------------
export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select("+password subscription");
  if (!user) throw new AppError(StatusCodes.BAD_REQUEST, "User not found");

  if (
    !user.password ||
    !(await User.isMatchPassword(password, user.password))
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "password is incorrect");
  }

  // OTP verified?
  if (!user.verified) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Account not verified. Please verify OTP first."
    );
  }

  // subscription check
  const sub: any = (user as any).subscription || {};
  if (!sub.isActive || sub.status !== "ACTIVE") {
    const stage =
      sub.status === "pending"
        ? "Plan selected, payment required"
        : sub.status === "pending_approval"
        ? "Payment done, waiting for admin approval"
        : sub.status === "rejected"
        ? "Subscription rejected by admin"
        : "No active subscription";
    throw new AppError(
      StatusCodes.FORBIDDEN,
      `${stage}. You cannot login yet.`
    );
  }

  const payload = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
  };
  const accessToken = jwtHelper.createAccessToken(payload);
  const refreshToken = jwtHelper.createRefreshToken(payload);

  const { password: _, ...userData } = user.toObject();

  return {
    message: "Login successful",
    user: userData,
    accessToken,
    refreshToken,
  };
};

// -------------------- Refresh Token --------------------
export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded: any = jwtHelper.verifyRefreshToken(refreshToken);
    const payload = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
    const accessToken = jwtHelper.createAccessToken(payload);
    return { accessToken };
  } catch {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }
};

// -------------------- Forgot Password --------------------
export const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  const otp = generateOTP(4);

  user.authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 10 * 60 * 1000),
    isResetPassword: true,
  };
  await user.save();

  // reset token generate now
  const resetToken = jwtHelper.createResetPasswordToken({
    email: user.email as string,
  });

  await emailHelper.sendEmail(
    emailTemplate.resetPassword({ otp, email: user.email as string })
  );

  return { otp, resetToken };
};

// -------------------- Verify Forgot Password OTP --------------------
export const verifyForgotPasswordOtp = async (
  resetToken: string,
  otp: string
) => {
  if (!resetToken)
    throw new AppError(StatusCodes.UNAUTHORIZED, "Reset token missing");

  let decoded: any;
  try {
    decoded = jwtHelper.verifyResetPasswordToken(resetToken);
  } catch {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired reset token"
    );
  }

  const user = await User.findOne({ email: decoded.email }).select(
    "+authentication"
  );
  if (!user || !user.authentication)
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  if (!user.authentication.isResetPassword) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP not valid for reset");
  }

  if (String(user.authentication.oneTimeCode) !== otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP");
  }

  if (
    user.authentication.expireAt &&
    new Date() > new Date(user.authentication.expireAt)
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP expired");
  }

  return { message: "OTP verified" };
};

// -------------------- Reset Password --------------------
export const resetPasswordWithToken = async (
  resetToken: string,
  newPassword: string,
  confirmPassword: string
) => {
  if (!resetToken)
    throw new AppError(StatusCodes.UNAUTHORIZED, "Reset token is required");
  if (newPassword !== confirmPassword)
    throw new AppError(StatusCodes.BAD_REQUEST, "Passwords do not match");

  let decoded: any;
  try {
    decoded = jwtHelper.verifyResetPasswordToken(resetToken);
  } catch {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired reset token"
    );
  }

  const user = await User.findOne({ email: decoded.email }).select(
    "+password +authentication"
  );
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  user.password = newPassword; // ✅ hook will hash automatically
  user.authentication = undefined; // OTP invalidate
  await user.save();

  return { message: "Password reset successfully" };
};

// -------------------- Change Password --------------------
export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  if (!user.password)
    throw new AppError(StatusCodes.BAD_REQUEST, "Old password is incorrect");

  const isMatch = await User.isMatchPassword(oldPassword, user.password);
  if (!isMatch)
    throw new AppError(StatusCodes.BAD_REQUEST, "Old password is incorrect");

  user.password = newPassword; // ✅ hook will hash automatically
  await user.save();

  return { message: "Password changed successfully" };
};

// -------------------- Helper for Controller --------------------
export const verifySignupToken = (token: string) => {
  return jwtHelper.verifySignupToken(token) as { email: string };
};

// Complete signup: set username, channelName and password after OTP verification
export const signupComplete = async (
  token: string,
  username: string,
  channelName: string,
  password: string
) => {
  if (!token)
    throw new AppError(StatusCodes.UNAUTHORIZED, "Signup token missing");

  let decoded: any;
  try {
    decoded = jwtHelper.verifySignupToken(token) as { email: string };
  } catch {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired signup token"
    );
  }

  const email = decoded.email;
  const user = await User.findOne({ email }).select(
    "+password +authentication"
  );
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  // Prevent overwriting credentials if already set
  if (user.password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Signup already completed for this user"
    );
  }

  // Check username / channelName uniqueness
  const existingUsername = await User.findOne({ username });
  if (existingUsername)
    throw new AppError(StatusCodes.CONFLICT, "Username already exists");
  const existingChannel = await User.findOne({ channelName });
  if (existingChannel)
    throw new AppError(StatusCodes.CONFLICT, "Channel name already exists");

  user.username = username;
  user.channelName = channelName;
  user.password = password; // will be hashed by pre-save hook
  user.verified = true;
  user.authentication = undefined;

  await user.save();

  logger.info(
    `Signup completed for ${user.email} — verified: ${user.verified}`
  );

  return { message: "Signup completed successfully. Please login." };
};
