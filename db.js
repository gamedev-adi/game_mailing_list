import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function addSubscriber(email, token) {
  const { data, error } = await supabase
    .from("subscribers")
    .insert([{ email, token, subscribed: true }]);
  if (error) throw error;
  return data;
}

export async function getSubscribers() {
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("subscribed", true);
  if (error) throw error;
  return data;
}

export async function unsubscribeUser(token) {
  const { data, error } = await supabase
    .from("subscribers")
    .update({ subscribed: false })
    .eq("token", token);
  if (error) throw error;
  return data;
}
