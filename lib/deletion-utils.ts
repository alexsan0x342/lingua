import { prisma } from "@/lib/db";
import { deleteFromBunny, isValidFileKey } from "@/lib/file-storage";
import fs from "fs/promises";
import path from "path";

/**
 * Delete a file from storage (Bunny.net or legacy local)
 */
export async function deleteFromStorage(fileKey: string): Promise<void> {
  try {
    if (isValidFileKey(fileKey)) {
      // Delete from Bunny.net
      await deleteFromBunny(fileKey);
    } else {
      // Legacy local storage deletion
      const cleanFileKey = fileKey.replace(/^\/images\//, "");
      const filePath = path.join(
        process.cwd(),
        "public",
        "images",
        cleanFileKey,
      );

      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch {
        // File not found - silent fail
      }
    }
  } catch {
    // Silent fail for deletion errors
  }
}

/**
 * @deprecated Use deleteFromStorage instead - supports both Bunny.net and legacy local storage
 */
export async function deleteFromLocalStorage(fileKey: string): Promise<void> {
  return deleteFromStorage(fileKey);
}

/**
 * Delete a video asset from Mux
 */

/**
 * Delete a video from Bunny.net Stream
 */
export async function deleteVideoFromBunny(videoId: string): Promise<void> {
  try {
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

    if (!apiKey || !libraryId) {
      console.error("Bunny.net credentials not configured");
      return;
    }

    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      {
        method: "DELETE",
        headers: {
          AccessKey: apiKey,
        },
      },
    );

    if (response.ok) {
      console.log(`Successfully deleted video from Bunny.net: ${videoId}`);
    } else {
      const error = await response.text();
      console.error(`Failed to delete video from Bunny.net: ${videoId}`, error);
    }
  } catch (error) {
    console.error(`Error deleting video from Bunny.net: ${videoId}`, error);
  }
}

/**
 * Delete a lesson and its associated video from Mux
 */
export async function deleteLesson(lessonId: string): Promise<void> {
  try {
    // Get the lesson to check if it has a video asset
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        videoKey: true,
        thumbnailKey: true,
        title: true,
        assignments: { select: { id: true } },
        resources: { select: { id: true, fileKey: true } },
      },
    });

    if (!lesson) {
      throw new Error(`Lesson with ID ${lessonId} not found`);
    }

    // Delete assignment submissions first
    for (const assignment of lesson.assignments) {
      await prisma.assignmentSubmission.deleteMany({
        where: { assignmentId: assignment.id },
      });
    }

    // Delete assignments
    await prisma.assignment.deleteMany({
      where: { lessonId },
    });

    // Delete resource files and records
    for (const resource of lesson.resources) {
      if (resource.fileKey) {
        await deleteFromStorage(resource.fileKey);
      }
    }
    await prisma.resource.deleteMany({
      where: { lessonId },
    });

    // Delete thumbnail from Bunny storage if it exists
    if (lesson.thumbnailKey) {
      await deleteFromStorage(lesson.thumbnailKey);
    }

    // Delete video from Bunny.net or Mux if it exists
    if (lesson.videoKey) {
      // Check if it's a Bunny.net video ID (UUID format) or Mux asset ID
      const isBunnyVideo =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          lesson.videoKey,
        );

      if (isBunnyVideo) {
        await deleteVideoFromBunny(lesson.videoKey);
      }
    }

    // Delete lesson progress records first (due to foreign key constraints)
    await prisma.lessonProgress.deleteMany({
      where: { lessonId: lessonId },
    });

    // Delete the lesson from database
    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    console.log(`Successfully deleted lesson: ${lesson.title} (${lessonId})`);
  } catch (error) {
    console.error(`Error deleting lesson ${lessonId}:`, error);
    throw error;
  }
}

/**
 * Delete a course and all its associated content
 */
export async function deleteCourse(courseId: string): Promise<void> {
  try {
    // Get the course with all its related data
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapter: {
          include: {
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      throw new Error(`Course with ID ${courseId} not found`);
    }

    // Delete course thumbnail from storage (Tigris or legacy local)
    if (course.fileKey) {
      await deleteFromStorage(course.fileKey);
    }

    // Delete all lessons and their associated files (videos, thumbnails, resources)
    for (const chapter of course.chapter) {
      for (const lesson of chapter.lessons) {
        // Delete lesson thumbnail
        if (lesson.thumbnailKey) {
          await deleteFromStorage(lesson.thumbnailKey);
        }

        // Delete lesson video
        if (lesson.videoKey) {
          // Check if it's a Bunny.net video ID (UUID format) or Mux asset ID
          const isBunnyVideo =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              lesson.videoKey,
            );

          if (isBunnyVideo) {
            await deleteVideoFromBunny(lesson.videoKey);
          }
        }

        // Delete lesson resources
        const resources = await prisma.resource.findMany({
          where: { lessonId: lesson.id },
          select: { fileKey: true },
        });

        for (const resource of resources) {
          if (resource.fileKey) {
            await deleteFromStorage(resource.fileKey);
          }
        }
      }
    }

    // Delete lesson progress records
    const lessonIds = course.chapter.flatMap((chapter) =>
      chapter.lessons.map((lesson) => lesson.id),
    );

    if (lessonIds.length > 0) {
      await prisma.lessonProgress.deleteMany({
        where: {
          lessonId: { in: lessonIds },
        },
      });
    }

    // Delete enrollments
    await prisma.enrollment.deleteMany({
      where: { courseId: courseId },
    });

    // Delete the course (this will cascade delete chapters and lessons)
    await prisma.course.delete({
      where: { id: courseId },
    });

    console.log(`Successfully deleted course: ${course.title} (${courseId})`);
  } catch (error) {
    console.error(`Error deleting course ${courseId}:`, error);
    throw error;
  }
}

/**
 * Delete an image file from local storage
 */
export async function deleteImage(fileKey: string): Promise<void> {
  try {
    await deleteFromStorage(fileKey);
    console.log(`Successfully deleted image: ${fileKey}`);
  } catch (error) {
    console.error(`Error deleting image ${fileKey}:`, error);
    throw error;
  }
}

/**
 * Delete a video asset from Mux by asset ID
 */

/**
 * Clean up orphaned files - removes files that exist in storage but not in database
 */
export async function cleanupOrphanedFiles(): Promise<void> {
  try {
    const imagesDir = path.join(process.cwd(), "public", "images");

    // Get all files from local storage
    const files = await fs.readdir(imagesDir);

    // Get all file keys from database
    const courses = await prisma.course.findMany({
      select: { fileKey: true },
    });

    const usedFileKeys = courses
      .map((course) => course.fileKey)
      .filter(Boolean)
      .map((fileKey) => fileKey.replace(/^\/images\//, ""));

    // Find orphaned files
    const orphanedFiles = files.filter((file) => !usedFileKeys.includes(file));

    // Delete orphaned files
    for (const file of orphanedFiles) {
      const filePath = path.join(imagesDir, file);
      await fs.unlink(filePath);
      console.log(`Deleted orphaned file: ${file}`);
    }

    console.log(
      `Cleanup complete. Deleted ${orphanedFiles.length} orphaned files.`,
    );
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

/**
 * Delete a chapter and all its lessons
 */
export async function deleteChapter(chapterId: string): Promise<void> {
  try {
    // Get all lessons in the chapter
    const lessons = await prisma.lesson.findMany({
      where: { chapterId },
      select: { id: true },
    });

    // Delete all lessons in the chapter
    for (const lesson of lessons) {
      await deleteLesson(lesson.id);
    }

    // Delete the chapter
    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    console.log(
      `Successfully deleted chapter: ${chapterId} and ${lessons.length} lessons`,
    );
  } catch (error) {
    console.error(`Error deleting chapter ${chapterId}:`, error);
    throw new Error("Failed to delete chapter");
  }
}

/**
 * Delete a page
 */
export async function deletePage(pageId: string): Promise<void> {
  try {
    await prisma.page.delete({
      where: { id: pageId },
    });

    console.log(`Successfully deleted page: ${pageId}`);
  } catch (error) {
    console.error(`Error deleting page ${pageId}:`, error);
    throw new Error("Failed to delete page");
  }
}

/**
 * Delete a category (only if no courses are using it)
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    // Check if category has courses
    const categoryWithCourses = await prisma.courseCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { courses: true } },
      },
    });

    if (!categoryWithCourses) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    if (categoryWithCourses._count.courses > 0) {
      throw new Error(
        "Cannot delete category with courses. Move courses to another category first.",
      );
    }

    await prisma.courseCategory.delete({
      where: { id: categoryId },
    });

    console.log(`Successfully deleted category: ${categoryId}`);
  } catch (error) {
    console.error(`Error deleting category ${categoryId}:`, error);
    throw error;
  }
}

/**
 * Delete an assignment and its submissions
 */
export async function deleteAssignment(assignmentId: string): Promise<void> {
  try {
    // Delete all submissions and their files
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      select: { fileKey: true },
    });

    for (const submission of submissions) {
      if (submission.fileKey) {
        await deleteFromStorage(submission.fileKey);
      }
    }

    // Delete submissions
    await prisma.assignmentSubmission.deleteMany({
      where: { assignmentId },
    });

    // Delete the assignment
    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    console.log(`Successfully deleted assignment: ${assignmentId}`);
  } catch (error) {
    console.error(`Error deleting assignment ${assignmentId}:`, error);
    throw new Error("Failed to delete assignment");
  }
}

/**
 * Delete a resource and its file
 */
export async function deleteResource(resourceId: string): Promise<void> {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { fileKey: true },
    });

    if (!resource) {
      throw new Error(`Resource with ID ${resourceId} not found`);
    }

    // Delete the file from local storage
    if (resource.fileKey) {
      await deleteFromStorage(resource.fileKey);
    }

    // Delete the resource record
    await prisma.resource.delete({
      where: { id: resourceId },
    });

    console.log(`Successfully deleted resource: ${resourceId}`);
  } catch (error) {
    console.error(`Error deleting resource ${resourceId}:`, error);
    throw new Error("Failed to delete resource");
  }
}

/**
 * Completely delete a user and all their associated data
 */
export async function deleteUserData(userId: string): Promise<void> {
  console.log(`Starting comprehensive deletion for user: ${userId}`);

  try {
    // Get all user's courses and their associated media files
    const userCourses = await prisma.course.findMany({
      where: { userId },
      include: {
        chapter: {
          include: {
            lessons: {
              include: {
                assignments: {
                  include: {
                    submissions: true,
                  },
                },
                resources: true,
              },
            },
          },
        },
      },
    });

    // Delete all courses and their media files
    for (const course of userCourses) {
      try {
        await deleteCourse(course.id);
      } catch (error) {
        console.error(`Error deleting course ${course.id}:`, error);
        // Continue with other deletions
      }
    }

    // Delete user's assignment submissions and their files
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { studentId: userId },
    });

    for (const submission of submissions) {
      if (submission.fileKey) {
        try {
          await deleteFromStorage(submission.fileKey);
        } catch (error) {
          console.error(
            `Error deleting submission file ${submission.fileKey}:`,
            error,
          );
        }
      }
    }

    // Delete user's pages
    const userPages = await prisma.page.findMany({
      where: { authorId: userId },
    });

    for (const page of userPages) {
      try {
        await deletePage(page.id);
      } catch (error) {
        console.error(`Error deleting page ${page.id}:`, error);
      }
    }

    // Delete user's live lessons
    const userLiveLessons = await prisma.liveLesson.findMany({
      where: {
        course: {
          userId,
        },
      },
    });

    for (const liveLesson of userLiveLessons) {
      await prisma.liveLessonAttendee.deleteMany({
        where: { liveLessonId: liveLesson.id },
      });

      await prisma.liveLesson.delete({
        where: { id: liveLesson.id },
      });
    }

    // Delete all user's data from database tables
    // Note: The foreign key cascade deletes will handle most relationships

    // Delete user settings
    await prisma.userSettings.deleteMany({
      where: { userId },
    });

    // Delete security events
    await prisma.securityEvent.deleteMany({
      where: { userId },
    });

    // Delete device logs
    await prisma.deviceLog.deleteMany({
      where: { userId },
    });

    // Delete device tracking
    await prisma.deviceTracking.deleteMany({
      where: { userId },
    });

    // Delete payment logs
    await prisma.paymentLog.deleteMany({
      where: { userId },
    });

    // Delete code redemptions
    await prisma.codeRedemption.deleteMany({
      where: { userId },
    });

    // Delete live lesson attendees
    await prisma.liveLessonAttendee.deleteMany({
      where: { userId },
    });

    // Delete lesson progress
    await prisma.lessonProgress.deleteMany({
      where: { userId },
    });

    // Delete assignment submissions
    await prisma.assignmentSubmission.deleteMany({
      where: { studentId: userId },
    });

    // Delete enrollments
    await prisma.enrollment.deleteMany({
      where: { userId },
    });

    // Delete sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Delete accounts (OAuth providers)
    await prisma.account.deleteMany({
      where: { userId },
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`Successfully deleted all data for user: ${userId}`);
  } catch (error) {
    console.error(`Error in comprehensive user deletion for ${userId}:`, error);
    throw new Error("Failed to delete user data completely");
  }
}
