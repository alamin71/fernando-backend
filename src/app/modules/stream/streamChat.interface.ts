import { Model } from "mongoose";

export interface IStreamChat {
  _id?: string;
  streamId: string; // Reference to Stream
  userId: string; // Reference to User
  message: string;
  messageType: "TEXT" | "SYSTEM"; // SYSTEM for events like "User joined"
  createdAt?: Date;
  updatedAt?: Date;
}

export type StreamChatModel = Model<IStreamChat>;
