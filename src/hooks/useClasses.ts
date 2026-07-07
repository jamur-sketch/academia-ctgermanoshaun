import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ClassGroup, Instructor, Modality, ClassType, uid } from "@/lib/mockData";

export function useClasses() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [clsRes, linkRes, instRes] = await Promise.all([
      supabase.from("classes").select("*"),
      supabase.from("class_students").select("*"),
      supabase.from("instructors").select("*"),
    ]);

    if (clsRes.error) console.error("[classes] load:", clsRes.error.message);
    if (linkRes.error) console.error("[class_students] load:", linkRes.error.message);
    if (instRes.error) console.error("[instructors] load:", instRes.error.message);

    const byClass = new Map<string, string[]>();
    (linkRes.data ?? []).forEach((l: Record<string, unknown>) => {
      const cid = l.class_id as string;
      const arr = byClass.get(cid) ?? [];
      arr.push(l.student_id as string);
      byClass.set(cid, arr);
    });

    setClasses(
      (clsRes.data ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        name: (c.name as string) ?? "",
        type: (c.type as ClassType) ?? "turma",
        modality: (c.modality as Modality) ?? "Muay Thai",
        instructorId: (c.instructor_id as string) ?? "",
        schedule: (c.schedule as string) ?? "",
        capacity: Number(c.capacity ?? 0),
        studentIds: byClass.get(c.id as string) ?? [],
      }))
    );

    setInstructors(
      (instRes.data ?? []).map((i: Record<string, unknown>) => ({
        id: i.id as string,
        name: (i.name as string) ?? "",
        modalities: (i.modalities as Modality[]) ?? [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const classToRow = (c: Partial<ClassGroup>): Record<string, unknown> => {
    const r: Record<string, unknown> = {};
    if (c.id !== undefined) r.id = c.id;
    if (c.name !== undefined) r.name = c.name;
    if (c.type !== undefined) r.type = c.type;
    if (c.modality !== undefined) r.modality = c.modality;
    if (c.instructorId !== undefined) r.instructor_id = c.instructorId || null;
    if (c.schedule !== undefined) r.schedule = c.schedule;
    if (c.capacity !== undefined) r.capacity = c.capacity;
    return r;
  };

  const addClass = async (data: Omit<ClassGroup, "id">) => {
    const id = uid();
    const item: ClassGroup = { ...data, id };
    setClasses((prev) => [...prev, item]);
    const { studentIds, ...rest } = item;
    void studentIds;
    const { error } = await supabase.from("classes").insert(classToRow(rest));
    if (error) {
      console.error("[classes] insert:", error.message);
      load();
    }
  };

  const updateClass = async (id: string, data: Partial<ClassGroup>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    const { studentIds, ...rest } = data;
    void studentIds;
    const { error } = await supabase.from("classes").update(classToRow(rest)).eq("id", id);
    if (error) {
      console.error("[classes] update:", error.message);
      load();
    }
  };

  const deleteClass = async (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) {
      console.error("[classes] delete:", error.message);
      load();
    }
  };

  return { classes, instructors, loading, addClass, updateClass, deleteClass };
}
