import { Model } from "mongoose";

export interface IStreamCategory {
  _id?: string;
  name: string;
  image?: string;
  coverPhoto?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CategoryModel = Model<IStreamCategory>;
