import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { WeightEntry, uid } from "@/shared/domain";

export function useWeightEntries(studentId: string | undefined) {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!studentId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("weight_entries")
      .select("*")
      .eq("student_id", studentId)
      .order("date", { ascending: true });
    if (error) {
      console.error("[weight] load:", error.message);
      setLoading(false);
      return;
    }
    setEntries(
      (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        studentId: r.student_id as string,
        date: r.date as string,
        weight: Number(r.weight),
      }))
    );
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const addWeight = async (date: string, weight: number) => {
    if (!studentId) return;
    const entry: WeightEntry = { id: uid(), studentId, date, weight };
    setEntries((prev) => [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)));
    const { error } = await supabase
      .from("weight_entries")
      .insert({ id: entry.id, student_id: studentId, date, weight });
    if (error) {
      console.error("[weight] insert:", error.message);
      load();
    }
  };

  const deleteWeight = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from("weight_entries").delete().eq("id", id);
    if (error) {
      console.error("[weight] delete:", error.message);
      load();
    }
  };

  return { entries, loading, addWeight, deleteWeight };
}
