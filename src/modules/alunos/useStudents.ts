import { Student, uid } from "@/shared/domain";
import { useSupabaseTable, dateOrNull } from "@/shared/hooks/useSupabaseTable";

function fromRow(r: Record<string, unknown>): Student {
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
  };
}

function toRow(s: Partial<Student>): Record<string, unknown> {
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
  return r;
}

export function useStudents() {
  const { items, loading, add, update, remove } = useSupabaseTable<Student>(
    "students",
    fromRow,
    toRow
  );

  const addStudent = (data: Omit<Student, "id">) => add({ ...data, id: uid() });
  const updateStudent = (id: string, data: Partial<Student>) => update(id, data);
  const deleteStudent = (id: string) => remove(id);

  return { students: items, loading, addStudent, updateStudent, deleteStudent };
}
