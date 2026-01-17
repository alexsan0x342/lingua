import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendPushNotificationToUser } from "@/lib/push-notifications";

// POST /api/notifications/test - Send a test notification
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await sendPushNotificationToUser(session.user.id, {
      title: "Test Notification",
      body: "This is a test notification from your LMS!",
      url: "/dashboard",
      tag: "test-notification",
      data: {
        type: "test",
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 },
    );
  }
}
