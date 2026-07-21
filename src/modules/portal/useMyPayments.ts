import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";

export interface MyPayment {
  id: string;
  month: number;
  year: number;
  paid: boolean;
  paidDate: string | null;
  amountPaid: number | null;
}

export function useMyPayments(studentId: string | undefined) {
  const [payments, setPayments] = useState<MyPayment[]>([]);
  const [monthlyFee, setMonthlyFee] = useState<number>(100);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    const [payRes, cfgRes] = await Promise.all([
      supabase.from("monthly_payments").select("*").eq("student_id", studentId),
      supabase.from("payment_configs").select("*").eq("student_id", studentId).limit(1),
    ]);
    if (payRes.error) console.error("[myPayments] load:", payRes.error.message);
    setPayments(
      (payRes.data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        month: Number(r.month),
        year: Number(r.year),
        paid: Boolean(r.paid),
        paidDate: (r.paid_date as string) ?? null,
        amountPaid: r.amount_paid != null ? Number(r.amount_paid) : null,
      }))
    );
    if (cfgRes.data && cfgRes.data[0]) setMonthlyFee(Number(cfgRes.data[0].monthly_fee));
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  return { payments, monthlyFee, loading };
}
