import { useMemo, useState } from "react";
import { Trophy, Medal, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table";
import { useStudents } from "@/modules/alunos/useStudents";
import { useAttendance } from "@/modules/chamada/useAttendance";
import { useMonthlyPayments } from "@/modules/mensalidades/useMonthlyPayments";
import { useGraduations } from "@/modules/graduacoes/useGraduations";

// Pesos da pontuação
const PT_PRESENCA = 10;
const PT_INDICACAO = 30;
const PT_PAGAMENTO = 20;
const PT_GRADUACAO = 50;
const PT_MES_CASA = 1;

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function paidOnTime(paidDate: string | null): boolean {
  if (!paidDate) return false;
  return new Date(paidDate + "T12:00:00").getDate() <= 10;
}

interface Row {
  studentId: string;
  name: string;
  presencas: number;
  indicacoes: number;
  extra: number; // pagou em dia (mensal, 0/1) ou graduações (geral)
  points: number;
}

function RankingTable({ rows, mode }: { rows: Row[]; mode: "mensal" | "geral" }) {
  return (
    <div className="rounded-xl border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">#</TableHead>
            <TableHead>Aluno</TableHead>
            <TableHead className="text-right">Presenças</TableHead>
            <TableHead className="text-right">Indicações</TableHead>
            <TableHead className="text-right">
              {mode === "mensal" ? "Pagou em dia" : "Graduações"}
            </TableHead>
            <TableHead className="text-right">Pontos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={row.studentId}>
              <TableCell className="font-semibold">
                {i < 3 ? (
                  <Medal
                    className={
                      i === 0
                        ? "h-5 w-5 text-yellow-500"
                        : i === 1
                        ? "h-5 w-5 text-zinc-400"
                        : "h-5 w-5 text-amber-700"
                    }
                  />
                ) : (
                  i + 1
                )}
              </TableCell>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell className="text-right">{row.presencas}</TableCell>
              <TableCell className="text-right">{row.indicacoes}</TableCell>
              <TableCell className="text-right">
                {mode === "mensal" ? (row.extra > 0 ? "Sim" : "—") : row.extra}
              </TableCell>
              <TableCell className="text-right font-bold">{row.points}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                Sem dados para exibir ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Ranking() {
  const { students } = useStudents();
  const { records } = useAttendance();
  const { payments } = useMonthlyPayments();
  const { graduations } = useGraduations();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [tab, setTab] = useState("mensal");

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    else if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const ativos = useMemo(() => students.filter((s) => s.status === "ativo"), [students]);

  // ---- Ranking Mensal ----
  const monthly = useMemo<Row[]>(() => {
    return ativos
      .map((s) => {
        const presencas = records.filter((r) => {
          if (r.studentId !== s.id) return false;
          const d = new Date(r.date + "T12:00:00");
          return d.getMonth() === month && d.getFullYear() === year;
        }).length;

        const indicacoes = students.filter((x) => {
          if (x.referredBy !== s.id) return false;
          const d = new Date(x.joinDate + "T12:00:00");
          return d.getMonth() === month && d.getFullYear() === year;
        }).length;

        const pay = payments.find(
          (p) => p.studentId === s.id && p.month === month && p.year === year && p.paid
        );
        const emDia = pay && paidOnTime(pay.paidDate) ? 1 : 0;

        const points =
          presencas * PT_PRESENCA + indicacoes * PT_INDICACAO + emDia * PT_PAGAMENTO;
        return { studentId: s.id, name: s.name, presencas, indicacoes, extra: emDia, points };
      })
      .sort((a, b) => b.points - a.points);
  }, [ativos, students, records, payments, month, year]);

  // ---- Ranking Geral ----
  const overall = useMemo<Row[]>(() => {
    return ativos
      .map((s) => {
        const presencas = records.filter((r) => r.studentId === s.id).length;
        const indicacoes = students.filter((x) => x.referredBy === s.id).length;
        const pagamentosEmDia = payments.filter(
          (p) => p.studentId === s.id && p.paid && paidOnTime(p.paidDate)
        ).length;
        const grads = graduations.filter((g) => g.studentId === s.id).length;

        const mesesCasa = s.joinDate
          ? Math.max(
              0,
              Math.round(
                (now.getTime() - new Date(s.joinDate + "T12:00:00").getTime()) /
                  (1000 * 60 * 60 * 24 * 30)
              )
            )
          : 0;

        const points =
          presencas * PT_PRESENCA +
          indicacoes * PT_INDICACAO +
          pagamentosEmDia * PT_PAGAMENTO +
          grads * PT_GRADUACAO +
          mesesCasa * PT_MES_CASA;

        return { studentId: s.id, name: s.name, presencas, indicacoes, extra: grads, points };
      })
      .sort((a, b) => b.points - a.points);
  }, [ativos, students, records, payments, graduations]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" /> Ranking de Alunos
          </h1>
          <p className="text-sm text-muted-foreground">
            Presença ×{PT_PRESENCA} · Indicação ×{PT_INDICACAO} · Pagamento em dia +{PT_PAGAMENTO}
            {" · "}Graduação ×{PT_GRADUACAO} (geral)
          </p>
        </div>
        {tab === "mensal" && (
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-40 text-center">
              {MONTH_NAMES[month]}/{year}
            </span>
            <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="mensal">Mensal</TabsTrigger>
          <TabsTrigger value="geral">Geral</TabsTrigger>
        </TabsList>
        <TabsContent value="mensal" className="mt-4">
          <RankingTable rows={monthly} mode="mensal" />
        </TabsContent>
        <TabsContent value="geral" className="mt-4">
          <RankingTable rows={overall} mode="geral" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
