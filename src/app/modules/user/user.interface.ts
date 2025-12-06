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

import { Model, Types } from "mongoose";
import { USER_ROLES } from "../../../enums/user";

export type ProfileData = {
  // Common
  phone?: string;
  location?: string;

  // USER specific
  firstName?: string;
  lastName?: string;
  age?: number;
  weight?: number;
  gender?: string;

  // Service Provider specific
  designation?: string;
  resumeUrl?: string;

  // Hospitality Venue specific
  venueName?: string;
  hoursOfOperation?: string;
  capacity?: number;
  displayQrCodes?: boolean;
  inAppPromotion?: boolean;
  allowRewards?: boolean;
  allowEvents?: boolean;
  venueTypes?: string[];
};
// ----------------- Document -----------------
export interface IDocument {
  name: string;
  url: string;
  uploadedAt?: Date;
  verified?: boolean;
}

// ----------------- Enums -----------------
export type SubscriptionStatus = "PENDING" | "ACTIVE" | "REJECTED" | "EXPIRED";

export type UserStatus = "ACTIVE" | "BLOCKED";

// ----------------- Subscription Data -----------------
export type SubscriptionData = {
  planId?: string | Types.ObjectId | null;
  status?: SubscriptionStatus;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  plan?: string;
  expiresAt?: Date;
};

// ----------------- User -----------------
export type IUser = {
  name: string;
  role: USER_ROLES;
  email: string;
  password: string;
  image?: string;
  isDeleted?: boolean;
  stripeCustomerId?: string;
  defaultPaymentMethodId?: string;
  status?: UserStatus;
  verified?: boolean;

  profileData?: ProfileData;
  subscription?: SubscriptionData;
  documents?: IDocument[];

  authentication?: {
    isResetPassword?: boolean;
    oneTimeCode?: number;
    expireAt?: Date;
  };
};

export type UserModel = Model<IUser> & {
  isExistUserById(id: string): Promise<IUser | null>;
  isExistUserByEmail(email: string): Promise<IUser | null>;
  isExistUserByPhone(contact: string): Promise<IUser | null>;
  isMatchPassword(password: string, hashPassword: string): Promise<boolean>;
};
