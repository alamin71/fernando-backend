import express from "express";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middleware/auth";
import { followController } from "./follow.controller";

const router = express.Router();

/**
 * Follow/Unfollow a creator
 */
router.post(
  "/:creatorId",
  auth(USER_ROLES.CREATOR, USER_ROLES.ADMIN),
  followController.followCreator
);

router.delete(
  "/:creatorId",
  auth(USER_ROLES.CREATOR, USER_ROLES.ADMIN),
  followController.unfollowCreator
);

/**
 * Get followers/following lists (public)
 */
router.get("/:userId/followers", followController.getFollowers);
router.get("/:userId/following", followController.getFollowing);

/**
 * Check if authenticated user follows a creator
 */
router.get(
  "/:creatorId/status",
  auth(USER_ROLES.CREATOR, USER_ROLES.ADMIN),
  followController.checkFollowStatus
);

export const followRoutes = router;
