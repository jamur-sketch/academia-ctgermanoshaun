import { useLocalStorage } from "./useLocalStorage";
import { Student, seedStudents, uid } from "@/lib/mockData";

export function useStudents() {
  const [students, setStudents] = useLocalStorage<Student[]>("academia:students", seedStudents);

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
