import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Alunos from "@/pages/Alunos";
import Planos from "@/pages/Planos";
import Aulas from "@/pages/Aulas";
import Financeiro from "@/pages/Financeiro";
import Relatorios from "@/pages/Relatorios";
import Ranking from "@/pages/Ranking";
import Graduacoes from "@/pages/Graduacoes";
import Configuracoes from "@/pages/Configuracoes";
import Mensalidades from "@/pages/Mensalidades";
import Chamada from "@/pages/Chamada";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import ChangePassword from "@/pages/ChangePassword";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <img src="/logo.jpg" alt="CT Germano Schaun" className="w-16 h-16 rounded-full object-cover animate-pulse" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <AppLayout>
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Navigate to="/alunos" replace />} />
            <Route path="/alunos" element={<Alunos />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/aulas" element={<Aulas />} />
            <Route path="/chamada" element={<Chamada />} />
            <Route path="/mensalidades" element={<Mensalidades />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/graduacoes" element={<Graduacoes />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </AppLayout>
    </BrowserRouter>
  );
}

function Gate() {
  const { session, loading } = useAuth();
  if (loading) return <Splash />;
  if (!session) return <Login />;
  if (session.user.user_metadata?.must_change_password) return <ChangePassword />;
  return <AppRoutes />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
