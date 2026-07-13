import { useCallback, useEffect, useState } from "react";
import { UserPlus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
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
import { supabase } from "@/shared/lib/supabase";

interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  mustChangePassword: boolean;
  isSelf: boolean;
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function UsersSettings() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: { action: "list" },
    });
    if (error || !data?.ok) {
      setLoadError(
        data?.error ||
          "Não foi possível carregar os usuários. A função 'manage-users' já foi publicada no Supabase?"
      );
      setUsers([]);
    } else {
      setUsers(data.users as AdminUser[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    setResult(null);
    if (!newEmail.trim() || !tempPassword.trim()) {
      setResult({ ok: false, msg: "Preencha o e-mail e a senha temporária." });
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: { action: "create", email: newEmail.trim(), password: tempPassword },
    });
    if (error || !data?.ok) {
      setResult({ ok: false, msg: data?.error || error?.message || "Erro ao criar usuário." });
    } else {
      setResult({
        ok: true,
        msg: `Usuário criado! Envie para a pessoa: e-mail ${newEmail.trim()} e senha temporária ${tempPassword}. No primeiro login ela vai definir a própria senha.`,
      });
      setNewEmail("");
      setTempPassword("");
      load();
    }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: { action: "delete", userId: deleteTarget.id },
    });
    setDeleteTarget(null);
    if (error || !data?.ok) {
      setResult({ ok: false, msg: data?.error || "Erro ao excluir usuário." });
    } else {
      load();
    }
  };

  return (
    <div className="space-y-6">
      {/* Criar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Criar administrador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Defina uma senha temporária — no primeiro login a pessoa será obrigada a criar a
            própria senha.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                type="email"
                placeholder="pessoa@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Senha temporária</Label>
              <div className="flex gap-2">
                <Input
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="mín. 6 caracteres"
                />
                <Button type="button" variant="outline" onClick={() => setTempPassword(randomPassword())}>
                  Gerar
                </Button>
              </div>
            </div>
          </div>
          {result && (
            <p className={`text-sm ${result.ok ? "text-green-600" : "text-destructive"}`}>
              {result.msg}
            </p>
          )}
          <Button onClick={handleCreate} disabled={creating} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {creating ? "Criando..." : "Criar administrador"}
          </Button>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Usuários do sistema</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
          ) : loadError ? (
            <p className="text-sm text-destructive py-6 text-center">{loadError}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Último acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.email}
                        {u.isSelf && <span className="text-xs text-muted-foreground ml-2">(você)</span>}
                      </TableCell>
                      <TableCell>
                        {u.mustChangePassword ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Senha temporária
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(u.createdAt)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(u.lastSignInAt)}</TableCell>
                      <TableCell className="text-right">
                        {!u.isSelf && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir usuário</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover o acesso de <strong>{deleteTarget?.email}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
