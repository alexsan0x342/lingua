import { resend } from "./resend";
import { env } from "./env";

// Rate limiter: Ensures we don't exceed 2 requests per second
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendWithRateLimit<T>(
  fn: () => Promise<T>,
  delayMs: number = 600, // 600ms = ~1.6 requests per second (safe margin)
): Promise<T> {
  await delay(delayMs);
  return fn();
}

// Batch send emails with rate limiting
export async function sendEmailsInBatches<T>(
  emails: (() => Promise<T>)[],
  delayMs: number = 600,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];

  for (const emailFn of emails) {
    try {
      const result = await sendWithRateLimit(emailFn, delayMs);
      results.push({ status: "fulfilled", value: result });
    } catch (error) {
      results.push({ status: "rejected", reason: error });
    }
  }

  return results;
}

interface LiveLessonNotificationProps {
  userEmail: string;
  userName: string;
  lessonTitle: string;
  lessonDescription?: string;
  scheduledAt: string;
  duration: number;
  zoomJoinUrl: string;
  zoomPassword?: string;
  courseName?: string;
  isReminder?: boolean;
  minutesUntilStart?: number;
  isRecordingNotification?: boolean;
  recordingUrl?: string;
}

export async function sendLiveLessonNotification({
  userEmail,
  userName,
  lessonTitle,
  lessonDescription,
  scheduledAt,
  duration,
  zoomJoinUrl,
  zoomPassword,
  courseName,
  isReminder = false,
  minutesUntilStart,
  isRecordingNotification = false,
  recordingUrl,
}: LiveLessonNotificationProps) {
  const lessonDate = new Date(scheduledAt);
  const formattedDate = lessonDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = lessonDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  let emailSubject: string;
  let emailHtml: string;

  if (isRecordingNotification) {
    emailSubject = `📺 Recording Available: "${lessonTitle}"`;
    emailHtml = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: oklch(0.4341 0.0392 41.9938); color: oklch(1.0000 0 0); padding: 30px; border-radius: 0.5rem 0.5rem 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600;">📺 Recording Now Available!</h1>
        </div>
        
        <div style="background: oklch(0.9911 0 0); padding: 30px; border-radius: 0 0 0.5rem 0.5rem; border: 1px solid oklch(0.8822 0 0);">
          <p style="font-size: 16px; margin-bottom: 20px; color: oklch(0.2435 0 0);">Hi ${userName},</p>
          
          <div style="background: oklch(0.9521 0 0); border: 1px solid oklch(0.8822 0 0); border-radius: 0.5rem; padding: 15px; margin-bottom: 25px; text-align: center;">
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: oklch(0.2435 0 0);">
              The recording for your live lesson is now ready to watch!
            </p>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 25px; color: oklch(0.2435 0 0);">
            Your live lesson <strong>"${lessonTitle}"</strong> recording is available:
          </p>
          
          ${
            lessonDescription
              ? `
            <div style="background: oklch(0.9911 0 0); padding: 15px; border-radius: 0.5rem; margin-bottom: 20px; border-left: 4px solid oklch(0.4341 0.0392 41.9938);">
              <p style="margin: 0; color: oklch(0.5032 0 0);">${lessonDescription}</p>
            </div>
          `
              : ""
          }
          
          <div style="background: oklch(0.9911 0 0); padding: 20px; border-radius: 0.5rem; margin-bottom: 25px; border: 1px solid oklch(0.8822 0 0);">
            <h3 style="margin-top: 0; color: oklch(0.2435 0 0); font-weight: 600;">📅 Lesson Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Original Date:</td>
                <td style="padding: 8px 0; color: oklch(0.2435 0 0);">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Original Time:</td>
                <td style="padding: 8px 0; color: oklch(0.2435 0 0);">${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Duration:</td>
                <td style="padding: 8px 0; color: oklch(0.2435 0 0);">${duration} minutes</td>
              </tr>
              ${
                courseName
                  ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Course:</td>
                  <td style="padding: 8px 0; color: oklch(0.2435 0 0);">${courseName}</td>
                </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${recordingUrl}" 
               style="display: inline-block; background: oklch(0.4341 0.0392 41.9938); color: oklch(1.0000 0 0); padding: 15px 30px; text-decoration: none; border-radius: 0.5rem; font-weight: 600; font-size: 16px; transition: all 0.2s ease;">
              📺 Go to Dashboard
            </a>
          </div>
          
          <div style="background: oklch(0.9521 0 0); border: 1px solid oklch(0.8822 0 0); border-radius: 0.5rem; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: oklch(0.2435 0 0); font-size: 14px;">
              <strong>💡 How to watch:</strong> Click the button above to go to your dashboard. In the "Previous Lessons" section, you'll find the lesson with a "Watch Lesson" button to view the recording.
            </p>
          </div>
          
          <div style="background: oklch(0.9521 0 0); border: 1px solid oklch(0.8822 0 0); border-radius: 0.5rem; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: oklch(0.2435 0 0); font-size: 14px;">
              <strong>� Note:</strong> This recording will remain available for the duration of your course enrollment. You can watch it as many times as you need!
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid oklch(0.8822 0 0); margin: 25px 0;">
          
          <p style="font-size: 14px; color: oklch(0.5032 0 0); margin-bottom: 10px;">
            Having trouble accessing the recording? Try:
          </p>
          <ul style="font-size: 14px; color: oklch(0.5032 0 0); margin-left: 20px;">
            <li>Opening the link in a different browser</li>
            <li>Clearing your browser cache and cookies</li>
            <li>Contacting support if you need assistance</li>
          </ul>
          
          <p style="font-size: 14px; color: oklch(0.5032 0 0); margin-top: 20px;">
            Best regards,<br>
            <strong>Your Learning Team</strong>
          </p>
        </div>
      </div>
    `;
  } else {
    emailSubject = isReminder
      ? `⏰ Reminder: "${lessonTitle}" starts in ${minutesUntilStart} minutes`
      : `🎥 Live Lesson: "${lessonTitle}" starting soon`;

    const urgencyMessage = isReminder
      ? `Your live lesson starts in ${minutesUntilStart} minutes!`
      : `Your live lesson is starting very soon!`;

    emailHtml = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: oklch(0.4341 0.0392 41.9938); color: oklch(1.0000 0 0); padding: 30px; border-radius: 0.5rem 0.5rem 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600;">${isReminder ? "⏰" : "🎥"} Live Lesson ${isReminder ? "Reminder" : "Starting Soon"}!</h1>
        </div>
        
        <div style="background: oklch(0.9911 0 0); padding: 30px; border-radius: 0 0 0.5rem 0.5rem; border: 1px solid oklch(0.8822 0 0);">
          <p style="font-size: 16px; margin-bottom: 20px; color: oklch(0.2435 0 0);">Hi ${userName},</p>
          
          <div style="background: ${isReminder ? "oklch(0.9200 0.0651 74.3695)" : "oklch(0.9521 0 0)"}; border: 1px solid oklch(0.8822 0 0); border-radius: 0.5rem; padding: 15px; margin-bottom: 25px; text-align: center;">
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: oklch(0.2435 0 0);">
              ${urgencyMessage}
            </p>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 25px; color: oklch(0.2435 0 0);">
            Your live lesson <strong>"${lessonTitle}"</strong> details:
          </p>
          
          ${
            lessonDescription
              ? `
            <div style="background: oklch(0.9911 0 0); padding: 15px; border-radius: 0.5rem; margin-bottom: 20px; border-left: 4px solid oklch(0.4341 0.0392 41.9938);">
              <p style="margin: 0; color: oklch(0.5032 0 0);">${lessonDescription}</p>
            </div>
          `
              : ""
          }
          
          <div style="background: oklch(0.9911 0 0); padding: 20px; border-radius: 0.5rem; margin-bottom: 25px; border: 1px solid oklch(0.8822 0 0);">
            <h3 style="margin-top: 0; color: oklch(0.2435 0 0); font-weight: 600;">📅 Lesson Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Date:</td>
                <td style="padding: 8px 0; color: oklch(0.2435 0 0);">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Time:</td>
                <td style="padding: 8px 0; color: oklch(0.2435 0 0);">${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Duration:</td>
                <td style="padding: 8px 0; color: oklch(0.2435 0 0);">${duration} minutes</td>
              </tr>
              ${
                courseName
                  ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Course:</td>
                  <td style="padding: 8px 0; color: oklch(0.2435 0 0);">${courseName}</td>
                </tr>
              `
                  : ""
              }
              ${
                zoomPassword
                  ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Meeting Password:</td>
                  <td style="padding: 8px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; background: oklch(0.9521 0 0); padding: 4px 8px; border-radius: 0.25rem; color: oklch(0.2435 0 0);">${zoomPassword}</td>
                </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${zoomJoinUrl}" 
               style="display: inline-block; background: oklch(0.4341 0.0392 41.9938); color: oklch(1.0000 0 0); padding: 15px 30px; text-decoration: none; border-radius: 0.5rem; font-weight: 600; font-size: 16px; transition: all 0.2s ease;">
              🎥 Join Live Lesson Now
            </a>
          </div>
          
          <div style="background: oklch(0.9200 0.0651 74.3695); border: 1px solid oklch(0.8822 0 0); border-radius: 0.5rem; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: oklch(0.3499 0.0685 40.8288); font-size: 14px;">
              <strong>💡 Tip:</strong> Join a few minutes early to test your audio and video. Make sure you have a stable internet connection!
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid oklch(0.8822 0 0); margin: 25px 0;">
          
          <p style="font-size: 14px; color: oklch(0.5032 0 0); margin-bottom: 10px;">
            If you're having trouble joining, you can:
          </p>
          <ul style="font-size: 14px; color: oklch(0.5032 0 0); margin-left: 20px;">
            <li>Copy and paste this link into your browser: <a href="${zoomJoinUrl}" style="color: oklch(0.4341 0.0392 41.9938);">${zoomJoinUrl}</a></li>
            <li>Download the Zoom app from <a href="https://zoom.us/download" style="color: oklch(0.4341 0.0392 41.9938);">zoom.us/download</a></li>
            <li>Contact support if you need technical assistance</li>
          </ul>
          
          <p style="font-size: 14px; color: oklch(0.5032 0 0); margin-top: 20px;">
            Best regards,<br>
            <strong>Your Learning Team</strong>
          </p>
        </div>
      </div>
    `;
  }

  try {
    const result = await resend.emails.send({
      from: env.FROM_EMAIL || "Live Lessons <noreply@lingua-ly.com>",
      to: [userEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    return result;
  } catch (error) {
    throw error;
  }
}

interface LiveLessonStatusNotificationProps {
  userEmail: string;
  userName: string;
  lessonTitle: string;
  lessonDescription?: string;
  scheduledAt: string;
  duration: number;
  zoomJoinUrl: string;
  zoomPassword?: string;
  courseName?: string;
  status: string;
  message?: string;
  lessonId: string;
}

export async function sendLiveLessonStatusNotification({
  userEmail,
  userName,
  lessonTitle,
  lessonDescription,
  scheduledAt,
  duration,
  zoomJoinUrl,
  zoomPassword,
  courseName,
  status,
  message,
  lessonId,
}: LiveLessonStatusNotificationProps) {
  const lessonDate = new Date(scheduledAt);
  const formattedDate = lessonDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = lessonDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const statusEmojis: Record<string, string> = {
    Starting: "🚀",
    Started: "🎬",
    InProgress: "⏳",
    Paused: "⏸️",
    Resumed: "▶️",
    Ended: "🏁",
    Completed: "✅",
    Cancelled: "❌",
  };

  const statusMessages: Record<string, string> = {
    Starting: "Your live lesson is about to begin!",
    Started: "Your live lesson has started!",
    InProgress: "Your live lesson is now in progress!",
    Paused: "Your live lesson has been paused.",
    Resumed: "Your live lesson has resumed!",
    Ended: "Your live lesson has ended.",
    Completed: "Your live lesson has been completed!",
    Cancelled: "Your live lesson has been cancelled.",
  };

  const emailSubject = `${statusEmojis[status] || "📢"} ${status}: "${lessonTitle}"`;
  const statusMessage =
    statusMessages[status] ||
    `Your live lesson status has been updated to: ${status}`;

  const emailHtml = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: oklch(0.4341 0.0392 41.9938); color: oklch(1.0000 0 0); padding: 30px; border-radius: 0.5rem 0.5rem 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600;">${statusEmojis[status] || "📢"} Live Lesson Status Update</h1>
      </div>
      
      <div style="background: oklch(0.9911 0 0); padding: 30px; border-radius: 0 0 0.5rem 0.5rem; border: 1px solid oklch(0.8822 0 0);">
        <p style="font-size: 16px; margin-bottom: 20px; color: oklch(0.2435 0 0);">Hi ${userName},</p>
        
        <div style="background: oklch(0.9521 0 0); border: 1px solid oklch(0.8822 0 0); border-radius: 0.5rem; padding: 15px; margin-bottom: 25px; text-align: center;">
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: oklch(0.2435 0 0);">
            ${statusMessage}
          </p>
        </div>
        
        <p style="font-size: 16px; margin-bottom: 25px; color: oklch(0.2435 0 0);">
          Your live lesson <strong>"${lessonTitle}"</strong> details:
        </p>
        
        ${
          lessonDescription
            ? `
          <div style="background: oklch(0.9911 0 0); padding: 15px; border-radius: 0.5rem; margin-bottom: 20px; border-left: 4px solid oklch(0.4341 0.0392 41.9938);">
            <p style="margin: 0; color: oklch(0.5032 0 0);">${lessonDescription}</p>
          </div>
        `
            : ""
        }
        
        <div style="background: oklch(0.9911 0 0); padding: 20px; border-radius: 0.5rem; margin-bottom: 25px; border: 1px solid oklch(0.8822 0 0);">
          <h3 style="margin-top: 0; color: oklch(0.2435 0 0); font-weight: 600;">📅 Lesson Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Date:</td>
              <td style="padding: 8px 0; color: oklch(0.2435 0 0);">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Time:</td>
              <td style="padding: 8px 0; color: oklch(0.2435 0 0);">${formattedTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Duration:</td>
              <td style="padding: 8px 0; color: oklch(0.2435 0 0);">${duration} minutes</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Status:</td>
              <td style="padding: 8px 0; color: oklch(0.2435 0 0);">
                <span style="background: oklch(0.4341 0.0392 41.9938); color: oklch(1.0000 0 0); padding: 4px 12px; border-radius: 0.25rem; font-size: 12px; font-weight: 600;">
                  ${status}
                </span>
              </td>
            </tr>
            ${
              courseName
                ? `
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: oklch(0.5032 0 0);">Course:</td>
                <td style="padding: 8px 0; color: oklch(0.2435 0 0);">${courseName}</td>
              </tr>
            `
                : ""
            }
          </table>
        </div>
        
        ${
          message
            ? `
          <div style="background: oklch(0.9200 0.0651 74.3695); border: 1px solid oklch(0.8822 0 0); border-radius: 0.5rem; padding: 15px; margin-bottom: 25px;">
            <h4 style="margin-top: 0; color: oklch(0.3499 0.0685 40.8288); font-weight: 600;">📢 Additional Message:</h4>
            <p style="margin: 0; color: oklch(0.3499 0.0651 74.3695);">${message}</p>
          </div>
        `
            : ""
        }
        
        ${
          (status === "Starting" ||
            status === "Started" ||
            status === "InProgress") &&
          zoomJoinUrl
            ? `
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${zoomJoinUrl}" 
               style="display: inline-block; background: oklch(0.4341 0.0392 41.9938); color: oklch(1.0000 0 0); padding: 15px 30px; text-decoration: none; border-radius: 0.5rem; font-weight: 600; font-size: 16px; transition: all 0.2s ease;">
              🎥 Join Live Lesson Now
              </a>
          </div>
          
          ${
            zoomPassword
              ? `
            <div style="background: oklch(0.9911 0 0); padding: 15px; border-radius: 0.5rem; margin-bottom: 20px; border: 1px solid oklch(0.8822 0 0); text-align: center;">
              <p style="margin: 0; color: oklch(0.2435 0 0); font-size: 14px;">
                <strong>🔑 Meeting Password:</strong> 
                <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; background: oklch(0.9521 0 0); padding: 4px 8px; border-radius: 0.25rem; color: oklch(0.2435 0 0);">${zoomPassword}</span>
              </p>
            </div>
          `
              : ""
          }
        `
            : ""
        }
        
        <div style="background: oklch(0.9521 0 0); border: 1px solid oklch(0.8822 0 0); border-radius: 0.5rem; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: oklch(0.5032 0 0); font-size: 14px;">
            <strong>💡 Note:</strong> You'll receive additional notifications for important updates. Keep an eye on your email!
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid oklch(0.8822 0 0); margin: 25px 0;">
        
        <p style="font-size: 14px; color: oklch(0.5032 0 0); margin-bottom: 10px;">
          If you have any questions, please contact your instructor or support team.
        </p>
        
        <p style="font-size: 14px; color: oklch(0.2435 0 0); margin-top: 20px;">
          Best regards,<br>
          <strong>Your Learning Team</strong>
        </p>
      </div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: env.FROM_EMAIL || "Live Lessons <noreply@lingua-ly.com>",
      to: [userEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    return result;
  } catch (error) {
    throw error;
  }
}
