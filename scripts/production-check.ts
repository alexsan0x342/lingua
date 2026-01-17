#!/usr/bin/env tsx
/**
 * Production Readiness Check Script
 * Run before deploying to production
 */

import { env } from "../lib/env";
import { prisma } from "../lib/db";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

const results: CheckResult[] = [];

function check(
  name: string,
  condition: boolean,
  passMsg: string,
  failMsg: string,
  isWarning = false,
) {
  results.push({
    name,
    status: condition ? "pass" : isWarning ? "warn" : "fail",
    message: condition ? passMsg : failMsg,
  });
}

async function runChecks() {
  console.log("🔍 Running Production Readiness Checks...\n");

  // Environment Checks
  console.log("📋 Environment Variables:");

  check(
    "Node Environment",
    process.env.NODE_ENV === "production",
    "✓ NODE_ENV is production",
    '✗ NODE_ENV should be "production"',
    true,
  );

  check(
    "Database URL",
    !!env.DATABASE_URL && env.DATABASE_URL.includes("postgresql"),
    "✓ Database URL configured",
    "✗ DATABASE_URL not properly configured",
  );

  check(
    "Auth Secret Length",
    !!env.BETTER_AUTH_SECRET && env.BETTER_AUTH_SECRET.length >= 64,
    "✓ Auth secret is secure (64+ chars)",
    "✗ Auth secret too short (minimum 64 chars required)",
  );

  check(
    "Auth URL",
    !!env.BETTER_AUTH_URL && env.BETTER_AUTH_URL.startsWith("https://"),
    "✓ Auth URL uses HTTPS",
    "⚠ Auth URL should use HTTPS in production",
    true,
  );

  check(
    "Cron Secret",
    !!env.CRON_SECRET && env.CRON_SECRET.length >= 32,
    "✓ Cron secret is secure",
    "✗ Cron secret too short (minimum 32 chars)",
  );

  // Email Configuration
  console.log("\n📧 Email Configuration:");

  check(
    "SMTP Host",
    !!env.SMTP_HOST,
    "✓ SMTP host configured",
    "⚠ SMTP host not configured",
    true,
  );

  check(
    "SMTP Credentials",
    !!env.SMTP_USER && !!env.SMTP_PASS,
    "✓ SMTP credentials configured",
    "⚠ SMTP credentials not configured",
    true,
  );

  // Payment Configuration
  console.log("\n💳 Payment Configuration:");

  check(
    "Stripe Secret Key",
    !!env.STRIPE_SECRET_KEY,
    "✓ Stripe secret key configured",
    "⚠ Stripe not configured (optional)",
    true,
  );

  check(
    "Stripe Live Mode",
    !env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.startsWith("sk_live_"),
    "✓ Using Stripe LIVE keys",
    "⚠ Using Stripe TEST keys in production",
    true,
  );

  check(
    "Stripe Webhook Secret",
    !env.STRIPE_SECRET_KEY || !!env.STRIPE_WEBHOOK_SECRET,
    "✓ Stripe webhook secret configured",
    "⚠ Stripe webhook secret missing",
    true,
  );

  // Storage Configuration
  console.log("\n📦 Storage Configuration:");

  check(
    "Bunny Storage",
    !!process.env.BUNNY_STORAGE_ZONE_NAME &&
      !!process.env.BUNNY_STORAGE_API_KEY,
    "✓ Bunny.net storage configured",
    "⚠ Bunny.net storage not configured",
    true,
  );

  // Security
  console.log("\n🔒 Security Configuration:");

  check(
    "Arcjet Protection",
    !!env.ARCJET_KEY,
    "✓ Arcjet security enabled",
    "⚠ Arcjet not configured (recommended for production)",
    true,
  );

  check(
    "Arcjet Production Mode",
    !env.ARCJET_KEY || env.ARCJET_ENV === "production",
    "✓ Arcjet in production mode",
    "⚠ Arcjet should be in production mode",
    true,
  );

  // Database Connection
  console.log("\n🗄️  Database Connection:");

  try {
    await prisma.$connect();
    check(
      "Database Connection",
      true,
      "✓ Successfully connected to database",
      "",
    );

    // Check if there are any users (basic data check)
    const userCount = await prisma.user.count();
    check(
      "Database Data",
      userCount >= 0,
      `✓ Database accessible (${userCount} users)`,
      "✗ Cannot query database",
    );

    // Check critical tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      LIMIT 5
    `;
    check(
      "Database Schema",
      Array.isArray(tables) && tables.length > 0,
      "✓ Database schema exists",
      "✗ Database schema missing",
    );
  } catch (error) {
    check(
      "Database Connection",
      false,
      "",
      `✗ Cannot connect to database: ${error}`,
    );
  } finally {
    await prisma.$disconnect();
  }

  // Print Results
  console.log("\n" + "=".repeat(60));
  console.log("📊 CHECK RESULTS");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warnings = results.filter((r) => r.status === "warn").length;

  results.forEach((result) => {
    const icon =
      result.status === "pass" ? "✅" : result.status === "warn" ? "⚠️" : "❌";
    console.log(`${icon} ${result.name}: ${result.message}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log(
    `Total: ${passed} passed, ${failed} failed, ${warnings} warnings`,
  );
  console.log("=".repeat(60));

  if (failed > 0) {
    console.log("\n❌ PRODUCTION READINESS: FAILED");
    console.log(
      "Please fix the issues above before deploying to production.\n",
    );
    process.exit(1);
  } else if (warnings > 0) {
    console.log("\n⚠️  PRODUCTION READINESS: PASS WITH WARNINGS");
    console.log("You can deploy, but consider addressing the warnings.\n");
    process.exit(0);
  } else {
    console.log("\n✅ PRODUCTION READINESS: PASSED");
    console.log("Your application is ready for production deployment!\n");
    process.exit(0);
  }
}

// Run checks
runChecks().catch((error) => {
  console.error("❌ Check script failed:", error);
  process.exit(1);
});
