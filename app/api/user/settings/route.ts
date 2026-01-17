import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/user/settings - Get current user settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Return default settings if none exist
    const defaultSettings = {
      notifications: {
        email: true,
        push: true,
        courseUpdates: true,
        announcements: true,
      },
      privacy: {
        profileVisibility: "public",
        showEmail: false,
        showProgress: true,
      },
      preferences: {
        theme: "system",
        autoPlay: true,
        downloadQuality: "high",
      },
    };

    return NextResponse.json({
      settings: settings
        ? {
            notifications: (settings.notifications as any) || defaultSettings.notifications,
            privacy: (settings.privacy as any) || defaultSettings.privacy,
            preferences: (settings.preferences as any) || defaultSettings.preferences,
          }
        : defaultSettings,
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

// PUT /api/user/settings - Update current user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notifications, privacy, preferences } = body;

    // Upsert user settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        notifications: notifications || {},
        privacy: privacy || {},
        preferences: preferences || {},
      },
      update: {
        ...(notifications && { notifications: notifications }),
        ...(privacy && { privacy: privacy }),
        ...(preferences && { preferences: preferences }),
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
