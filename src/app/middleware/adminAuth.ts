import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { jwtHelper } from "../../helpers/jwtHelper";
import { Admin } from "../modules/admin/admin.model";

const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!!");
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = jwtHelper.verifyAccessToken(token) as any;
    } catch (err) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "Invalid or expired token!!"
      );
    }

    // Check if admin exists in Admin collection (not User collection)
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      throw new AppError(StatusCodes.NOT_FOUND, "Admin not found!!");
    }

    if (!admin.isActive) {
      throw new AppError(StatusCodes.FORBIDDEN, "Admin account is inactive!!");
    }

    // Check if role is admin or super_admin
    if (!["admin", "super_admin"].includes(decoded.role)) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You don't have permission to access this api!!"
      );
    }

    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch (error) {
    next(error);
  }
};

export default adminAuth;
