import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export async function adminGetCourses() {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const session = await requireAdmin();
  const userRole = session.user.role;
  const isManager = userRole === 'MANAGER';

  const data = await prisma.course.findMany({
    ...(isManager && {
      where: {
        userId: session.user.id,
      },
    }),
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      smallDescription: true,
      duration: true,
      level: true,
      status: true,
      price: true,
      fileKey: true,
      slug: true,
    },
  });

  return data;
}

export type AdminCourseType = Awaited<ReturnType<typeof adminGetCourses>>[0];
