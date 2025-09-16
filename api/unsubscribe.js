import { unsubscribeUser } from "../db.js";

export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).send("Invalid token");

  try {
    await unsubscribeUser(token);
    res.status(200).send("✅ You have been unsubscribed.");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Unsubscribe failed.");
  }
}
