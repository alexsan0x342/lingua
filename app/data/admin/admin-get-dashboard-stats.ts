import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export async function adminGetDashboardStats() {
  const session = await requireAdmin();
  const isManager = session.user.role === 'MANAGER';

  const [totalSignups, totalCustomers, totalCourses, totalLessons] =
    await Promise.all([
      // Total Signups - managers can't see this, show 0
      isManager ? Promise.resolve(0) : prisma.user.count(),

      // Total Customers - count of users enrolled in manager's courses
      isManager
        ? prisma.user.count({
            where: {
              enrollment: {
                some: {
                  Course: {
                    userId: session.user.id,
                  },
                },
              },
            },
          })
        : prisma.user.count({
            where: {
              enrollment: {
                some: {},
              },
            },
          }),

      // Total Courses - manager's courses only
      isManager
        ? prisma.course.count({
            where: {
              userId: session.user.id,
            },
          })
        : prisma.course.count(),

      // Total Lessons - lessons in manager's courses
      isManager
        ? prisma.lesson.count({
            where: {
              Chapter: {
                Course: {
                  userId: session.user.id,
                },
              },
            },
          })
        : prisma.lesson.count(),
    ]);

  return {
    totalSignups,
    totalCustomers,
    totalCourses,
    totalLessons,
  };
}
