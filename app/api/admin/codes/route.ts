import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserRole } from "@/lib/rbac";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET /api/admin/codes - Fetch all codes
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    if (!hasDynamicPermission(userRole, "codes_view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const codes = await prisma.redemptionCode.findMany({
      include: {
        course: {
          select: {
            title: true,
          },
        },
        redemptions: {
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
        createdAt: "desc",
      },
    });

    return NextResponse.json({ codes });
  } catch (error) {
    console.error("Error fetching codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch codes" },
      { status: 500 },
    );
  }
}

// POST /api/admin/codes - Create a new code
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    if (!hasDynamicPermission(userRole, "codes_create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { code, type, value, courseId, maxUses, expiresAt } = body;

    const finalCode = code || generateCode();

    // Check if code already exists
    const existingCode = await prisma.redemptionCode.findUnique({
      where: { code: finalCode },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Code already exists" },
        { status: 400 },
      );
    }

    const newCode = await prisma.redemptionCode.create({
      data: {
        code: finalCode,
        type: type || "COURSE",
        value: value || 0,
        courseId: courseId || null,
        maxUses: maxUses || 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ code: newCode });
  } catch (error) {
    console.error("Error creating code:", error);
    return NextResponse.json(
      { error: "Failed to create code" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/codes - Update a code
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    if (!hasDynamicPermission(userRole, "codes_edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Code ID is required" },
        { status: 400 },
      );
    }

    const updatedCode = await prisma.redemptionCode.update({
      where: { id },
      data: {
        ...updates,
        expiresAt: updates.expiresAt ? new Date(updates.expiresAt) : undefined,
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ code: updatedCode });
  } catch (error) {
    console.error("Error updating code:", error);
    return NextResponse.json(
      { error: "Failed to update code" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/codes - Delete a code
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole | null;

    if (!hasDynamicPermission(userRole, "codes_delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Code ID is required" },
        { status: 400 },
      );
    }

    await prisma.redemptionCode.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting code:", error);
    return NextResponse.json(
      { error: "Failed to delete code" },
      { status: 500 },
    );
  }
}
