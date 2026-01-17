import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/user/course-points - Get total points earned in a specific course
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 },
      );
    }

    // Get all chapters in the course
    const chapters = await prisma.chapter.findMany({
      where: { courseId },
      include: {
        lessons: {
          include: {
            assignments: {
              include: {
                submissions: {
                  where: {
                    studentId: session.user.id,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate total earned points and max possible points
    let earnedPoints = 0;
    let maxPoints = 0;

    for (const chapter of chapters) {
      for (const lesson of chapter.lessons) {
        for (const assignment of lesson.assignments) {
          if (assignment.maxPoints) {
            maxPoints += assignment.maxPoints;
          }
          for (const submission of assignment.submissions) {
            if (submission.grade !== null) {
              earnedPoints += submission.grade;
            }
          }
        }
      }
    }

    return NextResponse.json({
      earnedPoints,
      maxPoints,
      courseId,
    });
  } catch (error) {
    console.error("Error fetching course points:", error);
    return NextResponse.json(
      { error: "Failed to fetch course points" },
      { status: 500 },
    );
  }
}
