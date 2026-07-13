import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { useStudents } from "@/modules/alunos/useStudents";
import { usePlans } from "@/modules/planos/usePlans";
import { Gender, Student, StudentStatus, MOTIVOS_INATIVACAO } from "@/shared/domain";

const GENDER_LABEL: Record<Gender, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
};

function StudentTable({
  rows,
  planName,
  onEdit,
  onDelete,
  showReason = false,
}: {
  rows: Student[];
  planName: (ids: string[]) => string;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
  showReason?: boolean;
}) {
  type SortKey = "nome" | "planoMotivo" | "genero";
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortValue = (s: Student): string => {
    if (sortKey === "nome") return s.name;
    if (sortKey === "genero") return GENDER_LABEL[s.gender];
    return showReason ? s.inactiveReason || "" : planName(s.planIds);
  };

  const sorted = useMemo(() => {
    const arr = [...rows].sort((a, b) =>
      sortValue(a).localeCompare(sortValue(b), "pt-BR", { sensitivity: "base" })
    );
    return sortDir === "asc" ? arr : arr.reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, sortDir, showReason]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortHeader = ({ label, k, align }: { label: string; k: SortKey; align?: "right" }) => (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 hover:text-foreground select-none"
      >
        {label}
        {sortKey === k ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );

  return (
    <div className="rounded-xl border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader label="Nome" k="nome" />
            <TableHead>Contato</TableHead>
            <SortHeader label={showReason ? "Motivo" : "Plano"} k="planoMotivo" />
            <SortHeader label="Gênero" k="genero" />
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {s.phone}
                {s.phone && s.email && <br />}
                {s.email}
              </TableCell>
              {showReason ? (
                <TableCell className="text-sm text-muted-foreground">
                  {s.inactiveReason || "—"}
                </TableCell>
              ) : (
                <TableCell>{planName(s.planIds)}</TableCell>
              )}
              <TableCell>{GENDER_LABEL[s.gender]}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(s)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(s)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                Nenhum aluno encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

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

export default function Alunos() {
  const { students, addStudent, updateStudent, deleteStudent } = useStudents();
  const { plans } = usePlans();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const setStatus = (status: StudentStatus) =>
    setForm((prev) => ({
      ...prev,
      status,
      inactiveReason: status === "ativo" ? "" : prev.inactiveReason,
    }));

  const planName = (ids: string[]) => {
    const names = ids.map((id) => plans.find((p) => p.id === id)?.name).filter(Boolean);
    return names.length > 0 ? names.join(", ") : "—";
  };

  const togglePlan = (id: string) =>
    setForm((prev) => ({
      ...prev,
      planIds: prev.planIds.includes(id)
        ? prev.planIds.filter((p) => p !== id)
        : [...prev.planIds, id],
    }));

  const filtered = useMemo(
    () =>
      students.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
      ),
    [students, search]
  );

  const ativos = useMemo(() => filtered.filter((s) => s.status === "ativo"), [filtered]);
  const inativos = useMemo(() => filtered.filter((s) => s.status === "inativo"), [filtered]);

  const openNew = () => {
    setEditingId(null);
    setFormError("");
    setForm({ ...emptyForm, planIds: [] });
    setDialogOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditingId(student.id);
    setFormError("");
    const { id, ...rest } = student;
    setForm({ ...emptyForm, ...rest });
    setDialogOpen(true);
  };

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
    const original = editingId ? students.find((s) => s.id === editingId) : undefined;
    const wasInactive = original?.status === "inativo";

    let inactiveSince = form.inactiveSince || "";
    if (form.status === "inativo") {
      // registra a data só quando é uma NOVA saída (ativo -> inativo).
      // importados que já vinham inativos permanecem sem data.
      if (!wasInactive) inactiveSince = today;
    } else {
      inactiveSince = "";
    }

    const data = {
      ...form,
      inactiveReason: form.status === "ativo" ? "" : form.inactiveReason,
      inactiveSince,
    };
    if (editingId) {
      updateStudent(editingId, data);
    } else {
      addStudent(data);
    }
    setDialogOpen(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alunos</h1>
          <p className="text-sm text-muted-foreground">
            {students.filter((s) => s.status === "ativo").length} alunos ativos
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo aluno
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="ativos">
        <TabsList>
          <TabsTrigger value="ativos">Ativos ({ativos.length})</TabsTrigger>
          <TabsTrigger value="inativos">Inativos</TabsTrigger>
        </TabsList>
        <TabsContent value="ativos" className="mt-4">
          <StudentTable
            rows={ativos}
            planName={planName}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        </TabsContent>
        <TabsContent value="inativos" className="mt-4">
          <StudentTable
            rows={inativos}
            planName={planName}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            showReason
          />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar aluno" : "Novo aluno"}</DialogTitle>
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
                    .filter((s) => s.id !== editingId)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir aluno</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Essa ação não pode ser
            desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) deleteStudent(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
