import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserRole } from "@/lib/rbac";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";

// GET /api/admin/assignments - Get assignments (optionally filtered by lessonId)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    if (!hasDynamicPermission(userRole, "courses_view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");

    const assignments = await prisma.assignment.findMany({
      where: lessonId ? { lessonId } : undefined,
      include: {
        lesson: {
          select: {
            title: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 },
    );
  }
}

// POST /api/admin/assignments - Create a new assignment
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    if (!hasDynamicPermission(userRole, "courses_edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 },
      );
    }

    // Get the highest position for existing assignments
    const lastAssignment = await prisma.assignment.findFirst({
      where: { lessonId: body.lessonId },
      orderBy: { position: "desc" },
    });

    const assignment = await prisma.assignment.create({
      data: {
        lessonId: body.lessonId,
        title: body.title,
        description: body.description,
        submissionType: body.submissionType || "TEXT",
        instructions: body.instructions || "",
        maxPoints: body.maxPoints,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        isRequired: body.isRequired || false,
        fileRequired: body.fileRequired || false,
        position: (lastAssignment?.position || 0) + 1,
      },
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/assignments - Update an assignment
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    if (!hasDynamicPermission(userRole, "courses_edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 },
      );
    }

    const assignment = await prisma.assignment.update({
      where: { id: body.id },
      data: {
        title: body.title,
        description: body.description,
        submissionType: body.submissionType,
        instructions: body.instructions,
        maxPoints: body.maxPoints,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        isRequired: body.isRequired,
        fileRequired: body.fileRequired,
        position: body.position,
      },
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/assignments - Delete an assignment
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    if (!hasDynamicPermission(userRole, "courses_delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 },
      );
    }

    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 },
    );
  }
}
