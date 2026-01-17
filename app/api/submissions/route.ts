import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserRole } from "@/lib/rbac";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";

// GET /api/submissions - Get submissions for the current user filtered by lessonId
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 },
      );
    }

    // Get assignments for this lesson first
    const assignments = await prisma.assignment.findMany({
      where: { lessonId },
      select: { id: true },
    });

    const assignmentIds = assignments.map((a) => a.id);

    // Get submissions for the current user for these assignments
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId: { in: assignmentIds },
        studentId: session.user.id,
      },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}

// POST /api/submissions - Create a new submission
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const assignmentId = formData.get("assignmentId") as string;
    const content = formData.get("content") as string | null;
    const file = formData.get("file") as File | null;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 },
      );
    }

    // Verify the assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: {
          include: {
            Chapter: {
              include: {
                Course: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: assignment.lesson.Chapter.courseId,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this course to submit assignments" },
        { status: 403 },
      );
    }

    // Handle file upload if present
    let fileKey: string | null = null;
    if (file && file.size > 0) {
      const { saveAssignmentFile } = await import("@/lib/file-storage");
      const result = await saveAssignmentFile(
        file,
        session.user.id,
        assignmentId,
      );
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to upload file" },
          { status: 400 },
        );
      }
      fileKey = result.fileKey || null;
    }

    // Create or update the submission
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: session.user.id,
        },
      },
      create: {
        assignmentId,
        studentId: session.user.id,
        content: content || null,
        fileKey,
      },
      update: {
        content: content || null,
        fileKey: fileKey || undefined,
        submittedAt: new Date(),
        // Reset grade when resubmitting
        grade: null,
        feedback: null,
        gradedAt: null,
      },
    });

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 },
    );
  }
}

// PATCH /api/submissions - Update grade/feedback (admin only)
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { submissionId, grade, feedback } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 },
      );
    }

    // Get the current submission to calculate points adjustment
    const currentSubmission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
        student: true,
      },
    });

    if (!currentSubmission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    const previousGrade = currentSubmission.grade || 0;
    const newGrade = grade || 0;
    const pointsAdjusted = newGrade - previousGrade;

    // Update the submission
    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade,
        feedback,
        gradedAt: new Date(),
      },
    });

    // Update user's total points
    if (pointsAdjusted !== 0) {
      await prisma.user.update({
        where: { id: currentSubmission.studentId },
        data: {
          totalPoints: {
            increment: pointsAdjusted,
          },
        },
      });
    }

    return NextResponse.json({ submission, pointsAdjusted });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 },
    );
  }
}
