import { useMemo, useState } from "react";
import { LogOut, User, LineChart as LineIcon, CreditCard, Plus } from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart";
import { useAuth } from "@/shared/hooks/useAuth";
import { usePlans } from "@/modules/planos/usePlans";
import { useMyStudent } from "./useMyStudent";
import { useWeightEntries } from "./useWeightEntries";
import { useMyPayments } from "./useMyPayments";

const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function StudentPortal() {
  const { signOut } = useAuth();
  const { student, loading, updateMyStudent } = useMyStudent();
  const { plans } = usePlans();
  const { entries, addWeight } = useWeightEntries(student?.id);
  const { payments, monthlyFee } = useMyPayments(student?.id);

  const [novoPeso, setNovoPeso] = useState("");
  const [dataPeso, setDataPeso] = useState(new Date().toISOString().slice(0, 10));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Não encontramos seu cadastro. Fale com a recepção.
        </p>
        <Button variant="outline" onClick={() => signOut()}>Sair</Button>
      </div>
    );
  }

  const pesoAtual = entries.length > 0 ? entries[entries.length - 1].weight : undefined;
  const planNames = student.planIds
    .map((id) => plans.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  const chartData = entries.map((e) => ({
    label: e.date.slice(8, 10) + "/" + e.date.slice(5, 7),
    peso: e.weight,
  }));

  const now = new Date();
  const pagoEsteMes = payments.some(
    (p) => p.paid && p.month === now.getMonth() && p.year === now.getFullYear()
  );
  const pagos = payments
    .filter((p) => p.paid)
    .sort((a, b) => (b.year - a.year) || (b.month - a.month));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 h-16 px-4 sm:px-6 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/logo.jpg" alt="CT" className="w-9 h-9 rounded-full object-cover shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{student.name}</p>
            <p className="text-xs text-muted-foreground">Portal do Aluno</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Tabs defaultValue="perfil">
          <TabsList className="w-full">
            <TabsTrigger value="perfil" className="flex-1 gap-1"><User className="h-4 w-4" /> Perfil</TabsTrigger>
            <TabsTrigger value="peso" className="flex-1 gap-1"><LineIcon className="h-4 w-4" /> Evolução</TabsTrigger>
            <TabsTrigger value="mensalidades" className="flex-1 gap-1"><CreditCard className="h-4 w-4" /> Mensalidades</TabsTrigger>
          </TabsList>

          {/* PERFIL */}
          <TabsContent value="perfil" className="mt-6 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Meus dados</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Nome</span><p className="font-medium">{student.name}</p></div>
                  <div><span className="text-muted-foreground">CPF</span><p className="font-medium">{student.cpf || "—"}</p></div>
                  <div><span className="text-muted-foreground">Nascimento</span><p className="font-medium">{student.birthDate ? new Date(student.birthDate + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</p></div>
                  <div><span className="text-muted-foreground">Plano(s)</span><p className="font-medium">{planNames || "—"}</p></div>
                </div>
                <div className="border-t pt-4 grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input value={student.phone} onChange={(e) => updateMyStudent({ phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bairro</Label>
                    <Input value={student.neighborhood ?? ""} onChange={(e) => updateMyStudent({ neighborhood: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Endereço</Label>
                    <Input value={student.address ?? ""} onChange={(e) => updateMyStudent({ address: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Instagram</Label>
                    <Input value={student.instagram ?? ""} onChange={(e) => updateMyStudent({ instagram: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Facebook</Label>
                    <Input value={student.facebook ?? ""} onChange={(e) => updateMyStudent({ facebook: e.target.value })} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">As alterações são salvas automaticamente.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PESO */}
          <TabsContent value="peso" className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card><CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground">Peso atual</p>
                <p className="text-2xl font-bold">{pesoAtual != null ? `${pesoAtual} kg` : "—"}</p>
              </CardContent></Card>
              <Card><CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground">Meta</p>
                <p className="text-2xl font-bold">{student.targetWeight != null ? `${student.targetWeight} kg` : "—"}</p>
              </CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Registrar peso</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1.5">
                    <Label>Data</Label>
                    <Input type="date" value={dataPeso} onChange={(e) => setDataPeso(e.target.value)} className="w-40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Peso (kg)</Label>
                    <Input type="number" step="0.1" value={novoPeso} onChange={(e) => setNovoPeso(e.target.value)} className="w-28" />
                  </div>
                  <Button
                    className="gap-1"
                    onClick={() => {
                      const w = Number(novoPeso);
                      if (!w) return;
                      addWeight(dataPeso, w);
                      setNovoPeso("");
                    }}
                  >
                    <Plus className="h-4 w-4" /> Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Evolução</CardTitle></CardHeader>
              <CardContent>
                {chartData.length > 1 ? (
                  <ChartContainer config={{ peso: { label: "Peso", color: "hsl(var(--chart-1))" } }} className="h-64 w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={40} domain={["dataMin - 2", "dataMax + 2"]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="peso" stroke="var(--color-peso)" strokeWidth={2} dot />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Registre pelo menos 2 pesos para ver o gráfico.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MENSALIDADES */}
          <TabsContent value="mensalidades" className="mt-6 space-y-4">
            <Card>
              <CardContent className="pt-5 pb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Mês atual</p>
                  <p className="text-lg font-bold">{fmtBRL(monthlyFee)}</p>
                </div>
                {pagoEsteMes ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Pago</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">Em aberto</Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Histórico de pagamentos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pagos.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum pagamento registrado ainda.</p>
                )}
                {pagos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                    <span className="text-sm font-medium">{MONTH_SHORT[p.month]}/{p.year}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {p.amountPaid != null ? fmtBRL(p.amountPaid) : "—"}
                      </span>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Pago</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground px-1">
              O pagamento é feito no início de cada mês, sem contrato ou vínculo. Em caso de dúvida,
              fale com a recepção.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
