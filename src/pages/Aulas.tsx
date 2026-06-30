import { useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { useClasses } from "@/hooks/useClasses";
import { ClassGroup, ClassType, MODALITIES, Modality } from "@/lib/mockData";

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
  capacity: 10,
});

function ClassList({ type }: { type: ClassType }) {
  const { classes, instructors, addClass, updateClass, deleteClass } = useClasses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(type));
  const [deleteTarget, setDeleteTarget] = useState<ClassGroup | null>(null);

  const items = classes.filter((c) => c.type === type);
  const instructorName = (id: string) => instructors.find((i) => i.id === id)?.name ?? "—";

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm(type));
    setDialogOpen(true);
  };

  const openEdit = (item: ClassGroup) => {
    setEditingId(item.id);
    const { id, studentIds, ...rest } = item;
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
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" /> {item.studentIds.length}/{item.capacity}
              </Badge>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
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

export default function Aulas() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aulas</h1>
        <p className="text-sm text-muted-foreground">Turmas, aulas particulares e aulas experimentais</p>
      </div>

      <Tabs defaultValue="turma">
        <TabsList>
          <TabsTrigger value="turma">Turma</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="gratis">Aulas Grátis</TabsTrigger>
        </TabsList>
        <TabsContent value="turma">
          <ClassList type="turma" />
        </TabsContent>
        <TabsContent value="personal">
          <ClassList type="personal" />
        </TabsContent>
        <TabsContent value="gratis">
          <ClassList type="gratis" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
