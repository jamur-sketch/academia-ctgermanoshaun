import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Users, Check, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
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
import { useClasses } from "@/modules/aulas/useClasses";
import { useStudents } from "@/modules/alunos/useStudents";
import { useClassRequests } from "@/modules/aulas/useClassRequests";
import { ClassGroup, ClassType, MODALITIES, Modality } from "@/shared/domain";

const TYPE_LABEL: Record<ClassType, string> = {
  turma: "Turma",
  personal: "Personal",
  gratis: "Aula Grátis",
};

type FormState = Omit<ClassGroup, "id" | "studentIds">;
const emptyForm = (type: ClassType): FormState => ({
  name: "",
  type,
  modality: MODALITIES[0],
  instructorId: "",
  schedule: "",
  capacity: 30,
});

function ClassList({ type }: { type: ClassType }) {
  const {
    classes,
    instructors,
    addClass,
    updateClass,
    deleteClass,
    enrollStudent,
    unenrollStudent,
  } = useClasses();
  const { students } = useStudents();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(type));
  const [deleteTarget, setDeleteTarget] = useState<ClassGroup | null>(null);
  const [manageId, setManageId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  const items = classes.filter((c) => c.type === type);
  const instructorName = (id: string) => instructors.find((i) => i.id === id)?.name ?? "—";

  const manageClass = manageId ? classes.find((c) => c.id === manageId) ?? null : null;

  const filteredStudents = useMemo(
    () =>
      students
        .filter((s) => s.status === "ativo")
        .filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students, studentSearch]
  );

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm(type));
    setDialogOpen(true);
  };

  const openEdit = (item: ClassGroup) => {
    setEditingId(item.id);
    const { id, studentIds, ...rest } = item;
    void id;
    void studentIds;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateClass(editingId, form);
    } else {
      addClass({ ...form, studentIds: [] });
    }
    setDialogOpen(false);
  };

  const openManage = (item: ClassGroup) => {
    setManageId(item.id);
    setStudentSearch("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nova {TYPE_LABEL[type].toLowerCase()}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{item.name}</CardTitle>
                <Badge variant="secondary">{item.modality}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{instructorName(item.instructorId)}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{item.schedule}</p>
              <button
                onClick={() => openManage(item)}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted transition-colors"
              >
                <Users className="h-3 w-3" /> {item.studentIds.length}/{item.capacity} alunos
              </button>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openManage(item)}>
                  <Users className="h-3.5 w-3.5" /> Alunos
                </Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-10">
            Nenhuma {TYPE_LABEL[type].toLowerCase()} cadastrada.
          </p>
        )}
      </div>

      {/* Dialog: criar/editar turma */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar" : "Nova"} {TYPE_LABEL[type].toLowerCase()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Modalidade</Label>
                <Select
                  value={form.modality}
                  onValueChange={(v: Modality) => setForm({ ...form, modality: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALITIES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Instrutor</Label>
                <Select value={form.instructorId} onValueChange={(v) => setForm({ ...form, instructorId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Capacidade</Label>
              <Input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: gerenciar alunos da turma */}
      <Dialog open={!!manageClass} onOpenChange={(o) => !o && setManageId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alunos — {manageClass?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            {manageClass?.studentIds.length ?? 0} de {manageClass?.capacity} matriculados. Toque para
            adicionar ou remover.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Buscar aluno..."
              className="pl-9"
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
            {filteredStudents.map((s) => {
              const enrolled = manageClass?.studentIds.includes(s.id) ?? false;
              return (
                <button
                  key={s.id}
                  onClick={() =>
                    manageClass &&
                    (enrolled
                      ? unenrollStudent(manageClass.id, s.id)
                      : enrollStudent(manageClass.id, s.id))
                  }
                  className={`w-full flex items-center justify-between gap-3 rounded-lg border p-2.5 text-left text-sm transition-colors ${
                    enrolled ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="truncate">{s.name}</span>
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 border-2 ${
                      enrolled
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-transparent"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                </button>
              );
            })}
            {filteredStudents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum aluno encontrado.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setManageId(null)}>Concluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: excluir */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) deleteClass(deleteTarget.id);
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

function SolicitacoesSection() {
  const { requests, resolve } = useClassRequests();
  const { classes, enrollStudent } = useClasses();
  const { students } = useStudents();

  if (requests.length === 0) return null;

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? "Aluno";
  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? "Aula";

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Solicitações de aula ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground -mt-1">
          Alunos que pediram, pelo portal, para fazer mais aulas.
        </p>
        {requests.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border rounded-lg p-3">
            <div className="min-w-0">
              <p className="font-medium">{studentName(r.studentId)}</p>
              <p className="text-xs text-muted-foreground">quer fazer: {className(r.classId)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => resolve(r.id)}>
                Dispensar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  enrollStudent(r.classId, r.studentId);
                  resolve(r.id);
                }}
              >
                Matricular
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function Aulas() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aulas</h1>
        <p className="text-sm text-muted-foreground">Turmas por modalidade e aulas particulares</p>
      </div>

      <SolicitacoesSection />

      <Tabs defaultValue="turma">
        <TabsList>
          <TabsTrigger value="turma">Turmas</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
        </TabsList>
        <TabsContent value="turma">
          <ClassList type="turma" />
        </TabsContent>
        <TabsContent value="personal">
          <ClassList type="personal" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
