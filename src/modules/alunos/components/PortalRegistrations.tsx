import { useMemo, useState } from "react";
import { Link2, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Student } from "@/shared/domain";

export function PortalRegistrations({
  students,
  onMerge,
}: {
  students: Student[];
  onMerge: (existingId: string, portal: Student) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [linkTarget, setLinkTarget] = useState<Student | null>(null);
  const [search, setSearch] = useState("");

  // Cadastros feitos pelo portal = têm login (auth) vinculado.
  const portalRegs = useMemo(
    () => students.filter((s) => s.authUserId && !dismissed.includes(s.id)),
    [students, dismissed]
  );

  // Candidatos a vincular: alunos SEM login (registros antigos importados).
  const candidates = useMemo(
    () =>
      students
        .filter((s) => !s.authUserId)
        .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [students, search]
  );

  if (portalRegs.length === 0) return null;

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 transition-colors text-sm font-medium text-amber-800 dark:text-amber-300"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Cadastros pelo portal a revisar — {portalRegs.length}</span>
        <span className="text-xs">{open ? "▲ Ocultar" : "▼ Mostrar"}</span>
      </button>
      {open && (
        <div className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            Se o aluno já existia na lista, clique em <strong>Vincular</strong> e escolha o registro
            antigo (o login vai para ele e o duplicado some). Se for realmente novo, marque como novo.
          </p>
          {portalRegs.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 border rounded-lg p-3">
              <div className="min-w-0">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.email || "sem e-mail"}{s.cpf ? ` · CPF ${s.cpf}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDismissed((d) => [...d, s.id])}>
                  É aluno novo
                </Button>
                <Button size="sm" className="gap-1" onClick={() => { setLinkTarget(s); setSearch(""); }}>
                  <Link2 className="h-3.5 w-3.5" /> Vincular
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!linkTarget} onOpenChange={(o) => !o && setLinkTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular {linkTarget?.name} a um aluno existente</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aluno da lista..."
              className="pl-9"
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
            {candidates.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  if (linkTarget) onMerge(c.id, linkTarget);
                  setLinkTarget(null);
                }}
                className="w-full flex items-center justify-between gap-2 rounded-lg border p-2.5 text-left text-sm hover:bg-muted/50 transition-colors"
              >
                <span className="truncate">{c.name}</span>
                <Badge variant="secondary" className="shrink-0">{c.status === "ativo" ? "Ativo" : "Inativo"}</Badge>
              </button>
            ))}
            {candidates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum aluno encontrado.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
