import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import {
  useMonthlyPayments,
  usePaymentConfigs,
  effectiveFee,
  isLate,
} from "@/hooks/useMonthlyPayments";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const PAYMENT_METHODS = ["Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Boleto"];

function fmt(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Mensalidades() {
  const { students } = useStudents();
  const { classes } = useClasses();
  const { key: getPayment, markPaid, unmarkPaid } = useMonthlyPayments();
  const { getConfig, setConfig } = usePaymentConfigs();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState("");

  // dialog para marcar como pago
  const [payDialog, setPayDialog] = useState<{
    studentId: string;
    name: string;
    baseFee: number;
  } | null>(null);
  const [payForm, setPayForm] = useState({ amount: 0, paymentMethod: "Pix", notes: "" });

  // dialog para editar config do aluno
  const [configDialog, setConfigDialog] = useState<{ studentId: string; name: string } | null>(null);
  const [configForm, setConfigForm] = useState({ monthlyFee: 100, paymentMethod: "Pix", notes: "" });

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    else if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  };

  // modalidade do aluno (primeira turma que ele pertence)
  const studentModality = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classes) {
      for (const sid of c.studentIds) {
        if (!map.has(sid)) map.set(sid, c.modality);
      }
    }
    return map;
  }, [classes]);

  const rows = useMemo(() => {
    return students
      .filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      )
      .map((s) => {
        const config = getConfig(s.id);
        const payment = getPayment(s.id, month, year);
        const currentFee = effectiveFee(config.monthlyFee);
        return { student: s, config, payment, currentFee };
      });
  }, [students, search, month, year, getConfig, getPayment]);

  // KPIs
  const totalAlunos = rows.length;
  const pagos = rows.filter((r) => r.payment?.paid).length;
  const pendentes = totalAlunos - pagos;
  const valorRecebido = rows.reduce(
    (s, r) => s + (r.payment?.paid && r.payment.amountPaid ? r.payment.amountPaid : 0),
    0
  );
  const valorEsperado = rows.reduce((s, r) => s + r.currentFee, 0);

  const openPayDialog = (studentId: string, name: string, baseFee: number) => {
    const config = getConfig(studentId);
    const amount = effectiveFee(config.monthlyFee);
    setPayForm({ amount, paymentMethod: config.paymentMethod, notes: "" });
    setPayDialog({ studentId, name, baseFee });
  };

  const confirmPay = () => {
    if (!payDialog) return;
    markPaid(
      payDialog.studentId,
      month,
      year,
      payForm.amount,
      payForm.paymentMethod,
      payForm.notes
    );
    setPayDialog(null);
  };

  const openConfigDialog = (studentId: string, name: string) => {
    const c = getConfig(studentId);
    setConfigForm({ monthlyFee: c.monthlyFee, paymentMethod: c.paymentMethod, notes: c.notes });
    setConfigDialog({ studentId, name });
  };

  const confirmConfig = () => {
    if (!configDialog) return;
    setConfig(configDialog.studentId, configForm);
    setConfigDialog(null);
  };

  const late = isLate();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mensalidades</h1>
          <p className="text-sm text-muted-foreground">
            Controle de pagamentos mensais
            {isCurrentMonth && late && (
              <span className="ml-2 text-amber-600 font-medium">· Após o dia 10 — valor padrão: R$125</span>
            )}
          </p>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Total alunos</p>
            <p className="text-2xl font-bold">{totalAlunos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Pagos</p>
            <p className="text-2xl font-bold text-green-600">{pagos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-destructive">{pendentes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="text-xl font-bold text-green-600">{fmt(valorRecebido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Esperado</p>
            <p className="text-xl font-bold">{fmt(valorEsperado)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Input
        placeholder="Buscar aluno..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Tabela */}
      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Pagamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ student, config, payment, currentFee }) => {
              const paid = payment?.paid ?? false;
              const paidDate = payment?.paidDate ?? null;
              const amountPaid = payment?.amountPaid ?? null;

              return (
                <TableRow key={student.id}>
                  <TableCell className="font-medium whitespace-nowrap">{student.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {studentModality.get(student.id) ?? "—"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {paid && amountPaid !== null ? (
                      <span className="font-medium">{fmt(amountPaid)}</span>
                    ) : (
                      <span className={isCurrentMonth && late && config.monthlyFee === 100 ? "text-amber-600 font-medium" : ""}>
                        {fmt(currentFee)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {paid ? payment?.paymentMethod : config.paymentMethod}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate">
                    {paid ? (payment?.notes || "—") : (config.notes || "—")}
                  </TableCell>
                  <TableCell>
                    {paid ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Pago</Badge>
                    ) : isCurrentMonth && late ? (
                      <Badge variant="destructive">Atrasado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {paidDate
                      ? new Date(paidDate + "T12:00:00").toLocaleDateString("pt-BR")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        title="Editar configuração"
                        onClick={() => openConfigDialog(student.id, student.name)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {paid ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-muted-foreground hover:text-destructive gap-1"
                          onClick={() => unmarkPaid(student.id, month, year)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Desfazer
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => openPayDialog(student.id, student.name, config.monthlyFee)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Marcar pago
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  Nenhum aluno encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog: Marcar como pago */}
      <Dialog open={!!payDialog} onOpenChange={(o) => !o && setPayDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Marcar como pago</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            {payDialog?.name} — {MONTH_NAMES[month]}/{year}
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Valor cobrado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })}
              />
              {payDialog && payDialog.baseFee === 100 && isLate() && (
                <p className="text-xs text-amber-600">
                  Após o dia 10 — valor ajustado para R$125.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <Select
                value={payForm.paymentMethod}
                onValueChange={(v) => setPayForm({ ...payForm, paymentMethod: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observação</Label>
              <Input
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>Cancelar</Button>
            <Button onClick={confirmPay}>Confirmar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar configuração do aluno */}
      <Dialog open={!!configDialog} onOpenChange={(o) => !o && setConfigDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Configurar mensalidade</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">{configDialog?.name}</p>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Valor mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={configForm.monthlyFee}
                onChange={(e) => setConfigForm({ ...configForm, monthlyFee: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Padrão R$100. Valores diferentes não sofrem o ajuste do dia 10.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Forma de pagamento padrão</Label>
              <Select
                value={configForm.paymentMethod}
                onValueChange={(v) => setConfigForm({ ...configForm, paymentMethod: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Input
                value={configForm.notes}
                onChange={(e) => setConfigForm({ ...configForm, notes: e.target.value })}
                placeholder="Ex: paga sempre no dia 5, personal..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(null)}>Cancelar</Button>
            <Button onClick={confirmConfig}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
