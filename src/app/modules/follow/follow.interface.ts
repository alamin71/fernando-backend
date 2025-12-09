import { Model } from "mongoose";

export interface IFollow {
  _id?: string;
  followerId: string; // User who is following
  followingId: string; // User being followed (Creator)
  createdAt?: Date;
}

export type FollowModel = Model<IFollow>;
