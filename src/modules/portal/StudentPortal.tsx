import { useState } from "react";
import { LogOut, User, Award, CreditCard, Plus, Pencil, Copy, Check, Trophy, Dumbbell, ShoppingBag } from "lucide-react";
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
import { Student } from "@/shared/domain";
import { useMyStudent } from "./useMyStudent";
import { useWeightEntries } from "./useWeightEntries";
import { useMyPayments } from "./useMyPayments";
import { useMyGraduations } from "./useMyGraduations";
import { usePortalClasses } from "./usePortalClasses";
import { usePortalStore } from "./usePortalStore";
import StoreTab from "./StoreTab";

const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PIX_KEY = "01306074010";

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(iso?: string) {
  return iso ? new Date(iso + "T12:00:00").toLocaleDateString("pt-BR") : "—";
}

/* ---------- Perfil (leitura + botão editar) ---------- */
function PerfilTab({
  student,
  planNames,
  onSave,
}: {
  student: Student;
  planNames: string;
  onSave: (patch: Partial<Student>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(student);

  const start = () => {
    setForm(student);
    setEditing(true);
  };
  const save = () => {
    onSave({
      phone: form.phone,
      address: form.address,
      addressNumber: form.addressNumber,
      neighborhood: form.neighborhood,
      instagram: form.instagram,
      facebook: form.facebook,
      targetWeight: form.targetWeight,
    });
    setEditing(false);
  };

  const Info = ({ label, value }: { label: string; value?: string }) => (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Meus dados</CardTitle>
        {!editing && (
          <Button variant="outline" size="sm" className="gap-1" onClick={start}>
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!editing ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Nome" value={student.name} />
              <Info label="CPF" value={student.cpf} />
              <Info label="Nascimento" value={fmtDate(student.birthDate)} />
              <Info label="Aluno desde" value={fmtDate(student.joinDate)} />
              <Info label="Plano(s)" value={planNames} />
              <Info label="Telefone" value={student.phone} />
              <Info
                label="Endereço"
                value={[student.address, student.addressNumber].filter(Boolean).join(", ")}
              />
              <Info label="Bairro" value={student.neighborhood} />
              <Info label="Instagram" value={student.instagram} />
              <Info label="Facebook" value={student.facebook} />
              <Info
                label="Peso pretendido"
                value={student.targetWeight != null ? `${student.targetWeight} kg` : undefined}
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Bairro</Label>
                <Input value={form.neighborhood ?? ""} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Endereço</Label>
                <Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Número</Label>
                <Input value={form.addressNumber ?? ""} onChange={(e) => setForm({ ...form, addressNumber: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Peso pretendido (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.targetWeight ?? ""}
                  onChange={(e) => setForm({ ...form, targetWeight: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Instagram</Label>
                <Input value={form.instagram ?? ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Facebook</Label>
                <Input value={form.facebook ?? ""} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Evolução (graduação + peso) ---------- */
const BELT_COLOR: Record<string, string> = {
  Branca: "#e5e7eb", Amarela: "#facc15", Laranja: "#fb923c", Verde: "#22c55e",
  Azul: "#3b82f6", Roxa: "#a855f7", Marrom: "#92400e", Preta: "#111827",
};

function EvolucaoTab({ studentId, targetWeight }: { studentId: string; targetWeight?: number }) {
  const { graduations } = useMyGraduations(studentId);
  const { entries, addWeight } = useWeightEntries(studentId);
  const [novoPeso, setNovoPeso] = useState("");
  const [dataPeso, setDataPeso] = useState(new Date().toISOString().slice(0, 10));

  const pesoAtual = entries.length > 0 ? entries[entries.length - 1].weight : undefined;
  const chartData = entries.map((e) => ({
    label: e.date.slice(8, 10) + "/" + e.date.slice(5, 7),
    peso: e.weight,
  }));

  return (
    <div className="space-y-4">
      {/* Graduações — foco principal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Minhas graduações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {graduations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma graduação registrada ainda. Assim que você graduar, aparece aqui.
            </p>
          ) : (
            <div className="space-y-3">
              {graduations.map((g, i) => (
                <div key={g.id} className="flex items-center gap-3">
                  <span
                    className="h-5 w-5 rounded-full border shrink-0"
                    style={{ backgroundColor: BELT_COLOR[g.belt] ?? "#9ca3af" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {g.belt} <span className="text-muted-foreground font-normal">— {g.modality}</span>
                    </p>
                    {g.notes && <p className="text-xs text-muted-foreground">{g.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-muted-foreground">{fmtDate(g.date)}</p>
                    {i === 0 && <Badge className="mt-0.5">Atual</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Peso — secundário */}
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="pt-5 pb-4">
          <p className="text-xs text-muted-foreground">Peso atual</p>
          <p className="text-2xl font-bold">{pesoAtual != null ? `${pesoAtual} kg` : "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4">
          <p className="text-xs text-muted-foreground">Meta</p>
          <p className="text-2xl font-bold">{targetWeight != null ? `${targetWeight} kg` : "—"}</p>
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
          {chartData.length > 1 && (
            <ChartContainer config={{ peso: { label: "Peso", color: "hsl(var(--chart-1))" } }} className="h-56 w-full mt-4">
              <LineChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} domain={["dataMin - 2", "dataMax + 2"]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="peso" stroke="var(--color-peso)" strokeWidth={2} dot />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Mensalidades ---------- */
function MensalidadesTab({ studentId }: { studentId: string }) {
  const { payments, monthlyFee } = useMyPayments(studentId);
  const { orders } = usePortalStore(studentId);
  const [copied, setCopied] = useState(false);

  const pedidosAbertos = orders.filter((o) => o.depositPaid && !o.remainingPaid && o.status !== "cancelado");

  const now = new Date();
  const pagoEsteMes = payments.some(
    (p) => p.paid && p.month === now.getMonth() && p.year === now.getFullYear()
  );

  // próximo vencimento: dia 10. Se o mês atual já foi pago, vence dia 10 do próximo mês.
  let dueMonth = now.getMonth();
  let dueYear = now.getFullYear();
  if (pagoEsteMes) {
    dueMonth += 1;
    if (dueMonth > 11) { dueMonth = 0; dueYear += 1; }
  }
  const proximoVenc = new Date(dueYear, dueMonth, 10);

  const pagos = payments
    .filter((p) => p.paid)
    .sort((a, b) => b.year - a.year || b.month - a.month)
    .slice(0, 3); // apenas os últimos 3

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 pb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Mensalidade</p>
            <p className="text-lg font-bold">{fmtBRL(monthlyFee)}</p>
          </div>
          {pagoEsteMes ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Mês pago</Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-300">Em aberto</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs text-muted-foreground">Próximo vencimento</p>
          <p className="text-lg font-bold">{proximoVenc.toLocaleDateString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Pagamento no início do mês. Após o dia 10, o valor padrão sobe para R$125.
          </p>
        </CardContent>
      </Card>

      {/* PIX */}
      <Card>
        <CardHeader><CardTitle className="text-base">Pagar via PIX</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Chave PIX (CPF)</p>
              <p className="font-mono font-medium truncate">{PIX_KEY}</p>
            </div>
            <Button size="sm" className="gap-1 shrink-0" onClick={copyPix}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Após pagar, envie o comprovante para o Jamur (Responsável Financeiro).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Últimos pagamentos</CardTitle></CardHeader>
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

      {pedidosAbertos.length > 0 && (
        <Card className="border-amber-300">
          <CardHeader><CardTitle className="text-base">Pedidos em aberto (2ª parte)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pedidosAbertos.map((o) => (
              <div key={o.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="text-sm">
                  <span className="font-medium">
                    {(o.items ?? []).map((it) => `${it.productName}`).join(", ") || "Pedido"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    restante {o.remainingDue ? `· vence ${new Date(o.remainingDue + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
                  </p>
                </div>
                <span className="font-bold text-amber-700">{fmtBRL(o.remaining)}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Vá na aba <strong>Loja</strong> → "Meus pedidos" para pagar o restante.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ---------- Aulas ---------- */
const TYPE_LABEL: Record<string, string> = { turma: "Turma", personal: "Personal", gratis: "Aula" };

function AulasTab({ studentId }: { studentId: string }) {
  const { classes, myClassIds, requestedIds, loading, requestClass } = usePortalClasses(studentId);

  const minhas = classes.filter((c) => myClassIds.includes(c.id));
  const outras = classes.filter((c) => !myClassIds.includes(c.id));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Minhas aulas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>}
          {!loading && minhas.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Você ainda não está matriculado em nenhuma aula.
            </p>
          )}
          {minhas.map((c) => (
            <div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.schedule}</p>
              </div>
              <Badge variant="secondary" className="shrink-0">{c.modality}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quero fazer mais aulas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground mb-1">
            Tem interesse em outra modalidade? Toque em "Tenho interesse" e a equipe entra em contato.
          </p>
          {outras.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma outra aula disponível no momento.
            </p>
          )}
          {outras.map((c) => {
            const requested = requestedIds.includes(c.id);
            return (
              <div key={c.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {c.name} <span className="text-muted-foreground font-normal">· {TYPE_LABEL[c.type] ?? ""}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{c.modality} · {c.schedule}</p>
                </div>
                {requested ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shrink-0">
                    Interesse enviado
                  </Badge>
                ) : (
                  <Button size="sm" variant="outline" className="shrink-0" onClick={() => requestClass(c.id)}>
                    Tenho interesse
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Portal ---------- */
export default function StudentPortal() {
  const { signOut } = useAuth();
  const { student, loading, updateMyStudent } = useMyStudent();
  const { plans } = usePlans();

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
        <p className="text-sm text-muted-foreground">Não encontramos seu cadastro. Fale com o Jamur (Responsável Financeiro).</p>
        <Button variant="outline" onClick={() => signOut()}>Sair</Button>
      </div>
    );
  }

  const planNames = student.planIds
    .map((id) => plans.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-background">
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
          <div className="overflow-x-auto -mx-1 px-1">
            <TabsList className="w-full">
              <TabsTrigger value="perfil" className="flex-1 gap-1"><User className="h-4 w-4" /> Perfil</TabsTrigger>
              <TabsTrigger value="evolucao" className="flex-1 gap-1"><Award className="h-4 w-4" /> Evolução</TabsTrigger>
              <TabsTrigger value="aulas" className="flex-1 gap-1"><Dumbbell className="h-4 w-4" /> Aulas</TabsTrigger>
              <TabsTrigger value="loja" className="flex-1 gap-1"><ShoppingBag className="h-4 w-4" /> Loja</TabsTrigger>
              <TabsTrigger value="mensalidades" className="flex-1 gap-1"><CreditCard className="h-4 w-4" /> Financeiro</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="perfil" className="mt-6">
            <PerfilTab student={student} planNames={planNames} onSave={updateMyStudent} />
          </TabsContent>
          <TabsContent value="evolucao" className="mt-6">
            <EvolucaoTab studentId={student.id} targetWeight={student.targetWeight} />
          </TabsContent>
          <TabsContent value="aulas" className="mt-6">
            <AulasTab studentId={student.id} />
          </TabsContent>
          <TabsContent value="loja" className="mt-6">
            <StoreTab studentId={student.id} />
          </TabsContent>
          <TabsContent value="mensalidades" className="mt-6">
            <MensalidadesTab studentId={student.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
