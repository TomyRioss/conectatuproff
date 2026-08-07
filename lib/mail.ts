import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    await transporter.sendMail({
      from: `"Conecta Tu Proff" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("[sendMail]", err);
  }
}
