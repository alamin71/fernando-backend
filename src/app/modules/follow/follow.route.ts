import express from "express";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middleware/auth";
import {
  followController,
  extendedFollowController,
} from "./follow.controller";

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
router.get("/:creatorId/followers", followController.getFollowers);
router.get("/:creatorId/following", followController.getFollowing);

// Convenience: get current creator's followers/following
router.get(
  "/me/followers",
  auth(USER_ROLES.CREATOR, USER_ROLES.ADMIN),
  extendedFollowController.getMyFollowers
);
router.get(
  "/me/following",
  auth(USER_ROLES.CREATOR, USER_ROLES.ADMIN),
  extendedFollowController.getMyFollowing
);

/**
 * Check if authenticated user follows a creator
 */
router.get(
  "/:creatorId/status",
  auth(USER_ROLES.CREATOR, USER_ROLES.ADMIN),
  followController.checkFollowStatus
);

export const followRoutes = router;
