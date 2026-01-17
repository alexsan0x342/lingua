import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

export const env = createEnv({
  server: {
    // Database
    // Accept any non-empty string to accommodate Postgres URLs with extended params
    DATABASE_URL: z.string().min(1, "Database URL is required"),

    // Authentication - More strict validation in production
    BETTER_AUTH_SECRET: isProduction
      ? z
          .string()
          .min(64, "Production auth secret must be at least 64 characters")
      : z.string().min(32, "Auth secret must be at least 32 characters"),
    BETTER_AUTH_URL: z.string().url("Invalid auth URL"),
    NEXTAUTH_URL: z.string().url("Invalid NextAuth URL").optional(),

    // Email - SMTP Configuration
    SMTP_HOST: z.string().min(1, "SMTP host is required").optional(),
    SMTP_PORT: z.string().min(1, "SMTP port is required").optional(),
    SMTP_SECURE: z.string().optional(),
    SMTP_USER: z.string().min(1, "SMTP user is required").optional(),
    SMTP_PASS: z.string().min(1, "SMTP password is required").optional(),
    SMTP_FROM_EMAIL: z.string().email("Invalid SMTP from email").optional(),
    SMTP_FROM_NAME: z.string().optional(),
    FROM_EMAIL: z.string().email("Invalid from email address").optional(),

    // Security - Arcjet is optional but recommended
    ARCJET_KEY: z.string().min(1, "Arcjet key is required").optional(),

    // File Storage (Tigris S3-compatible)
    AWS_ACCESS_KEY_ID: z
      .string()
      .min(1, "AWS access key is required")
      .optional(),
    AWS_SECRET_ACCESS_KEY: z
      .string()
      .min(1, "AWS secret key is required")
      .optional(),
    AWS_REGION: z.string().min(1, "AWS region is required").optional(),
    AWS_S3_BUCKET_NAME: z
      .string()
      .min(1, "S3 bucket name is required")
      .optional(),
    AWS_ENDPOINT_URL_S3: z.string().url("Invalid S3 endpoint URL").optional(),
    AWS_ENDPOINT_URL_IAM: z.string().url("Invalid IAM endpoint URL").optional(),

    // Payment Processing - Required in production
    STRIPE_SECRET_KEY: isProduction
      ? z.string().min(1, "Stripe secret key is required in production")
      : z.string().min(1, "Stripe secret key is required").optional(),
    STRIPE_WEBHOOK_SECRET: isProduction
      ? z.string().min(1, "Stripe webhook secret is required in production")
      : z.string().min(1, "Stripe webhook secret is required").optional(),

    // Video Conferencing (optional)
    ZOOM_API_KEY: z.string().min(1, "Zoom API key is required").optional(),
    ZOOM_API_SECRET: z
      .string()
      .min(1, "Zoom API secret is required")
      .optional(),
    ZOOM_ACCOUNT_ID: z
      .string()
      .min(1, "Zoom account ID is required")
      .optional(),

    // OAuth Providers
    GOOGLE_CLIENT_ID: z
      .string()
      .min(1, "Google client ID is required")
      .optional(),
    GOOGLE_CLIENT_SECRET: z
      .string()
      .min(1, "Google client secret is required")
      .optional(),

    // Cron Jobs
    CRON_SECRET: z
      .string()
      .min(32, "Cron secret must be at least 32 characters"),

    // Super Admin (for viewing logs)
    SUPER_ADMIN_EMAIL: z.string().email("Invalid super admin email").optional(),

    // Environment
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    ARCJET_ENV: z.enum(["development", "production"]).default("development"),
  },

  client: {
    // Add any client-side environment variables here
    NEXT_PUBLIC_APP_URL: z.string().url("Invalid app URL").optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
      .string()
      .min(1, "Stripe publishable key is required")
      .optional(),
  },

  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
});
