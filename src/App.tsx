import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/shared/components/AppLayout";
import Alunos from "@/modules/alunos/Alunos";
import Planos from "@/modules/planos/Planos";
import Aulas from "@/modules/aulas/Aulas";
import Financeiro from "@/modules/financeiro/Financeiro";
import Relatorios from "@/modules/relatorios/Relatorios";
import Ranking from "@/modules/ranking/Ranking";
import Graduacoes from "@/modules/graduacoes/Graduacoes";
import Configuracoes from "@/modules/configuracoes/Configuracoes";
import Mensalidades from "@/modules/mensalidades/Mensalidades";
import Chamada from "@/modules/chamada/Chamada";
import Inicio from "@/modules/inicio/Inicio";
import NotFound from "@/shared/components/NotFound";
import Login from "@/modules/auth/Login";
import ChangePassword from "@/modules/auth/ChangePassword";
import StudentAuth from "@/modules/portal/StudentAuth";
import StudentPortal from "@/modules/portal/StudentPortal";
import { AuthProvider, useAuth } from "@/shared/hooks/useAuth";

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
            <Route path="/" element={<Navigate to="/inicio" replace />} />
            <Route path="/inicio" element={<Inicio />} />
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
  const { session, loading, role } = useAuth();
  if (loading) return <Splash />;
  if (!session) return <EntryScreen />;
  if (role === "aluno") return <StudentPortal />;
  if (session.user.user_metadata?.must_change_password) return <ChangePassword />;
  return <AppRoutes />;
}

function EntryScreen() {
  const [mode, setMode] = useState<"equipe" | "aluno">("equipe");
  if (mode === "aluno") return <StudentAuth onStaff={() => setMode("equipe")} />;
  return <Login onStudent={() => setMode("aluno")} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
