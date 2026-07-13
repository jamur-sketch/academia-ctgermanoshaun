import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent } from "@/shared/ui/card";
import { useStudents } from "@/modules/alunos/useStudents";
import { useClasses } from "@/modules/aulas/useClasses";
import { usePlans } from "@/modules/planos/usePlans";
import {
  useMonthlyPayments,
  usePaymentConfigs,
  effectiveFee,
  isLate,
} from "@/modules/mensalidades/useMonthlyPayments";
import { MONTH_NAMES } from "@/shared/constants";
import { PayForm, ConfigForm, fmtBRL } from "./types";
import { MensalidadesTable } from "./components/MensalidadesTable";
import { InativosSection } from "./components/InativosSection";
import { PagamentoDialog } from "./components/PagamentoDialog";
import { ConfigMensalidadeDialog } from "./components/ConfigMensalidadeDialog";

export default function Mensalidades() {
  const { students, updateStudent } = useStudents();
  const { classes } = useClasses();
  const { plans } = usePlans();
  const { key: getPayment, markPaid, unmarkPaid } = useMonthlyPayments();
  const { getConfig, setConfig } = usePaymentConfigs();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState("");
  const [showInativos, setShowInativos] = useState(false);

  const [payDialog, setPayDialog] = useState<{ studentId: string; name: string; baseFee: number } | null>(null);
  const [payForm, setPayForm] = useState<PayForm>({ amount: 0, paymentMethod: "Pix", notes: "" });
  const [configDialog, setConfigDialog] = useState<{ studentId: string; name: string } | null>(null);
  const [configForm, setConfigForm] = useState<ConfigForm>({ monthlyFee: 100, paymentMethod: "Pix", notes: "" });

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    else if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  };

  // modalidade do aluno: prioriza a turma (quando houver), senão usa o plano
  const classModality = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classes) {
      for (const sid of c.studentIds) {
        if (!map.has(sid)) map.set(sid, c.modality);
      }
    }
    return map;
  }, [classes]);

  const planName = useMemo(() => {
    const map = new Map<string, string>();
    plans.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [plans]);

  const modalityOf = (studentId: string, planIds: string[]) => {
    const fromClass = classModality.get(studentId);
    if (fromClass) return fromClass;
    const names = planIds.map((id) => planName.get(id)).filter(Boolean);
    return names.length > 0 ? names.join(", ") : "—";
  };

  const makeRows = (list: typeof students) =>
    list
      .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
      .map((s) => {
        const config = getConfig(s.id);
        const payment = getPayment(s.id, month, year);
        const currentFee = effectiveFee(config.monthlyFee);
        return { student: s, config, payment, currentFee };
      });

  const ativos = useMemo(
    () => makeRows(students.filter((s) => s.status === "ativo")),
    [students, search, month, year, getConfig, getPayment]
  );
  const inativos = useMemo(
    () => makeRows(students.filter((s) => s.status === "inativo")),
    [students, search, month, year, getConfig, getPayment]
  );

  // KPIs — baseado apenas nos ativos
  const totalAlunos = ativos.length;
  const pagos = ativos.filter((r) => r.payment?.paid).length;
  const pendentes = totalAlunos - pagos;
  const valorRecebido = ativos.reduce(
    (s, r) => s + (r.payment?.paid && r.payment.amountPaid ? r.payment.amountPaid : 0),
    0
  );
  const valorEsperado = ativos.reduce((s, r) => s + r.currentFee, 0);

  const openPayDialog = (studentId: string, name: string, baseFee: number) => {
    const config = getConfig(studentId);
    setPayForm({ amount: effectiveFee(config.monthlyFee), paymentMethod: config.paymentMethod, notes: "" });
    setPayDialog({ studentId, name, baseFee });
  };

  const confirmPay = () => {
    if (!payDialog) return;
    markPaid(payDialog.studentId, month, year, payForm.amount, payForm.paymentMethod, payForm.notes);
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
            <p className="text-xl font-bold text-green-600">{fmtBRL(valorRecebido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Esperado</p>
            <p className="text-xl font-bold">{fmtBRL(valorEsperado)}</p>
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

      <MensalidadesTable
        rows={ativos}
        modalityOf={modalityOf}
        isCurrentMonth={isCurrentMonth}
        late={late}
        onEditConfig={openConfigDialog}
        onPay={openPayDialog}
        onUnmark={(studentId) => unmarkPaid(studentId, month, year)}
      />

      <InativosSection
        rows={inativos}
        modalityOf={modalityOf}
        show={showInativos}
        onToggle={() => setShowInativos((v) => !v)}
        onReactivate={(studentId) =>
          updateStudent(studentId, { status: "ativo", inactiveReason: "", inactiveSince: "" })
        }
      />

      <PagamentoDialog
        open={!!payDialog}
        name={payDialog?.name ?? ""}
        baseFee={payDialog?.baseFee ?? 0}
        month={month}
        year={year}
        form={payForm}
        setForm={setPayForm}
        onClose={() => setPayDialog(null)}
        onConfirm={confirmPay}
      />

      <ConfigMensalidadeDialog
        open={!!configDialog}
        name={configDialog?.name ?? ""}
        form={configForm}
        setForm={setConfigForm}
        onClose={() => setConfigDialog(null)}
        onConfirm={confirmConfig}
      />
    </div>
  );
}
