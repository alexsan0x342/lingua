import { prisma } from "@/lib/db";
import { sendPushNotificationToUser } from "./push-notifications";

export interface NotificationPayload {
  recipientId: string;
  type:
    | "tutor_response"
    | "new_lesson"
    | "course_update"
    | "announcement"
    | "live_lesson_reminder"
    | "lesson_completion";
  title: string;
  message: string;
  data?: Record<string, any>;
  url?: string;
}

export async function sendBrowserNotification(payload: NotificationPayload) {
  try {
    // Check if recipient exists and has notifications enabled
    const recipient = await prisma.user.findUnique({
      where: { id: payload.recipientId },
      include: {
        userSettings: true,
      },
    });

    if (!recipient) {
      console.warn(
        `Recipient ${payload.recipientId} not found for notification`,
      );
      return false;
    }

    // Check if recipient has notifications enabled
    const notifications = recipient.userSettings?.notifications as any;
    const isNotificationEnabled =
      notifications &&
      (notifications.push === true || notifications.email === true);

    if (!isNotificationEnabled) {
      console.log(`Notifications disabled for user ${payload.recipientId}`);
      return false;
    }

    // Create notification record in database
    const notification = await prisma.notification.create({
      data: {
        userId: payload.recipientId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
        url: payload.url,
        isRead: false,
        sentAt: new Date(),
      },
    });

    // Send push notification if user has push subscription
    if (recipient.pushSubscription) {
      console.log(
        `[Notification] User ${payload.recipientId} has push subscription, sending push notification...`,
      );
      await sendPushNotificationToUser(payload.recipientId, {
        title: payload.title,
        body: payload.message,
        url: payload.url,
        tag: `notification-${notification.id}`,
        data: {
          notificationId: notification.id,
          type: payload.type,
          ...payload.data,
        },
      });
    } else {
      console.log(
        `[Notification] User ${payload.recipientId} does not have a push subscription - no push notification sent`,
      );
    }

    console.log(
      `✅ Browser notification created for user ${payload.recipientId}: ${payload.title}`,
    );
    return true;
  } catch (error) {
    console.error("Error sending browser notification:", error);
    return false;
  }
}

export async function sendBulkNotification(
  courseId: string,
  payload: Omit<NotificationPayload, "recipientId">,
) {
  try {
    // Get all enrolled students for the course
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: courseId,
        status: "Active",
      },
      include: {
        User: {
          include: {
            userSettings: true,
          },
          select: {
            id: true,
            pushSubscription: true,
            userSettings: true,
          },
        },
      },
    });

    // Filter students who have notifications enabled
    const eligibleStudents = enrollments.filter((enrollment) => {
      const notifications = enrollment.User.userSettings?.notifications as any;
      return (
        notifications &&
        (notifications.push === true || notifications.email === true)
      );
    });

    if (eligibleStudents.length === 0) {
      console.log(`No eligible recipients found for course ${courseId}`);
      return 0;
    }

    // Create notifications for all eligible students
    const notificationData = eligibleStudents.map((enrollment) => ({
      userId: enrollment.User.id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data || {},
      url: payload.url,
      isRead: false,
      sentAt: new Date(),
    }));

    const createdNotifications = await prisma.notification.createMany({
      data: notificationData,
    });

    // Send push notifications to users who have push subscriptions
    let pushSentCount = 0;
    for (const enrollment of eligibleStudents) {
      if (enrollment.User.pushSubscription) {
        try {
          await sendPushNotificationToUser(enrollment.User.id, {
            title: payload.title,
            body: payload.message,
            url: payload.url,
            tag: `bulk-${courseId}-${Date.now()}`,
            data: payload.data,
          });
          pushSentCount++;
        } catch (error) {
          console.error(
            `Failed to send push to user ${enrollment.User.id}:`,
            error,
          );
        }
      }
    }

    console.log(
      `✅ Bulk notifications created for ${createdNotifications.count} students, push sent to ${pushSentCount} devices for course ${courseId}`,
    );
    return createdNotifications.count;
  } catch (error) {
    console.error("Error sending bulk notifications:", error);
    return 0;
  }
}

export async function notifyTutorResponse(
  studentId: string,
  assignmentTitle: string,
  grade: number,
  submissionId: string,
  courseSlug?: string,
  lessonId?: string,
  maxPoints?: number,
  isRegrade?: boolean,
  feedback?: string | null,
) {
  // Build the URL - prefer lesson page, fallback to dashboard
  let url = "/dashboard";
  if (courseSlug && lessonId) {
    url = `/dashboard/${courseSlug}/${lessonId}`;
  }

  const title = isRegrade ? "Assignment Re-graded" : "Assignment Graded";
  let message = `Your assignment "${assignmentTitle}" has been ${isRegrade ? "re-graded" : "graded"}. Score: ${grade}/${maxPoints || "∞"} points`;

  if (feedback) {
    message += ` - Feedback: "${feedback.substring(0, 50)}${feedback.length > 50 ? "..." : ""}"`;
  }

  return await sendBrowserNotification({
    recipientId: studentId,
    type: "tutor_response",
    title,
    message,
    url,
    data: {
      assignmentTitle,
      grade,
      maxPoints,
      submissionId,
      isRegrade,
      feedback,
    },
  });
}

export async function notifyLessonCompletion(
  studentId: string,
  lessonTitle: string,
  lessonId: string,
) {
  return await sendBrowserNotification({
    recipientId: studentId,
    type: "lesson_completion",
    title: "Lesson Completed!",
    message: `Congratulations! You completed "${lessonTitle}"`,
    url: `/lesson/${lessonId}`,
    data: {
      lessonTitle,
      lessonId,
    },
  });
}

export async function notifyNewLesson(
  courseId: string,
  lessonTitle: string,
  lessonId: string,
) {
  // Get course info
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });

  return await sendBulkNotification(courseId, {
    type: "new_lesson",
    title: "New Lesson Available",
    message: `A new lesson "${lessonTitle}" is now available in ${course?.title || "your course"}`,
    url: `/lesson/${lessonId}`,
    data: {
      lessonTitle,
      lessonId,
      courseId,
    },
  });
}

export async function notifyCourseUpdate(
  courseId: string,
  updateTitle: string,
  updateMessage: string,
) {
  return await sendBulkNotification(courseId, {
    type: "course_update",
    title: updateTitle,
    message: updateMessage,
    url: `/course/${courseId}`,
    data: {
      courseId,
    },
  });
}

export async function notifyLiveLessonCreated(lessonId: string) {
  try {
    const lesson = await prisma.liveLesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!lesson || !lesson.courseId) {
      console.log(`Lesson ${lessonId} not found or has no course`);
      return 0;
    }

    return await sendBulkNotification(lesson.courseId, {
      type: "live_lesson_reminder",
      title: "New Live Lesson Scheduled",
      message: `A new live lesson "${lesson.title}" has been scheduled for ${new Date(lesson.scheduledAt).toLocaleString()}`,
      url: `/live-lessons/${lessonId}`,
      data: {
        lessonId,
        lessonTitle: lesson.title,
        scheduledAt: lesson.scheduledAt,
      },
    });
  } catch (error) {
    console.error("Error notifying live lesson created:", error);
    return 0;
  }
}

export async function notifyLiveLessonStarting(lessonId: string) {
  try {
    const lesson = await prisma.liveLesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!lesson || !lesson.courseId) {
      console.log(`Lesson ${lessonId} not found or has no course`);
      return 0;
    }

    return await sendBulkNotification(lesson.courseId, {
      type: "live_lesson_reminder",
      title: "Live Lesson Starting Soon!",
      message: `"${lesson.title}" is starting soon. Join now!`,
      url: `/live-lessons/${lessonId}`,
      data: {
        lessonId,
        lessonTitle: lesson.title,
        joinUrl: lesson.zoomJoinUrl,
      },
    });
  } catch (error) {
    console.error("Error notifying live lesson starting:", error);
    return 0;
  }
}

export async function notifyLiveLessonRecordingReady(lessonId: string) {
  try {
    const lesson = await prisma.liveLesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!lesson || !lesson.courseId) {
      console.log(`Lesson ${lessonId} not found or has no course`);
      return 0;
    }

    return await sendBulkNotification(lesson.courseId, {
      type: "live_lesson_reminder",
      title: "Recording Available",
      message: `The recording for "${lesson.title}" is now available to watch`,
      url: `/live-lessons/${lessonId}`,
      data: {
        lessonId,
        lessonTitle: lesson.title,
        recordingUrl: lesson.recordingUrl,
      },
    });
  } catch (error) {
    console.error("Error notifying recording ready:", error);
    return 0;
  }
}
