// Edge Function: gestão de administradores (listar / criar / excluir).
// Roda no servidor do Supabase — a chave service_role NUNCA vai para o front-end.
// Só executa se quem chamou já estiver autenticado (é um admin logado).
//
// Deploy pelo painel: Edge Functions > Deploy a new function > nome: manage-users

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS configurável. Por padrão libera qualquer origem ("*", comportamento
// atual). Para restringir, defina a variável de ambiente ALLOWED_ORIGINS na
// função (lista separada por vírgula, ex.:
// "https://academia-ctgermanoshaun.vercel.app,http://localhost:5173").
// Só as origens da lista recebem o cabeçalho de permissão.
function corsHeaders(req: Request): Record<string, string> {
  const base: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "*").trim();
  if (allowed === "*" || allowed === "") {
    base["Access-Control-Allow-Origin"] = "*";
    return base;
  }
  const list = allowed.split(",").map((o) => o.trim()).filter(Boolean);
  const origin = req.headers.get("Origin") ?? "";
  if (origin && list.includes(origin)) {
    base["Access-Control-Allow-Origin"] = origin;
  }
  return base;
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(req, { ok: false, error: "Não autorizado." }, 401);

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
      return json(req, { ok: false, error: "Sessão inválida. Faça login novamente." }, 401);
    }

    // IMPORTANTE: estar logado NÃO basta — alunos do portal também estão
    // logados. Só a equipe (app_metadata.role = "equipe") pode gerenciar
    // usuários. Sem esta checagem, um aluno conseguiria listar/criar/excluir
    // contas de administrador.
    const callerRole = (user.app_metadata as { role?: string } | null)?.role;
    if (callerRole !== "equipe") {
      return json(req, { ok: false, error: "Acesso restrito à equipe." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    const admin = createClient(url, serviceKey);

    // ---------- LISTAR ----------
    if (action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (error) return json(req, { ok: false, error: error.message }, 400);
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
      return json(req, { ok: true, users });
    }

    // ---------- CRIAR ----------
    if (action === "create") {
      const { email, password } = body;
      if (!email || !password) {
        return json(req, { ok: false, error: "Informe e-mail e senha temporária." }, 400);
      }
      if (String(password).length < 6) {
        return json(req, { ok: false, error: "A senha temporária deve ter ao menos 6 caracteres." }, 400);
      }
      const { error } = await admin.auth.admin.createUser({
        email: String(email).trim(),
        password: String(password),
        email_confirm: true,
        // Papel definido pelo SERVIDOR (nunca pelo cliente): novo usuário é
        // equipe, então consegue gerenciar o sistema após o 1º acesso.
        app_metadata: { role: "equipe" },
        user_metadata: { must_change_password: true },
      });
      if (error) {
        const msg = error.message.includes("already been registered")
          ? "Já existe um usuário com esse e-mail."
          : error.message;
        return json(req, { ok: false, error: msg }, 400);
      }
      return json(req, { ok: true });
    }

    // ---------- EXCLUIR ----------
    if (action === "delete") {
      const { userId } = body;
      if (!userId) return json(req, { ok: false, error: "Usuário não informado." }, 400);
      if (userId === user.id) {
        return json(req, { ok: false, error: "Você não pode excluir a própria conta." }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(String(userId));
      if (error) return json(req, { ok: false, error: error.message }, 400);
      return json(req, { ok: true });
    }

    return json(req, { ok: false, error: "Ação inválida." }, 400);
  } catch (e) {
    return json(req, { ok: false, error: String(e) });
  }
});
