import { Plan, uid } from "@/shared/domain";
import { useSupabaseTable } from "@/shared/hooks/useSupabaseTable";

function fromRow(r: Record<string, unknown>): Plan {
  return {
    id: r.id as string,
    name: (r.name as string) ?? "",
    price: Number(r.price ?? 0),
    classesPerMonth: Number(r.classes_per_month ?? 0),
    highlight: Boolean(r.highlight),
  };
}

function toRow(p: Partial<Plan>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (p.id !== undefined) r.id = p.id;
  if (p.name !== undefined) r.name = p.name;
  if (p.price !== undefined) r.price = p.price;
  if (p.classesPerMonth !== undefined) r.classes_per_month = p.classesPerMonth;
  if (p.highlight !== undefined) r.highlight = p.highlight;
  return r;
}

export function usePlans() {
  const { items, loading, add, update, remove } = useSupabaseTable<Plan>("plans", fromRow, toRow);

  const addPlan = (data: Omit<Plan, "id">) => add({ ...data, id: uid() });
  const updatePlan = (id: string, data: Partial<Plan>) => update(id, data);
  const deletePlan = (id: string) => remove(id);

  return { plans: items, loading, addPlan, updatePlan, deletePlan };
}
