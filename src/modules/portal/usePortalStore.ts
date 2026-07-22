import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { Product, Order, OrderItem, uid } from "@/shared/domain";

interface CartLine {
  product: Product;
  size: string;
  quantity: number;
}

function productFromRow(r: Record<string, unknown>): Product {
  return {
    id: r.id as string,
    name: (r.name as string) ?? "",
    category: (r.category as string) ?? "",
    price: Number(r.price ?? 0),
    description: (r.description as string) ?? "",
    video: (r.video as string) ?? "",
    sizes: (r.sizes as string[]) ?? [],
    active: Boolean(r.active),
  };
}

export function usePortalStore(studentId: string | undefined) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [prodRes, ordRes, itemRes] = await Promise.all([
      supabase.from("products").select("*").eq("active", true),
      studentId
        ? supabase.from("orders").select("*").eq("student_id", studentId).order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null } as { data: unknown[]; error: null }),
      studentId
        ? supabase.from("order_items").select("*")
        : Promise.resolve({ data: [], error: null } as { data: unknown[]; error: null }),
    ]);
    setProducts((prodRes.data ?? []).map((r) => productFromRow(r as Record<string, unknown>)));

    const items: OrderItem[] = ((itemRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      orderId: r.order_id as string,
      productId: (r.product_id as string) ?? "",
      productName: (r.product_name as string) ?? "",
      size: (r.size as string) ?? "",
      quantity: Number(r.quantity ?? 1),
      unitPrice: Number(r.unit_price ?? 0),
    }));
    setOrders(
      ((ordRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
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
        items: items.filter((it) => it.orderId === (r.id as string)),
      }))
    );
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const createOrder = async (lines: CartLine[]) => {
    if (!studentId || lines.length === 0) return;
    const total = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);
    const deposit = Math.round(total * 50) / 100; // 50%
    const orderId = `ped-${uid()}`;
    const { error: oErr } = await supabase.from("orders").insert({
      id: orderId,
      student_id: studentId,
      status: "aguardando",
      total,
      deposit,
      remaining: total - deposit,
    });
    if (oErr) {
      console.error("[store] create order:", oErr.message);
      return;
    }
    const itemsPayload = lines.map((l) => ({
      id: uid(),
      order_id: orderId,
      product_id: l.product.id,
      product_name: l.product.name,
      size: l.size,
      quantity: l.quantity,
      unit_price: l.product.price,
    }));
    const { error: iErr } = await supabase.from("order_items").insert(itemsPayload);
    if (iErr) console.error("[store] create items:", iErr.message);
    await load();
    return orderId;
  };

  return { products, orders, loading, createOrder, reload: load };
}

export type { CartLine };
