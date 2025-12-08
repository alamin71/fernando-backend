import { Model } from "mongoose";

export interface IStreamLike {
  _id?: string;
  streamId: string; // Reference to Stream
  userId: string; // Reference to User
  createdAt?: Date;
}

export type StreamLikeModel = Model<IStreamLike>;
