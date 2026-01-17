import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserRole } from "@/lib/rbac";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";
import { zoomAPI } from "@/lib/zoom";
import { notifyLiveLessonCreated } from "@/lib/notification-helpers";

// GET /api/live-lessons - Fetch all live lessons
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    // Admin/Manager/Teacher can see all lessons
    // Students only see non-deleted lessons for courses they're enrolled in
    let where: any = {};

    if (userRole === "STUDENT") {
      // Students only see non-deleted lessons from courses they're enrolled in
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: session.user.id },
        select: { courseId: true },
      });

      const enrolledCourseIds = enrollments.map((e) => e.courseId);

      where = {
        deletedAt: null,
        courseId: { in: enrolledCourseIds },
      };
    } else if (hasDynamicPermission(userRole, "live_lessons_view")) {
      // Teachers/Managers/Admins can see all lessons (including soft-deleted)
      // No filter - show all
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const liveLessons = await prisma.liveLesson.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledAt: "desc",
      },
    });

    return NextResponse.json(liveLessons);
  } catch (error) {
    console.error("Error fetching live lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch live lessons" },
      { status: 500 },
    );
  }
}

// POST /api/live-lessons - Create a new live lesson
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    if (!hasDynamicPermission(userRole, "live_lessons_create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, scheduledAt, duration, courseId } = body;

    if (!title || !scheduledAt || !courseId) {
      return NextResponse.json(
        { error: "Title, scheduled time, and course are required" },
        { status: 400 },
      );
    }

    // Create Zoom meeting if configured
    let zoomData: any = {};
    try {
      const zoomMeeting = await zoomAPI.createMeeting({
        topic: title,
        type: 2, // Scheduled meeting
        start_time: new Date(scheduledAt).toISOString(),
        duration: duration || 60,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          waiting_room: false,
          auto_recording: "cloud",
        },
      });

      zoomData = {
        zoomMeetingId: zoomMeeting.id?.toString(),
        zoomStartUrl: zoomMeeting.start_url,
        zoomJoinUrl: zoomMeeting.join_url,
        zoomPassword: zoomMeeting.password,
      };
    } catch (zoomError) {
      console.error("Zoom meeting creation failed:", zoomError);
      // Continue without Zoom data
    }

    const liveLesson = await prisma.liveLesson.create({
      data: {
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 60,
        courseId,
        creatorId: session.user.id,
        status: "Scheduled",
        ...zoomData,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Notify enrolled students
    try {
      await notifyLiveLessonCreated(liveLesson.id);
    } catch (notifyError) {
      console.error("Failed to send notifications:", notifyError);
    }

    return NextResponse.json(liveLesson, { status: 201 });
  } catch (error) {
    console.error("Error creating live lesson:", error);
    return NextResponse.json(
      { error: "Failed to create live lesson" },
      { status: 500 },
    );
  }
}
