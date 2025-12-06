// import { Request, Response, NextFunction } from 'express';

// export const checkSubscription = (req: Request, res: Response, next: NextFunction) => {
//   const user = req.user; // assuming req.user is populated by auth middleware

//   if (!user?.subscription?.isActive) {
//     return res.status(403).json({
//       success: false,
//       message: 'Your subscription has expired or is inactive. Please renew.'
//     });
//   }

//   next();
// };
import { Request, Response, NextFunction } from "express";
import { User } from "../modules/user/user.model";

export const checkSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id; // req.user set by auth middleware
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user || !user.subscription) {
      return res.status(403).json({ success: false, message: "No active subscription found" });
    }

    const subscription = user.subscription;

    // Check if subscription is active
    if (!subscription.isActive) {
      return res.status(403).json({ success: false, message: "Your subscription is inactive. Please renew." });
    }

    // Check expiry date
    if (subscription.expiresAt && subscription.expiresAt < new Date()) {
      return res.status(403).json({ success: false, message: "Your subscription has expired. Please renew." });
    }

    next(); // passed all checks
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
