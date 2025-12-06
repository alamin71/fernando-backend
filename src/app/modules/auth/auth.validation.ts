import { z } from "zod";

// Signup
const createSignupZodSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  role: z.string().optional(),
  profileData: z.record(z.string(), z.any()).optional(),
});

// Verify OTP
const createVerifyOtpZodSchema = z.object({
  otp: z.string().length(4, { message: "OTP must be 4 digits" }),
});

// Login
const createLoginZodSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }),
  password: z.string().nonempty({ message: "Password is required" }),
});

// Refresh token
const createRefreshTokenZodSchema = z.object({
  refreshToken: z.string().nonempty({ message: "Refresh token is required" }),
});

// Resend OTP
const createResendOtpZodSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }),
});

// Forgot password
const createForgotPasswordZodSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }),
});
// Forgot password OTP verification (generates reset token)
const verifyForgotPasswordOtpZodSchema = z.object({
  otp: z.string().length(4, { message: "OTP must be 4 digits" }),
});

// Reset password (using reset token in headers)
const resetPasswordZodSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Confirm password must be at least 6 characters" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Change password (protected)
const createChangePasswordZodSchema = z
  .object({
    oldPassword: z.string().nonempty({ message: "oldPassword is required" }),
    newPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Confirm password must be at least 6 characters" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const AuthValidation = {
  createSignupZodSchema,
  createVerifyOtpZodSchema,
  createLoginZodSchema,
  createRefreshTokenZodSchema,
  createResendOtpZodSchema,
  createForgotPasswordZodSchema,
  resetPasswordZodSchema,
  createChangePasswordZodSchema,
  verifyForgotPasswordOtpZodSchema,
};
