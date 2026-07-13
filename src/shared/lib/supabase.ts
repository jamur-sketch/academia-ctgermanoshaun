import { createClient } from "@supabase/supabase-js";

// A publishable key é segura para o front-end (o RLS protege os dados no banco).
// Pode ser sobrescrita por variáveis de ambiente no build (Vercel etc.).
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://iomhtfrpabrvquvrzxjy.supabase.co";
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_XF4Z35iECyZAyQrahG7-Ww_rwSkOX7h";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
