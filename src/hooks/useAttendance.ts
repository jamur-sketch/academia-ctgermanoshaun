import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { uid } from "@/lib/mockData";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
}

function fromRow(r: Record<string, unknown>): AttendanceRecord {
  return {
    id: r.id as string,
    studentId: r.student_id as string,
    date: (r.date as string) ?? "",
  };
}

export function useAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("attendance").select("*");
    if (error) {
      console.error("[attendance] load:", error.message);
      setLoading(false);
      return;
    }
    setRecords((data ?? []).map((r) => fromRow(r as Record<string, unknown>)));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isPresent = (studentId: string, date: string) =>
    records.some((r) => r.studentId === studentId && r.date === date);

  const markPresent = async (studentId: string, date: string) => {
    if (isPresent(studentId, date)) return;
    const rec: AttendanceRecord = { id: uid(), studentId, date };
    setRecords((prev) => [...prev, rec]);
    const { error } = await supabase
      .from("attendance")
      .insert({ id: rec.id, student_id: studentId, date });
    if (error) {
      console.error("[attendance] insert:", error.message);
      load();
    }
  };

  const unmarkPresent = async (studentId: string, date: string) => {
    setRecords((prev) => prev.filter((r) => !(r.studentId === studentId && r.date === date)));
    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("student_id", studentId)
      .eq("date", date);
    if (error) {
      console.error("[attendance] delete:", error.message);
      load();
    }
  };

  const toggle = (studentId: string, date: string) => {
    if (isPresent(studentId, date)) unmarkPresent(studentId, date);
    else markPresent(studentId, date);
  };

  return { records, loading, isPresent, markPresent, unmarkPresent, toggle };
}
