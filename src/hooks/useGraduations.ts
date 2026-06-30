import { useLocalStorage } from "./useLocalStorage";
import { Graduation, seedGraduations, uid } from "@/lib/mockData";

export function useGraduations() {
  const [graduations, setGraduations] = useLocalStorage<Graduation[]>("academia:graduations", seedGraduations);

  const addGraduation = (data: Omit<Graduation, "id">) => {
    setGraduations((prev) => [...prev, { ...data, id: uid() }]);
  };

  const deleteGraduation = (id: string) => {
    setGraduations((prev) => prev.filter((g) => g.id !== id));
  };

  return { graduations, addGraduation, deleteGraduation };
}
