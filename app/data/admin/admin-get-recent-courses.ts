import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export async function adminGetRecentCourses() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const session = await requireAdmin();
  
  const isManager = session.user.role === 'MANAGER';
  const whereClause = isManager ? { userId: session.user.id } : undefined;

  const data = await prisma.course.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    take: 2,
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
