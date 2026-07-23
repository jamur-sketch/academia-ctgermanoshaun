import { Student, uid } from "@/shared/domain";
import { useSupabaseTable, dateOrNull } from "@/shared/hooks/useSupabaseTable";
import { supabase } from "@/shared/lib/supabase";

export function studentFromRow(r: Record<string, unknown>): Student {
  return {
    id: r.id as string,
    name: (r.name as string) ?? "",
    phone: (r.phone as string) ?? "",
    email: (r.email as string) ?? "",
    birthDate: (r.birth_date as string) ?? "",
    gender: (r.gender as Student["gender"]) ?? "masculino",
    planIds:
      (r.plan_ids as string[] | null) && (r.plan_ids as string[]).length > 0
        ? (r.plan_ids as string[])
        : r.plan_id
        ? [r.plan_id as string]
        : [],
    joinDate: (r.join_date as string) ?? "",
    lastActivityDate: (r.last_activity_date as string) ?? "",
    status: (r.status as Student["status"]) ?? "ativo",
    referredBy: (r.referred_by as string) ?? "",
    inactiveReason: (r.inactive_reason as string) ?? "",
    inactiveSince: (r.inactive_since as string) ?? "",
    cpf: (r.cpf as string) ?? "",
    address: (r.address as string) ?? "",
    addressNumber: (r.address_number as string) ?? "",
    neighborhood: (r.neighborhood as string) ?? "",
    instagram: (r.instagram as string) ?? "",
    facebook: (r.facebook as string) ?? "",
    targetWeight: r.target_weight != null ? Number(r.target_weight) : undefined,
    consentData: Boolean(r.consent_data),
    consentDate: (r.consent_date as string) ?? "",
    authUserId: (r.auth_user_id as string) ?? "",
  };
}

export function studentToRow(s: Partial<Student>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (s.id !== undefined) r.id = s.id;
  if (s.name !== undefined) r.name = s.name;
  if (s.phone !== undefined) r.phone = s.phone;
  if (s.email !== undefined) r.email = s.email;
  if (s.birthDate !== undefined) r.birth_date = dateOrNull(s.birthDate);
  if (s.gender !== undefined) r.gender = s.gender;
  if (s.planIds !== undefined) {
    r.plan_ids = s.planIds;
    r.plan_id = s.planIds[0] ?? null; // mantém a coluna antiga sincronizada
  }
  if (s.joinDate !== undefined) r.join_date = dateOrNull(s.joinDate);
  if (s.lastActivityDate !== undefined) r.last_activity_date = dateOrNull(s.lastActivityDate);
  if (s.status !== undefined) r.status = s.status;
  if (s.referredBy !== undefined) r.referred_by = s.referredBy || null;
  if (s.inactiveReason !== undefined) r.inactive_reason = s.inactiveReason || null;
  if (s.inactiveSince !== undefined) r.inactive_since = dateOrNull(s.inactiveSince);
  if (s.cpf !== undefined) r.cpf = s.cpf || null;
  if (s.address !== undefined) r.address = s.address || null;
  if (s.addressNumber !== undefined) r.address_number = s.addressNumber || null;
  if (s.neighborhood !== undefined) r.neighborhood = s.neighborhood || null;
  if (s.instagram !== undefined) r.instagram = s.instagram || null;
  if (s.facebook !== undefined) r.facebook = s.facebook || null;
  if (s.targetWeight !== undefined) r.target_weight = s.targetWeight ?? null;
  return r;
}

export function useStudents() {
  const { items, loading, add, update, remove, reload } = useSupabaseTable<Student>(
    "students",
    studentFromRow,
    studentToRow
  );

  const addStudent = (data: Omit<Student, "id">) => add({ ...data, id: uid() });
  const updateStudent = (id: string, data: Partial<Student>) => update(id, data);
  const deleteStudent = (id: string) => remove(id);

  // Vincula um cadastro feito pelo portal (portal) a um aluno já existente
  // (existingId, que tem o histórico). O login e os dados que o aluno
  // preencheu passam para o registro antigo; o que ele deixou em branco
  // mantém o valor antigo. Plano, status, data de entrada, mensalidades e
  // graduações do registro antigo são preservados. O duplicado é removido.
  const mergeStudents = async (existingId: string, portal: Student) => {
    const existing = items.find((s) => s.id === existingId);
    const pick = (a?: string, b?: string) => (a && a.trim() ? a : b) || null;
    await supabase
      .from("students")
      .update({
        name: pick(portal.name, existing?.name),
        email: pick(portal.email, existing?.email),
        phone: pick(portal.phone, existing?.phone),
        birth_date: dateOrNull(portal.birthDate || existing?.birthDate || ""),
        cpf: pick(portal.cpf, existing?.cpf),
        address: pick(portal.address, existing?.address),
        address_number: pick(portal.addressNumber, existing?.addressNumber),
        neighborhood: pick(portal.neighborhood, existing?.neighborhood),
        instagram: pick(portal.instagram, existing?.instagram),
        facebook: pick(portal.facebook, existing?.facebook),
        target_weight: portal.targetWeight ?? existing?.targetWeight ?? null,
        consent_data: portal.consentData ?? existing?.consentData ?? false,
        consent_date: portal.consentDate || existing?.consentDate || null,
        auth_user_id: portal.authUserId || null,
      })
      .eq("id", existingId);
    // move pesos e pedidos do registro novo para o antigo
    await supabase.from("weight_entries").update({ student_id: existingId }).eq("student_id", portal.id);
    await supabase.from("orders").update({ student_id: existingId }).eq("student_id", portal.id);
    // remove o duplicado
    await supabase.from("students").delete().eq("id", portal.id);
    await reload();
  };

  return { students: items, loading, addStudent, updateStudent, deleteStudent, mergeStudents };
}
