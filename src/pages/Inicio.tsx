import { useMemo } from "react";
import { Users, UserMinus, TrendingDown, UserPlus } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useStudents } from "@/hooks/useStudents";
import { usePlans } from "@/hooks/usePlans";

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6 pb-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <p className="text-sm">{label}</p>
        </div>
        <p className={`text-3xl font-bold mt-1 ${accent ?? ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function Inicio() {
  const { students } = useStudents();
  const { plans } = usePlans();
  const now = new Date();

  const ativos = useMemo(() => students.filter((s) => s.status === "ativo"), [students]);
  // Evasão considera apenas saídas registradas no sistema (com data),
  // ignorando os inativos que já vieram importados da planilha.
  const evadidos = useMemo(
    () => students.filter((s) => s.status === "inativo" && s.inactiveSince),
    [students]
  );
  const baseEvasao = ativos.length + evadidos.length;
  const taxaEvasao = baseEvasao > 0 ? Math.round((evadidos.length / baseEvasao) * 100) : 0;

  const newStudentsMonth = ativos.filter((s) => {
    const d = new Date(s.joinDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Motivos de evasão
  const reasons = useMemo(() => {
    const map = new Map<string, number>();
    evadidos.forEach((s) => {
      const r = s.inactiveReason || "Não informado";
      map.set(r, (map.get(r) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [evadidos]);

  const maiorMotivo = reasons[0];

  // Distribuição por plano
  const byPlan = useMemo(
    () =>
      plans
        .map((p) => ({ name: p.name, value: ativos.filter((s) => s.planIds.includes(p.id)).length }))
        .filter((d) => d.value > 0),
    [plans, ativos]
  );

  // Idade
  const ageDistribution = useMemo(() => {
    const buckets = [
      { label: "13-17", min: 13, max: 17 },
      { label: "18-25", min: 18, max: 25 },
      { label: "26-35", min: 26, max: 35 },
      { label: "36-45", min: 36, max: 45 },
      { label: "46+", min: 46, max: 200 },
    ];
    return buckets.map((b) => ({
      label: b.label,
      count: ativos.filter((s) => {
        const age = now.getFullYear() - new Date(s.birthDate).getFullYear();
        return age >= b.min && age <= b.max;
      }).length,
    }));
  }, [ativos]);

  // Gênero
  const genderDistribution = useMemo(() => {
    const labels: Record<string, string> = { masculino: "Masculino", feminino: "Feminino", outro: "Outro" };
    const map = new Map<string, number>();
    ativos.forEach((s) => map.set(s.gender, (map.get(s.gender) ?? 0) + 1));
    return Array.from(map.entries()).map(([key, value]) => ({ name: labels[key] ?? key, value }));
  }, [ativos]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
        <p className="text-sm text-muted-foreground">Visão geral da academia</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Users} label="Alunos ativos" value={ativos.length} accent="text-green-600" />
        <Kpi
          icon={UserMinus}
          label="Alunos que saíram"
          value={evadidos.length}
          sub="saídas registradas no sistema"
        />
        <Kpi
          icon={TrendingDown}
          label="Taxa de evasão"
          value={`${taxaEvasao}%`}
          sub="saíram sobre o total já cadastrado"
          accent={taxaEvasao >= 30 ? "text-destructive" : undefined}
        />
        <Kpi icon={UserPlus} label="Novos no mês" value={newStudentsMonth} />
      </div>

      {/* Evasão */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Maior motivo de saída</CardTitle>
          </CardHeader>
          <CardContent>
            {maiorMotivo ? (
              <>
                <p className="text-xl font-bold">{maiorMotivo.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {maiorMotivo.value}{" "}
                  {maiorMotivo.value === 1 ? "aluno" : "alunos"} — {" "}
                  {evadidos.length > 0
                    ? Math.round((maiorMotivo.value / evadidos.length) * 100)
                    : 0}
                  % das saídas
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma saída registrada.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Motivos de evasão</CardTitle>
          </CardHeader>
          <CardContent>
            {reasons.length > 0 ? (
              <ChartContainer
                config={{ value: { label: "Alunos", color: "hsl(var(--chart-1))" } }}
                className="h-64 w-full"
              >
                <BarChart data={reasons} layout="vertical" margin={{ left: 12, right: 12 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-10 text-center">
                Nenhuma saída registrada ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribuições */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-56 w-full mx-auto">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={byPlan} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                  {byPlan.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Idade</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ count: { label: "Alunos", color: "hsl(var(--chart-2))" } }}
              className="h-56 w-full"
            >
              <BarChart data={ageDistribution}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gênero</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-56 w-full mx-auto">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={genderDistribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                  {genderDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
