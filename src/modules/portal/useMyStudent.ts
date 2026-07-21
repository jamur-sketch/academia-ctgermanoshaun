import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { Student } from "@/shared/domain";
import { studentFromRow, studentToRow } from "@/modules/alunos/useStudents";

// Busca o registro do próprio aluno logado (o RLS já limita ao dele).
export function useMyStudent() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("students").select("*").limit(1);
    if (error) {
      console.error("[myStudent] load:", error.message);
      setLoading(false);
      return;
    }
    setStudent(data && data[0] ? studentFromRow(data[0] as Record<string, unknown>) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateMyStudent = async (patch: Partial<Student>) => {
    if (!student) return;
    setStudent({ ...student, ...patch });
    const { error } = await supabase.from("students").update(studentToRow(patch)).eq("id", student.id);
    if (error) {
      console.error("[myStudent] update:", error.message);
      load();
    }
  };

  return { student, loading, updateMyStudent, reload: load };
}
