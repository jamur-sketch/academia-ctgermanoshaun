// Edge Function: cadastro público de ALUNO (portal do aluno).
// Cria a conta de auth com papel "aluno" (no app_metadata, controlado pelo
// servidor) e o registro do aluno vinculado. NÃO exige estar logado.
//
// Deploy pelo painel: Edge Functions > Deploy a new function > nome: register-student
// (Marque para NÃO exigir JWT / "Verify JWT" desligado, pois é cadastro público.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS configurável. Por padrão libera qualquer origem ("*"). Para restringir,
// defina a variável de ambiente ALLOWED_ORIGINS na função (lista separada por
// vírgula, ex.: "https://academia-ctgermanoshaun.vercel.app,http://localhost:5173").
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

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    const b = await req.json().catch(() => ({}));
    const email = String(b.email ?? "").trim().toLowerCase();
    const password = String(b.password ?? "");
    const name = String(b.name ?? "").trim();

    if (!email || !password || !name) {
      return json(req, { ok: false, error: "Preencha nome, e-mail e senha." }, 400);
    }
    if (password.length < 8) {
      return json(req, { ok: false, error: "A senha deve ter ao menos 8 caracteres." }, 400);
    }
    if (!b.consent) {
      return json(req, { ok: false, error: "É necessário autorizar o uso dos dados." }, 400);
    }

    // 1) cria o usuário de auth com papel "aluno" (app_metadata = servidor)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "aluno" },
      user_metadata: { name },
    });
    if (createErr || !created.user) {
      const msg = createErr?.message.includes("already been registered")
        ? "Já existe uma conta com esse e-mail."
        : createErr?.message ?? "Erro ao criar a conta.";
      return json(req, { ok: false, error: msg }, 400);
    }

    // 1.5) Mapeia as turmas marcadas -> planos e valor da mensalidade.
    // Boxe/Muay Thai casam pelo nome da modalidade da turma; "Personal" usa o
    // Personal Fight 1x (R$200) como padrão — a equipe ajusta conforme pagam.
    const classIds: string[] = Array.isArray(b.signupClassIds)
      ? b.signupClassIds.map((x: unknown) => String(x))
      : [];
    let planIds: string[] = [];
    let monthlyFee: number | null = null;
    if (classIds.length > 0) {
      const { data: classes } = await admin
        .from("classes")
        .select("id, name, modality")
        .in("id", classIds);
      const { data: plans } = await admin.from("plans").select("id, name, price");
      const planList = (plans ?? []) as Array<{ id: string; name: string; price: number }>;
      const norm = (s: unknown) => String(s ?? "").toLowerCase().trim();
      const pickPlan = (cls: { name?: unknown; modality?: unknown }) => {
        const hay = `${norm(cls.name)} ${norm(cls.modality)}`;
        if (hay.includes("personal")) {
          return (
            planList.find((p) => /personal/i.test(p.name) && /1x|1\b/.test(p.name)) ||
            planList
              .filter((p) => /personal/i.test(p.name))
              .sort((a, b) => Number(a.price) - Number(b.price))[0] ||
            null
          );
        }
        return (
          planList.find((p) => norm(p.name) === norm(cls.modality)) ||
          planList.find((p) => norm(cls.modality) && norm(cls.modality).includes(norm(p.name))) ||
          planList.find((p) => norm(p.name) && hay.includes(norm(p.name))) ||
          null
        );
      };
      const matched = ((classes ?? []) as Array<{ name?: unknown; modality?: unknown }>)
        .map((c) => pickPlan(c))
        .filter((p): p is { id: string; name: string; price: number } => !!p);
      planIds = [...new Set(matched.map((p) => String(p.id)))];
      if (matched.length > 0) {
        monthlyFee = Math.max(...matched.map((p) => Number(p.price) || 0));
      }
    }

    // 2) cria o registro do aluno vinculado
    const today = new Date().toISOString().slice(0, 10);
    const studentId = `aluno-${uid()}`;
    const { error: insErr } = await admin.from("students").insert({
      id: studentId,
      name,
      email,
      phone: b.phone ?? "",
      birth_date: b.birthDate || null,
      // Sem campo de gênero no cadastro: fica vazio para a equipe preencher
      // depois na gestão (não assume "masculino").
      gender: b.gender || "",
      cpf: b.cpf ?? "",
      address: b.address ?? "",
      address_number: b.addressNumber ?? "",
      neighborhood: b.neighborhood ?? "",
      instagram: b.instagram ?? "",
      facebook: b.facebook ?? "",
      target_weight: b.targetWeight ? Number(b.targetWeight) : null,
      signup_class: b.signupClass ?? "",
      plan_ids: planIds,
      join_date: today,
      last_activity_date: today,
      status: "ativo",
      consent_data: true,
      consent_date: new Date().toISOString(),
      auth_user_id: created.user.id,
    });
    if (insErr) {
      // desfaz o usuário criado se o registro falhar
      await admin.auth.admin.deleteUser(created.user.id);
      return json(req, { ok: false, error: insErr.message }, 400);
    }

    // 2.5) define a mensalidade conforme o plano da turma (Personal = R$200).
    // A equipe pode ajustar depois em Mensalidades.
    if (monthlyFee != null) {
      await admin
        .from("payment_configs")
        .upsert({ student_id: studentId, monthly_fee: monthlyFee }, { onConflict: "student_id" });
    }

    // 3) peso inicial (opcional)
    if (b.currentWeight) {
      await admin.from("weight_entries").insert({
        id: uid(),
        student_id: studentId,
        date: today,
        weight: Number(b.currentWeight),
      });
    }

    return json(req, { ok: true });
  } catch (e) {
    return json(req, { ok: false, error: String(e) }, 500);
  }
});
