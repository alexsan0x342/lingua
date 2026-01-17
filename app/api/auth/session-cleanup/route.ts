import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// GET - Get session info
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active sessions for this user
    const activeSessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        token: true,
        createdAt: true,
        ipAddress: true,
        userAgent: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      activeSessionCount: activeSessions.length,
      sessionId: session.session.id,
      sessions: activeSessions,
    });
  } catch (error) {
    console.error("Error getting session info:", error);
    return NextResponse.json(
      { error: "Failed to get session info" },
      { status: 500 },
    );
  }
}

// POST - Enforce single session (delete all other sessions)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentSessionId = session.session.id;

    // Delete all other sessions for this user except the current one
    const result = await prisma.session.deleteMany({
      where: {
        userId: session.user.id,
        id: {
          not: currentSessionId,
        },
      },
    });

    console.log(
      `🗑️ Deleted ${result.count} other sessions for user ${session.user.id}`,
    );

    // Get remaining active sessions
    const activeSessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      activeSessionCount: activeSessions.length,
      sessionId: currentSessionId,
      message: `Enforced single session. Deleted ${result.count} other session(s).`,
    });
  } catch (error) {
    console.error("Error enforcing single session:", error);
    return NextResponse.json(
      { error: "Failed to enforce single session" },
      { status: 500 },
    );
  }
}
