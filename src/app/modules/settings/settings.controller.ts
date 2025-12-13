import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import AppError from "../../../errors/AppError";
import { PageSettings } from "./settings.model";

// Update Privacy Policy
const updatePrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Privacy policy content is required"
    );
  }

  // Use singleton pattern - only one settings document
  let settings = await PageSettings.findOne();
  if (!settings) {
    settings = await PageSettings.create({
      privacyPolicy: content,
      lastUpdated: new Date(),
    });
  } else {
    settings.privacyPolicy = content;
    settings.lastUpdated = new Date();
    await settings.save();
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Privacy policy updated successfully",
    data: {
      privacyPolicy: settings.privacyPolicy,
      lastUpdated: settings.lastUpdated,
    },
  });
});

// Update Terms & Conditions
const updateTermsAndConditions = catchAsync(
  async (req: Request, res: Response) => {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Terms and conditions content is required"
      );
    }

    let settings = await PageSettings.findOne();
    if (!settings) {
      settings = await PageSettings.create({
        termsAndConditions: content,
        lastUpdated: new Date(),
      });
    } else {
      settings.termsAndConditions = content;
      settings.lastUpdated = new Date();
      await settings.save();
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Terms and conditions updated successfully",
      data: {
        termsAndConditions: settings.termsAndConditions,
        lastUpdated: settings.lastUpdated,
      },
    });
  }
);

// Get Privacy Policy
const getPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
  const settings = await PageSettings.findOne();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Privacy policy retrieved successfully",
    data: {
      privacyPolicy: settings?.privacyPolicy || "",
      lastUpdated: settings?.lastUpdated || null,
    },
  });
});

// Get Terms & Conditions
const getTermsAndConditions = catchAsync(
  async (req: Request, res: Response) => {
    const settings = await PageSettings.findOne();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Terms and conditions retrieved successfully",
      data: {
        termsAndConditions: settings?.termsAndConditions || "",
        lastUpdated: settings?.lastUpdated || null,
      },
    });
  }
);

// Get All Settings (both privacy policy and terms)
const getAllSettings = catchAsync(async (req: Request, res: Response) => {
  const settings = await PageSettings.findOne();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Settings retrieved successfully",
    data: {
      privacyPolicy: settings?.privacyPolicy || "",
      termsAndConditions: settings?.termsAndConditions || "",
      lastUpdated: settings?.lastUpdated || null,
    },
  });
});

export const settingsControllers = {
  updatePrivacyPolicy,
  updateTermsAndConditions,
  getPrivacyPolicy,
  getTermsAndConditions,
  getAllSettings,
};
