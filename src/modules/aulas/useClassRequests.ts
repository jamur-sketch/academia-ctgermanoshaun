import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";

export interface ClassRequest {
  id: string;
  studentId: string;
  classId: string;
  createdAt: string;
}

export function useClassRequests() {
  const [requests, setRequests] = useState<ClassRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("class_requests")
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[classRequests] load:", error.message);
      setLoading(false);
      return;
    }
    setRequests(
      (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        studentId: r.student_id as string,
        classId: r.class_id as string,
        createdAt: (r.created_at as string) ?? "",
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    const { error } = await supabase.from("class_requests").update({ status: "atendido" }).eq("id", id);
    if (error) {
      console.error("[classRequests] resolve:", error.message);
      load();
    }
  };

  return { requests, loading, resolve, reload: load };
}
