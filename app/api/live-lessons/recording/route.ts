import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserRole } from "@/lib/rbac";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";
import { notifyLiveLessonRecordingReady } from "@/lib/notification-helpers";
import { deleteVideoFromBunny } from "@/lib/deletion-utils";

// POST /api/live-lessons/recording - Upload recording URL and notify students
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    if (!hasDynamicPermission(userRole, "live_lessons_edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { lessonId, recordingUrl } = body;

    if (!lessonId || !recordingUrl) {
      return NextResponse.json(
        { error: "Lesson ID and recording URL are required" },
        { status: 400 },
      );
    }

    // Update lesson with recording URL
    const lesson = await prisma.liveLesson.update({
      where: { id: lessonId },
      data: {
        recordingUrl,
        status: "Completed",
      },
      include: {
        course: true,
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Live lesson not found" },
        { status: 404 },
      );
    }

    // Send notifications to enrolled students
    await notifyLiveLessonRecordingReady(lessonId);

    return NextResponse.json({
      success: true,
      message: "Recording uploaded and notifications sent successfully",
    });
  } catch (error) {
    console.error("Error uploading recording:", error);
    return NextResponse.json(
      { error: "Failed to upload recording" },
      { status: 500 },
    );
  }
}

// DELETE /api/live-lessons/recording - Delete recording from a live lesson
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    if (!hasDynamicPermission(userRole, "live_lessons_edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { lessonId } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 },
      );
    }

    // Get the lesson to find the recording URL
    const lesson = await prisma.liveLesson.findUnique({
      where: { id: lessonId },
      select: { recordingUrl: true },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Live lesson not found" },
        { status: 404 },
      );
    }

    // Delete the video from Bunny.net if it exists
    if (lesson.recordingUrl) {
      // Check if it's a Bunny.net video ID (UUID format)
      const isBunnyVideo =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          lesson.recordingUrl,
        );
      if (isBunnyVideo) {
        await deleteVideoFromBunny(lesson.recordingUrl);
      }
    }

    // Update lesson to remove recording URL
    await prisma.liveLesson.update({
      where: { id: lessonId },
      data: {
        recordingUrl: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Recording deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting recording:", error);
    return NextResponse.json(
      { error: "Failed to delete recording" },
      { status: 500 },
    );
  }
}
