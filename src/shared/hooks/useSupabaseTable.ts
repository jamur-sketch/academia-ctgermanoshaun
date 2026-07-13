import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";

/**
 * Hook genérico para uma tabela do Supabase.
 * Mantém uma cópia local em estado (com update otimista) e recarrega
 * do servidor caso alguma operação falhe.
 *
 * fromRow: converte a linha do banco (snake_case) para o objeto do app.
 * toRow:   converte um objeto (ou patch parcial) do app para a linha do banco.
 *          Deve incluir SOMENTE as chaves presentes no input.
 */
export function useSupabaseTable<T extends { id: string }>(
  table: string,
  fromRow: (row: Record<string, unknown>) => T,
  toRow: (item: Partial<T>) => Record<string, unknown>
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`[${table}] load:`, error.message);
      setLoading(false);
      return;
    }
    setItems((data ?? []).map((r) => fromRow(r as Record<string, unknown>)));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (item: T) => {
      setItems((prev) => [...prev, item]);
      const { error } = await supabase.from(table).insert(toRow(item));
      if (error) {
        console.error(`[${table}] insert:`, error.message);
        load();
      }
    },
    [table, toRow, load]
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      const { error } = await supabase.from(table).update(toRow(patch)).eq("id", id);
      if (error) {
        console.error(`[${table}] update:`, error.message);
        load();
      }
    },
    [table, toRow, load]
  );

  const remove = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) {
        console.error(`[${table}] delete:`, error.message);
        load();
      }
    },
    [table, load]
  );

  return { items, loading, add, update, remove, reload: load };
}

/** Converte string de data vazia em null (colunas date do Postgres rejeitam ""). */
export function dateOrNull(v: unknown): string | null {
  return v ? String(v) : null;
}
