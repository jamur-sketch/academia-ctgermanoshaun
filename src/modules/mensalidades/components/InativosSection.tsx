import { Button } from "@/shared/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table";
import { PaymentRow, fmtBRL } from "../types";

export function InativosSection({
  rows,
  modalityOf,
  show,
  onToggle,
  onReactivate,
}: {
  rows: PaymentRow[];
  modalityOf: (studentId: string, planIds: string[]) => string;
  show: boolean;
  onToggle: () => void;
  onReactivate: (studentId: string) => void;
}) {
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-medium text-muted-foreground"
        onClick={onToggle}
      >
        <span>Alunos inativos (PAROU) — {rows.length}</span>
        <span className="text-xs">{show ? "▲ Ocultar" : "▼ Mostrar"}</span>
      </button>
      {show && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ student, config }) => (
                <TableRow key={student.id} className="opacity-60">
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {modalityOf(student.id, student.planIds)}
                  </TableCell>
                  <TableCell className="text-right">{fmtBRL(config.monthlyFee)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{config.notes || "—"}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onReactivate(student.id)}
                    >
                      Reativar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
