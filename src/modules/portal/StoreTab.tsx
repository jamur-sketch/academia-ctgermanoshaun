import { useState } from "react";
import { ShoppingBag, Copy, Check } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select";
import { QRCodePix } from "@/shared/components/QRCodePix";
import { pixForAmount } from "@/shared/lib/pix";
import { Product, Order } from "@/shared/domain";
import { usePortalStore } from "./usePortalStore";
import { useAppSetting } from "@/modules/pedidos/useAppSettings";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function StoreTab({ studentId }: { studentId: string }) {
  const { products, orders, loading, createOrder } = usePortalStore(studentId);
  const { value: pixKey } = useAppSetting("order_pix");

  const [pedir, setPedir] = useState<Product | null>(null);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);

  const [pay, setPay] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  const openPedir = (p: Product) => {
    setPedir(p);
    setSize(p.sizes[0] ?? "");
    setQty(1);
  };

  const confirmPedido = async () => {
    if (!pedir) return;
    setSaving(true);
    await createOrder([{ product: pedir, size, quantity: qty }]);
    setSaving(false);
    setPedir(null);
  };

  // valor a pagar no dialog: entrada (50%) se ainda não pagou, senão o restante
  const payAmount = pay ? (!pay.depositPaid ? pay.deposit : pay.remaining) : 0;
  const payLabel = pay && !pay.depositPaid ? "entrada (50%)" : "restante (50%)";
  const pixCode = pixForAmount(pixKey, payAmount); // código gerado com o valor exato

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      {/* Aviso */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
        O pedido só é confirmado após o pagamento de <strong>50% de entrada</strong>. O restante (50%)
        vence em <strong>30 dias</strong>. Sem o pagamento da entrada, o pedido não é realizado.
      </div>

      {/* Catálogo */}
      <div className="grid sm:grid-cols-2 gap-3">
        {products.map((p) => (
          <Card key={p.id}>
            <CardContent className="pt-4 pb-4 space-y-2">
              {p.video && (
                <video src={p.video} controls playsInline className="w-full rounded-lg bg-black max-h-64" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
                <p className="font-bold">{brl(p.price)}</p>
              </div>
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              <Button className="w-full" onClick={() => openPedir(p)} disabled={p.price <= 0}>
                {p.price > 0 ? "Pedir" : "Em breve"}
              </Button>
            </CardContent>
          </Card>
        ))}
        {!loading && products.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">
            Nenhum produto disponível no momento.
          </p>
        )}
      </div>

      {/* Meus pedidos */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Meus pedidos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {orders.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Você ainda não fez pedidos.</p>
          )}
          {orders.filter((o) => o.status !== "cancelado").map((o) => (
            <div key={o.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  {(o.items ?? []).map((it) => (
                    <span key={it.id} className="block font-medium">{it.quantity}× {it.productName} ({it.size})</span>
                  ))}
                  <span className="text-xs text-muted-foreground">{brl(o.total)}</span>
                </div>
                {o.status === "entregue" ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Entregue</Badge>
                ) : !o.depositPaid ? (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">Aguardando entrada</Badge>
                ) : o.remainingPaid ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Pago</Badge>
                ) : (
                  <Badge>Em produção</Badge>
                )}
              </div>
              {!o.depositPaid && (
                <Button size="sm" className="w-full" onClick={() => setPay(o)}>Pagar entrada — {brl(o.deposit)}</Button>
              )}
              {o.depositPaid && !o.remainingPaid && (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Restante {brl(o.remaining)}{o.remainingDue ? ` · vence ${new Date(o.remainingDue + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setPay(o)}>Pagar restante</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialog: fazer pedido */}
      <Dialog open={!!pedir} onOpenChange={(o) => !o && setPedir(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Pedir — {pedir?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tamanho</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(pedir?.sizes ?? []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
              </div>
            </div>
            {pedir && (
              <div className="text-sm rounded-lg bg-muted p-3 space-y-1">
                <div className="flex justify-between"><span>Total</span><span className="font-medium">{brl(pedir.price * qty)}</span></div>
                <div className="flex justify-between text-amber-700"><span>Entrada agora (50%)</span><span className="font-medium">{brl((pedir.price * qty) / 2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Restante (30 dias)</span><span>{brl((pedir.price * qty) / 2)}</span></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPedir(null)}>Cancelar</Button>
            <Button onClick={confirmPedido} disabled={saving || !size}>
              {saving ? "Enviando..." : "Confirmar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: pagar (QR) */}
      <Dialog open={!!pay} onOpenChange={(o) => !o && setPay(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Pagar {payLabel}</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-2xl font-bold">{brl(payAmount)}</p>
            <QRCodePix value={pixCode} size={200} />
            {pixCode && (
              <Button variant="outline" size="sm" className="gap-1" onClick={copyPix}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado!" : "Copiar código PIX"}
              </Button>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Após pagar, envie o comprovante para o <strong>Jamur (Responsável Financeiro)</strong>.
              O pedido é confirmado quando a equipe registrar o pagamento.
            </p>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setPay(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
