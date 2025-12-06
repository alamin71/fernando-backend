// import { NextFunction, Request, Response } from "express";
// import { StatusCodes } from "http-status-codes";
// import { Secret } from "jsonwebtoken";
// import config from "../../config";
// import AppError from "../../errors/AppError";
// import { verifyToken } from "../../utils/verifyToken";
// import { User } from "../modules/user/user.model";

// const auth =
//   (...roles: string[]) =>
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const tokenWithBearer = req.headers.authorization;
//       if (!tokenWithBearer) {
//         throw new AppError(
//           StatusCodes.UNAUTHORIZED,
//           "You are not authorized !!"
//         );
//       }
//       if (!tokenWithBearer.startsWith("Bearer")) {
//         throw new AppError(
//           StatusCodes.UNAUTHORIZED,
//           "Token send is not valid !!"
//         );
//       }

//       if (tokenWithBearer && tokenWithBearer.startsWith("Bearer")) {
//         const token = tokenWithBearer.split(" ")[1];

//         //verify token
//         let verifyUser: any;
//         try {
//           verifyUser = verifyToken(token, config.jwt.jwt_secret as Secret);
//         } catch (error) {
//           throw new AppError(
//             StatusCodes.UNAUTHORIZED,
//             "You are not authorized !!"
//           );
//         }

//         //  user cheak isUserExist or not
//         const user = await User.isExistUserById(verifyUser.id);
//         if (!user) {
//           throw new AppError(
//             StatusCodes.NOT_FOUND,
//             "This user is not found !!"
//           );
//         }

//         if (user?.status === "blocked") {
//           throw new AppError(StatusCodes.FORBIDDEN, "This user is blocked !!");
//         }

//         if (user?.isDeleted) {
//           throw new AppError(
//             StatusCodes.FORBIDDEN,
//             "This user accaunt is deleted !!"
//           );
//         }

//         //guard user
//         if (roles.length && !roles.includes(verifyUser?.role)) {
//           throw new AppError(
//             StatusCodes.FORBIDDEN,
//             "You don't have permission to access this api !!"
//           );
//         }

//         //set user to header
//         req.user = verifyUser;
//         next();
//       }
//     } catch (error) {
//       next(error);
//     }
//   };

// export default auth;
// src/middleware/auth.ts
// import { NextFunction, Request, Response } from 'express';
// import { StatusCodes } from 'http-status-codes';
// import AppError from '../../errors/AppError';
// import { verifyAccessToken } from '../../utils/jwtHelper';
// import { User } from '../modules/user/user.model';

// // attach types to req.user
// declare global {
//   namespace Express {
//     interface Request {
//       user?: any;
//     }
//   }
// }

// const auth =
//   (...roles: string[]) =>
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const authHeader = req.headers.authorization;
//       if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized!!');
//       }

//       const token = authHeader.split(' ')[1];
//       let decoded: any;
//       try {
//         decoded = verifyAccessToken(token) as any;
//       } catch (err) {
//         throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token!!');
//       }

//       // Load user to ensure still exists and not blocked/deleted
//       const user = await User.isExistUserById(decoded.id);
//       if (!user) {
//         throw new AppError(StatusCodes.NOT_FOUND, 'User not found!!');
//       }
//       if (user.status === 'blocked') {
//         throw new AppError(StatusCodes.FORBIDDEN, 'User blocked!!');
//       }
//       if (user.isDeleted) {
//         throw new AppError(StatusCodes.FORBIDDEN, 'User deleted!!');
//       }

//       // Role guard
//       if (roles.length && !roles.includes(decoded.role)) {
//         throw new AppError(StatusCodes.FORBIDDEN, "You don't have permission to access this api!!");
//       }

//       req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
//       next();
//     } catch (error) {
//       next(error);
//     }
//   };

// export default auth;
// আগের কোড
// import { NextFunction, Request, Response } from "express";
// import { StatusCodes } from "http-status-codes";
// import { Secret } from "jsonwebtoken";
// import config from "../../config";
// import AppError from "../../errors/AppError";
// import { verifyToken } from "../../utils/verifyToken";
// import { User } from "../modules/user/user.model";

// const auth =
//   (...roles: string[]) =>
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const tokenWithBearer = req.headers.authorization;
//       if (!tokenWithBearer) {
//         throw new AppError(
//           StatusCodes.UNAUTHORIZED,
//           "You are not authorized !!"
//         );
//       }
//       if (!tokenWithBearer.startsWith("Bearer")) {
//         throw new AppError(
//           StatusCodes.UNAUTHORIZED,
//           "Token send is not valid !!"
//         );
//       }

//       if (tokenWithBearer && tokenWithBearer.startsWith("Bearer")) {
//         const token = tokenWithBearer.split(" ")[1];

//         //verify token
//         let verifyUser: any;
//         try {
//           verifyUser = verifyToken(token, config.jwt.jwt_secret as Secret);
//         } catch (error) {
//           throw new AppError(
//             StatusCodes.UNAUTHORIZED,
//             "You are not authorized !!"
//           );
//         }

//         //  user cheak isUserExist or not
//         const user = await User.isExistUserById(verifyUser.id);
//         if (!user) {
//           throw new AppError(
//             StatusCodes.NOT_FOUND,
//             "This user is not found !!"
//           );
//         }

//         if (user?.status === "blocked") {
//           throw new AppError(StatusCodes.FORBIDDEN, "This user is blocked !!");
//         }

//         if (user?.isDeleted) {
//           throw new AppError(
//             StatusCodes.FORBIDDEN,
//             "This user accaunt is deleted !!"
//           );
//         }

//         //guard user
//         if (roles.length && !roles.includes(verifyUser?.role)) {
//           throw new AppError(
//             StatusCodes.FORBIDDEN,
//             "You don't have permission to access this api !!"
//           );
//         }

//         //set user to header
//         req.user = verifyUser;
//         next();
//       }
//     } catch (error) {
//       next(error);
//     }
//   };

// export default auth;

// Updated কোড (jwtHelper দিয়ে, console log সহ)
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { jwtHelper } from "../../helpers/jwtHelper";
import { User } from "../modules/user/user.model";

// attach types to req.user
declare global {
  namespace Express {
    interface Request {
      user: any;
    }
  }
}

const auth =
  (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("No or invalid authorization header");
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          "You are not authorized!!"
        );
      }

      const token = authHeader.split(" ")[1];
      let decoded: any;
      try {
        decoded = jwtHelper.verifyAccessToken(token) as any;
      } catch (err) {
        console.error("Token verify failed:", err);
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          "Invalid or expired token!!"
        );
      }

      // Load user to ensure still exists and not blocked/deleted
      const user = await User.isExistUserById(decoded.id);
      if (!user) {
        console.error("User not found:", decoded.id);
        throw new AppError(StatusCodes.NOT_FOUND, "User not found!!");
      }
      if (user.status === "BLOCKED") {
        console.error("User blocked:", decoded.id);
        throw new AppError(StatusCodes.FORBIDDEN, "User blocked!!");
      }
      if (user.isDeleted) {
        console.error("User deleted:", decoded.id);
        throw new AppError(StatusCodes.FORBIDDEN, "User deleted!!");
      }

      // Role guard
      if (roles.length && !roles.includes(decoded.role)) {
        console.error("Role forbidden:", decoded.role);
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "You don't have permission to access this api!!"
        );
      }

      req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      next(error);
    }
  };

export default auth;
