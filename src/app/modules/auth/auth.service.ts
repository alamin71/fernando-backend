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
  const normalizedEmail = String(payload.email || "")
    .trim()
    .toLowerCase();
  const existing = await User.isExistUserByEmail(normalizedEmail);
  if (existing)
    throw new AppError(StatusCodes.CONFLICT, "Email already exists");

  const assignRole =
    payload.role &&
    Object.values(USER_ROLES).includes(payload.role as USER_ROLES)
      ? payload.role
      : USER_ROLES.CREATOR;

  // Simple profile data for all users (Creator or User)
  const profileData = {
    firstName: payload.profileData?.firstName || "",
    lastName: payload.profileData?.lastName || "",
    bio: payload.profileData?.bio || "",
    phone: payload.profileData?.phone || "",
    location: payload.profileData?.location || "",
  };

  const newUser = await User.create({
    email: normalizedEmail,
    role: assignRole,
    profileData,
    verified: false,
  });

  // OTP generate (6 digits)
  const otp = generateOTP(6);
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
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+authentication"
  );
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

  const decoded = jwtHelper.verifySignupToken(signupToken) as {
    email: string;
  };
  const email = String(decoded.email || "")
    .trim()
    .toLowerCase();

  const user = await User.findOne({ email });
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  const otp = generateOTP(6);
  user.authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 10 * 60 * 1000),
    isResetPassword: false,
  };
  await user.save();

  // Send email asynchronously (do not await) to avoid blocking the request
  const senderName = user.profileData?.firstName || user.email;
  emailHelper
    .sendEmail(
      emailTemplate.createAccount({
        name: senderName,
        otp,
        email: user.email as string,
      })
    )
    .then(() => logger.info(`Resend OTP email queued for ${user.email}`))
    .catch((err) =>
      errorLogger.error("Resend OTP email error: " + String(err))
    );

  return {
    message: "OTP resent to email",
    ...(process.env.NODE_ENV === "development" && { otp }),
  };
};

// -------------------- Login --------------------
export const login = async (email: string, password: string) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password"
  );
  if (!user) throw new AppError(StatusCodes.BAD_REQUEST, "User not found");

  // Debug log: show which user document was found and its verified state
  logger.info(
    `Login attempt for email=${normalizedEmail} found userId=${user._id} verified=${user.verified}`
  );

  if (
    !user.password ||
    !(await User.isMatchPassword(password, user.password))
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "password is incorrect");
  }

  // OTP verified?
  if (!user.verified) {
    errorLogger.error(
      `Login blocked: user ${user._id} (${email}) not verified`
    );
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Account not verified. Please verify OTP first."
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
  // Return a minimal user payload (exclude heavy nested fields)
  const minimalUser = {
    _id: user._id,
    email: user.email,
    role: user.role,
    username: user.username,
    channelName: user.channelName,
    verified: user.verified,
    status: user.status,
    image: user.image,
    createdAt: (user as any).createdAt,
    updatedAt: (user as any).updatedAt,
  };

  return {
    message: "Login successful",
    user: minimalUser,
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
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  const otp = generateOTP(6);

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

  // Send email asynchronously (do not await) to avoid blocking the request
  emailHelper
    .sendEmail(
      emailTemplate.resetPassword({ otp, email: user.email as string })
    )
    .then(() => logger.info(`Forgot password email queued for ${user.email}`))
    .catch((err) =>
      errorLogger.error("Forgot password email error: " + String(err))
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

  const normalizedEmail = String(decoded.email || "")
    .trim()
    .toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
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

  const normalizedEmail2 = String(decoded.email || "")
    .trim()
    .toLowerCase();
  const user = await User.findOne({ email: normalizedEmail2 }).select(
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

  const email = String(decoded.email || "")
    .trim()
    .toLowerCase();
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
