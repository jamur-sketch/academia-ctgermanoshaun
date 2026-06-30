import { useMemo, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";

interface RankingRow {
  studentId: string;
  name: string;
  presence: number;
  checkins: number;
  referrals: number;
  workouts: number;
  points: number;
}

function buildRanking(students: ReturnType<typeof useStudents>["students"], seedOffset: number) {
  return students
    .map((s, i) => {
      const seed = (s.id.charCodeAt(0) + s.id.charCodeAt(s.id.length - 1) + i * 7 + seedOffset) % 97;
      const presence = 4 + (seed % 20);
      const checkins = 2 + (seed % 15);
      const referrals = seed % 5;
      const workouts = 1 + (seed % 12);
      const points = presence * 10 + checkins * 5 + referrals * 30 + workouts * 8;
      return { studentId: s.id, name: s.name, presence, checkins, referrals, workouts, points };
    })
    .sort((a, b) => b.points - a.points);
}

function RankingTable({ rows }: { rows: RankingRow[] }) {
  return (
    <div className="rounded-xl border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">#</TableHead>
            <TableHead>Aluno</TableHead>
            <TableHead className="text-right">Presenças</TableHead>
            <TableHead className="text-right">Check-ins</TableHead>
            <TableHead className="text-right">Indicações</TableHead>
            <TableHead className="text-right">Treinos</TableHead>
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
              <TableCell className="text-right">{row.presence}</TableCell>
              <TableCell className="text-right">{row.checkins}</TableCell>
              <TableCell className="text-right">{row.referrals}</TableCell>
              <TableCell className="text-right">{row.workouts}</TableCell>
              <TableCell className="text-right font-bold">{row.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Ranking() {
  const { students } = useStudents();
  useClasses();
  const [tab, setTab] = useState("mensal");

  const monthly = useMemo(() => buildRanking(students, 1), [students]);
  const overall = useMemo(() => buildRanking(students, 7), [students]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" /> Ranking de Alunos
        </h1>
        <p className="text-sm text-muted-foreground">
          Pontuação por engajamento: presença, check-ins, indicações e treinos
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="mensal">Mensal</TabsTrigger>
          <TabsTrigger value="geral">Geral</TabsTrigger>
        </TabsList>
        <TabsContent value="mensal">
          <RankingTable rows={monthly} />
        </TabsContent>
        <TabsContent value="geral">
          <RankingTable rows={overall} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
