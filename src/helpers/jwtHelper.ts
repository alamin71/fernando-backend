// import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

// const createToken = (payload: object, secret: Secret, expireTime: string) => {
//   return jwt.sign(payload, secret, { expiresIn: expireTime } as SignOptions);
// };

// const verifyToken = (token: string, secret: Secret) => {
//   return jwt.verify(token, secret) as JwtPayload;
// };

// export const jwtHelper = { createToken, verifyToken };
// import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
// import ms from "ms"; // for type support
// import config from "../config";

// // Secret getter
// const getSecret = (secret: string | undefined): Secret => {
//   if (!secret) {
//     throw new Error("JWT secret is not defined");
//   }
//   return secret as Secret;
// };

// // Create Access Token
// const createAccessToken = (payload: object) => {
//   const options: SignOptions = { 
//     expiresIn: config.jwt.jwt_expire_in as ms.StringValue || "30d" 
//   };
//   return jwt.sign(payload, getSecret(config.jwt.jwt_secret), options);
// };

// // Create Refresh Token
// const createRefreshToken = (payload: object) => {
//   const options: SignOptions = { 
//     expiresIn: config.jwt.jwt_refresh_expire_in as ms.StringValue || "365d" 
//   };
//   return jwt.sign(payload, getSecret(config.jwt.jwt_refresh_secret), options);
// };

// // Create Reset Password Token (Add this)
// const createResetPasswordToken = (payload: object) => {
//   const options: SignOptions = { 
//     expiresIn: "10m" // 10 মিনিটের জন্য
//   };
//   return jwt.sign(payload, getSecret(config.jwt.jwt_reset_password_secret), options);
// };

// // Verify Access Token
// const verifyAccessToken = (token: string) => {
//   return jwt.verify(token, getSecret(config.jwt.jwt_secret)) as JwtPayload;
// };

// // Verify Refresh Token
// const verifyRefreshToken = (token: string) => {
//   return jwt.verify(token, getSecret(config.jwt.jwt_refresh_secret)) as JwtPayload;
// };

// // Verify Reset Password Token (Add this)
// const verifyResetPasswordToken = (token: string) => {
//   return jwt.verify(token, getSecret(config.jwt.jwt_reset_password_secret)) as JwtPayload;
// };

// export const jwtHelper = {
//   createAccessToken,
//   createRefreshToken,
//   createResetPasswordToken,     
//   verifyAccessToken,
//   verifyRefreshToken,
//   verifyResetPasswordToken       
// };

import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import ms from "ms"; // for type support
import config from "../config";

// Secret getter
const getSecret = (secret: string | undefined): Secret => {
  if (!secret) {
    throw new Error("JWT secret is not defined");
  }
  return secret as Secret;
};

// Create Access Token
const createAccessToken = (payload: object) => {
  const options: SignOptions = { 
    expiresIn: config.jwt.jwt_expire_in as ms.StringValue || "30d" 
  };
  return jwt.sign(payload, getSecret(config.jwt.jwt_secret), options);
};

// Create Refresh Token
const createRefreshToken = (payload: object) => {
  const options: SignOptions = { 
    expiresIn: config.jwt.jwt_refresh_expire_in as ms.StringValue || "365d" 
  };
  return jwt.sign(payload, getSecret(config.jwt.jwt_refresh_secret), options);
};

// Create Reset Password Token
const createResetPasswordToken = (payload: object) => {
  const options: SignOptions = { 
    expiresIn: "10m"
  };
  return jwt.sign(payload, getSecret(config.jwt.jwt_reset_password_secret), options);
};

// ---- New: Signup Token ----
const createSignupToken = (payload: object) => {
  const options: SignOptions = { expiresIn: "10m" }; 
  return jwt.sign(payload, getSecret(config.jwt.jwt_signup_secret), options);
};

const verifySignupToken = (token: string) => {
  return jwt.verify(token, getSecret(config.jwt.jwt_signup_secret)) as JwtPayload;
};

// Verify Access Token
const verifyAccessToken = (token: string) => {
  return jwt.verify(token, getSecret(config.jwt.jwt_secret)) as JwtPayload;
};

// Verify Refresh Token
const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, getSecret(config.jwt.jwt_refresh_secret)) as JwtPayload;
};

// Verify Reset Password Token
const verifyResetPasswordToken = (token: string) => {
  return jwt.verify(token, getSecret(config.jwt.jwt_reset_password_secret)) as JwtPayload;
};

export const jwtHelper = {
  createAccessToken,
  createRefreshToken,
  createResetPasswordToken,
  createSignupToken,         // <-- added
  verifyAccessToken,
  verifyRefreshToken,
  verifyResetPasswordToken,
  verifySignupToken          // <-- added
};
