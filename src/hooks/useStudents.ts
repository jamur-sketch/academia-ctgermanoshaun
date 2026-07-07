import { useLocalStorage } from "./useLocalStorage";
import { Student, uid } from "@/lib/mockData";
import { seedRealStudents } from "@/lib/realData";

export function useStudents() {
  const [students, setStudents] = useLocalStorage<Student[]>("academia:students:v2", seedRealStudents);

  const addStudent = (data: Omit<Student, "id">) => {
    setStudents((prev) => [...prev, { ...data, id: uid() }]);
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  return { students, addStudent, updateStudent, deleteStudent };
}
