import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/shared/lib/supabase";

type Role = "equipe" | "aluno";

interface AuthState {
  session: Session | null;
  loading: boolean;
  role: Role;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  role: "equipe",
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Papel vem do app_metadata (definido no servidor). Sem papel => tratamos
  // como equipe (contas antigas antes da migração de papéis).
  const role: Role =
    (session?.user?.app_metadata?.role as Role) === "aluno" ? "aluno" : "equipe";

  return (
    <AuthContext.Provider value={{ session, loading, role, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
