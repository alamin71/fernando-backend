import { z } from "zod";

export const createUserZodSchema = z.object({
  body: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
  }),
});
const otpVerifyZodSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6, { message: "OTP must be 6 digits" }),
  }),
});

const resendOtpZodSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const forgotPasswordZodSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const resetPasswordZodSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6, { message: "OTP must be 6 digits" }),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  }),
});

const changePasswordZodSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  }),
});
const updateUserZodSchema = z.object({
  body: z.object({
    contact: z.string().optional(),
    address: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    password: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const UserValidation = {
  createUserZodSchema,
  otpVerifyZodSchema,
  resendOtpZodSchema,
  forgotPasswordZodSchema,
  resetPasswordZodSchema,
  changePasswordZodSchema,
  updateUserZodSchema,
};
