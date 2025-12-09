import { Router } from "express";
import auth from "../../middleware/auth";
import adminAuth from "../../middleware/adminAuth";
import { adminControllers } from "./admin.controller";
import upload from "../../middleware/fileUpload";

const router = Router();

router.post("/login", adminControllers.adminLogin);
router.get("/me", adminAuth, adminControllers.getProfile);
router.get("/stats", adminAuth, adminControllers.getPlatformStats);

router.get("/growth-overview", adminAuth, adminControllers.getGrowthOverview);
router.get("/recent-creators", adminAuth, adminControllers.getRecentCreators);
router.get("/users", adminAuth, adminControllers.listUsers);
router.patch("/users/:id/status", adminAuth, adminControllers.updateUserStatus);
router.get("/users/:id", adminAuth, adminControllers.getUserById);
router.get("/streams", adminAuth, adminControllers.listStreams);
router.get(
  "/streams/:id/analytics",
  adminAuth,
  adminControllers.getStreamAnalytics
);

router.patch(
  "/update-profile",
  adminAuth,
  upload.single("file"),
  adminControllers.updateProfile
);
router.patch("/change-password", adminAuth, adminControllers.changePassword);
router.post("/forgot-password", adminControllers.forgotPassword);
router.post("/verify-otp", adminControllers.verifyOtp);
router.post("/reset-password", adminControllers.resetPassword);

export const adminRoutes = router;
