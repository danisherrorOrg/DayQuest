import nodemailer from "nodemailer";

let cachedTransporter = null;

function buildTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST) {
    // No SMTP configured (e.g. local dev) — log the email instead of sending it, so the
    // verification/reset links are still usable without standing up a real mail server.
    return {
      sendMail: async ({ to, subject, text }) => {
        console.log(
          `\n[mailer] SMTP not configured — logging email instead of sending it.\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`,
        );
      },
    };
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export async function sendMail({ to, subject, text }) {
  if (!cachedTransporter) cachedTransporter = buildTransporter();
  const from = process.env.EMAIL_FROM || "Day Story <no-reply@dayquest.local>";
  await cachedTransporter.sendMail({ from, to, subject, text });
}
