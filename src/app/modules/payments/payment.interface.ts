// payment.interface.ts
export enum PaymentStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending'
}

export interface IPayment {
  userId: string;
  subscriptionId: string;
  amount: number;
  transactionId: string;
  invoiceId: string;
  status: PaymentStatus;
  paymentMethodId?: string;
  createdAt?: Date;
}

export interface ISavedCard {
  userId: string;
  stripeCustomerId: string;
  paymentMethodId: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  createdAt?: Date;
}
