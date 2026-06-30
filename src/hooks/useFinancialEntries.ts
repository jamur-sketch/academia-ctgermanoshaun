import { useLocalStorage } from "./useLocalStorage";
import { FinancialEntry, seedFinancialEntries, uid } from "@/lib/mockData";

export function useFinancialEntries() {
  const [entries, setEntries] = useLocalStorage<FinancialEntry[]>("academia:financial", seedFinancialEntries);

  const addEntry = (data: Omit<FinancialEntry, "id">) => {
    setEntries((prev) => [...prev, { ...data, id: uid() }]);
  };

  const updateEntry = (id: string, data: Partial<FinancialEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return { entries, addEntry, updateEntry, deleteEntry };
}
