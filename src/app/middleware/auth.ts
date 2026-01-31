// Updated code (by jwtHelper , with console log)
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
          "You are not authorized!!",
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
          "Invalid or expired token!!",
        );
      }

      // Load user to ensure still exists and not blocked/deleted
      const user = await User.isExistUserById(decoded.id);
      if (!user) {
        console.error("User not found:", decoded.id);
        throw new AppError(StatusCodes.NOT_FOUND, "User not found!!");
      }
      if (user.status === "REJECTED") {
        console.error("User rejected:", decoded.id);
        throw new AppError(StatusCodes.FORBIDDEN, "User account rejected!!");
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
          "You don't have permission to access this api!!",
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
