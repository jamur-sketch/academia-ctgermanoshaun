import { useLocalStorage } from "./useLocalStorage";
import { ClassGroup, seedClasses, seedInstructors, Instructor, uid } from "@/lib/mockData";

export function useClasses() {
  const [classes, setClasses] = useLocalStorage<ClassGroup[]>("academia:classes", seedClasses);
  const [instructors] = useLocalStorage<Instructor[]>("academia:instructors", seedInstructors);

  const addClass = (data: Omit<ClassGroup, "id">) => {
    setClasses((prev) => [...prev, { ...data, id: uid() }]);
  };

  const updateClass = (id: string, data: Partial<ClassGroup>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  return { classes, instructors, addClass, updateClass, deleteClass };
}
