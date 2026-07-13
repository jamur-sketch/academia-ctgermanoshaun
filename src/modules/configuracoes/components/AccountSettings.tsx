import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { useAuth } from "@/shared/hooks/useAuth";
import { supabase } from "@/shared/lib/supabase";

export function AccountSettings() {
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
