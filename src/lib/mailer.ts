import "server-only";
import {
  createEmailGateway,
  type EmailGateway,
  type EmailMessage,
} from "@/integrations/email/gateway";
import { getServerEnv } from "@/lib/env";

const FALLBACK_FROM = "Vidyagata <no-reply@vidyagata.local>";

let cachedGateway: EmailGateway | null = null;
let consoleWarningShown = false;

function mailer(): EmailGateway {
  if (cachedGateway !== null) return cachedGateway;
  const env = getServerEnv();
  if (
    env.VERCEL_ENV === "production" &&
    env.EMAIL_PROVIDER === "console" &&
    !consoleWarningShown
  ) {
    consoleWarningShown = true;
    console.error(
      "[email] EMAIL_PROVIDER=console di produksi — email pemulihan akun tidak sampai ke pengguna",
    );
  }
  cachedGateway = createEmailGateway({
    provider: env.EMAIL_PROVIDER,
    smtpUrl: env.SMTP_URL,
    from: env.EMAIL_FROM ?? FALLBACK_FROM,
  });
  return cachedGateway;
}

export async function sendTransactionalEmail(
  message: EmailMessage,
): Promise<void> {
  const result = await mailer().send(message);
  if (!result.ok) {
    console.error(
      `[email] pengiriman gagal (${result.error.provider}): ${result.error.detail}`,
    );
  }
}
