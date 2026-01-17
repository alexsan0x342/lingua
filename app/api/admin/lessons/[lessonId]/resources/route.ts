import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserRole } from "@/lib/rbac";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";

// GET /api/admin/lessons/[lessonId]/resources - Get all resources for a lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
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

    const { lessonId } = await params;

    const resources = await prisma.resource.findMany({
      where: { lessonId },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

// POST /api/admin/lessons/[lessonId]/resources - Create a new resource
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
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

    const { lessonId } = await params;
    const body = await request.json();

    // Get the highest position for existing resources
    const lastResource = await prisma.resource.findFirst({
      where: { lessonId },
      orderBy: { position: "desc" },
    });

    const resource = await prisma.resource.create({
      data: {
        lessonId,
        title: body.title,
        description: body.description,
        fileKey: body.fileKey || "",
        fileType: body.fileType || "file",
        fileName: body.fileName || body.title,
        fileSize: body.fileSize || 0,
        url: body.url,
        type: body.type || "file",
        isRequired: body.isRequired || false,
        position: (lastResource?.position || 0) + 1,
      },
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
