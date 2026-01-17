import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { env } from "./env";
import { emailOTP } from "better-auth/plugins";
import { resend } from "./resend";
import { admin } from "better-auth/plugins";
import { getSiteSettings } from "./site-settings";

// Check if Google OAuth is properly configured
const isGoogleOAuthConfigured =
  env.GOOGLE_CLIENT_ID &&
  env.GOOGLE_CLIENT_SECRET &&
  env.GOOGLE_CLIENT_ID !== "" &&
  env.GOOGLE_CLIENT_SECRET !== "";

if (!isGoogleOAuthConfigured) {
  console.warn(
    "⚠️ Google OAuth not configured. Social login will be disabled.",
  );
  console.warn(
    "   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables to enable Google OAuth.",
  );
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),

  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  trustedOrigins: [
    "http://localhost:3000",
    "http://86.108.20.128:3001",
    "https://yourdomain.com",
    "https://lingua-ly.com",
    "https://www.lingua-ly.com",
  ],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Email verification disabled - users can sign in immediately
    sendResetPassword: async ({ user, url }) => {
      // Send password reset email
      console.log("Password reset for:", user.email, "URL:", url);
    },
  },

  socialProviders: isGoogleOAuthConfigured
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "STUDENT",
        input: false,
        returned: true,
      },
      emailVerified: {
        type: "boolean",
        defaultValue: false,
        input: false,
        returned: true,
      },
    },
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        const isDev = process.env.NODE_ENV === "development";

        if (isDev) {
          console.log("📧 [Email OTP] Sending verification code to:", email);
          console.log("📧 [Email OTP] OTP Code:", otp);
        }

        try {
          // Check if email service is configured
          if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            if (isDev) {
              console.error("❌ [Email OTP] Email service not configured!");
              console.error(
                "📧 [Email OTP] For testing, use this OTP code:",
                otp,
              );
            }
            throw new Error(
              "Email service not configured. Please contact administrator.",
            );
          }

          const siteSettings = await getSiteSettings();

          // Get absolute logo URL (skip if localhost)
          const getAbsoluteUrl = (url: string | undefined): string | null => {
            if (!url) return null;
            if (url.startsWith("http://") || url.startsWith("https://"))
              return url;
            const baseUrl =
              process.env.NEXT_PUBLIC_APP_URL ||
              process.env.BETTER_AUTH_URL ||
              "https://www.lingua-ly.com";
            if (baseUrl.includes("localhost")) return null;
            return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
          };

          const logoUrl = getAbsoluteUrl(siteSettings.logo_url);
          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.BETTER_AUTH_URL ||
            "https://www.lingua-ly.com";

          // Use black as default for email colors
          const headerColor =
            siteSettings.email_header_color === "#4F46E5" ||
            siteSettings.email_header_color === "#7C3AED"
              ? "#000000"
              : siteSettings.email_header_color || "#000000";
          const accentColor =
            siteSettings.email_accent_color === "#4F46E5" ||
            siteSettings.email_accent_color === "#7C3AED"
              ? "#000000"
              : siteSettings.email_accent_color || "#000000";
          const footerColor = siteSettings.email_footer_color || "#666666";

          const emailContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
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
                  .otp-box { 
                    background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); 
                    border: 2px dashed ${accentColor}; 
                    border-radius: 12px; 
                    padding: 24px; 
                    text-align: center; 
                    margin: 24px 0; 
                  }
                  .otp-code { 
                    font-size: 36px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: ${accentColor};
                    font-family: 'Courier New', monospace;
                  }
                  .expiry-notice {
                    background: #FEF3C7;
                    border-left: 4px solid #F59E0B;
                    border-radius: 0 8px 8px 0;
                    padding: 16px;
                    margin: 24px 0;
                    font-size: 14px;
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
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    ${logoUrl ? `<img src="${logoUrl}" alt="${siteSettings.site_name}" class="logo" />` : ""}
                    <h1>Verify Your Email</h1>
                    <p>Welcome to ${siteSettings.site_name}!</p>
                  </div>
                  <div class="content">
                    <h2>Hello!</h2>
                    <p>Thank you for signing up with ${siteSettings.site_name}. To complete your registration, please use the verification code below:</p>
                    
                    <div class="otp-box">
                      <div class="otp-code">${otp}</div>
                    </div>
                    
                    <div class="expiry-notice">
                      <strong>⏱️ Important:</strong> This code will expire in 10 minutes.
                    </div>
                    
                    <p>If you didn't create an account with ${siteSettings.site_name}, you can safely ignore this email.</p>
                    
                    <p style="margin-top: 32px;">Best regards,<br><strong>The ${siteSettings.site_name} Team</strong></p>
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

          const fromEmail =
            env.FROM_EMAIL ||
            process.env.SMTP_FROM_EMAIL ||
            "noreply@lingua-ly.com";
          const result = await resend.emails.send({
            from: fromEmail,
            to: [email],
            subject: `${siteSettings.site_name} - Verify your email`,
            html: emailContent,
          });

          if (isDev) {
            console.log("✅ [Email OTP] Email sent successfully!");
          }
        } catch (error) {
          if (isDev) {
            console.error("❌ [Email OTP] Email sending failed:", error);
            console.error(
              "📧 [Email OTP] For testing, use this OTP code:",
              otp,
            );
          }
          throw error;
        }
      },
    }),
    admin({
      defaultRole: "STUDENT",
    }),
  ],
});
