// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables!");
  console.log("REACT_APP_SUPABASE_URL:", supabaseUrl);
  console.log("REACT_APP_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Set" : "Missing");
}

console.log("Initializing Supabase client with URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;