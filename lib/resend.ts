import { Resend } from "resend";

// Initialize Resend with API key
const resendApiKey = process.env.SMTP_PASS || process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn(
    "[Resend] No API key found. Set RESEND_API_KEY or SMTP_PASS environment variable.",
  );
}

// Create Resend client
const resendClient = new Resend(resendApiKey);

// Export compatible interface
export const resend = {
  emails: {
    send: async (options: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
    }) => {
      try {
        if (!resendApiKey) {
          console.error("[Resend] API key not configured");
          return {
            data: null,
            error: {
              message: "Resend API key not configured",
              name: "config_error",
            },
          };
        }

        const result = await resendClient.emails.send({
          from: options.from,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
        });

        if (result.error) {
          console.error("[Resend] Error:", result.error);
          return {
            data: null,
            error: {
              message: result.error.message,
              name: result.error.name,
            },
          };
        }

        return {
          data: { id: result.data?.id },
          error: null,
        };
      } catch (error) {
        console.error("[Resend] Exception:", error);
        return {
          data: null,
          error: {
            message: error instanceof Error ? error.message : "Unknown error",
            name: "resend_error",
          },
        };
      }
    },
  },
};

// Also export the client directly for advanced usage
export { resendClient };
