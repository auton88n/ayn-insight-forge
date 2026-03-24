import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Testing user_subscriptions!");
  const { data: d1, error: e1 } = await supabase.from('user_subscriptions').select('user_id, profiles:user_id(company_name)').limit(1);
  if (e1) console.error("user_subscriptions JOIN ERROR:", e1.message);
  else console.log("user_subscriptions SUCCESS:", JSON.stringify(d1));

  console.log("Testing user_ai_limits!");
  const { data: d2, error: e2 } = await supabase.from('user_ai_limits').select('user_id, profiles:user_id(company_name)').limit(1);
  if (e2) console.error("user_ai_limits JOIN ERROR:", e2.message);
  else console.log("user_ai_limits SUCCESS:", JSON.stringify(d2));
}

run().catch(console.error);
