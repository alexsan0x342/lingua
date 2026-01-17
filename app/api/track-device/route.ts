import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// POST /api/track-device - Track user device for security
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceInfo, fingerprint } = body;

    // Get request headers for additional info
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "unknown";

    // Store device tracking info in session metadata or a separate table
    // For now, we'll update the session with device info
    await prisma.session.updateMany({
      where: {
        userId: session.user.id,
        token: session.session?.token,
      },
      data: {
        userAgent: userAgent.substring(0, 255),
        ipAddress: ip.substring(0, 45),
      },
    });

    return NextResponse.json({
      success: true,
      tracked: true,
    });
  } catch (error) {
    console.error("Error tracking device:", error);
    return NextResponse.json(
      { error: "Failed to track device" },
      { status: 500 },
    );
  }
}
