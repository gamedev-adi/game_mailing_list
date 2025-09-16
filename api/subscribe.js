import Resend from "resend";
import { addSubscriber } from "../db.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { email } = req.body;
  const token = Math.random().toString(36).substring(2, 9);

  try {
    await addSubscriber(email, token);

    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Welcome to Aditya Games!",
      html: `
        <h1>🚀 Thanks for subscribing!</h1>
        <p>You'll receive teasers, demos, and full game releases.</p>
        <p>Unsubscribe anytime: <a href="https://yourdomain.com/unsubscribe.html?token=${token}">Click here</a></p>
      `
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Subscription failed." });
  }
}
