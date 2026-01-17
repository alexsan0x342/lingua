import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// GET /api/user/recordings - Get user's live lesson recordings
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recordings from live lessons the user has access to
    const recordings = await prisma.liveLesson.findMany({
      where: {
        recordingUrl: { not: null },
        OR: [
          // User is enrolled in a course that has this live lesson
          {
            course: {
              enrollment: {
                some: { userId: session.user.id },
              },
            },
          },
          // User created the live lesson
          { creatorId: session.user.id },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        recordingUrl: true,
        scheduledAt: true,
        duration: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json(recordings);
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json(
      { error: "Failed to fetch recordings" },
      { status: 500 },
    );
  }
}
