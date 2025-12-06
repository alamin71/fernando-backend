// import { Schema, model } from 'mongoose';
// import { ISubscription } from './subscription.interface';

// const subscriptionSchema = new Schema<ISubscription>(
//   {
//     title: { type: String, required: true },
//     price: { type: Number, required: true },
//     category:{
//       type:String,
//       requred:true,
//       enum["user","hospitality venue",["service provider"]],
//        default:[]},
//     features: { type: [String], default: [] },
//     isActive: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

// export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
// import { Schema, model } from 'mongoose';
// import { ISubscription } from './subscription.interface';

// const subscriptionSchema = new Schema<ISubscription>(
//   {
//     title: { type: String, required: true },
//     billingCycle: { 
//       type: String, 
//       required: true, 
//       enum: ['monthly', 'quarterly', 'yearly'] 
//     },
//     price: { type: Number, required: true },
//     category: {
//       type: String,
//       required: true,
//       enum: ['USER', 'HOSPITALITY_VENUE', 'SERVICE_PROVIDER']
//     },
//     features: { type: [String], default: [] },
//     isActive: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

// export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);

import { Schema, model } from 'mongoose';
import { ISubscription } from './subscription.interface';

const subscriptionSchema = new Schema<ISubscription>(
  {
    title: { type: String, required: true },
    billingCycle: { 
      type: String, 
      required: true, 
      enum: ['monthly', 'quarterly', 'yearly'] 
    },
    price: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: ['USER', 'HOSPITALITY_VENUE', 'SERVICE_PROVIDER'] 
    },
    features: { type: [String], default: [] },
    planId: { type: String, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    plan: { type: String },
    status: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
