// The browser library that talks to Supabase.
import { createClient } from "@supabase/supabase-js";
// Public URL + anon key baked for hosts that forget Netlify env vars.
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabasePublic";

// Prefer Vite env when set; otherwise use the committed public values.
const url = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
// The anon key is safe in the browser; never add the service-role key here.
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
// True only when both values are real, not the sample text from .env.example.
const ready = Boolean(url && key && !url.includes("YOUR_PROJECT_REF") && key !== "your-anon-key");

// The shared database client, or null when this browser should keep scores locally.
export const supabase = ready ? createClient(url, key) : null;
