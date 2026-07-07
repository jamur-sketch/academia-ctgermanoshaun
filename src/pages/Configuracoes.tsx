import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { supabase } from "@/lib/supabase";

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

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export default function Configuracoes() {
  const [settings, setSettings] = useLocalStorage<Settings>("academia:settings", defaultSettings);
  const [form, setForm] = useState(settings);

  // Criação de administrador
  const [newEmail, setNewEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleCreateUser = async () => {
    setResult(null);
    if (!newEmail.trim() || !tempPassword.trim()) {
      setResult({ ok: false, msg: "Preencha o e-mail e a senha temporária." });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { email: newEmail.trim(), password: tempPassword },
      });
      if (error || !data?.ok) {
        const msg = data?.error || error?.message || "Não foi possível criar o usuário.";
        setResult({ ok: false, msg });
      } else {
        setResult({
          ok: true,
          msg: `Usuário criado! Envie estes dados para a pessoa: e-mail ${newEmail.trim()} e senha temporária ${tempPassword}. No primeiro login ela vai definir a própria senha.`,
        });
        setNewEmail("");
        setTempPassword("");
      }
    } catch (e) {
      setResult({ ok: false, msg: String(e) });
    }
    setCreating(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados da academia e acesso</p>
      </div>

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
          <Button onClick={() => setSettings(form)}>Salvar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Criar administrador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Crie um acesso para outra pessoa da equipe. Defina uma senha temporária —
            no primeiro login ela será obrigada a criar a própria senha.
          </p>
          <div className="space-y-1.5">
            <Label>E-mail do novo administrador</Label>
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
                placeholder="mínimo 6 caracteres"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setTempPassword(randomPassword())}
              >
                Gerar
              </Button>
            </div>
          </div>

          {result && (
            <p className={`text-sm ${result.ok ? "text-green-600" : "text-destructive"}`}>
              {result.msg}
            </p>
          )}

          <Button onClick={handleCreateUser} disabled={creating} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {creating ? "Criando..." : "Criar administrador"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
