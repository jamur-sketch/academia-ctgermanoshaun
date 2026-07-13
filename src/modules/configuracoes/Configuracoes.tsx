import { useCallback, useEffect, useState } from "react";
import { UserPlus, Trash2, RefreshCw, ShieldCheck, Plus, Pencil, Dumbbell } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
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
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
import { useAuth } from "@/shared/hooks/useAuth";
import { useInstructors } from "@/modules/instrutores/useInstructors";
import { supabase } from "@/shared/lib/supabase";
import { Instructor, MODALITIES, Modality } from "@/shared/domain";

interface Settings {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const defaultSettings: Settings = {
  name: "CT Germano Schaun",
  phone: "",
  email: "",
  address: "",
};

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

/* ----------------------- Aba Academia ----------------------- */
function AcademiaSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>("academia:settings", defaultSettings);
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dados de contato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Nome da academia</Label>
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
          <Label>Endereço</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save}>Salvar</Button>
          {saved && <span className="text-sm text-green-600">Salvo!</span>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ----------------------- Aba Usuários ----------------------- */
function UsersSettings() {
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

/* ----------------------- Aba Minha conta ----------------------- */
function AccountSettings() {
  const { session, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    setMsg(null);
    if (password.length < 6) {
      setMsg({ ok: false, text: "A senha deve ter ao menos 6 caracteres." });
      return;
    }
    if (password !== confirm) {
      setMsg({ ok: false, text: "As senhas não coincidem." });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMsg({ ok: false, text: error.message });
    else {
      setMsg({ ok: true, text: "Senha atualizada com sucesso." });
      setPassword("");
      setConfirm("");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Minha conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={session?.user.email ?? ""} disabled />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>
          {msg && (
            <p className={`text-sm ${msg.ok ? "text-green-600" : "text-destructive"}`}>{msg.text}</p>
          )}
          <div className="flex items-center justify-between">
            <Button onClick={changePassword} disabled={saving}>
              {saving ? "Salvando..." : "Alterar senha"}
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              Sair do sistema
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------- Aba Instrutores ----------------------- */
function InstructorsSettings() {
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

/* ----------------------- Página ----------------------- */
export default function Configuracoes() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados da academia, usuários e conta</p>
      </div>

      <Tabs defaultValue="academia">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList>
            <TabsTrigger value="academia">Academia</TabsTrigger>
            <TabsTrigger value="instrutores">Instrutores</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="conta">Minha conta</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="academia" className="mt-6">
          <AcademiaSettings />
        </TabsContent>
        <TabsContent value="instrutores" className="mt-6">
          <InstructorsSettings />
        </TabsContent>
        <TabsContent value="usuarios" className="mt-6">
          <UsersSettings />
        </TabsContent>
        <TabsContent value="conta" className="mt-6">
          <AccountSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
