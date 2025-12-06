// import bcrypt from "bcrypt";
// import { StatusCodes } from "http-status-codes";
// import { model, Schema } from "mongoose";
// import config from "../../../config";
// import { USER_ROLES } from "../../../enums/user";
// import AppError from "../../../errors/AppError";
// import { IUser, UserModel } from "./user.interface";

// const userSchema = new Schema<IUser, UserModel>(
//   {
//     role: {
//       type: String,
//       enum: Object.values(USER_ROLES),
//       default: USER_ROLES.USER,
//     },
//     email: { type: String, required: true, unique: true, lowercase: true },
//     password: { type: String, required: true, select: false, minlength: 8 },
//     image: { type: String, default: "" },
//     status: { type: String, enum: ["active", "blocked"], default: "active" },
//     verified: { type: Boolean, default: false },
//     isDeleted: { type: Boolean, default: false },

//     stripeCustomerId: { type: String, default: "" },
//     defaultPaymentMethodId: { type: String, default: "" },

//     profileData: {
//       // Common
//       phone: { type: String, default: "" },
//       location: { type: String, default: "" },

//       // User specific
//       firstName: { type: String, default: "" },
//       lastName: { type: String, default: "" },
//       age: { type: Number, default: null },
//       weight: { type: Number, default: null },
//       gender: { type: String, default: "" },

//       // Service Provider specific
//       designation: { type: String, default: "" },
//       resumeUrl: { type: String, default: "" },

//       // Hospitality Venue specific
//       venueName: { type: String, default: "" },
//       hoursOfOperation: { type: String, default: "" },
//       capacity: { type: Number, default: null },
//       displayQrCodes: { type: Boolean, default: false },
//       inAppPromotion: { type: Boolean, default: false },
//       allowRewards: { type: Boolean, default: false },
//       allowEvents: { type: Boolean, default: false },
//       venueTypes: { type: [String], default: [] },
//     },

//     subscription: {
//       planId: { type: String, default: null },
//       isActive: { type: Boolean, default: false },
//       startDate: { type: Date, default: null },
//       endDate: { type: Date, default: null },
//       plan: { type: String },
//       status: { type: String },
//       expiresAt: { type: Date },
//     },

//     authentication: {
//       isResetPassword: { type: Boolean, default: false },
//       oneTimeCode: { type: Number, default: null },
//       expireAt: { type: Date, default: null },
//     },
//   },
//   { timestamps: true }
// );

// // Statics
// userSchema.statics.isExistUserById = async (id: string) => {
//   return await User.findById(id);
// };

// userSchema.statics.isExistUserByEmail = async (email: string) => {
//   return await User.findOne({ email });
// };

// userSchema.statics.isExistUserByPhone = async (contact: string) => {
//   return await User.findOne({ "profileData.phone": contact });
// };

// userSchema.statics.isMatchPassword = async (
//   password: string,
//   hashPassword: string
// ): Promise<boolean> => {
//   return await bcrypt.compare(password, hashPassword);
// };

// // Hooks
// userSchema.pre("save", async function (next) {
//   if (this.isModified("email")) {
//     const isExist = await User.findOne({ email: this.get("email") });
//     if (isExist) {
//       throw new AppError(StatusCodes.BAD_REQUEST, "Email already exists!");
//     }
//   }

//   if (this.isModified("password")) {
//     this.password = await bcrypt.hash(
//       this.password,
//       Number(config.bcrypt_salt_rounds)
//     );
//   }

//   next();
// });

// userSchema.pre("find", function (next) {
//   this.find({ isDeleted: { $ne: true } });
//   next();
// });

// userSchema.pre("findOne", function (next) {
//   this.find({ isDeleted: { $ne: true } });
//   next();
// });

// userSchema.pre("aggregate", function (next) {
//   this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
//   next();
// });

// export const User = model<IUser, UserModel>("User", userSchema);
import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { model, Schema } from "mongoose";
import config from "../../../config";
import { USER_ROLES, GENDER, DESIGNATION } from "../../../enums/user";
import AppError from "../../../errors/AppError";
import { IUser, UserModel } from "./user.interface";

const userSchema = new Schema<IUser, UserModel>(
  {
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false, minlength: 8 },
    image: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REJECTED"],
      default: "PENDING",
    },
    verified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },

    stripeCustomerId: { type: String, default: "" },
    defaultPaymentMethodId: { type: String, default: "" },

    profileData: {
      // Common
      phone: { type: String, default: "" },
      location: { type: String, default: "" },

      // User specific
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      age: { type: Number, default: null },
      weight: { type: Number, default: null },
      gender: {
        type: String,
        enum: Object.values(GENDER),
        required: function () {
          return this.role === USER_ROLES.USER;
        },
        default: null,
      },

      designation: {
        type: String,
        enum: Object.values(DESIGNATION),
        required: function () {
          return this.role === USER_ROLES.SERVICE_PROVIDER;
        },
      },

      resumeUrl: { type: String, default: "" },

      // Hospitality Venue specific
      venueName: { type: String, default: "" },
      hoursOfOperation: { type: String, default: "" },
      capacity: { type: Number, default: null },
      displayQrCodes: { type: Boolean, default: false },
      inAppPromotion: { type: Boolean, default: false },
      allowRewards: { type: Boolean, default: false },
      allowEvents: { type: Boolean, default: false },
      venueTypes: { type: [String], default: [] },
    },
    // Necessary Documents (for Service Providers & Hospitality Venue)
    documents: [
      {
        name: { type: String, required: true }, // e.g. "Trade License", "NID"
        url: { type: String, required: true }, // file storage url
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false }, // admin verification
      },
    ],
    subscription: {
      planId: { type: String, default: null },
      isActive: { type: Boolean, default: false },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      plan: { type: String },
      status: { type: String },
      expiresAt: { type: Date },
    },

    authentication: {
      isResetPassword: { type: Boolean, default: false },
      oneTimeCode: { type: Number, default: null },
      expireAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// ---------- Statics ----------
userSchema.statics.isExistUserById = async (id: string) => {
  return await User.findById(id);
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};

userSchema.statics.isExistUserByPhone = async (contact: string) => {
  return await User.findOne({ "profileData.phone": contact });
};

userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

// ---------- Hooks ----------
userSchema.pre("save", async function (next) {
  if (this.isModified("email")) {
    const isExist = await User.findOne({ email: this.get("email") });
    if (isExist) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Email already exists!");
    }
  }

  if (this.isModified("password")) {
    this.password = await bcrypt.hash(
      this.password,
      Number(config.bcrypt_salt_rounds)
    );
  }

  next();
});

userSchema.pre("find", function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre("findOne", function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export const User = model<IUser, UserModel>("User", userSchema);
