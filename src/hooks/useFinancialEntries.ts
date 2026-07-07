import { FinancialEntry, uid } from "@/lib/mockData";
import { useSupabaseTable, dateOrNull } from "./useSupabaseTable";

function fromRow(r: Record<string, unknown>): FinancialEntry {
  return {
    id: r.id as string,
    type: (r.type as FinancialEntry["type"]) ?? "receita",
    category: (r.category as string) ?? "",
    paymentMethod: (r.payment_method as string) ?? "",
    amount: Number(r.amount ?? 0),
    date: (r.date as string) ?? "",
    description: (r.description as string) ?? "",
  };
}

function toRow(e: Partial<FinancialEntry>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (e.id !== undefined) r.id = e.id;
  if (e.type !== undefined) r.type = e.type;
  if (e.category !== undefined) r.category = e.category;
  if (e.paymentMethod !== undefined) r.payment_method = e.paymentMethod;
  if (e.amount !== undefined) r.amount = e.amount;
  if (e.date !== undefined) r.date = dateOrNull(e.date);
  if (e.description !== undefined) r.description = e.description;
  return r;
}

export function useFinancialEntries() {
  const { items, loading, add, update, remove } = useSupabaseTable<FinancialEntry>(
    "financial_entries",
    fromRow,
    toRow
  );

  const addEntry = (data: Omit<FinancialEntry, "id">) => add({ ...data, id: uid() });
  const updateEntry = (id: string, data: Partial<FinancialEntry>) => update(id, data);
  const deleteEntry = (id: string) => remove(id);

  return { entries: items, loading, addEntry, updateEntry, deleteEntry };
}
