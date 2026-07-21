// Edge Function: cadastro público de ALUNO (portal do aluno).
// Cria a conta de auth com papel "aluno" (no app_metadata, controlado pelo
// servidor) e o registro do aluno vinculado. NÃO exige estar logado.
//
// Deploy pelo painel: Edge Functions > Deploy a new function > nome: register-student
// (Marque para NÃO exigir JWT / "Verify JWT" desligado, pois é cadastro público.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    const b = await req.json().catch(() => ({}));
    const email = String(b.email ?? "").trim().toLowerCase();
    const password = String(b.password ?? "");
    const name = String(b.name ?? "").trim();

    if (!email || !password || !name) {
      return json({ ok: false, error: "Preencha nome, e-mail e senha." }, 400);
    }
    if (password.length < 6) {
      return json({ ok: false, error: "A senha deve ter ao menos 6 caracteres." }, 400);
    }
    if (!b.consent) {
      return json({ ok: false, error: "É necessário autorizar o uso dos dados." }, 400);
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
      return json({ ok: false, error: msg }, 400);
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
      gender: b.gender ?? "masculino",
      cpf: b.cpf ?? "",
      address: b.address ?? "",
      address_number: b.addressNumber ?? "",
      neighborhood: b.neighborhood ?? "",
      instagram: b.instagram ?? "",
      facebook: b.facebook ?? "",
      target_weight: b.targetWeight ? Number(b.targetWeight) : null,
      plan_ids: [],
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
      return json({ ok: false, error: insErr.message }, 400);
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

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
