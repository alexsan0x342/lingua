import { NextResponse } from "next/server";

// GET /api/auth/providers - Get available auth providers
export async function GET() {
  // Return available authentication providers
  // This is used by the auth client to show available login methods
  const providers = {
    email: {
      id: "email",
      name: "Email OTP",
      type: "email",
      enabled: true,
    },
    // Add more providers here as needed
    // google: {
    //   id: "google",
    //   name: "Google",
    //   type: "oauth",
    //   enabled: !!process.env.GOOGLE_CLIENT_ID,
    // },
  };

  return NextResponse.json(providers);
}
