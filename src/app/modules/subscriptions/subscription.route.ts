import express from "express";
import { SubscriptionController } from "./subscription.controller";
import validateRequest from "../../middleware/validateRequest";
import { SubscriptionValidation } from "./subscription.validation";

const router = express.Router();

router.post(
  "/create-subscription",
  validateRequest(SubscriptionValidation.createSubscriptionZodSchema),
  SubscriptionController.createSubscription
);

router.get("/all-subscription", SubscriptionController.getAllSubscriptions);
router.get("/:id", SubscriptionController.getSingleSubscription);

router.patch(
  "/:id",
  validateRequest(SubscriptionValidation.updateSubscriptionZodSchema),
  SubscriptionController.updateSubscription
);
router.post("/select", SubscriptionController.selectSubscription);

router.post("/approve", SubscriptionController.approveUserSubscription);
router.post("/reject", SubscriptionController.rejectUserSubscription);

router.delete("/:id", SubscriptionController.deleteSubscription);

export const SubscriptionRoutes = router;
