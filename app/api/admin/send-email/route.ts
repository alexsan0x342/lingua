import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { sendBulkEmail } from "@/lib/email";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";
import { UserRole } from "@/lib/rbac";

// GET - Fetch users for email manager
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission - require users_view to see user list
    const userRole = session.user.role as UserRole;
    if (!hasDynamicPermission(userRole, "users_view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// POST - Send bulk email
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission - require users_view to send emails
    const userRole = session.user.role as UserRole;
    if (!hasDynamicPermission(userRole, "users_view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { subject, content, recipientType, specificUserId } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Subject and content are required" },
        { status: 400 },
      );
    }

    // Get recipients based on type
    let recipients: { email: string; name: string }[] = [];

    if (recipientType === "specific" && specificUserId) {
      const user = await prisma.user.findUnique({
        where: { id: specificUserId },
        select: { email: true, name: true },
      });
      if (user && user.email) {
        recipients = [{ email: user.email, name: user.name || "User" }];
      }
    } else if (recipientType === "students") {
      const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        select: { email: true, name: true },
      });
      recipients = students
        .filter((u) => u.email)
        .map((u) => ({ email: u.email!, name: u.name || "User" }));
    } else if (recipientType === "vendors" || recipientType === "managers") {
      const managers = await prisma.user.findMany({
        where: { role: "MANAGER" },
        select: { email: true, name: true },
      });
      recipients = managers
        .filter((u) => u.email)
        .map((u) => ({ email: u.email!, name: u.name || "User" }));
    } else {
      // All users
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true },
      });
      recipients = allUsers
        .filter((u) => u.email)
        .map((u) => ({ email: u.email!, name: u.name || "User" }));
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found" },
        { status: 400 },
      );
    }

    // Send bulk email
    const result = await sendBulkEmail({
      subject,
      content,
      recipients,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send emails" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      total: result.total,
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 },
    );
  }
}
