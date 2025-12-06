
import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import * as AuthService from './auth.service';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';

// -------------------- Signup --------------------
export const signupInitController = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.signupInit(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: result.message,
    data: { 
      email: result.email, 
      role: result.role, 
      profileData: result.profileData, 
      signupToken: result.signupToken,
      ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
    },
  });
});

export const signupVerifyOtpController = catchAsync(async (req: Request, res: Response) => {
  const signupToken = req.headers['x-signup-token'] as string;
  if (!signupToken) throw new AppError(StatusCodes.BAD_REQUEST, 'Signup token missing');

  const decoded = AuthService.verifySignupToken(signupToken);
  const { otp } = req.body;
  if (!otp) throw new AppError(StatusCodes.BAD_REQUEST, 'OTP is required');

  const result = await AuthService.signupVerifyOtp(decoded.email, otp);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'OTP verified successfully',
    data: result,
  });
});

// -------------------- Resend OTP --------------------
export const resendSignupOtp = catchAsync(async (req: Request, res: Response) => {
  const signupToken = req.headers['x-signup-token'] as string;
  if (!signupToken) throw new AppError(StatusCodes.BAD_REQUEST, 'Signup token missing');

  const result = await AuthService.resendSignupOtp(signupToken);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result,
  });
});

// -------------------- Login --------------------
export const loginController = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: result.message, data: result });
});

// -------------------- Refresh Token --------------------
export const refreshTokenController = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await AuthService.refreshAccessToken(refreshToken);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'New access token', data: result });
});

// -------------------- Forgot Password --------------------
export const forgotPasswordController = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const { otp, resetToken } = await AuthService.forgotPassword(email);

  // resetToken send with header
  res.setHeader("x-reset-token", resetToken);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'OTP sent to email',
    data: process.env.NODE_ENV === "development" ? { otp, resetToken } : { resetToken },
  });
});

// -------------------- Verify Forgot Password OTP --------------------
export const verifyForgotPasswordOtpController = catchAsync(async (req: Request, res: Response) => {
  const resetToken = req.headers['x-reset-token'] as string;
  const { otp } = req.body;

  await AuthService.verifyForgotPasswordOtp(resetToken, otp);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'OTP verified successfully. You can now reset your password.',
  });
});



// -------------------- Reset Password --------------------
export const resetPasswordController = catchAsync(async (req: Request, res: Response) => {
  const resetToken = req.headers['x-reset-token'] as string;
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) 
    throw new AppError(StatusCodes.BAD_REQUEST, 'All fields are required');

  if (newPassword !== confirmPassword) 
    throw new AppError(StatusCodes.BAD_REQUEST, 'Passwords do not match');

  await AuthService.resetPasswordWithToken(resetToken, newPassword, confirmPassword);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Password reset successfully. Please login.',
  });
});



// -------------------- Change Password --------------------
export const changePasswordController = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) throw new AppError(StatusCodes.BAD_REQUEST, 'All fields are required');
  if (newPassword !== confirmPassword) throw new AppError(StatusCodes.BAD_REQUEST, 'Passwords do not match');

  const result = await AuthService.changePassword(user.id, oldPassword, newPassword);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
  });
});
