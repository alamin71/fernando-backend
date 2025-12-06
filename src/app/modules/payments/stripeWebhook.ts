import express, { Request, Response } from "express";
import stripe from "../../../config/stripe";
import { Payment } from "./payment.model";
import { PaymentStatus } from "./payment.interface";
import { User } from "../user/user.model";
import { emailHelper } from "../../../helpers/emailHelper";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
    } catch (err: any) {
      console.error("Webhook Error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;

      // 1) payment row update
      const paymentDoc = await Payment.findOneAndUpdate(
        { transactionId: paymentIntent.id },
        { status: PaymentStatus.SUCCESS },
        { new: true }
      );

      // 2) mark subscription as pending admin approval
      if (paymentDoc) {
        const user = await User.findById(paymentDoc.userId);
        if (
          user &&
          (!user.subscription?.isActive ||
            user.subscription?.status !== "ACTIVE")
        ) {
          await User.findByIdAndUpdate(paymentDoc.userId, {
            $set: {
              "subscription.plan": paymentDoc.subscriptionId,
              "subscription.status": "pending_approval",
              "subscription.isActive": false,
            },
          });

          // 3) send confirmation email to user
          await emailHelper.sendEmail({
            to: user.email,
            subject: "Payment Successful - Subscription Pending Approval",
            html: `
              <h2>Hi ${user.name || "User"},</h2>
              <p>We have received your payment successfully 🎉</p>
              <p>Your subscription request is now <b>pending admin approval</b>.</p>
              <p>We’ll notify you once the admin approves your subscription.</p>
              <br/>
              <p>Thank you for choosing us!</p>
            `,
          });
        }
      }
    }

    res.status(200).json({ received: true });
  }
);

export default router;
