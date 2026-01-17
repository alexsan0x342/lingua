"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";

export async function updateLesson(
  values: LessonSchemaType,
  lessonId: string
): Promise<ApiResponse> {
  await requireAdmin();

  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    // Check if this is a new video upload
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { videoKey: true }
    });

    const isNewVideo = existingLesson?.videoKey !== result.data.videoKey && result.data.videoKey;

    // Update the lesson
    await prisma.lesson.update({
      where: {
        id: lessonId,
      },
      data: {
        title: result.data.name,
        description: result.data.description,
        thumbnailKey: result.data.thumbnailKey,
        videoKey: result.data.videoKey,
        playbackId: result.data.playbackId,
        isFree: result.data.isFree ?? false,
      },
    });

    // Video migration removed (Mux/Cloudinary no longer supported)

    return {
      status: "success",
      message: "Lesson updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update lesson",
    };
  }
}
