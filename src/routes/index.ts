import express from "express";
import { UserRouter } from "../app/modules/user/user.route";
import AuthRouter from "../app/modules/auth/auth.route";

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
];

routes.forEach((element) => {
  if (element?.path && element?.route) {
    router.use(element?.path, element?.route);
  }
});

export default router;
