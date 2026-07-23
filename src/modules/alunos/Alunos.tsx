import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { useStudents } from "@/modules/alunos/useStudents";
import { usePlans } from "@/modules/planos/usePlans";
import { Student } from "@/shared/domain";
import { StudentTable } from "./components/StudentTable";
import { StudentFormDialog } from "./components/StudentFormDialog";
import { PortalRegistrations } from "./components/PortalRegistrations";

export default function Alunos() {
  const { students, addStudent, updateStudent, deleteStudent, mergeStudents } = useStudents();
  const { plans } = usePlans();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [saveError, setSaveError] = useState("");

  const planName = (ids: string[]) => {
    const names = ids.map((id) => plans.find((p) => p.id === id)?.name).filter(Boolean);
    return names.length > 0 ? names.join(", ") : "—";
  };

  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase())
      ),
    [students, search]
  );

  const ativos = useMemo(() => filtered.filter((s) => s.status === "ativo"), [filtered]);
  const inativos = useMemo(() => filtered.filter((s) => s.status === "inativo"), [filtered]);

  const openNew = () => {
    setEditing(null);
    setSaveError("");
    setDialogOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setSaveError("");
    setDialogOpen(true);
  };

  const handleSubmit = async (data: Omit<Student, "id">) => {
    const { error } = editing ? await updateStudent(editing.id, data) : await addStudent(data);
    if (error) {
      setSaveError(error);
      return; // mantém o diálogo aberto para não perder a edição
    }
    setSaveError("");
    setDialogOpen(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alunos</h1>
          <p className="text-sm text-muted-foreground">
            {students.filter((s) => s.status === "ativo").length} alunos ativos ·{" "}
            <span className="text-green-600">
              {students.filter((s) => s.status === "ativo" && s.authUserId).length} com login
            </span>{" "}
            no portal
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo aluno
        </Button>
      </div>

      <PortalRegistrations
        students={students}
        onMerge={mergeStudents}
        onMarkNew={(id) => updateStudent(id, { portalReviewed: true })}
      />

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
          <StudentTable rows={ativos} planName={planName} onEdit={openEdit} onDelete={setDeleteTarget} />
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

      <StudentFormDialog
        open={dialogOpen}
        onClose={() => {
          setSaveError("");
          setDialogOpen(false);
        }}
        editing={editing}
        plans={plans}
        students={students}
        onSubmit={handleSubmit}
        externalError={saveError}
      />

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
