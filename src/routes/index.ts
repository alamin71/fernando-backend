import express from "express";
import { UserRouter } from "../app/modules/user/user.route";
import AuthRouter from "../app/modules/auth/auth.route";
import{PaymentRoutes} from "../app/modules/payments/payment.route";
import{SubscriptionRoutes} from "../app/modules/subscriptions/subscription.route"

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
    path: "/payment",
    route: PaymentRoutes,
  },
   {
    path: '/subscription',
    route: SubscriptionRoutes,
  },
];

routes.forEach((element) => {
  if (element?.path && element?.route) {
    router.use(element?.path, element?.route);
  }
});

export default router;
