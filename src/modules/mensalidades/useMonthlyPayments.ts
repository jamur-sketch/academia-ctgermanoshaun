import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";

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
  const [configs, setConfigs] = useState<Record<string, PaymentConfig>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("payment_configs").select("*");
    if (error) {
      console.error("[payment_configs] load:", error.message);
      setLoading(false);
      return;
    }
    const map: Record<string, PaymentConfig> = {};
    (data ?? []).forEach((r: Record<string, unknown>) => {
      map[r.student_id as string] = {
        monthlyFee: Number(r.monthly_fee ?? DEFAULT_FEE),
        paymentMethod: (r.payment_method as string) ?? "Pix",
        notes: (r.notes as string) ?? "",
      };
    });
    setConfigs(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getConfig = (studentId: string): PaymentConfig =>
    configs[studentId] ?? { monthlyFee: DEFAULT_FEE, paymentMethod: "Pix", notes: "" };

  const setConfig = async (studentId: string, data: Partial<PaymentConfig>) => {
    const merged = { ...getConfig(studentId), ...data };
    setConfigs((prev) => ({ ...prev, [studentId]: merged }));
    const { error } = await supabase.from("payment_configs").upsert(
      {
        student_id: studentId,
        monthly_fee: merged.monthlyFee,
        payment_method: merged.paymentMethod,
        notes: merged.notes,
      },
      { onConflict: "student_id" }
    );
    if (error) {
      console.error("[payment_configs] upsert:", error.message);
      load();
    }
  };

  return { configs, loading, getConfig, setConfig };
}

export function useMonthlyPayments() {
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("monthly_payments").select("*");
    if (error) {
      console.error("[monthly_payments] load:", error.message);
      setLoading(false);
      return;
    }
    setPayments(
      (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        studentId: r.student_id as string,
        month: Number(r.month),
        year: Number(r.year),
        paid: Boolean(r.paid),
        paidDate: (r.paid_date as string) ?? null,
        amountPaid: r.amount_paid != null ? Number(r.amount_paid) : null,
        paymentMethod: (r.payment_method as string) ?? "Pix",
        notes: (r.notes as string) ?? "",
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const key = (studentId: string, month: number, year: number) =>
    payments.find((p) => p.studentId === studentId && p.month === month && p.year === year);

  const markPaid = async (
    studentId: string,
    month: number,
    year: number,
    amountPaid: number,
    paymentMethod: string,
    notes: string
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const existing = payments.find(
      (p) => p.studentId === studentId && p.month === month && p.year === year
    );
    const id = existing?.id ?? `mp-${studentId}-${year}-${month}`;

    const record: MonthlyPayment = {
      id,
      studentId,
      month,
      year,
      paid: true,
      paidDate: today,
      amountPaid,
      paymentMethod,
      notes,
    };

    setPayments((prev) => {
      if (existing) return prev.map((p) => (p.id === id ? record : p));
      return [...prev, record];
    });

    const { error } = await supabase.from("monthly_payments").upsert(
      {
        id,
        student_id: studentId,
        month,
        year,
        paid: true,
        paid_date: today,
        amount_paid: amountPaid,
        payment_method: paymentMethod,
        notes,
      },
      { onConflict: "student_id,month,year" }
    );
    if (error) {
      console.error("[monthly_payments] upsert:", error.message);
      load();
    }
  };

  const unmarkPaid = async (studentId: string, month: number, year: number) => {
    const existing = payments.find(
      (p) => p.studentId === studentId && p.month === month && p.year === year
    );
    setPayments((prev) =>
      prev.map((p) =>
        p.studentId === studentId && p.month === month && p.year === year
          ? { ...p, paid: false, paidDate: null, amountPaid: null }
          : p
      )
    );
    if (!existing) return;
    const { error } = await supabase
      .from("monthly_payments")
      .update({ paid: false, paid_date: null, amount_paid: null })
      .eq("id", existing.id);
    if (error) {
      console.error("[monthly_payments] unmark:", error.message);
      load();
    }
  };

  return { payments, loading, key, markPaid, unmarkPaid };
}
