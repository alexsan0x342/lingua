"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await requireUser();

  try {
    // Mark the lesson as complete
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
      update: {
        completed: true,
      },
      create: {
        lessonId: lessonId,
        userId: session.id,
        completed: true,
      },
    });

    // Check if this completion makes the course 100% complete
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        Chapter: {
          include: {
            Course: {
              include: {
                chapter: {
                  include: {
                    lessons: {
                      include: {
                        lessonProgress: {
                          where: { userId: session.id }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (lesson?.Chapter.Course) {
      const course = lesson.Chapter.Course;
      
      // Calculate progress
      let totalLessons = 0;
      let completedLessons = 0;

      course.chapter.forEach((chapter) => {
        chapter.lessons.forEach((courseLesson) => {
          totalLessons++;
          const isCompleted = courseLesson.lessonProgress.some(
            (progress) => progress.completed
          );
          if (isCompleted) {
            completedLessons++;
          }
        });
      });

      // If course is 100% complete, show completion message
      if (totalLessons > 0 && completedLessons === totalLessons) {
        revalidatePath(`/dashboard/${slug}`);
        
        return {
          status: "success",
          message: "🎉 Congratulations! You've completed the course!",
        };
      }
    }

    revalidatePath(`/dashboard/${slug}`);

    return {
      status: "success",
      message: "Progress updated",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to mark lesson as complete",
    };
  }
}
