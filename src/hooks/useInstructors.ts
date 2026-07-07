import { Instructor, Modality, uid } from "@/lib/mockData";
import { useSupabaseTable } from "./useSupabaseTable";

function fromRow(r: Record<string, unknown>): Instructor {
  return {
    id: r.id as string,
    name: (r.name as string) ?? "",
    modalities: ((r.modalities as string[]) ?? []) as Modality[],
  };
}

function toRow(i: Partial<Instructor>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (i.id !== undefined) r.id = i.id;
  if (i.name !== undefined) r.name = i.name;
  if (i.modalities !== undefined) r.modalities = i.modalities;
  return r;
}

export function useInstructors() {
  const { items, loading, add, update, remove } = useSupabaseTable<Instructor>(
    "instructors",
    fromRow,
    toRow
  );

  const addInstructor = (data: Omit<Instructor, "id">) => add({ ...data, id: uid() });
  const updateInstructor = (id: string, data: Partial<Instructor>) => update(id, data);
  const deleteInstructor = (id: string) => remove(id);

  return { instructors: items, loading, addInstructor, updateInstructor, deleteInstructor };
}
