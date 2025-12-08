import { model, Schema } from "mongoose";
import { IStreamCategory, StreamCategoryModel } from "./streamCategory.interface";

const streamCategorySchema = new Schema<IStreamCategory, StreamCategoryModel>(
  {
    name: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    icon: { type: String, default: "" },
    color: { type: String, default: "#FF0000" },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Indexes
streamCategorySchema.index({ isActive: 1 });
streamCategorySchema.index({ slug: 1 });

streamCategorySchema.statics.getActiveCategories = async function () {
  return await this.find({ isActive: true }).lean();
};

export const StreamCategory = model<IStreamCategory, StreamCategoryModel>(
  "StreamCategory",
  streamCategorySchema
);
