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
  inactiveReason?: string;
  inactiveSince?: string;
}

export const MOTIVOS_INATIVACAO = [
  "Não teve mais interesse",
  "Mudou de cidade / se mudou",
  "Motivos financeiros",
  "Lesão ou problema de saúde",
  "Falta de tempo",
  "Aluno expulso",
  "Mudou de academia",
  "Outro",
];

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

export { uid };
