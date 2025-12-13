import { model, Schema } from "mongoose";

export interface IPageSettings {
  privacyPolicy?: string;
  termsAndConditions?: string;
  lastUpdated?: Date;
}

const pageSettingsSchema = new Schema<IPageSettings>(
  {
    privacyPolicy: { type: String, default: "" },
    termsAndConditions: { type: String, default: "" },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PageSettings = model<IPageSettings>(
  "PageSettings",
  pageSettingsSchema
);
