import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { useStudents } from "@/hooks/useStudents";
import { usePlans } from "@/hooks/usePlans";
import { useClasses } from "@/hooks/useClasses";
import { useFinancialEntries } from "@/hooks/useFinancialEntries";
import { EntryType } from "@/lib/mockData";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const revenueChartConfig: ChartConfig = {
  value: { label: "Receita", color: "hsl(var(--chart-1))" },
};

export default function Relatorios() {
  const { students } = useStudents();
  const { plans } = usePlans();
  const { classes } = useClasses();
  const { entries } = useFinancialEntries();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [finType, setFinType] = useState<EntryType>("receita");

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const monthEntries = useMemo(
    () =>
      entries.filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
      }),
    [entries, month, year]
  );

  // Faturamento anual
  const annualRevenue = useMemo(() => {
    return MONTH_SHORT.map((label, i) => {
      const value = entries
        .filter((e) => e.type === "receita" && new Date(e.date).getMonth() === i && new Date(e.date).getFullYear() === year)
        .reduce((s, e) => s + e.amount, 0);
      return { month: label, value };
    });
  }, [entries, year]);

  // Financeiro por categoria / forma de pagamento
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthEntries.filter((e) => e.type === finType).forEach((e) => {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [monthEntries, finType]);

  const byPaymentMethod = useMemo(() => {
    const map = new Map<string, number>();
    monthEntries.filter((e) => e.type === finType).forEach((e) => {
      map.set(e.paymentMethod, (map.get(e.paymentMethod) ?? 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [monthEntries, finType]);

  // Aulas por tipo
  const classesByType = useMemo(() => {
    const turma = classes.filter((c) => c.type === "turma");
    const personal = classes.filter((c) => c.type === "personal");
    const gratis = classes.filter((c) => c.type === "gratis");
    return [
      { label: "Turma", count: turma.length, enrolled: turma.reduce((s, c) => s + c.studentIds.length, 0) },
      { label: "Personal", count: personal.length, enrolled: personal.reduce((s, c) => s + c.studentIds.length, 0) },
      { label: "Aulas Grátis", count: gratis.length, enrolled: gratis.reduce((s, c) => s + c.studentIds.length, 0) },
    ];
  }, [classes]);

  // Alunos mês x ano
  const newStudentsMonth = students.filter((s) => {
    const d = new Date(s.joinDate);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;
  const newStudentsYear = students.filter((s) => new Date(s.joinDate).getFullYear() === year).length;

  // Distribuição por plano
  const byPlan = useMemo(() => {
    return plans.map((p) => ({
      name: p.name,
      value: students.filter((s) => s.planId === p.id).length,
    }));
  }, [plans, students]);

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
      count: students.filter((s) => {
        const age = now.getFullYear() - new Date(s.birthDate).getFullYear();
        return age >= b.min && age <= b.max;
      }).length,
    }));
  }, [students]);

  // Gênero
  const genderDistribution = useMemo(() => {
    const labels: Record<string, string> = { masculino: "Masculino", feminino: "Feminino", outro: "Outro" };
    const map = new Map<string, number>();
    students.forEach((s) => map.set(s.gender, (map.get(s.gender) ?? 0) + 1));
    return Array.from(map.entries()).map(([key, value]) => ({ name: labels[key] ?? key, value }));
  }, [students]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Visão geral do desempenho da academia</p>
        </div>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faturamento Anual ({year})</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={revenueChartConfig} className="h-72 w-full">
            <BarChart data={annualRevenue}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Financeiro do mês</CardTitle>
          <Tabs value={finType} onValueChange={(v) => setFinType(v as EntryType)}>
            <TabsList>
              <TabsTrigger value="receita">Receita</TabsTrigger>
              <TabsTrigger value="despesa">Despesa</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium mb-2 text-center">Por Categoria</p>
            <ChartContainer config={{}} className="h-64 w-full mx-auto">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
          <div>
            <p className="text-sm font-medium mb-2 text-center">Por Forma de Pagamento</p>
            <ChartContainer config={{}} className="h-64 w-full mx-auto">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={byPaymentMethod} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {byPaymentMethod.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aulas do mês</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          {classesByType.map((c) => (
            <div key={c.label} className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-bold">{c.count}</p>
              <p className="text-xs text-muted-foreground">{c.enrolled} matrículas</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alunos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">Novos no mês</p>
              <p className="text-2xl font-bold">{newStudentsMonth}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">Novos no ano</p>
              <p className="text-2xl font-bold">{newStudentsYear}</p>
            </div>
          </CardContent>
        </Card>

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
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Idade</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Alunos", color: "hsl(var(--chart-2))" } }} className="h-64 w-full">
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
            <ChartContainer config={{}} className="h-64 w-full mx-auto">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={genderDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
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
