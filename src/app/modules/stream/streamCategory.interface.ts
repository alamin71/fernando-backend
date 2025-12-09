import { Model } from "mongoose";

export interface IStreamCategory {
  _id?: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type StreamCategoryModel = Model<IStreamCategory>;
