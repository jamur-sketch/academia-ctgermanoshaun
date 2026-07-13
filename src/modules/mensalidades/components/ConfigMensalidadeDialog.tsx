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
import { PAYMENT_METHODS } from "@/shared/constants";
import { ConfigForm } from "../types";

export function ConfigMensalidadeDialog({
  open,
  name,
  form,
  setForm,
  onClose,
  onConfirm,
}: {
  open: boolean;
  name: string;
  form: ConfigForm;
  setForm: (f: ConfigForm) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Configurar mensalidade</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">{name}</p>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Valor mensal (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.monthlyFee}
              onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Padrão R$100. Valores diferentes não sofrem o ajuste do dia 10.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Forma de pagamento padrão</Label>
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
            <Label>Observações</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ex: paga sempre no dia 5, personal..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onConfirm}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
