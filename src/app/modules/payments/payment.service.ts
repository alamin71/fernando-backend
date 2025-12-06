import stripe from '../../../config/stripe';
import { SavedCard, Payment } from './payment.model';
import { PaymentStatus } from './payment.interface';

 const createStripeCustomer = async (
  email: string,
  paymentMethodId: string
) => {
  return await stripe.customers.create({
    payment_method: paymentMethodId,
    email,
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
};

 const retrievePaymentMethod = async (paymentMethodId: string) => {
  return await stripe.paymentMethods.retrieve(paymentMethodId);
};

 const saveCardToDB = async (data: {
  userId: string;
  stripeCustomerId: string;
  paymentMethodId: string;
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
}) => {
  return await SavedCard.create(data);
};

 const getUserSavedCards = async (userId: string) => {
  return await SavedCard.find({ userId });
};

 const findSavedCardById = async (cardId: string) => {
  return await SavedCard.findById(cardId);
};

 const createPaymentIntent = async (params: {
  amount: number;
  currency: string;
  customerId: string;
  paymentMethodId: string;
}) => {
  return await stripe.paymentIntents.create({
    amount: Math.round(params.amount * 100),
    currency: params.currency,
    customer: params.customerId,
    payment_method: params.paymentMethodId,
    confirm: true,
    off_session: true,
    expand: ['charges'],
  });
};

 const savePaymentToDB = async (data: {
  userId: string;
  subscriptionId: string;
  amount: number;
  transactionId: string;
  invoiceId: string;
  status: PaymentStatus;
  paymentMethodId: string;
}) => {
  return await Payment.create(data);
};
export const PaymentService =  {
  createStripeCustomer,
  retrievePaymentMethod,
  saveCardToDB,
  getUserSavedCards,
  findSavedCardById,
  createPaymentIntent,
  savePaymentToDB,
};