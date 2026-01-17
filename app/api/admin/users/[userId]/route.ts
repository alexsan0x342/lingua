import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";
import { UserRole } from "@/lib/rbac";

// GET /api/admin/users/[userId] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    if (!hasDynamicPermission(userRole, "users_view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
        banned: true,
        banReason: true,
        banExpires: true,
        createdAt: true,
        updatedAt: true,
        enrollment: {
          select: {
            id: true,
            createdAt: true,
            Course: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollment: true,
            sessions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/users/[userId] - Update user role or ban status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    const { userId } = await params;
    const body = await request.json();

    // Check if updating role
    if (body.role !== undefined) {
      if (!hasDynamicPermission(userRole, "users_manage_roles")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Prevent changing own role
      if (userId === session.user.id) {
        return NextResponse.json(
          { error: "Cannot change your own role" },
          { status: 400 },
        );
      }

      await prisma.user.update({
        where: { id: userId },
        data: { role: body.role },
      });

      return NextResponse.json({ success: true, message: "Role updated" });
    }

    // Check if banning/unbanning
    if (body.banned !== undefined) {
      if (!hasDynamicPermission(userRole, "users_ban")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Prevent banning self
      if (userId === session.user.id) {
        return NextResponse.json(
          { error: "Cannot ban yourself" },
          { status: 400 },
        );
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          banned: body.banned,
          banReason: body.banReason || null,
          banExpires: body.banExpires ? new Date(body.banExpires) : null,
        },
      });

      return NextResponse.json({
        success: true,
        message: body.banned ? "User banned" : "User unbanned",
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/users/[userId] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    if (!hasDynamicPermission(userRole, "users_delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 },
      );
    }

    // Delete user and cascade
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
