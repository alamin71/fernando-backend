import { Model, Document } from "mongoose";

export interface IFollow extends Document {
  _id: string;
  followerId: string; // User who is following
  followingId: string; // User being followed (Creator)
  createdAt: Date;
}

export type FollowModel = Model<IFollow>;
