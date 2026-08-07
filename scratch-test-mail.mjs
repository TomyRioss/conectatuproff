import nodemailer from "nodemailer";
import { config } from "dotenv";
config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
});

transporter.sendMail({
  from: `"Conecta Tu Proff" <${process.env.SMTP_EMAIL}>`,
  to: process.env.SMTP_EMAIL,
  subject: "Test SMTP conectatuproff",
  html: "<p>Test ok</p>",
}).then((info) => console.log("SENT", info.messageId)).catch((e) => console.error("FAIL", e.message));
