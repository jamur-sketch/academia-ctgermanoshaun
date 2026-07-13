import { Student } from "@/shared/domain";
import { PaymentConfig, MonthlyPayment } from "./useMonthlyPayments";

export interface PaymentRow {
  student: Student;
  config: PaymentConfig;
  payment: MonthlyPayment | undefined;
  currentFee: number;
}

export interface PayForm {
  amount: number;
  paymentMethod: string;
  notes: string;
}

export interface ConfigForm {
  monthlyFee: number;
  paymentMethod: string;
  notes: string;
}

export function fmtBRL(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
