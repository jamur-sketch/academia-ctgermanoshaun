// Edge Function: cria um novo usuário administrador.
// Roda no servidor do Supabase — a chave service_role NUNCA vai para o front-end.
// Só executa se quem chamou já estiver autenticado (é um admin logado).
//
// Deploy:
//   supabase functions deploy create-user
// (ou pelo painel: Edge Functions > Deploy a new function)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ ok: false, error: "Não autorizado." }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Confirma que quem chamou é um usuário logado (admin da academia).
    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await caller.auth.getUser();
    if (userErr || !user) {
      return json({ ok: false, error: "Sessão inválida. Faça login novamente." }, 401);
    }

    const { email, password } = await req.json().catch(() => ({}));
    if (!email || !password) {
      return json({ ok: false, error: "Informe e-mail e senha temporária." }, 400);
    }
    if (String(password).length < 6) {
      return json({ ok: false, error: "A senha temporária deve ter ao menos 6 caracteres." }, 400);
    }

    // Cria o usuário já confirmado (não depende de e-mail/SMTP configurado),
    // marcando que ele precisa trocar a senha no primeiro acesso.
    const admin = createClient(url, serviceKey);
    const { error: createErr } = await admin.auth.admin.createUser({
      email: String(email).trim(),
      password: String(password),
      email_confirm: true,
      user_metadata: { must_change_password: true },
    });

    if (createErr) {
      const msg = createErr.message.includes("already been registered")
        ? "Já existe um usuário com esse e-mail."
        : createErr.message;
      return json({ ok: false, error: msg }, 400);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
