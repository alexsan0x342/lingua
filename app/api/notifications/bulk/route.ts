import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// POST /api/notifications/bulk - Send bulk notifications
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userIds, type, title, message, url, data } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "User IDs array is required" },
        { status: 400 },
      );
    }

    const notifications = userIds.map((userId) => ({
      userId,
      type: type || "announcement",
      title,
      message,
      url,
      data: data || {},
      isRead: false,
      sentAt: new Date(),
    }));

    const result = await prisma.notification.createMany({
      data: notifications,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return NextResponse.json(
      { error: "Failed to create bulk notifications" },
      { status: 500 },
    );
  }
}
