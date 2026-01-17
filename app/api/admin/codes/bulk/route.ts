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

// POST /api/admin/codes/bulk - Create multiple codes
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
    const { count, type, value, courseId, maxUses, expiresAt } = body;

    if (!count || count < 1 || count > 100) {
      return NextResponse.json(
        { error: "Count must be between 1 and 100" },
        { status: 400 },
      );
    }

    const codes = [];
    const existingCodes = new Set(
      (await prisma.redemptionCode.findMany({ select: { code: true } })).map(
        (c) => c.code,
      ),
    );

    for (let i = 0; i < count; i++) {
      let newCode = generateCode();
      // Make sure we don't generate duplicates
      while (existingCodes.has(newCode)) {
        newCode = generateCode();
      }
      existingCodes.add(newCode);

      codes.push({
        code: newCode,
        type: type || "COURSE",
        value: value || 0,
        courseId: courseId || null,
        maxUses: maxUses || 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
    }

    await prisma.redemptionCode.createMany({
      data: codes,
    });

    return NextResponse.json({ success: true, count: codes.length });
  } catch (error) {
    console.error("Error creating bulk codes:", error);
    return NextResponse.json(
      { error: "Failed to create bulk codes" },
      { status: 500 },
    );
  }
}
