import { useEffect, useState } from "react";
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
import { Gender, Plan, Student, StudentStatus, MOTIVOS_INATIVACAO } from "@/shared/domain";
import { GENDER_LABEL } from "../labels";

type FormState = Omit<Student, "id">;

const emptyForm: FormState = {
  name: "",
  phone: "",
  email: "",
  birthDate: "",
  gender: "masculino",
  planIds: [],
  joinDate: new Date().toISOString().slice(0, 10),
  lastActivityDate: new Date().toISOString().slice(0, 10),
  status: "ativo",
  inactiveReason: "",
  inactiveSince: "",
};

export function StudentFormDialog({
  open,
  onClose,
  editing,
  plans,
  students,
  onSubmit,
  externalError,
}: {
  open: boolean;
  onClose: () => void;
  editing: Student | null;
  plans: Plan[];
  students: Student[];
  onSubmit: (data: FormState) => void;
  externalError?: string;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;
    setFormError("");
    if (editing) {
      const { id, ...rest } = editing;
      void id;
      setForm({ ...emptyForm, ...rest });
    } else {
      setForm({ ...emptyForm });
    }
  }, [open, editing]);

  const setStatus = (status: StudentStatus) =>
    setForm((prev) => ({
      ...prev,
      status,
      inactiveReason: status === "ativo" ? "" : prev.inactiveReason,
    }));

  const togglePlan = (id: string) =>
    setForm((prev) => ({
      ...prev,
      planIds: prev.planIds.includes(id)
        ? prev.planIds.filter((p) => p !== id)
        : [...prev.planIds, id],
    }));

  const handleSave = () => {
    if (!form.name.trim()) {
      setFormError("Informe o nome do aluno.");
      return;
    }
    if (form.status === "inativo" && !form.inactiveReason) {
      setFormError("Selecione o motivo da inatividade.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const wasInactive = editing?.status === "inativo";

    let inactiveSince = form.inactiveSince || "";
    if (form.status === "inativo") {
      // registra a data só quando é uma NOVA saída (ativo -> inativo).
      if (!wasInactive) inactiveSince = today;
    } else {
      inactiveSince = "";
    }

    onSubmit({
      ...form,
      inactiveReason: form.status === "ativo" ? "" : form.inactiveReason,
      inactiveSince,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar aluno" : "Novo aluno"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-1.5">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Nascimento</Label>
            <Input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Gênero</Label>
            <Select value={form.gender} onValueChange={(v: Gender) => setForm({ ...form, gender: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GENDER_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Data de entrada na academia</Label>
            <Input
              type="date"
              value={form.joinDate}
              onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Planos / modalidades</Label>
            <div className="flex flex-wrap gap-2">
              {plans.map((p) => {
                const active = form.planIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlan(p.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Pode marcar mais de um (ex: Muay Thai + Personal).
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Situação</Label>
            <Select value={form.status} onValueChange={(v: StudentStatus) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.status === "inativo" && (
            <div className="space-y-1.5">
              <Label>Motivo da inatividade</Label>
              <Select
                value={form.inactiveReason || ""}
                onValueChange={(v) => setForm({ ...form, inactiveReason: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_INATIVACAO.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="col-span-2 space-y-1.5">
            <Label>Indicado por (opcional)</Label>
            <Select
              value={form.referredBy || "none"}
              onValueChange={(v) => setForm({ ...form, referredBy: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ninguém" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguém</SelectItem>
                {students
                  .filter((s) => s.id !== editing?.id)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(formError || externalError) && (
          <p className="text-sm text-destructive">{formError || externalError}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
