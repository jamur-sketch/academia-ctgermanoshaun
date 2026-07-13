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
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/shared/ui/chart";
import { useClasses } from "@/modules/aulas/useClasses";
import { useFinancialEntries } from "@/modules/financeiro/useFinancialEntries";
import { EntryType } from "@/shared/domain";

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

  const totalReceita = monthEntries.filter((e) => e.type === "receita").reduce((s, e) => s + e.amount, 0);
  const totalDespesa = monthEntries.filter((e) => e.type === "despesa").reduce((s, e) => s + e.amount, 0);
  const saldo = totalReceita - totalDespesa;

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
    return [
      { label: "Turmas", count: turma.length, enrolled: turma.reduce((s, c) => s + c.studentIds.length, 0) },
      { label: "Personal", count: personal.length, enrolled: personal.reduce((s, c) => s + c.studentIds.length, 0) },
    ];
  }, [classes]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios financeiros</h1>
          <p className="text-sm text-muted-foreground">Faturamento, receitas e despesas</p>
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

      {/* Resumo do mês */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Receita</p>
            <p className="text-xl font-bold text-green-600">{fmt(totalReceita)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Despesa</p>
            <p className="text-xl font-bold text-destructive">{fmt(totalDespesa)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-xl font-bold ${saldo >= 0 ? "text-green-600" : "text-destructive"}`}>
              {fmt(saldo)}
            </p>
          </CardContent>
        </Card>
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
          <CardTitle className="text-base">Aulas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {classesByType.map((c) => (
            <div key={c.label} className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-bold">{c.count}</p>
              <p className="text-xs text-muted-foreground">{c.enrolled} matrículas</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
