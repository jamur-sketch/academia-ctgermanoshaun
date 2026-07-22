import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { Order, OrderItem } from "@/shared/domain";

function orderFromRow(r: Record<string, unknown>): Order {
  return {
    id: r.id as string,
    studentId: (r.student_id as string) ?? "",
    status: (r.status as Order["status"]) ?? "aguardando",
    total: Number(r.total ?? 0),
    deposit: Number(r.deposit ?? 0),
    remaining: Number(r.remaining ?? 0),
    depositPaid: Boolean(r.deposit_paid),
    remainingPaid: Boolean(r.remaining_paid),
    remainingDue: (r.remaining_due as string) ?? null,
    orderNumber: (r.order_number as string) ?? "",
    notes: (r.notes as string) ?? "",
    createdAt: (r.created_at as string) ?? "",
  };
}

function itemFromRow(r: Record<string, unknown>): OrderItem {
  return {
    id: r.id as string,
    orderId: r.order_id as string,
    productId: (r.product_id as string) ?? "",
    productName: (r.product_name as string) ?? "",
    size: (r.size as string) ?? "",
    quantity: Number(r.quantity ?? 1),
    unitPrice: Number(r.unit_price ?? 0),
  };
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [ordRes, itemRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("order_items").select("*"),
    ]);
    if (ordRes.error) console.error("[orders] load:", ordRes.error.message);
    const items = (itemRes.data ?? []).map((r) => itemFromRow(r as Record<string, unknown>));
    const byOrder = new Map<string, OrderItem[]>();
    items.forEach((it) => {
      const arr = byOrder.get(it.orderId) ?? [];
      arr.push(it);
      byOrder.set(it.orderId, arr);
    });
    setOrders(
      (ordRes.data ?? []).map((r) => {
        const o = orderFromRow(r as Record<string, unknown>);
        o.items = byOrder.get(o.id) ?? [];
        return o;
      })
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: string, data: Record<string, unknown>) => {
    const { error } = await supabase.from("orders").update(data).eq("id", id);
    if (error) console.error("[orders] update:", error.message);
    load();
  };

  const confirmDeposit = (id: string) => {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    return patch(id, {
      deposit_paid: true,
      status: "confirmado",
      remaining_due: due.toISOString().slice(0, 10),
    });
  };
  const setOrderNumber = (id: string, orderNumber: string) => patch(id, { order_number: orderNumber });
  const markRemainingPaid = (id: string) => patch(id, { remaining_paid: true });
  const markDelivered = (id: string) => patch(id, { status: "entregue" });
  const cancelOrder = (id: string) => patch(id, { status: "cancelado" });

  return { orders, loading, reload: load, confirmDeposit, setOrderNumber, markRemainingPaid, markDelivered, cancelOrder };
}
