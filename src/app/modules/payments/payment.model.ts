import mongoose, { Schema } from 'mongoose';
import { IPayment, ISavedCard, PaymentStatus } from './payment.interface';

const paymentSchema = new Schema<IPayment>({
  userId: { type: String, required: true },
  subscriptionId: { type: String, required: true },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true },
  invoiceId: { type: String, required: true },
  status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
  paymentMethodId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const savedCardSchema = new Schema<ISavedCard>({
  userId: { type: String, required: true },
  stripeCustomerId: { type: String, required: true },
  paymentMethodId: { type: String, required: true },
  last4: { type: String, required: true },
  brand: { type: String, required: true },
  expMonth: { type: Number, required: true },
  expYear: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Payment = mongoose.model('Payment', paymentSchema);
export const SavedCard = mongoose.model('SavedCard', savedCardSchema);
