import { useMemo, useState } from "react";
import { Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown, Smartphone } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table";
import { Student } from "@/shared/domain";
import { GENDER_LABEL } from "../labels";

type SortKey = "nome" | "planoMotivo" | "genero";

export function StudentTable({
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
              <TableCell className="font-medium">
                <span className="inline-flex items-center gap-1.5">
                  {s.name}
                  {s.authUserId && (
                    <Smartphone className="h-3.5 w-3.5 text-green-600" aria-label="Tem login no portal" />
                  )}
                </span>
              </TableCell>
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
