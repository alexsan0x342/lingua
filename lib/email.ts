import { resend } from "./resend";
import { getSiteSettings } from "./site-settings";
import { env } from "./env";

interface GradeEmailData {
  studentEmail: string;
  studentName: string;
  assignmentTitle: string;
  grade: number;
  maxPoints: number;
  feedback?: string;
  courseName: string;
}

interface InvoiceEmailData {
  customerEmail: string;
  customerName: string;
  courseName: string;
  amount: number;
  currency: string;
  invoiceNumber: string;
  purchaseDate: string;
}

interface BulkEmailData {
  subject: string;
  content: string;
  recipients: Array<{
    email: string;
    name: string;
  }>;
}

interface ReceiptEmailData {
  customerEmail: string;
  customerName: string;
  courseName: string;
  courseDescription?: string;
  amount: number;
  currency: string;
  receiptNumber: string;
  transactionDate: string;
  accessMethod: "purchase" | "redemption_code" | "free_access";
  redemptionCode?: string;
}

// Helper function to get absolute URL for assets
function getAbsoluteUrl(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  // If already absolute, return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Convert relative URL to absolute using production URL
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "https://www.lingua-ly.com";

  const absoluteUrl = `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  return absoluteUrl;
}

// Helper function to generate dynamic email styles
function generateEmailStyles(siteSettings: any) {
  // Use purple/indigo color scheme from globals.css
  const headerColor = "#143a7b"; // Primary dark blue
  const buttonColor = "#143a7b"; // Primary dark blue
  const footerColor = "#be531e"; // Secondary orange
  const accentColor = "#143a7b"; // Primary dark blue

  return `
    body { 
      font-family: ${siteSettings.email_font_family || "Arial, sans-serif"}; 
      margin: 0; 
      padding: 20px; 
      background-color: #f4f4f4; 
      line-height: 1.6;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 8px; 
      overflow: hidden; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
    }
    .header { 
      background: ${headerColor}; 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .logo {
      max-width: 120px;
      height: auto;
      margin-bottom: 15px;
    }
    .content { 
      padding: 40px 30px; 
      color: #374151;
    }
    .content h2 {
      color: #111827;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      margin-bottom: 16px;
    }
    .grade-box { 
      background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); 
      border: 2px solid ${accentColor}; 
      border-radius: 12px; 
      padding: 24px; 
      text-align: center; 
      margin: 24px 0; 
    }
    .grade-score { 
      font-size: 2.5em; 
      font-weight: bold; 
      color: ${accentColor}; 
      margin-bottom: 8px;
    }
    .feedback { 
      background: #F8FAFC; 
      border-left: 4px solid ${accentColor}; 
      border-radius: 0 8px 8px 0;
      padding: 20px; 
      margin: 24px 0; 
    }
    .feedback h3 {
      margin-top: 0;
      color: #111827;
    }
    .button { 
      display: inline-block; 
      background: ${buttonColor}; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 6px; 
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #333333;
    }
    .footer { 
      background: ${footerColor}; 
      color: white;
      padding: 30px 24px; 
      text-align: center; 
      font-size: 14px; 
    }
    .footer p {
      margin: 8px 0;
    }
    .footer a {
      color: white;
      text-decoration: none;
    }
  `;
}

// Helper function to generate email footer
function generateEmailFooter(siteSettings: any) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "https://www.lingua-ly.com";
  return `
    <div class="footer">
      <p><strong>${siteSettings.site_name}</strong></p>
      <p><a href="${appUrl}">${appUrl.replace("https://", "")}</a></p>
      <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">© ${new Date().getFullYear()} ${siteSettings.site_name}. All rights reserved.</p>
    </div>
  `;
}

export async function sendGradeNotification(data: GradeEmailData) {
  try {
    const percentage = ((data.grade / data.maxPoints) * 100).toFixed(1);
    const siteSettings = await getSiteSettings();

    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            ${generateEmailStyles(siteSettings)}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Assignment Graded</h1>
              <p>Your assignment has been reviewed and graded</p>
            </div>
            <div class="content">
              <h2>Hello ${data.studentName}!</h2>
              <p>Great news! Your assignment "<strong>${data.assignmentTitle}</strong>" from <strong>${data.courseName}</strong> has been graded.</p>
              
              <div class="grade-box">
                <div class="grade-score">${data.grade}/${data.maxPoints}</div>
                <p>Score: ${percentage}%</p>
              </div>
              
              ${
                data.feedback
                  ? `
                <div class="feedback">
                  <h3>Instructor Feedback:</h3>
                  <p>${data.feedback}</p>
                </div>
              `
                  : ""
              }
              
              <p>Keep up the excellent work! You can view your full assignment details by logging into your dashboard.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View Dashboard</a>
            </div>
            ${generateEmailFooter(siteSettings)}
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from:
        env.FROM_EMAIL || `${siteSettings.site_name} <noreply@lingua-ly.com>`,
      to: data.studentEmail,
      subject: `Assignment Graded: ${data.assignmentTitle} - ${percentage}%`,
      html: emailContent,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send grade notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendInvoiceEmail(data: InvoiceEmailData) {
  try {
    const siteSettings = await getSiteSettings();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.BETTER_AUTH_URL ||
      "https://www.lingua-ly.com";
    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: #143a7b; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .invoice-box { background: #F0FDF4; border: 2px solid #143a7b; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .amount { font-size: 1.5em; font-weight: bold; color: #143a7b; }
            .invoice-details { display: flex; justify-content: space-between; margin: 10px 0; }
            .footer { background: #be531e; color: white; padding: 20px; text-align: center; font-size: 0.9em; }
            .footer a { color: white; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invoice</h1>
              <p>Thank you for your purchase!</p>
            </div>
            <div class="content">
              <h2>Hello ${data.customerName}!</h2>
              <p>Thank you for enrolling in <strong>${data.courseName}</strong>. Here are your purchase details:</p>
              
              <div class="invoice-box">
                <div class="invoice-details">
                  <span><strong>Invoice Number:</strong></span>
                  <span>${data.invoiceNumber}</span>
                </div>
                <div class="invoice-details">
                  <span><strong>Purchase Date:</strong></span>
                  <span>${data.purchaseDate}</span>
                </div>
                <div class="invoice-details">
                  <span><strong>Course:</strong></span>
                  <span>${data.courseName}</span>
                </div>
                <div class="invoice-details">
                  <span><strong>Amount Paid:</strong></span>
                  <span class="amount">{data.amount.toFixed(2)} LYD</span>
                </div>
              </div>
              
              <p>You now have full access to the course content. Start learning by visiting your dashboard!</p>
            </div>
            <div class="footer">
              <p><strong>${siteSettings.site_name}</strong></p>
              <p><a href="${appUrl}">${appUrl.replace("https://", "")}</a></p>
              <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">© ${new Date().getFullYear()} ${siteSettings.site_name}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from:
        env.FROM_EMAIL || `${siteSettings.site_name} <noreply@lingua-ly.com>`,
      to: data.customerEmail,
      subject: `Invoice for ${data.courseName} - ${data.invoiceNumber}`,
      html: emailContent,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const siteSettings = await getSiteSettings();

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return { success: false, error: "Email service not configured" };
    }

    await resend.emails.send({
      from:
        env.FROM_EMAIL || `${siteSettings.site_name} <noreply@lingua-ly.com>`,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendBulkEmail(data: BulkEmailData) {
  try {
    const siteSettings = await getSiteSettings();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.BETTER_AUTH_URL ||
      "https://www.lingua-ly.com";
    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: #143a7b; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; line-height: 1.6; }
            .footer { background: #be531e; color: white; padding: 20px; text-align: center; font-size: 0.9em; }
            .footer a { color: white; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Message from ${siteSettings.site_name}</h1>
            </div>
            <div class="content">
              ${data.content}
            </div>
            <div class="footer">
              <p><strong>${siteSettings.site_name}</strong></p>
              <p><a href="${appUrl}">${appUrl.replace("https://", "")}</a></p>
              <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">© ${new Date().getFullYear()} ${siteSettings.site_name}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails in batches to avoid rate limiting
    const batchSize = 50;
    const results = [];

    for (let i = 0; i < data.recipients.length; i += batchSize) {
      const batch = data.recipients.slice(i, i + batchSize);

      const batchPromises = batch.map((recipient) =>
        resend.emails.send({
          from:
            env.FROM_EMAIL ||
            `${siteSettings.site_name} <noreply@lingua-ly.com>`,
          to: recipient.email,
          subject: data.subject,
          html: emailContent.replace("{{name}}", recipient.name),
        }),
      );

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);

      // Add a small delay between batches
      if (i + batchSize < data.recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return {
      success: true,
      sent: successful,
      failed: failed,
      total: data.recipients.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendReceiptEmail(data: ReceiptEmailData) {
  try {
    const siteSettings = await getSiteSettings();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.BETTER_AUTH_URL ||
      "https://www.lingua-ly.com";

    // Determine the access method text and styling
    const accessMethodLabels = {
      purchase: { label: "Purchase", badge: "#10B981", icon: "💳" },
      redemption_code: {
        label: "Code Redemption",
        badge: "#143a7b",
        icon: "🎟️",
      },
      free_access: { label: "Free Access", badge: "#F59E0B", icon: "🎁" },
    };

    const methodInfo = accessMethodLabels[data.accessMethod];
    const isPaid = data.accessMethod === "purchase" && data.amount > 0;

    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: #143a7b; color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; }
            .success-icon { font-size: 48px; margin-bottom: 15px; }
            .content { padding: 30px; }
            .greeting { font-size: 18px; color: #111827; margin-bottom: 20px; }
            .receipt-box { background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); border: 2px solid #10B981; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .receipt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px dashed #10B981; padding-bottom: 15px; }
            .receipt-title { font-size: 18px; font-weight: 600; color: #065F46; }
            .receipt-number { font-size: 12px; color: #6B7280; }
            .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2); }
            .receipt-row:last-child { border-bottom: none; }
            .receipt-label { color: #6B7280; font-size: 14px; }
            .receipt-value { color: #111827; font-weight: 500; font-size: 14px; }
            .total-row { background: #10B981; color: white; margin: 15px -24px -24px -24px; padding: 15px 24px; border-radius: 0 0 10px 10px; display: flex; justify-content: space-between; }
            .total-label { font-weight: 600; }
            .total-amount { font-size: 20px; font-weight: 700; }
            .access-badge { display: inline-block; background: ${methodInfo.badge}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 15px; }
            .course-card { background: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #143a7b; }
            .course-name { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 8px; }
            .course-desc { font-size: 14px; color: #6B7280; line-height: 1.5; }
            .cta-button { display: inline-block; background: #143a7b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .cta-button:hover { background: #0f2d5e; }
            .footer { background: #be531e; color: white; padding: 25px; text-align: center; font-size: 14px; }
            .footer a { color: white; text-decoration: none; }
            .footer p { margin: 5px 0; }
            .divider { height: 1px; background: #E5E7EB; margin: 20px 0; }
            .note { font-size: 13px; color: #6B7280; background: #F9FAFB; padding: 15px; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Access Confirmed!</h1>
              <p>Your course enrollment is complete</p>
            </div>
            <div class="content">
              <p class="greeting">Hello ${data.customerName}! 👋</p>
              
              <span class="access-badge">${methodInfo.icon} ${methodInfo.label}</span>
              
              <p>Great news! You now have full access to the following course:</p>
              
              <div class="course-card">
                <div class="course-name">📚 ${data.courseName}</div>
                ${data.courseDescription ? `<div class="course-desc">${data.courseDescription}</div>` : ""}
              </div>
              
              <div class="receipt-box">
                <div class="receipt-header">
                  <span class="receipt-title">Receipt Details</span>
                  <span class="receipt-number">#${data.receiptNumber}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Date</span>
                  <span class="receipt-value">${data.transactionDate}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Course</span>
                  <span class="receipt-value">${data.courseName}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Access Type</span>
                  <span class="receipt-value">${methodInfo.label}</span>
                </div>
                ${
                  data.redemptionCode
                    ? `
                <div class="receipt-row">
                  <span class="receipt-label">Redemption Code</span>
                  <span class="receipt-value" style="font-family: monospace;">${data.redemptionCode}</span>
                </div>
                `
                    : ""
                }
                <div class="total-row">
                  <span class="total-label">${isPaid ? "Amount Paid" : "Total"}</span>
                  <span class="total-amount">${isPaid ? `${data.amount.toFixed(2)} LYD` : "FREE"}</span>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${appUrl}/dashboard" class="cta-button">🚀 Start Learning Now</a>
              </div>
              
              <div class="divider"></div>
              
              <div class="note">
                <strong>💡 Quick Tips:</strong><br>
                • Access your course anytime from your dashboard<br>
                • Track your progress as you complete lessons<br>
                • Keep this email as your receipt for reference
              </div>
            </div>
            <div class="footer">
              <p><strong>${siteSettings.site_name}</strong></p>
              <p><a href="${appUrl}">${appUrl.replace("https://", "")}</a></p>
              <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">© ${new Date().getFullYear()} ${siteSettings.site_name}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from:
        env.FROM_EMAIL || `${siteSettings.site_name} <noreply@lingua-ly.com>`,
      to: data.customerEmail,
      subject: `🎉 Course Access Confirmed: ${data.courseName}`,
      html: emailContent,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
