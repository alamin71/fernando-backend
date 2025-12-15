import express from "express";
import { UserRouter } from "../app/modules/user/user.route";
import AuthRouter from "../app/modules/auth/auth.route";
import { adminRoutes } from "../app/modules/admin/admin.route";
import { categoryRoutes } from "../app/modules/category/category.route";
import { settingsRoutes } from "../app/modules/settings/settings.route";
import { streamRoutes } from "../app/modules/stream/stream.route";

const router = express.Router();
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
    path: "/categories",
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
];

routes.forEach((element) => {
  if (element?.path && element?.route) {
    router.use(element?.path, element?.route);
  }
});

export default router;
