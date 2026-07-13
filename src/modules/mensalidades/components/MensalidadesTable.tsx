import { CheckCircle2, XCircle, Pencil } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table";
import { PaymentRow, fmtBRL } from "../types";

export function MensalidadesTable({
  rows,
  modalityOf,
  isCurrentMonth,
  late,
  onEditConfig,
  onPay,
  onUnmark,
}: {
  rows: PaymentRow[];
  modalityOf: (studentId: string, planIds: string[]) => string;
  isCurrentMonth: boolean;
  late: boolean;
  onEditConfig: (studentId: string, name: string) => void;
  onPay: (studentId: string, name: string, baseFee: number) => void;
  onUnmark: (studentId: string) => void;
}) {
  return (
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
                  {modalityOf(student.id, student.planIds)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {paid && amountPaid !== null ? (
                    <span className="font-medium">{fmtBRL(amountPaid)}</span>
                  ) : (
                    <span className={isCurrentMonth && late && config.monthlyFee === 100 ? "text-amber-600 font-medium" : ""}>
                      {fmtBRL(currentFee)}
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
                  {paidDate ? new Date(paidDate + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      title="Editar configuração"
                      onClick={() => onEditConfig(student.id, student.name)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {paid ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-destructive gap-1"
                        onClick={() => onUnmark(student.id)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Desfazer
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => onPay(student.id, student.name, config.monthlyFee)}
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
  );
}
