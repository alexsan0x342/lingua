import webpush from "web-push";
import { prisma } from "./db";

// Initialize web-push with VAPID keys
// Generate keys with: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject =
  process.env.VAPID_SUBJECT || "mailto:noreply@lingua-ly.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  url?: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload,
): Promise<boolean> {
  try {
    console.log(
      `[Push] Attempting to send push notification to user ${userId}`,
    );

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn(
        "[Push] VAPID keys not configured. Push notifications disabled.",
      );
      console.warn(
        "[Push] VAPID Public Key:",
        vapidPublicKey ? "Present" : "Missing",
      );
      console.warn(
        "[Push] VAPID Private Key:",
        vapidPrivateKey ? "Present" : "Missing",
      );
      return false;
    }

    // Get user's push subscription
    console.log(`[Push] Fetching push subscription for user ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true },
    });

    if (!user?.pushSubscription) {
      console.log(`[Push] No push subscription found for user ${userId}`);
      return false;
    }

    console.log(`[Push] Found push subscription for user ${userId}`);
    const subscription = user.pushSubscription as any;
    console.log(
      `[Push] Subscription endpoint:`,
      subscription.endpoint?.substring(0, 50) + "...",
    );

    // Prepare notification payload
    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/logo.svg",
      badge: payload.badge || "/logo.svg",
      tag: payload.tag,
      data: {
        ...payload.data,
        url: payload.url || "/notifications",
      },
      actions: payload.actions,
    };

    console.log(`[Push] Sending notification with title: "${payload.title}"`);
    // Send push notification
    await webpush.sendNotification(
      subscription,
      JSON.stringify(notificationPayload),
    );

    console.log(
      `[Push] ✅ Push notification sent successfully to user ${userId}`,
    );
    return true;
  } catch (error: any) {
    console.error(
      `[Push] ❌ Failed to send push notification to user ${userId}:`,
      error,
    );
    console.error("[Push] Error details:", {
      message: error.message,
      statusCode: error.statusCode,
      body: error.body,
    });

    // If subscription is no longer valid, remove it from database
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(
        `[Push] Subscription expired (${error.statusCode}), removing from database`,
      );
      await prisma.user.update({
        where: { id: userId },
        data: { pushSubscription: null as any },
      });
    }

    return false;
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushNotificationPayload,
): Promise<{ successful: number; failed: number }> {
  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushNotificationToUser(userId, payload)),
  );

  const successful = results.filter(
    (r) => r.status === "fulfilled" && r.value,
  ).length;
  const failed = results.length - successful;

  return { successful, failed };
}

/**
 * Send push notification to all enrolled students in a course
 */
export async function sendPushToCourseStudents(
  courseId: string,
  payload: PushNotificationPayload,
): Promise<{ successful: number; failed: number }> {
  try {
    // Get all enrolled students with push subscriptions
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: {
        userId: true,
        User: {
          select: {
            pushSubscription: true,
          },
        },
      },
    });

    const userIds = enrollments
      .filter((e) => e.User.pushSubscription)
      .map((e) => e.userId);

    return await sendPushNotificationToUsers(userIds, payload);
  } catch (error) {
    console.error("Failed to send push to course students:", error);
    return { successful: 0, failed: 0 };
  }
}

/**
 * Test push notification (admin only)
 */
export async function sendTestPushNotification(
  userId: string,
): Promise<boolean> {
  return await sendPushNotificationToUser(userId, {
    title: "🔔 Test Notification",
    body: "This is a test push notification. If you see this, push notifications are working!",
    tag: "test-notification",
    url: "/settings",
  });
}
