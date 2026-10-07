// The browser library that talks to Supabase.
import { createClient } from "@supabase/supabase-js";

// The project URL from the env file. Empty when the file was not filled in.
const url = import.meta.env.VITE_SUPABASE_URL;
// The public anon key from the env file. Empty when the file was not filled in.
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
// True only when both values are real, not the sample text from .env.example.
const ready = Boolean(url && key && !url.includes("YOUR_PROJECT_REF") && key !== "your-anon-key");

// The shared database client, or null when this browser should keep scores locally.
export const supabase = ready ? createClient(url, key) : null;
