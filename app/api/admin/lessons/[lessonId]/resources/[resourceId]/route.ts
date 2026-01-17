import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserRole } from "@/lib/rbac";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";

// PUT /api/admin/lessons/[lessonId]/resources/[resourceId] - Update a resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; resourceId: string }> }
) {
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

    const { resourceId } = await params;
    const body = await request.json();

    const resource = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        title: body.title,
        description: body.description,
        fileKey: body.fileKey,
        fileType: body.fileType,
        fileName: body.fileName,
        fileSize: body.fileSize,
        url: body.url,
        type: body.type,
        isRequired: body.isRequired,
        position: body.position,
      },
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/lessons/[lessonId]/resources/[resourceId] - Delete a resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; resourceId: string }> }
) {
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

    const { resourceId } = await params;

    await prisma.resource.delete({
      where: { id: resourceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
