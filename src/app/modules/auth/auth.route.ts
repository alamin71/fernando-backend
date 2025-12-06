


import express from 'express';
import * as AuthController from './auth.controller';
import { AuthValidation } from './auth.validation';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';

const router = express.Router();

// Signup
router.post('/signup/init', validateRequest(AuthValidation.createSignupZodSchema), AuthController.signupInitController);
router.post('/verify-otp', validateRequest(AuthValidation.createVerifyOtpZodSchema), AuthController.signupVerifyOtpController);
router.post('/resend-otp', AuthController.resendSignupOtp);

// Login
router.post('/login', validateRequest(AuthValidation.createLoginZodSchema), AuthController.loginController);
router.post('/refresh-token', validateRequest(AuthValidation.createRefreshTokenZodSchema), AuthController.refreshTokenController);

// Forgot / Reset / Change Password
router.post('/forgot-password', validateRequest(AuthValidation.createForgotPasswordZodSchema), AuthController.forgotPasswordController);
router.post('/verify-forgot-password-otp', validateRequest(AuthValidation.verifyForgotPasswordOtpZodSchema), AuthController.verifyForgotPasswordOtpController);
router.patch('/reset-password', validateRequest(AuthValidation.resetPasswordZodSchema), AuthController.resetPasswordController);
router.patch('/change-password', auth(), validateRequest(AuthValidation.createChangePasswordZodSchema), AuthController.changePasswordController);

export default router;
