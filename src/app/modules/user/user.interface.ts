// import { Model } from "mongoose";
// import { USER_ROLES } from "../../../enums/user";
// export type IUser = {
//   name: string;
//   role: USER_ROLES;
//   email: string;
//   password: string;
//   image?: string;
//   isDeleted: boolean;
//   stripeCustomerId: string;
//   address: string;
//   status: "active" | "blocked";
//   verified: boolean;
//   authentication?: {
//     isResetPassword: boolean;
//     oneTimeCode: number;
//     expireAt: Date;
//   };
// };

// export type UserModel = {
//   isExistUserById(id: string): any;
//   isExistUserByEmail(email: string): any;
//   isExistUserByPhone(contact: string): any;
//   isMatchPassword(password: string, hashPassword: string): boolean;
// } & Model<IUser>;
// import { Model } from "mongoose";
// import { USER_ROLES } from "../../../enums/user";

// // Profile Data Type (Role Specific Fields)
// export type ProfileData = {
//   phone?: string;
//   address?: string;

//   // Service Provider Specific
//   businessName?: string;
//   serviceCategory?: string;
//   portfolioLink?: string;

//   // Hospitality Venue Specific
//   venueName?: string;
//   venueType?: string;
//   location?: string;
//   capacity?: number;
//   amenities?: string[];
// };

// // Subscription Data Type
// export type SubscriptionData = {
//   planId?: string;
//   isActive: boolean;
//   startDate?: Date;
//   endDate?: Date;
//    plan?: String;
//   status?:String ;
// };

// // User Main Interface
// export type IUser = {
//   name: string;
//   role: USER_ROLES;
//   email: string;
//   password: string;
//   image?: string;
//   isDeleted: boolean;
//   stripeCustomerId: string;
//   defaultPaymentMethodId?: string;
//   status: "active" | "blocked";
//   verified: boolean;

//   profileData?: ProfileData;
//   subscription?: SubscriptionData;

//   authentication?: {
//     isResetPassword: boolean;
//     oneTimeCode: number;
//     expireAt: Date;
//   };
// };

// // Static Methods Interface
// export type UserModel = {
//   isExistUserById(id: string): any;
//   isExistUserByEmail(email: string): any;
//   isExistUserByPhone(contact: string): any;
//   isMatchPassword(password: string, hashPassword: string): boolean;
// } & Model<IUser>;

import { Model } from "mongoose";
import { USER_ROLES } from "../../../enums/user";

export type ProfileData = {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  location?: string;
};

export type CreatorStats = {
  totalFollowers?: number;
  totalStreams?: number;
  totalStreamViews?: number;
  totalLikes?: number;
};

export type SocialAccount = {
  _id?: string;
  platform?:
    | "twitter"
    | "instagram"
    | "youtube"
    | "twitch"
    | "discord"
    | "tiktok"
    | "facebook";
  url?: string;
  displayName?: string;
  createdAt?: Date;
};

export type IUser = {
  _id?: string;
  role: USER_ROLES;
  email: string;
  password?: string;
  username?: string;
  channelName?: string;
  image?: string;
  profilePhoto?: string;
  coverPhoto?: string;
  description?: string;
  verified?: boolean;
  isDeleted?: boolean;
  isBlocked?: boolean;
  status?: "PENDING" | "ACTIVE" | "REJECTED";

  profileData?: ProfileData;
  creatorStats?: CreatorStats;

  socialAccounts?: SocialAccount[];

  streamKey?: string;
  streamKeyUpdatedAt?: Date;

  followers?: string[];
  following?: string[];
  likedStreams?: string[]; // Stream IDs that user has liked

  authentication?: {
    isResetPassword?: boolean;
    oneTimeCode?: number;
    expireAt?: Date;
  };

  followerCount?: number; // derived field used in channel details response

  createdAt?: Date;
  updatedAt?: Date;
};

export type UserModel = Model<IUser> & {
  isExistUserById(id: string): Promise<IUser | null>;
  isExistUserByEmail(email: string): Promise<IUser | null>;
  isExistUserByPhone(contact: string): Promise<IUser | null>;
  isExistUserByUsername(username: string): Promise<IUser | null>;
  isExistUserByChannelName(channelName: string): Promise<IUser | null>;
  isMatchPassword(password: string, hashPassword: string): Promise<boolean>;
};
