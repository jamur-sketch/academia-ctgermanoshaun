import { useState, FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { supabase } from "@/shared/lib/supabase";

const emptyReg = {
  name: "",
  email: "",
  password: "",
  birthDate: "",
  cpf: "",
  phone: "",
  address: "",
  addressNumber: "",
  neighborhood: "",
  instagram: "",
  facebook: "",
  currentWeight: "",
  targetWeight: "",
};

export default function StudentAuth({ onStaff }: { onStaff: () => void }) {
  const [mode, setMode] = useState<"login" | "cadastro">("login");

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // cadastro
  const [reg, setReg] = useState({ ...emptyReg });
  const [consent, setConsent] = useState(false);
  const set = (k: keyof typeof reg, v: string) => setReg((p) => ({ ...p, [k]: v }));

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("E-mail ou senha inválidos.");
    setLoading(false);
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!consent) {
      setError("Você precisa autorizar o uso dos seus dados para se cadastrar.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("register-student", {
      body: { ...reg, consent },
    });
    if (error || !data?.ok) {
      setError(data?.error || error?.message || "Não foi possível concluir o cadastro.");
      setLoading(false);
      return;
    }
    // login automático após cadastro
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: reg.email.trim().toLowerCase(),
      password: reg.password,
    });
    if (loginErr) {
      setMode("login");
      setError("Cadastro criado! Faça login com seu e-mail e senha.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo.jpg"
            alt="CT Germano Schaun"
            className="w-20 h-20 rounded-full object-cover mb-4 shadow-md"
          />
          <h1 className="text-xl font-bold tracking-tight text-center">Portal do Aluno</h1>
          <p className="text-sm text-muted-foreground">CT Germano Schaun</p>
        </div>

        <div className="flex rounded-xl bg-muted p-1 mb-4">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "login" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Entrar
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "cadastro" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => { setMode("cadastro"); setError(""); }}
          >
            Criar cadastro
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4 bg-card border rounded-2xl p-6 shadow-sm">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4 bg-card border rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome completo *</Label>
                <Input value={reg.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Nascimento</Label>
                <Input type="date" value={reg.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input value={reg.cpf} onChange={(e) => set("cpf", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={reg.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Bairro</Label>
                <Input value={reg.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Endereço</Label>
                  <Input value={reg.address} onChange={(e) => set("address", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nº</Label>
                  <Input value={reg.addressNumber} onChange={(e) => set("addressNumber", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Instagram</Label>
                <Input value={reg.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@" />
              </div>
              <div className="space-y-1.5">
                <Label>Facebook</Label>
                <Input value={reg.facebook} onChange={(e) => set("facebook", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Peso atual (kg)</Label>
                <Input type="number" step="0.1" value={reg.currentWeight}
                  onChange={(e) => set("currentWeight", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Peso pretendido (kg)</Label>
                <Input type="number" step="0.1" value={reg.targetWeight}
                  onChange={(e) => set("targetWeight", e.target.value)} />
              </div>
              <div className="col-span-2 border-t pt-3 space-y-1.5">
                <Label>E-mail *</Label>
                <Input type="email" value={reg.email} onChange={(e) => set("email", e.target.value)} required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Senha * (mín. 6)</Label>
                <Input type="password" value={reg.password} onChange={(e) => set("password", e.target.value)} required />
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span>
                Autorizo o CT Germano Schaun a coletar e utilizar meus dados pessoais para gestão
                da minha matrícula, comunicação e acompanhamento do meu desenvolvimento, conforme a
                LGPD. Posso solicitar a exclusão a qualquer momento.
              </span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Criar meu cadastro"}
            </Button>
          </form>
        )}

        <button
          onClick={onStaff}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors mt-6"
        >
          Sou da equipe →
        </button>
      </div>
    </div>
  );
}
