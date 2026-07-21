import { useState, FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { supabase } from "@/shared/lib/supabase";

export default function Login({ onStudent }: { onStudent?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("E-mail ou senha inválidos.");
    }
    setLoading(false);
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
          <h1 className="text-xl font-bold tracking-tight text-center">CT Germano Schaun</h1>
          <p className="text-sm text-muted-foreground">Sistema de gestão</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card border rounded-2xl p-6 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Acesso restrito à equipe da academia.
        </p>
        {onStudent && (
          <button
            onClick={onStudent}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors mt-3"
          >
            Sou aluno — acessar o Portal do Aluno →
          </button>
        )}
      </div>
    </div>
  );
}
