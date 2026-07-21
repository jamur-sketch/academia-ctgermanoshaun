import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";

export interface MyGraduation {
  id: string;
  modality: string;
  belt: string;
  date: string;
  notes: string;
}

export function useMyGraduations(studentId: string | undefined) {
  const [graduations, setGraduations] = useState<MyGraduation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!studentId) {
      setGraduations([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("graduations")
      .select("*")
      .eq("student_id", studentId)
      .order("date", { ascending: false });
    if (error) {
      console.error("[myGraduations] load:", error.message);
      setLoading(false);
      return;
    }
    setGraduations(
      (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        modality: (r.modality as string) ?? "",
        belt: (r.belt as string) ?? "",
        date: (r.date as string) ?? "",
        notes: (r.notes as string) ?? "",
      }))
    );
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  return { graduations, loading };
}
