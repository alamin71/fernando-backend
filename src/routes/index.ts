import express from "express";
import { UserRouter } from "../app/modules/user/user.route";
import AuthRouter from "../app/modules/auth/auth.route";
import { adminRoutes } from "../app/modules/admin/admin.route";
import { categoryRoutes } from "../app/modules/category/category.route";
import { settingsRoutes } from "../app/modules/settings/settings.route";
import { streamRoutes } from "../app/modules/stream/stream.route";
import { followRoutes } from "../app/modules/follow/follow.route";
import mongoose from "mongoose";

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  const healthCheck = {
    status: "UP",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development",
  };
  res.status(200).json(healthCheck);
});
const routes = [
  {
    path: "/auth",
    route: AuthRouter,
  },
  {
    path: "/users",
    route: UserRouter,
  },
  {
    path: "/admin",
    route: adminRoutes,
  },
  {
    path: "/admin",
    route: categoryRoutes,
  },
  {
    path: "/admin/settings",
    route: settingsRoutes,
  },
  {
    path: "/streams",
    route: streamRoutes,
  },
  {
    path: "/follow",
    route: followRoutes,
  },
];

routes.forEach((element) => {
  if (element?.path && element?.route) {
    router.use(element?.path, element?.route);
  }
});

export default router;
