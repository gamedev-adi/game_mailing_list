import { Resend } from "resend";
import { addSubscriber } from "../db.js";
import Redis from "ioredis";

const resend = new Resend(process.env.RESEND_API_KEY);
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { email } = req.body;
  const token = Math.random().toString(36).substring(2, 9);
  const ipKey = `rate:subscribe:ip:${req.ip}`;
  const emailKey = `rate:subscribe:email:${email}`;

  try {
    // Rate-limit per IP
    if (await redis.exists(ipKey)) {
      return res.status(429).json({ error: "Too many requests. Try again later." });
    }
    await redis.set(ipKey, 1, "EX", 5); // 5-second block per IP

    // Prevent duplicate subscription
    if (await redis.exists(emailKey)) {
      return res.status(409).json({ error: "You are already subscribed." });
    }
    await redis.set(emailKey, 1, "EX", 300); // 5-minute block per email

    // Add subscriber to Supabase
    await addSubscriber(email, token);

    // Store unsubscribe token temporarily in Redis (optional)
    await redis.set(`unsubscribe:${token}`, email, "EX", 86400); // 24h validity

    // Send welcome email
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
