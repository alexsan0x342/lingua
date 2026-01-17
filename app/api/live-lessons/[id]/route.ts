import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserRole } from "@/lib/rbac";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";

// PUT /api/live-lessons/[id] - Update a live lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    // Check if lesson exists
    const existingLesson = await prisma.liveLesson.findUnique({
      where: { id },
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: "Live lesson not found" },
        { status: 404 },
      );
    }

    const updatedLesson = await prisma.liveLesson.update({
      where: { id },
      data: body,
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
    });

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error("Error updating live lesson:", error);
    return NextResponse.json(
      { error: "Failed to update live lesson" },
      { status: 500 },
    );
  }
}

// DELETE /api/live-lessons/[id] - Delete a live lesson (hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    if (!hasDynamicPermission(userRole, "live_lessons_delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.liveLesson.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting live lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete live lesson" },
      { status: 500 },
    );
  }
}
