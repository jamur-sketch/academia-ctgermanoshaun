export type Gender = "masculino" | "feminino" | "outro";
export type StudentStatus = "ativo" | "inativo";
export type ClassType = "turma" | "personal" | "gratis";
export type EntryType = "receita" | "despesa";

export const MODALITIES = [
  "Jiu-Jitsu",
  "Muay Thai",
  "Boxe",
  "Judô",
  "Karatê",
  "MMA",
] as const;
export type Modality = (typeof MODALITIES)[number];

export const BELTS_BY_MODALITY: Record<Modality, string[]> = {
  "Jiu-Jitsu": ["Branca", "Azul", "Roxa", "Marrom", "Preta"],
  "Muay Thai": ["Branca", "Amarela", "Laranja", "Verde", "Azul", "Marrom", "Preta"],
  Boxe: ["Iniciante", "Intermediário", "Avançado"],
  Judô: ["Branca", "Amarela", "Laranja", "Verde", "Azul", "Marrom", "Preta"],
  Karatê: ["Branca", "Amarela", "Laranja", "Verde", "Roxa", "Marrom", "Preta"],
  MMA: ["Iniciante", "Intermediário", "Avançado"],
};

export interface Plan {
  id: string;
  name: string;
  price: number;
  classesPerMonth: number;
  highlight: boolean;
}

export interface Instructor {
  id: string;
  name: string;
  modalities: Modality[];
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: Gender;
  planIds: string[];
  joinDate: string;
  lastActivityDate: string;
  status: StudentStatus;
  referredBy?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  type: ClassType;
  modality: Modality;
  instructorId: string;
  schedule: string;
  capacity: number;
  studentIds: string[];
}

export interface FinancialEntry {
  id: string;
  type: EntryType;
  category: string;
  paymentMethod: string;
  amount: number;
  date: string;
  description: string;
}

export interface Graduation {
  id: string;
  studentId: string;
  modality: Modality;
  belt: string;
  date: string;
  instructorId: string;
  notes?: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const seedPlans: Plan[] = [
  { id: "plan-1", name: "Mensal Jiu-Jitsu", price: 180, classesPerMonth: 12, highlight: false },
  { id: "plan-2", name: "Mensal Muay Thai", price: 170, classesPerMonth: 12, highlight: false },
  { id: "plan-3", name: "Plano Completo", price: 280, classesPerMonth: 24, highlight: true },
  { id: "plan-4", name: "Aula Avulsa", price: 40, classesPerMonth: 1, highlight: false },
];

export const seedInstructors: Instructor[] = [
  { id: "inst-1", name: "Carlos Mendes", modalities: ["Jiu-Jitsu", "MMA"] },
  { id: "inst-2", name: "Fernanda Lima", modalities: ["Muay Thai", "Boxe"] },
  { id: "inst-3", name: "Rafael Souza", modalities: ["Judô", "Karatê"] },
];

const firstNames = ["Lucas", "Mariana", "Pedro", "Juliana", "Gabriel", "Camila", "Bruno", "Larissa", "Thiago", "Beatriz", "André", "Patrícia", "Felipe", "Aline", "Diego", "Renata"];
const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Costa", "Pereira", "Almeida", "Ferreira", "Rodrigues", "Carvalho"];

function randomDateWithinMonths(monthsBack: number): string {
  const now = new Date();
  const past = new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * monthsBack), 1 + Math.floor(Math.random() * 28));
  return past.toISOString().slice(0, 10);
}

export const seedStudents: Student[] = Array.from({ length: 36 }).map((_, i) => {
  const gender: Gender = i % 3 === 0 ? "feminino" : i % 7 === 0 ? "outro" : "masculino";
  const birthYear = 1985 + (i % 25);
  return {
    id: `student-${i + 1}`,
    name: `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`,
    phone: `(11) 9${String(80000000 + i * 137).slice(0, 8)}`,
    email: `aluno${i + 1}@email.com`,
    birthDate: `${birthYear}-0${(i % 9) + 1}-1${i % 9}`,
    gender,
    planIds: [seedPlans[i % seedPlans.length].id],
    joinDate: randomDateWithinMonths(11),
    lastActivityDate: randomDateWithinMonths(2),
    status: "ativo" as StudentStatus,
  };
});

export const seedClasses: ClassGroup[] = [
  { id: "class-1", name: "Jiu-Jitsu Fundamentos", type: "turma", modality: "Jiu-Jitsu", instructorId: "inst-1", schedule: "Seg/Qua/Sex 19h", capacity: 20, studentIds: seedStudents.slice(0, 12).map((s) => s.id) },
  { id: "class-2", name: "Muay Thai Iniciante", type: "turma", modality: "Muay Thai", instructorId: "inst-2", schedule: "Ter/Qui 20h", capacity: 18, studentIds: seedStudents.slice(12, 22).map((s) => s.id) },
  { id: "class-3", name: "Judô Kids", type: "turma", modality: "Judô", instructorId: "inst-3", schedule: "Sáb 10h", capacity: 15, studentIds: seedStudents.slice(22, 28).map((s) => s.id) },
  { id: "class-4", name: "Personal MMA", type: "personal", modality: "MMA", instructorId: "inst-1", schedule: "Sob agendamento", capacity: 1, studentIds: seedStudents.slice(28, 31).map((s) => s.id) },
  { id: "class-5", name: "Aula Experimental Muay Thai", type: "gratis", modality: "Muay Thai", instructorId: "inst-2", schedule: "Sáb 9h", capacity: 10, studentIds: seedStudents.slice(31, 36).map((s) => s.id) },
];

const categories = {
  receita: ["Mensalidade", "Matrícula", "Produto", "Aula Avulsa"],
  despesa: ["Aluguel", "Salários", "Equipamentos", "Marketing", "Energia/Água"],
};
const paymentMethods = ["Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Boleto"];

export const seedFinancialEntries: FinancialEntry[] = Array.from({ length: 90 }).map((_, i) => {
  const type: EntryType = (i * 13 + 7) % 11 < 4 ? "despesa" : "receita";
  const cats = categories[type];
  const monthsBack = i % 12;
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1 + (i % 27)).toISOString().slice(0, 10);
  return {
    id: `entry-${i + 1}`,
    type,
    category: cats[i % cats.length],
    paymentMethod: paymentMethods[i % paymentMethods.length],
    amount: type === "receita" ? 80 + (i % 10) * 25 : 150 + (i % 8) * 90,
    date,
    description: type === "receita" ? `${cats[i % cats.length]} - ${seedStudents[i % seedStudents.length].name}` : `${cats[i % cats.length]} mensal`,
  };
});

export const seedGraduations: Graduation[] = seedStudents.slice(0, 20).map((s, i) => {
  const modality = seedClasses.find((c) => c.studentIds.includes(s.id))?.modality ?? "Jiu-Jitsu";
  const belts = BELTS_BY_MODALITY[modality];
  const belt = belts[i % belts.length];
  return {
    id: `grad-${i + 1}`,
    studentId: s.id,
    modality,
    belt,
    date: randomDateWithinMonths(8),
    instructorId: seedInstructors[i % seedInstructors.length].id,
  };
});

export { uid };
