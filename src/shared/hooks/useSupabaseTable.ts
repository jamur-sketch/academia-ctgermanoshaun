import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";

/** Resultado de uma escrita: { error } preenchido quando algo falhou. */
export type WriteResult = { error?: string };

const PERMISSION_MSG =
  "Não foi possível salvar (sem permissão). Saia e entre novamente na conta para renovar o acesso e tente de novo.";

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
    async (item: T): Promise<WriteResult> => {
      setItems((prev) => [...prev, item]);
      const { data, error } = await supabase.from(table).insert(toRow(item)).select();
      if (error) {
        console.error(`[${table}] insert:`, error.message);
        load();
        return { error: error.message };
      }
      if (!data || data.length === 0) {
        console.error(`[${table}] insert afetou 0 linhas (RLS/permissão)`);
        load();
        return { error: PERMISSION_MSG };
      }
      return {};
    },
    [table, toRow, load]
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>): Promise<WriteResult> => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      const { data, error } = await supabase
        .from(table)
        .update(toRow(patch))
        .eq("id", id)
        .select();
      if (error) {
        console.error(`[${table}] update:`, error.message);
        load();
        return { error: error.message };
      }
      // Sem erro mas 0 linhas = RLS bloqueou (ex.: sessão sem papel de equipe).
      if (!data || data.length === 0) {
        console.error(`[${table}] update afetou 0 linhas (RLS/permissão)`);
        load();
        return { error: PERMISSION_MSG };
      }
      return {};
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
