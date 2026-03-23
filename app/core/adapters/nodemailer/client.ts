import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";

export type SmtpConfig = {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  readonly from: string;
};

export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;

  if (!host) {
    throw new Error("SMTP_HOST environment variable is not set");
  }
  if (!port) {
    throw new Error("SMTP_PORT environment variable is not set");
  }
  if (!user) {
    throw new Error("SMTP_USER environment variable is not set");
  }
  if (!password) {
    throw new Error("SMTP_PASSWORD environment variable is not set");
  }
  if (!from) {
    throw new Error("SMTP_FROM environment variable is not set");
  }

  return {
    host,
    port: Number.parseInt(port, 10),
    user,
    password,
    from,
  };
}

export function createTransporter(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}
