import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select";
import { MONTH_NAMES, PAYMENT_METHODS } from "@/shared/constants";
import { isLate } from "../useMonthlyPayments";
import { PayForm } from "../types";

export function PagamentoDialog({
  open,
  name,
  baseFee,
  month,
  year,
  form,
  setForm,
  onClose,
  onConfirm,
}: {
  open: boolean;
  name: string;
  baseFee: number;
  month: number;
  year: number;
  form: PayForm;
  setForm: (f: PayForm) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Marcar como pago</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          {name} — {MONTH_NAMES[month]}/{year}
        </p>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Valor cobrado (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
            {baseFee === 100 && isLate() && (
              <p className="text-xs text-amber-600">Após o dia 10 — valor ajustado para R$125.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
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
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Opcional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onConfirm}>Confirmar pagamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
