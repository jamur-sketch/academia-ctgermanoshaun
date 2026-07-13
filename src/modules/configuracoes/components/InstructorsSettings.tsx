import { useState } from "react";
import { Plus, Pencil, Trash2, Dumbbell } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { useInstructors } from "@/modules/instrutores/useInstructors";
import { Instructor, MODALITIES, Modality } from "@/shared/domain";

export function InstructorsSettings() {
  const { instructors, loading, addInstructor, updateInstructor, deleteInstructor } = useInstructors();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [mods, setMods] = useState<Modality[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Instructor | null>(null);

  const openNew = () => {
    setEditingId(null);
    setName("");
    setMods([]);
    setDialogOpen(true);
  };

  const openEdit = (i: Instructor) => {
    setEditingId(i.id);
    setName(i.name);
    setMods(i.modalities);
    setDialogOpen(true);
  };

  const toggleMod = (m: Modality) =>
    setMods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const save = () => {
    if (!name.trim()) return;
    if (editingId) updateInstructor(editingId, { name: name.trim(), modalities: mods });
    else addInstructor({ name: name.trim(), modalities: mods });
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Dumbbell className="h-4 w-4" /> Instrutores
        </CardTitle>
        <Button size="sm" className="gap-1" onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
        ) : (
          <div className="space-y-2">
            {instructors.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{i.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {i.modalities.length > 0 ? (
                      i.modalities.map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs">
                          {m}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem modalidade</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(i)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {instructors.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhum instrutor cadastrado.
              </p>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar instrutor" : "Novo instrutor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do professor" />
            </div>
            <div className="space-y-2">
              <Label>Modalidades</Label>
              <div className="flex flex-wrap gap-2">
                {MODALITIES.map((m) => {
                  const active = mods.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMod(m)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir instrutor</DialogTitle>
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
                if (deleteTarget) deleteInstructor(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
