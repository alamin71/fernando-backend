export interface ISubscription {
  title: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  price: number;
  category: 'USER' | 'HOSPITALITY_VENUE' | 'SERVICE_PROVIDER';
  features: string[];
   planId?: string | null;
   startDate?: Date | null;
  endDate?: Date | null;
  plan?: string;
  status?: string;
  isActive?: boolean;
}
