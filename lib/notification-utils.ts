/**
 * Notification utilities for sending different types of notifications
 */

interface NotificationData {
  recipientId: string;
  type: 'tutor_response' | 'new_lesson' | 'course_update' | 'announcement' | 'live_lesson_reminder';
  title: string;
  message: string;
  data?: Record<string, any>;
  url?: string;
}

export async function sendNotification(notificationData: NotificationData): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    if (response.ok) {
      console.log('Notification sent successfully');
      return true;
    } else {
      const error = await response.json();
      console.error('Failed to send notification:', error);
      return false;
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

export async function sendTutorResponseNotification(
  studentId: string,
  assignmentTitle: string,
  tutorName: string,
  submissionId: string
): Promise<boolean> {
  return sendNotification({
    recipientId: studentId,
    type: 'tutor_response',
    title: '📚 Tutor Response Received',
    message: `${tutorName} has responded to your assignment "${assignmentTitle}"`,
    data: {
      submissionId,
      assignmentTitle,
      tutorName,
    },
    url: `/dashboard?tab=assignments`,
  });
}

export async function sendNewLessonNotification(
  studentId: string,
  lessonTitle: string,
  courseTitle: string,
  courseSlug: string,
  lessonId: string
): Promise<boolean> {
  return sendNotification({
    recipientId: studentId,
    type: 'new_lesson',
    title: '🎯 New Lesson Available',
    message: `New lesson "${lessonTitle}" added to ${courseTitle}`,
    data: {
      lessonId,
      lessonTitle,
      courseTitle,
      courseSlug,
    },
    url: `/course/${courseSlug}`,
  });
}

export async function sendCourseUpdateNotification(
  studentId: string,
  courseTitle: string,
  courseSlug: string,
  updateType: string,
  courseId: string
): Promise<boolean> {
  return sendNotification({
    recipientId: studentId,
    type: 'course_update',
    title: '📖 Course Updated',
    message: `${courseTitle} has been updated: ${updateType}`,
    data: {
      courseId,
      courseTitle,
      updateType,
      courseSlug,
    },
    url: `/course/${courseSlug}`,
  });
}

export async function sendAnnouncementNotification(
  studentId: string,
  title: string,
  message: string,
  announcementId: string
): Promise<boolean> {
  return sendNotification({
    recipientId: studentId,
    type: 'announcement',
    title: '📢 New Announcement',
    message: message,
    data: {
      announcementId,
      announcementTitle: title,
    },
    url: '/dashboard?tab=announcements',
  });
}

export async function sendLiveLessonReminderNotification(
  studentId: string,
  lessonTitle: string,
  scheduledTime: string,
  lessonId: string
): Promise<boolean> {
  return sendNotification({
    recipientId: studentId,
    type: 'live_lesson_reminder',
    title: '🔴 Live Lesson Starting Soon',
    message: `"${lessonTitle}" starts at ${scheduledTime}`,
    data: {
      lessonId,
      lessonTitle,
      scheduledTime,
    },
    url: `/live-lessons/${lessonId}`,
  });
}

/**
 * Send notifications to all enrolled students in a course
 */
export async function sendNotificationToEnrolledStudents(
  courseId: string,
  notificationType: 'new_lesson' | 'course_update',
  title: string,
  message: string,
  additionalData?: Record<string, any>,
  url?: string
): Promise<void> {
  try {
    // This would typically be called from a server-side function
    // where you have access to the database to get enrolled students
    const response = await fetch('/api/notifications/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId,
        type: notificationType,
        title,
        message,
        data: additionalData,
        url,
      }),
    });

    if (response.ok) {
      console.log('Bulk notifications sent successfully');
    } else {
      const error = await response.json();
      console.error('Failed to send bulk notifications:', error);
    }
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
  }
}