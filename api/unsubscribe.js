import { updateSubscriber } from "../db.js"; // your Supabase unsubscribe function
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { token } = req.body;

  try {
    const email = await redis.get(`unsubscribe:${token}`);
    if (!email) return res.status(404).json({ error: "Invalid or expired token." });

    // Optional: rate-limit per IP/email for unsubscribe
    const ipKey = `rate:unsubscribe:ip:${req.ip}`;
    if (await redis.exists(ipKey)) {
      return res.status(429).json({ error: "Too many requests. Try again later." });
    }
    await redis.set(ipKey, 1, "EX", 5);

    // Update Supabase
    await updateSubscriber(email, { subscribed: false });

    // Remove token from Redis
    await redis.del(`unsubscribe:${token}`);

    res.status(200).json({ success: true, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unsubscribe failed." });
  }
}
