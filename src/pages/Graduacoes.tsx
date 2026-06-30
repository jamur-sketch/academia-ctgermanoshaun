import { useMemo, useState } from "react";
import { Plus, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
import { useGraduations } from "@/hooks/useGraduations";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { BELTS_BY_MODALITY, Graduation, MODALITIES, Modality } from "@/lib/mockData";

type FormState = Omit<Graduation, "id" | "date"> & { date: string };

export default function Graduacoes() {
  const { graduations, addGraduation } = useGraduations();
  const { students } = useStudents();
  const { instructors } = useClasses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    studentId: "",
    modality: MODALITIES[0],
    belt: BELTS_BY_MODALITY[MODALITIES[0]][0],
    date: new Date().toISOString().slice(0, 10),
    instructorId: "",
  });

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? "—";
  const instructorName = (id: string) => instructors.find((i) => i.id === id)?.name ?? "—";

  const currentBelts = useMemo(() => {
    const map = new Map<string, Graduation>();
    for (const g of [...graduations].sort((a, b) => a.date.localeCompare(b.date))) {
      map.set(`${g.studentId}-${g.modality}`, g);
    }
    return Array.from(map.values());
  }, [graduations]);

  const openNew = () => {
    setForm({
      studentId: students[0]?.id ?? "",
      modality: MODALITIES[0],
      belt: BELTS_BY_MODALITY[MODALITIES[0]][0],
      date: new Date().toISOString().slice(0, 10),
      instructorId: instructors[0]?.id ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.studentId) return;
    addGraduation(form);
    setDialogOpen(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Graduações</h1>
          <p className="text-sm text-muted-foreground">Controle de faixa/grau por modalidade</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Registrar graduação
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" /> Graduações registradas
            </p>
            <p className="text-2xl font-bold">{graduations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Alunos com faixa atual registrada</p>
            <p className="text-2xl font-bold">{currentBelts.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Faixa/Grau atual</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Instrutor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentBelts.map((g) => (
              <TableRow key={`${g.studentId}-${g.modality}`}>
                <TableCell className="font-medium">{studentName(g.studentId)}</TableCell>
                <TableCell>{g.modality}</TableCell>
                <TableCell>
                  <Badge>{g.belt}</Badge>
                </TableCell>
                <TableCell>{new Date(g.date).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>{instructorName(g.instructorId)}</TableCell>
              </TableRow>
            ))}
            {currentBelts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  Nenhuma graduação registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar graduação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Aluno</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Modalidade</Label>
                <Select
                  value={form.modality}
                  onValueChange={(v: Modality) =>
                    setForm({ ...form, modality: v, belt: BELTS_BY_MODALITY[v][0] })
                  }
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
                <Label>Faixa/Grau</Label>
                <Select value={form.belt} onValueChange={(v) => setForm({ ...form, belt: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BELTS_BY_MODALITY[form.modality].map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Instrutor responsável</Label>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
