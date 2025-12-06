import { z } from 'zod';
import { CategoryEnum, BillingCycleEnum } from './subscription.enum';

const createSubscriptionZodSchema = z.object({
  title: z.string().min(1, 'Title is required'),

  billingCycle: z.nativeEnum(BillingCycleEnum).refine(val => val !== undefined && val !== null, {
    message: 'Billing cycle is required',
  }),

 price: z.number().refine(val => val !== undefined, {
  message: 'Price is required',
  })
  .refine(val => !isNaN(val), {
    message: 'Price must be a valid number',
  }),

  category: z.nativeEnum(CategoryEnum).refine(val => val !== undefined && val !== null, {
    message: 'Category is required',
  }),

  features: z.array(z.string()).optional(),

  isActive: z.boolean().optional(),
});

const updateSubscriptionZodSchema = z.object({
  title: z.string().optional(),

  billingCycle: z.nativeEnum(BillingCycleEnum).optional(),

  price: z.number().optional(),

  description: z.string().optional(),

  category: z.nativeEnum(CategoryEnum).optional(),

  features: z.array(z.string()).optional(),

  isActive: z.boolean().optional(),
});

export const SubscriptionValidation = {
  createSubscriptionZodSchema,
  updateSubscriptionZodSchema,
};
