import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { SubscriptionService } from "./subscription.service";
import sendResponse from "../../../shared/sendResponse";
import { emailHelper } from "../../../helpers/emailHelper";
import { User } from "../user/user.model";

// -------------------- Create Subscription --------------------
const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.createSubscription(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Subscription created successfully",
    data: result,
  });
});

// -------------------- Get All Subscriptions --------------------
const getAllSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.getAllSubscriptions(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscriptions retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// -------------------- Get Single Subscription --------------------
const getSingleSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubscriptionService.getSingleSubscription(
      req.params.id
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscription retrieved successfully",
      data: result,
    });
  }
);

// -------------------- Update Subscription --------------------
const updateSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.updateSubscription(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription updated successfully",
    data: result,
  });
});

// -------------------- Delete Subscription --------------------
const deleteSubscription = catchAsync(async (req: Request, res: Response) => {
  await SubscriptionService.deleteSubscription(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription deleted successfully",
  });
});

// -------------------- Select Subscription --------------------
const selectSubscription = catchAsync(async (req: Request, res: Response) => {
  const { userId, planId } = req.body;
  const result = await SubscriptionService.selectSubscription(userId, planId);
  res.json({ message: "Subscription selected", data: result });
});

// -------------------- Approve Subscription --------------------
const approveUserSubscription = catchAsync(async (req, res) => {
  const { userId } = req.body;
  const data = await SubscriptionService.approveUserSubscription(userId);

  // get user info
  const user = await User.findById(userId);
  if (user) {
    await emailHelper.sendEmail({
      to: user.email,
      subject: "Your Subscription Has Been Approved 🎉",
      html: `
        <h2>Hi ${user.name || "User"},</h2>
        <p>Good news! Your subscription has been <b>approved</b> by admin ✅</p>
        <p>You can now log in and start enjoying all premium features.</p>
        <br/>
        <p>Welcome onboard 🚀</p>
      `,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription approved by admin",
    data,
  });
});

// -------------------- Reject Subscription --------------------
const rejectUserSubscription = catchAsync(async (req, res) => {
  const { userId } = req.body;
  const data = await SubscriptionService.rejectUserSubscription(userId);

  // get user info
  const user = await User.findById(userId);
  if (user) {
    await emailHelper.sendEmail({
      to: user.email,
      subject: "Your Subscription Request Was Rejected",
      html: `
        <h2>Hi ${user.name || "User"},</h2>
        <p>Unfortunately, your subscription request has been <b>rejected</b> ❌</p>
        <p>If you think this is a mistake, please contact our support team.</p>
        <br/>
        <p>Thank you for your understanding 🙏</p>
      `,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription rejected by admin",
    data,
  });
});

export const SubscriptionController = {
  createSubscription,
  getAllSubscriptions,
  getSingleSubscription,
  updateSubscription,
  deleteSubscription,
  selectSubscription,
  approveUserSubscription,
  rejectUserSubscription,
};
