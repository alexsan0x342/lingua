import "server-only";

import Stripe from "stripe";
import { env } from "./env";

// Initialize Stripe with environment variable  
export const stripe = new Stripe(env.STRIPE_SECRET_KEY || "sk_test_disabled", {
  // Using default API version for compatibility
  typescript: true,
});

// Flag to indicate if Stripe is enabled
export const STRIPE_ENABLED = !!env.STRIPE_SECRET_KEY;
