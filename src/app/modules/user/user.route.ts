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
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),
    UserController.getUserProfile
  )
  .patch(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),

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

router.delete("/delete", auth(USER_ROLES.USER), UserController.deleteProfile);

export const UserRouter = router;
