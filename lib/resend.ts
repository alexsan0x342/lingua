import nodemailer from "nodemailer";
import { env } from "./env";

// SMTP Configuration
const smtpHost = env.SMTP_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(env.SMTP_PORT || process.env.SMTP_PORT || "587");
const smtpSecure =
  (env.SMTP_SECURE || process.env.SMTP_SECURE || "false") === "true";
const smtpUser = env.SMTP_USER || process.env.SMTP_USER;
const smtpPass = env.SMTP_PASS || process.env.SMTP_PASS;

// Create SMTP transporter
export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth:
    smtpUser && smtpPass
      ? {
          user: smtpUser,
          pass: smtpPass,
        }
      : undefined,
});

// Helper function to send emails (compatible with Resend API)
export const resend = {
  emails: {
    send: async (options: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
    }) => {
      try {
        // Handle both string and array for 'to' field
        const toAddresses = Array.isArray(options.to)
          ? options.to.join(", ")
          : options.to;

        const info = await transporter.sendMail({
          from: options.from,
          to: toAddresses,
          subject: options.subject,
          html: options.html,
        });

        return {
          data: { id: info.messageId },
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: {
            message: error instanceof Error ? error.message : "Unknown error",
            name: "smtp_error",
          },
        };
      }
    },
  },
};
