import { model, Schema } from "mongoose";
import { IStreamCategory, CategoryModel } from "./category.interface";

const categorySchema = new Schema<IStreamCategory, CategoryModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    image: {
      type: String,
      default: "",
    },
    coverPhoto: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const StreamCategory = model<IStreamCategory, CategoryModel>(
  "StreamCategory",
  categorySchema
);
