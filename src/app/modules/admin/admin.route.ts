// import express from "express";
// import { USER_ROLES } from "../../../enums/user";
// import { AdminController } from "./admin.controller";
// import { AdminValidation } from "./admin.validation";
// import auth from "../../middleware/auth";
// import validateRequest from "../../middleware/validateRequest";
// const router = express.Router();

// router.post(
//   "/create-admin",
//   auth(USER_ROLES.SUPER_ADMIN),
//   validateRequest(AdminValidation.createAdminZodSchema),
//   AdminController.createAdmin
// );

// router.get(
//   "/get-admin",
//   auth(USER_ROLES.SUPER_ADMIN),
//   AdminController.getAdmin
// );

// router.delete(
//   "/:id",
//   auth(USER_ROLES.SUPER_ADMIN),
//   AdminController.deleteAdmin
// );

// export const AdminRoutes = router;
import { Router } from "express";
import auth from "../../middleware/auth";
import { adminControllers } from "./admin.controller";
import upload from "../../middleware/fileUpload";

const router = Router();

router.post("/login", adminControllers.adminLogin);
router.get("/me", auth("admin"), adminControllers.getProfile);

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
