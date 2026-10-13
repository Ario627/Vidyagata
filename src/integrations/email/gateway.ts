import nodemailer, { type Transporter } from "nodemailer";
import { err, ok, type Result } from "@/domain/shared/result";

export const EMAIL_PROVIDERS = ["console", "smtp"] as const;

export type EmailProviderId = (typeof EMAIL_PROVIDERS)[number];

export type EmailMessage = {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
};

export type EmailError = {
  readonly kind: "send_failed";
  readonly provider: EmailProviderId;
  readonly detail: string;
};

export type EmailGateway = {
  readonly id: EmailProviderId;
  send(message: EmailMessage): Promise<Result<void, EmailError>>;
};

const MASK_VISIBLE_CHARS = 1;
const SMTP_TIMEOUT_MS = 10_000;
const DEFAULT_SMTPS_PORT = 465;
const DEFAULT_SMTP_PORT = 587;

type SmtpConnection = {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly auth: { readonly user: string; readonly pass: string } | undefined;
};

function parseSmtpUrl(smtpUrl: string): SmtpConnection {
  const url = new URL(smtpUrl);
  const secure = url.protocol === "smtps:";
  const fallbackPort = secure ? DEFAULT_SMTPS_PORT : DEFAULT_SMTP_PORT;
  return {
    host: url.hostname,
    port: url.port === "" ? fallbackPort : Number(url.port),
    secure,
    auth:
      url.username === ""
        ? undefined
        : {
            user: decodeURIComponent(url.username),
            pass: decodeURIComponent(url.password),
          },
  };
}

export function maskEmailAddress(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return "***";
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  const visible = local.slice(0, MASK_VISIBLE_CHARS);
  return `${visible}${"*".repeat(Math.max(local.length - 1, 1))}${domain}`;
}

const consoleGateway: EmailGateway = {
  id: "console",
  async send(message) {
    process.stdout.write(
      `\n[EMAIL dev sink] -> ${maskEmailAddress(message.to)}\n${message.subject}\n${message.text}\n(tidak dikirim ke jaringan)\n\n`,
    );
    return ok(undefined);
  },
};

function createSmtpGateway(config: {
  readonly smtpUrl: string;
  readonly from: string;
}): EmailGateway {
  let transporter: Transporter | null = null;

  function transport(): Transporter {
    if (transporter === null) {
      const connection = parseSmtpUrl(config.smtpUrl);
      transporter = nodemailer.createTransport({
        ...connection,
        connectionTimeout: SMTP_TIMEOUT_MS,
        greetingTimeout: SMTP_TIMEOUT_MS,
        socketTimeout: SMTP_TIMEOUT_MS,
      });
    }
    return transporter;
  }

  return {
    id: "smtp",
    async send(message) {
      try {
        await transport().sendMail({
          from: config.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
        });
        return ok(undefined);
      } catch (error) {
        return err({
          kind: "send_failed",
          provider: "smtp",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}

export function createEmailGateway(config: {
  readonly provider: EmailProviderId;
  readonly smtpUrl?: string | undefined;
  readonly from: string;
}): EmailGateway {
  switch (config.provider) {
    case "console":
      return consoleGateway;
    case "smtp": {
      if (config.smtpUrl === undefined) {
        throw new Error("SMTP_URL wajib diisi untuk provider smtp");
      }
      return createSmtpGateway({ smtpUrl: config.smtpUrl, from: config.from });
    }
  }
}
