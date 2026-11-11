import "server-only";

import nodemailer from "nodemailer";
import { allowsLocalOrigin, configuredOrigin, validEmail } from "./request";

function contactConfig() {
  const host = process.env.NEXUS_SMTP_HOST?.trim();
  const from = process.env.NEXUS_CONTACT_FROM?.trim();
  const to = process.env.NEXUS_CONTACT_TO?.trim();
  const user = process.env.NEXUS_SMTP_USER;
  const pass = process.env.NEXUS_SMTP_PASSWORD;
  const secure = process.env.NEXUS_SMTP_SECURE === "true";
  const port = Number(process.env.NEXUS_SMTP_PORT || (secure ? 465 : 587));
  if (!host || !from || !to || !validEmail(from) || !validEmail(to) ||
      !Number.isInteger(port) || port < 1 || port > 65535 || Boolean(user) !== Boolean(pass) ||
      (!configuredOrigin() && !allowsLocalOrigin())) return null;

  const local = ["localhost", "127.0.0.1", "::1"].includes(host);
  const allowInsecure = local && process.env.NEXUS_SMTP_ALLOW_INSECURE === "true";
  return { host, port, secure, from, to, auth: user && pass ? { user, pass } : undefined, allowInsecure };
}

export function isContactConfigured(): boolean {
  return contactConfig() !== null;
}

export type ContactMessage = {
  subject: string;
  name: string;
  email: string;
  message: string;
};

export function parseContact(input: unknown) {
  const data = typeof input === "object" && input !== null ? input as Record<string, unknown> : {};
  const string = (value: unknown) => typeof value === "string" ? value.trim() : "";
  const subject = string(data.subject);
  const name = string(data.name);
  const email = string(data.email);
  const message = string(data.message);
  const honeypot = data.website !== undefined && (typeof data.website !== "string" || data.website.trim() !== "");
  const fieldErrors: Record<string, string> = {};

  if (subject.length < 3 || subject.length > 120 || /[\x00-\x1f\x7f]/.test(subject)) {
    fieldErrors.subject = "Gib einen Betreff mit 3 bis 120 Zeichen ein.";
  }
  if (name.length < 2 || name.length > 100 || /[\x00-\x1f\x7f]/.test(name)) {
    fieldErrors.name = "Gib einen Namen mit 2 bis 100 Zeichen ein.";
  }
  if (!validEmail(email)) fieldErrors.email = "Gib eine gültige E-Mail-Adresse ein.";
  if (message.length < 10 || message.length > 4000 || message.includes("\0")) {
    fieldErrors.message = "Schreibe eine Nachricht mit 10 bis 4000 Zeichen.";
  }
  return { data: { subject, name, email, message }, fieldErrors, honeypot };
}

export async function sendContact(message: ContactMessage): Promise<boolean> {
  const config = contactConfig();
  if (!config) return false;
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure && !config.allowInsecure,
    auth: config.auth,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  const result = await transport.sendMail({
    from: { name: "NEXUS ONE Kontakt", address: config.from },
    to: config.to,
    replyTo: { name: message.name, address: message.email },
    subject: `[NEXUS ONE] ${message.subject}`,
    text: `Name: ${message.name}\nE-Mail: ${message.email}\n\n${message.message}`,
  });
  return result.accepted.length > 0;
}
