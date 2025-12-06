import Stripe from 'stripe';
import config from './index'
const stripe = new Stripe(config.stripe.stripe_secret_key as string, {
  apiVersion: '2024-04-10' as any,
});
export default stripe;