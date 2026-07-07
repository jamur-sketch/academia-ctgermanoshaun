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
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Navigate to="/alunos" replace />} />
            <Route path="/alunos" element={<Alunos />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/aulas" element={<Aulas />} />
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
