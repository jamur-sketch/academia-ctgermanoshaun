import { useLocalStorage } from "./useLocalStorage";
import { Plan, seedPlans, uid } from "@/lib/mockData";

export function usePlans() {
  const [plans, setPlans] = useLocalStorage<Plan[]>("academia:plans", seedPlans);

  const addPlan = (data: Omit<Plan, "id">) => {
    setPlans((prev) => [...prev, { ...data, id: uid() }]);
  };

  const updatePlan = (id: string, data: Partial<Plan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const deletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  return { plans, addPlan, updatePlan, deletePlan };
}
