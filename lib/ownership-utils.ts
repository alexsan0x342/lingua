import "server-only";
import { prisma } from "./db";

/**
 * Check if a user owns or has access to a course
 */
export async function canAccessCourse(userId: string, courseId: string, userRole: string): Promise<boolean> {
  if (userRole === 'ADMIN') {
    return true; // Admins can access all courses
  }

  if (userRole === 'MANAGER') {
    // Managers can only access their own courses
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: userId
      }
    });
    return !!course;
  }

  return false;
}

/**
 * Check if a user owns or has access to a lesson
 */
export async function canAccessLesson(userId: string, lessonId: string, userRole: string): Promise<boolean> {
  if (userRole === 'ADMIN') {
    return true; // Admins can access all lessons
  }

  if (userRole === 'MANAGER') {
    // Managers can only access lessons in their own courses
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: {
          Course: {
            userId: userId
          }
        }
      }
    });
    return !!lesson;
  }

  return false;
}

/**
 * Check if a user owns or has access to a live lesson
 */
export async function canAccessLiveLesson(userId: string, liveLessonId: string, userRole: string): Promise<boolean> {
  if (userRole === 'ADMIN') {
    return true; // Admins can access all live lessons
  }

  if (userRole === 'MANAGER') {
    // Managers can only access live lessons for their own courses or ones they created
    const liveLesson = await prisma.liveLesson.findFirst({
      where: {
        id: liveLessonId,
        OR: [
          { creatorId: userId },
          {
            course: {
              userId: userId
            }
          }
        ]
      }
    });
    return !!liveLesson;
  }

  return false;
}

/**
 * Check if a user owns or has access to a redemption code
 */
export async function canAccessRedemptionCode(userId: string, codeId: string, userRole: string): Promise<boolean> {
  if (userRole === 'ADMIN') {
    return true; // Admins can access all codes
  }

  if (userRole === 'MANAGER') {
    // Managers can only access codes for their own courses or ones they created
    const code = await prisma.redemptionCode.findFirst({
      where: {
        id: codeId,
        OR: [
          { creatorId: userId },
          {
            course: {
              userId: userId
            }
          }
        ]
      }
    });
    return !!code;
  }

  return false;
}

/**
 * Check if a user can access a submission
 */
export async function canAccessSubmission(userId: string, submissionId: string, userRole: string): Promise<boolean> {
  if (userRole === 'ADMIN') {
    return true; // Admins can access all submissions
  }

  if (userRole === 'MANAGER') {
    // Managers can only access submissions for their own courses
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        assignment: {
          lesson: {
            Chapter: {
              Course: {
                userId: userId
              }
            }
          }
        }
      }
    });
    return !!submission;
  }

  return false;
}

/**
 * Get course filter for database queries based on user role
 */
export function getCourseFilter(userId: string, userRole: string): { userId: string } | undefined {
  if (userRole === 'ADMIN') {
    return undefined; // No filter - admins see everything
  }

  if (userRole === 'MANAGER') {
    return { userId: userId }; // Filter by ownership
  }

  return undefined;
}

/**
 * Get lesson filter for database queries based on user role
 */
export function getLessonFilter(userId: string, userRole: string) {
  if (userRole === 'ADMIN') {
    return undefined; // No filter - admins see everything
  }

  if (userRole === 'MANAGER') {
    return {
      Chapter: {
        Course: {
          userId: userId
        }
      }
    };
  }

  return undefined;
}

/**
 * Get live lesson filter for database queries based on user role
 */
export function getLiveLessonFilter(userId: string, userRole: string) {
  if (userRole === 'ADMIN') {
    return undefined; // No filter - admins see everything
  }

  if (userRole === 'MANAGER') {
    return {
      OR: [
        { creatorId: userId },
        {
          course: {
            userId: userId
          }
        }
      ]
    };
  }

  return undefined;
}
