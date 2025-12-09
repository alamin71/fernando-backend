import { Router } from "express";
import auth from "../../middleware/auth";
import { adminControllers } from "./admin.controller";
import upload from "../../middleware/fileUpload";

const router = Router();

router.post("/login", adminControllers.adminLogin);
router.get("/me", auth("admin"), adminControllers.getProfile);
router.get("/stats", auth("admin"), adminControllers.getPlatformStats);

router.get(
  "/growth-overview",
  auth("admin"),
  adminControllers.getGrowthOverview
);
router.get(
  "/recent-creators",
  auth("admin"),
  adminControllers.getRecentCreators
);
router.get("/users", auth("admin"), adminControllers.listUsers);
router.patch(
  "/users/:id/status",
  auth("admin"),
  adminControllers.updateUserStatus
);
router.get("/users/:id", auth("admin"), adminControllers.getUserById);
router.get("/streams", auth("admin"), adminControllers.listStreams);
router.get(
  "/streams/:id/analytics",
  auth("admin"),
  adminControllers.getStreamAnalytics
);

router.patch(
  "/update-profile",
  auth("admin", "super_admin"),
  upload.single("file"),
  adminControllers.updateProfile
);
router.patch(
  "/change-password",
  auth("admin", "super_admin"),
  adminControllers.changePassword
);
router.post("/forgot-password", adminControllers.forgotPassword);
router.post("/verify-otp", adminControllers.verifyOtp);
router.post("/reset-password", adminControllers.resetPassword);

export const adminRoutes = router;
