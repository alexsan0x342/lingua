import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// GET /api/user/enrollments - Get user's course enrollments
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        Course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            fileKey: true,
            price: true,
            chapter: {
              select: {
                lessons: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const allLessonIds = enrollment.Course.chapter.flatMap((ch) =>
          ch.lessons.map((l) => l.id),
        );

        const completedLessons = await prisma.lessonProgress.count({
          where: {
            lessonId: { in: allLessonIds },
            userId: session.user.id,
            completed: true,
          },
        });

        const totalLessons = allLessonIds.length;
        const progress =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return {
          ...enrollment,
          course: enrollment.Course,
          progress,
          completedLessons,
          totalLessons,
        };
      }),
    );

    return NextResponse.json({ enrollments: enrollmentsWithProgress });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 },
    );
  }
}
