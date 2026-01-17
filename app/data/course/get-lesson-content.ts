import "server-only";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

export async function getLessonContent(lessonId: string) {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    // Redirect to login if not authenticated
    redirect("/login");
  }

  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailKey: true,
      videoKey: true,
      playbackId: true,
      position: true,
      isFree: true, // Add isFree field
      lessonProgress: {
        where: {
          userId: session.user.id,
        },
        select: {
          completed: true,
          lessonId: true,
        },
      },
      assignments: {
        select: {
          id: true,
          title: true,
          description: true,
          instructions: true,
          submissionType: true,
          maxPoints: true,
          dueDate: true,
          isRequired: true,
          fileRequired: true,
          position: true,
        },
        orderBy: {
          position: "asc",
        },
      },
      resources: {
        select: {
          id: true,
          title: true,
          description: true,
          url: true,
          fileKey: true,
          fileType: true,
          fileName: true,
          type: true,
          isRequired: true,
          position: true,
        },
        orderBy: {
          position: "asc",
        },
      },
      Chapter: {
        select: {
          id: true,
          courseId: true,
          Course: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    return notFound();
  }

  // Check if lesson is free - allow access without enrollment
  if (lesson.isFree) {
    return lesson;
  }

  // For non-free lessons, require active enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: lesson.Chapter.courseId,
      },
    },
    select: {
      status: true,
    },
  });

  if (!enrollment || enrollment.status !== "Active") {
    // Redirect to course page to purchase instead of showing 404
    redirect(`/courses/${lesson.Chapter.Course.slug}?locked=true`);
  }
  
  return lesson;
}

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;
