import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function ChangePassword() {
  const { signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Em caso de sucesso, o evento USER_UPDATED atualiza a sessão e o app
    // segue automaticamente para as telas internas.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.jpg"
            alt="CT Germano Schaun"
            className="w-20 h-20 rounded-full object-cover mb-4 shadow-md"
          />
          <h1 className="text-xl font-bold tracking-tight text-center">Defina sua senha</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Este é seu primeiro acesso. Escolha uma senha pessoal para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card border rounded-2xl p-6 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar e entrar"}
          </Button>

          <button
            type="button"
            onClick={() => signOut()}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
