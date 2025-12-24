import { Router } from "express";
import adminAuth from "../../middleware/adminAuth";
import { adminControllers } from "./admin.controller";
import upload from "../../middleware/fileUpload";

const router = Router();

router.post("/login", adminControllers.adminLogin);
router.get("/me", adminAuth, adminControllers.getProfile);
router.get("/stats", adminAuth, adminControllers.getPlatformStats);

router.get("/growth-overview", adminAuth, adminControllers.getGrowthOverview);
router.get("/recent-creators", adminAuth, adminControllers.getRecentCreators);
router.get("/creators", adminAuth, adminControllers.getAllCreators);
router.get("/creators/export", adminAuth, adminControllers.exportCreators);
router.get("/creators/:id", adminAuth, adminControllers.getCreatorById);
router.delete("/creators/:id", adminAuth, adminControllers.deleteCreator);
router.post(
  "/creators/bulk-delete",
  adminAuth,
  adminControllers.bulkDeleteCreators
);
router.get("/streams", adminAuth, adminControllers.listStreams);
router.get(
  "/streams/:id/analytics",
  adminAuth,
  adminControllers.getStreamAnalytics
);

router.patch(
  "/update-profile",
  adminAuth,
  upload.single("img"),
  adminControllers.updateProfile
);
router.patch("/change-password", adminAuth, adminControllers.changePassword);
router.post("/forgot-password", adminControllers.forgotPassword);
router.post("/verify-otp", adminControllers.verifyOtp);
router.post("/reset-password", adminControllers.resetPassword);

// Block/Unblock creators
router.patch("/creators/:id/block", adminAuth, adminControllers.blockCreator);
router.patch(
  "/creators/:id/unblock",
  adminAuth,
  adminControllers.unblockCreator
);

export const adminRoutes = router;
