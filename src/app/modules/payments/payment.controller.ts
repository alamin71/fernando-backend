import { Request, Response } from "express";
import stripe from "../../../config/stripe";
import { SavedCard, Payment } from "./payment.model";
import { PaymentStatus } from "./payment.interface";
import type { Stripe } from "stripe";
import { Subscription } from "../subscriptions/subscription.model";

import { User } from "../user/user.model";

// ----------------------
// Save a new payment method (card) for a user
// ----------------------
const saveCard = async (req: Request, res: Response) => {
  try {
    const { userId, paymentMethodId, email } = req.body;

    // Create Stripe customer
    const customer = await stripe.customers.create({
      payment_method: paymentMethodId,
      email,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Retrieve card details
    const paymentMethod = (await stripe.paymentMethods.retrieve(
      paymentMethodId
    )) as Stripe.PaymentMethod;

    const savedCard = await SavedCard.create({
      userId,
      stripeCustomerId: customer.id,
      paymentMethodId,
      last4: paymentMethod.card?.last4,
      brand: paymentMethod.card?.brand,
      expMonth: paymentMethod.card?.exp_month,
      expYear: paymentMethod.card?.exp_year,
    });

    res.status(201).json({ success: true, data: savedCard });
  } catch (error) {
    console.error("Save Card Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error saving card", error });
  }
};

// ----------------------
// Get all saved cards for a user
// ----------------------
const getSavedCards = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const cards = await SavedCard.find({ userId });
    res.status(200).json({ success: true, data: cards });
  } catch (error) {
    console.error("Fetch Cards Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch cards", error });
  }
};

// ----------------------
// Make a payment using a saved card
// ----------------------
const makePayment = async (req: Request, res: Response) => {
  try {
    const { userId, subscriptionId, savedCardId } = req.body;

    const card = await SavedCard.findById(savedCardId);
    if (!card) return res.status(404).json({ message: "Card not found" });

    const plan = await Subscription.findById(subscriptionId);
    if (!plan)
      return res.status(404).json({ message: "Subscription plan not found" });

    const amount = Number((plan as any).price || (plan as any).amount || 0);
    if (!amount)
      return res.status(400).json({ message: "Plan amount is invalid" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      customer: card.stripeCustomerId,
      payment_method: card.paymentMethodId,
      confirm: true,
      off_session: true,
      expand: ["charges"],
    });

    const invoiceId = (paymentIntent as any)?.charges?.data?.[0]?.invoice ?? "";

    const payment = await Payment.create({
      userId,
      subscriptionId,
      amount,
      transactionId: paymentIntent.id,
      invoiceId,
      status:
        paymentIntent.status === "succeeded"
          ? PaymentStatus.SUCCESS
          : PaymentStatus.FAILED,
      paymentMethodId: card.paymentMethodId,
    });

    // ✅ Payment success হলে এখনই active না করে, admin approval pending রাখুন
    if (paymentIntent.status === "succeeded") {
      await User.findByIdAndUpdate(userId, {
        $set: {
          "subscription.plan": subscriptionId,
          "subscription.status": "pending_approval", // <-- নতুন স্টেট
          "subscription.isActive": false,
          // dates admin approve করার সময় সেট হবে
        },
      });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ success: false, message: "Payment failed", error });
  }
};
export const PaymentController = {
  saveCard,
  getSavedCards,
  makePayment,
};
