// Edge Function: gestão de administradores (listar / criar / excluir).
// Roda no servidor do Supabase — a chave service_role NUNCA vai para o front-end.
// Só executa se quem chamou já estiver autenticado (é um admin logado).
//
// Deploy pelo painel: Edge Functions > Deploy a new function > nome: manage-users

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

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    const admin = createClient(url, serviceKey);

    // ---------- LISTAR ----------
    if (action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (error) return json({ ok: false, error: error.message }, 400);
      const users = data.users.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        mustChangePassword: Boolean(u.user_metadata?.must_change_password),
        isSelf: u.id === user.id,
      }));
      // mais recentes primeiro
      users.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return json({ ok: true, users });
    }

    // ---------- CRIAR ----------
    if (action === "create") {
      const { email, password } = body;
      if (!email || !password) {
        return json({ ok: false, error: "Informe e-mail e senha temporária." }, 400);
      }
      if (String(password).length < 6) {
        return json({ ok: false, error: "A senha temporária deve ter ao menos 6 caracteres." }, 400);
      }
      const { error } = await admin.auth.admin.createUser({
        email: String(email).trim(),
        password: String(password),
        email_confirm: true,
        user_metadata: { must_change_password: true },
      });
      if (error) {
        const msg = error.message.includes("already been registered")
          ? "Já existe um usuário com esse e-mail."
          : error.message;
        return json({ ok: false, error: msg }, 400);
      }
      return json({ ok: true });
    }

    // ---------- EXCLUIR ----------
    if (action === "delete") {
      const { userId } = body;
      if (!userId) return json({ ok: false, error: "Usuário não informado." }, 400);
      if (userId === user.id) {
        return json({ ok: false, error: "Você não pode excluir a própria conta." }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(String(userId));
      if (error) return json({ ok: false, error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ ok: false, error: "Ação inválida." }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e) });
  }
});
