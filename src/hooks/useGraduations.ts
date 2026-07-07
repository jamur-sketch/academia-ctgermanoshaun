import { Graduation, Modality, uid } from "@/lib/mockData";
import { useSupabaseTable, dateOrNull } from "./useSupabaseTable";

function fromRow(r: Record<string, unknown>): Graduation {
  return {
    id: r.id as string,
    studentId: (r.student_id as string) ?? "",
    modality: (r.modality as Modality) ?? "Muay Thai",
    belt: (r.belt as string) ?? "",
    date: (r.date as string) ?? "",
    instructorId: (r.instructor_id as string) ?? "",
    notes: (r.notes as string) ?? undefined,
  };
}

function toRow(g: Partial<Graduation>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (g.id !== undefined) r.id = g.id;
  if (g.studentId !== undefined) r.student_id = g.studentId;
  if (g.modality !== undefined) r.modality = g.modality;
  if (g.belt !== undefined) r.belt = g.belt;
  if (g.date !== undefined) r.date = dateOrNull(g.date);
  if (g.instructorId !== undefined) r.instructor_id = g.instructorId || null;
  if (g.notes !== undefined) r.notes = g.notes;
  return r;
}

export function useGraduations() {
  const { items, loading, add, remove } = useSupabaseTable<Graduation>(
    "graduations",
    fromRow,
    toRow
  );

  const addGraduation = (data: Omit<Graduation, "id">) => add({ ...data, id: uid() });
  const deleteGraduation = (id: string) => remove(id);

  return { graduations: items, loading, addGraduation, deleteGraduation };
}
