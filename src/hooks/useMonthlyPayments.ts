import { useLocalStorage } from "./useLocalStorage";
import { uid } from "@/lib/mockData";
import { seedPaymentConfigs, seedMonthlyPayments } from "@/lib/realData";

export interface PaymentConfig {
  monthlyFee: number;
  paymentMethod: string;
  notes: string;
}

export interface MonthlyPayment {
  id: string;
  studentId: string;
  month: number;
  year: number;
  paid: boolean;
  paidDate: string | null;
  amountPaid: number | null;
  paymentMethod: string;
  notes: string;
}

const DEFAULT_FEE = 100;
const LATE_FEE = 125;
const LATE_DAY = 10;

export function isLate(date?: Date): boolean {
  const d = date ?? new Date();
  return d.getDate() > LATE_DAY;
}

export function effectiveFee(baseFee: number, date?: Date): number {
  if (baseFee === DEFAULT_FEE && isLate(date)) return LATE_FEE;
  return baseFee;
}

export function usePaymentConfigs() {
  const [configs, setConfigs] = useLocalStorage<Record<string, PaymentConfig>>(
    "academia:payment-configs:v2",
    seedPaymentConfigs
  );

  const getConfig = (studentId: string): PaymentConfig =>
    configs[studentId] ?? { monthlyFee: DEFAULT_FEE, paymentMethod: "Pix", notes: "" };

  const setConfig = (studentId: string, data: Partial<PaymentConfig>) => {
    setConfigs((prev) => ({
      ...prev,
      [studentId]: { ...getConfig(studentId), ...data },
    }));
  };

  return { configs, getConfig, setConfig };
}

export function useMonthlyPayments() {
  const [payments, setPayments] = useLocalStorage<MonthlyPayment[]>(
    "academia:monthly-payments:v2",
    seedMonthlyPayments
  );

  const key = (studentId: string, month: number, year: number) =>
    payments.find((p) => p.studentId === studentId && p.month === month && p.year === year);

  const markPaid = (
    studentId: string,
    month: number,
    year: number,
    amountPaid: number,
    paymentMethod: string,
    notes: string
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    setPayments((prev) => {
      const existing = prev.find(
        (p) => p.studentId === studentId && p.month === month && p.year === year
      );
      if (existing) {
        return prev.map((p) =>
          p.studentId === studentId && p.month === month && p.year === year
            ? { ...p, paid: true, paidDate: today, amountPaid, paymentMethod, notes }
            : p
        );
      }
      return [
        ...prev,
        {
          id: uid(),
          studentId,
          month,
          year,
          paid: true,
          paidDate: today,
          amountPaid,
          paymentMethod,
          notes,
        },
      ];
    });
  };

  const unmarkPaid = (studentId: string, month: number, year: number) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.studentId === studentId && p.month === month && p.year === year
          ? { ...p, paid: false, paidDate: null, amountPaid: null }
          : p
      )
    );
  };

  return { payments, key, markPaid, unmarkPaid };
}
