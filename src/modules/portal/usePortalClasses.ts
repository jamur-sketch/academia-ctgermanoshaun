import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { uid } from "@/shared/domain";

export interface PortalClass {
  id: string;
  name: string;
  modality: string;
  schedule: string;
  type: string;
}

export function usePortalClasses(studentId: string | undefined) {
  const [classes, setClasses] = useState<PortalClass[]>([]);
  const [myClassIds, setMyClassIds] = useState<string[]>([]);
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [clsRes, linkRes, reqRes] = await Promise.all([
      supabase.from("classes").select("*"),
      studentId
        ? supabase.from("class_students").select("class_id").eq("student_id", studentId)
        : Promise.resolve({ data: [], error: null } as { data: unknown[]; error: null }),
      studentId
        ? supabase.from("class_requests").select("class_id").eq("student_id", studentId).eq("status", "pendente")
        : Promise.resolve({ data: [], error: null } as { data: unknown[]; error: null }),
    ]);

    if (clsRes.error) console.error("[portalClasses] load:", clsRes.error.message);
    setClasses(
      (clsRes.data ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        name: (c.name as string) ?? "",
        modality: (c.modality as string) ?? "",
        schedule: (c.schedule as string) ?? "",
        type: (c.type as string) ?? "turma",
      }))
    );
    setMyClassIds(((linkRes.data ?? []) as Record<string, unknown>[]).map((l) => l.class_id as string));
    setRequestedIds(((reqRes.data ?? []) as Record<string, unknown>[]).map((r) => r.class_id as string));
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const requestClass = async (classId: string) => {
    if (!studentId) return;
    setRequestedIds((prev) => [...prev, classId]);
    const { error } = await supabase
      .from("class_requests")
      .insert({ id: uid(), student_id: studentId, class_id: classId, status: "pendente" });
    if (error) {
      console.error("[portalClasses] request:", error.message);
      load();
    }
  };

  return { classes, myClassIds, requestedIds, loading, requestClass };
}
