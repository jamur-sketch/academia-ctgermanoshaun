import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { useOrders } from "@/modules/pedidos/useOrders";
import { useStudents } from "@/modules/alunos/useStudents";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// 2ª parcela dos pedidos (50% restante) que a academia ainda vai receber.
export function PedidosAReceber() {
  const { orders } = useOrders();
  const { students } = useStudents();
  const abertos = orders.filter((o) => o.depositPaid && !o.remainingPaid && o.status !== "cancelado");

  if (abertos.length === 0) return null;
  const name = (id: string) => students.find((s) => s.id === id)?.name ?? "—";
  const total = abertos.reduce((s, o) => s + o.remaining, 0);

  return (
    <Card className="border-amber-300">
      <CardHeader>
        <CardTitle className="text-base">Pedidos a receber — 2ª parcela ({brl(total)})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {abertos.map((o) => (
          <div key={o.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
            <div className="min-w-0">
              <span className="font-medium">{name(o.studentId)}</span>
              <p className="text-xs text-muted-foreground truncate">
                {(o.items ?? []).map((it) => it.productName).join(", ")}
                {o.remainingDue ? ` · vence ${new Date(o.remainingDue + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
              </p>
            </div>
            <span className="font-bold text-amber-700 shrink-0">{brl(o.remaining)}</span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Para dar baixa, vá em <strong>Pedidos</strong> e marque "restante pago".
        </p>
      </CardContent>
    </Card>
  );
}
