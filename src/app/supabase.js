import { createClient } from "@supabase/supabase-js";

// leser config fra .env (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// eksporterer supabase klient hvis vi har keys, ellers null (så resten av appen kan disable features)
export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          // Require fresh login on every new page load/browser session.
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;
