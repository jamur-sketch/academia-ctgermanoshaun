import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useStudents } from "@/hooks/useStudents";
import { usePlans } from "@/hooks/usePlans";
import { useAttendance } from "@/hooks/useAttendance";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtLong(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function shiftDay(iso: string, delta: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default function Chamada() {
  const { students } = useStudents();
  const { plans } = usePlans();
  const { isPresent, toggle, records } = useAttendance();
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState("");

  const planName = useMemo(() => {
    const m = new Map<string, string>();
    plans.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [plans]);

  const ativos = useMemo(
    () =>
      students
        .filter((s) => s.status === "ativo")
        .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students, search]
  );

  const presentesHoje = records.filter((r) => r.date === date).length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chamada</h1>
          <p className="text-sm text-muted-foreground capitalize">{fmtLong(date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setDate(shiftDay(date, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" size="icon" onClick={() => setDate(shiftDay(date, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Presentes no dia</p>
            <p className="text-2xl font-bold text-green-600">{presentesHoje}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Alunos ativos</p>
            <p className="text-2xl font-bold">{students.filter((s) => s.status === "ativo").length}</p>
          </CardContent>
        </Card>
      </div>

      <Input
        placeholder="Buscar aluno..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="space-y-2">
        {ativos.map((s) => {
          const present = isPresent(s.id, date);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id, date)}
              className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                present ? "border-green-500/50 bg-green-50 dark:bg-green-950/20" : "hover:bg-muted/50"
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{planName.get(s.planId) ?? "—"}</p>
              </div>
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                  present
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-muted-foreground/30 text-transparent"
                }`}
              >
                <Check className="h-4 w-4" />
              </div>
            </button>
          );
        })}
        {ativos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">Nenhum aluno encontrado.</p>
        )}
      </div>
    </div>
  );
}
