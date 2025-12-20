import express, { NextFunction, Request, Response } from "express";
import { USER_ROLES } from "../../../enums/user";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import { getSingleFilePath } from "../../../shared/getFilePath";
import auth from "../../middleware/auth";
import upload from "../../middleware/fileUpload";
import validateRequest from "../../middleware/validateRequest";
const router = express.Router();

router
  .route("/profile")
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.CREATOR),
    UserController.getUserProfile
  )
  .patch(
    auth(USER_ROLES.ADMIN, USER_ROLES.CREATOR),

    upload.single("file"),
    validateRequest(UserValidation.updateUserZodSchema),
    UserController.updateProfile
  );
router
  .route("/")
  .post(
    validateRequest(UserValidation.createUserZodSchema),
    UserController.createUser
  );

router.delete(
  "/delete",
  auth(USER_ROLES.CREATOR),
  UserController.deleteProfile
);

// ============ CHANNEL CUSTOMIZATION ROUTES ============

/**
 * 🖼️ UPDATE CHANNEL PHOTOS
 * PATCH /api/v1/users/:id/channel-photos
 * Purpose: Upload profile + cover photos
 * Auth: Creator only
 */
router.patch(
  "/:id/channel-photos",
  auth(USER_ROLES.CREATOR),
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  UserController.updateChannelPhotos
);

/**
 * ℹ️ UPDATE CHANNEL INFO
 * PATCH /api/v1/users/:id/channel-info
 * Purpose: Update channel name, username, description
 * Auth: Creator only
 */
router.patch(
  "/:id/channel-info",
  auth(USER_ROLES.CREATOR),
  UserController.updateChannelInfo
);

/**
 * 🔗 ADD SOCIAL ACCOUNT
 * POST /api/v1/users/:id/social-accounts
 * Purpose: Add social media links
 * Auth: Creator only
 */
router.post(
  "/:id/social-accounts",
  auth(USER_ROLES.CREATOR),
  UserController.addSocialAccount
);

/**
 * ✏️ UPDATE SOCIAL ACCOUNT
 * PATCH /api/v1/users/:id/social-accounts/:socialId
 * Purpose: Edit social media link
 * Auth: Creator only
 */
router.patch(
  "/:id/social-accounts/:socialId",
  auth(USER_ROLES.CREATOR),
  UserController.updateSocialAccount
);

/**
 * 🗑️ DELETE SOCIAL ACCOUNT
 * DELETE /api/v1/users/:id/social-accounts/:socialId
 * Purpose: Remove social media link
 * Auth: Creator only
 */
router.delete(
  "/:id/social-accounts/:socialId",
  auth(USER_ROLES.CREATOR),
  UserController.deleteSocialAccount
);

/**
 * 📋 GET CHANNEL DETAILS
 * GET /api/v1/users/:id/channel-details
 * Purpose: Get complete channel info (public)
 * Auth: Not required
 */
router.get("/:id/channel-details", UserController.getChannelDetails);

export const UserRouter = router;
