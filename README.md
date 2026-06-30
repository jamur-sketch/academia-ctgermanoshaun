# Sistema de Controle de Academia

App de gestão para academia: alunos, planos, aulas (turma/personal/aulas grátis),
financeiro (receita/despesa) e dashboard de relatórios.

Projeto independente, sem relação com outros apps do mesmo usuário.

## Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Recharts (gráficos)
- Dados mockados em `src/lib/mockData.ts`, persistidos em `localStorage` via hooks
  em `src/hooks` — **não há backend ainda**, é uma fase de validação das telas.

## Rodando localmente

```sh
npm install
npm run dev
```
