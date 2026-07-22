import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
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
import { useStudents } from "@/modules/alunos/useStudents";
import { useProducts } from "./useProducts";
import { useOrders } from "./useOrders";
import { useAppSetting } from "./useAppSettings";
import { Product, Order, PRODUCT_CATEGORIES, PRODUCT_VIDEOS } from "@/shared/domain";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
const STATUS_LABEL: Record<Order["status"], string> = {
  aguardando: "Aguardando pagamento (50%)",
  confirmado: "Confirmado / em produção",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

/* ---------------- Controle de pedidos ---------------- */
function OrdersTab() {
  const { orders, loading, confirmDeposit, setOrderNumber, markRemainingPaid, markDelivered, cancelOrder } = useOrders();
  const { students } = useStudents();
  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? "—";

  const ativos = orders.filter((o) => o.status !== "cancelado");

  return (
    <div className="space-y-3">
      {loading && <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>}
      {!loading && ativos.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">Nenhum pedido ainda.</p>
      )}
      {ativos.map((o) => (
        <Card key={o.id}>
          <CardContent className="pt-5 pb-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{studentName(o.studentId)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString("pt-BR")} · {brl(o.total)}
                </p>
              </div>
              <Badge
                variant={o.status === "aguardando" ? "outline" : "default"}
                className={o.status === "aguardando" ? "text-amber-600 border-amber-300" : ""}
              >
                {STATUS_LABEL[o.status]}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              {(o.items ?? []).map((it) => (
                <span key={it.id} className="inline-block mr-3">
                  {it.quantity}× {it.productName} ({it.size})
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Entrada (50%)</span>
                <p className={o.depositPaid ? "text-green-600 font-medium" : "font-medium"}>
                  {brl(o.deposit)} {o.depositPaid ? "✓" : "· pendente"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Restante (50%)</span>
                <p className={o.remainingPaid ? "text-green-600 font-medium" : "font-medium"}>
                  {brl(o.remaining)} {o.remainingPaid ? "✓" : o.remainingDue ? `· vence ${new Date(o.remainingDue + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
                </p>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Nº do pedido (fabricante)</Label>
                <Input
                  defaultValue={o.orderNumber}
                  placeholder="ex: 1234"
                  className="h-8"
                  onBlur={(e) => {
                    if (e.target.value !== o.orderNumber) setOrderNumber(o.id, e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {!o.depositPaid && (
                <Button size="sm" className="gap-1" onClick={() => confirmDeposit(o.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar 50% pago
                </Button>
              )}
              {o.depositPaid && !o.remainingPaid && (
                <Button size="sm" variant="outline" onClick={() => markRemainingPaid(o.id)}>
                  Marcar restante pago
                </Button>
              )}
              {o.status === "confirmado" && (
                <Button size="sm" variant="outline" onClick={() => markDelivered(o.id)}>
                  Marcar entregue
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancelOrder(o.id)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Produtos ---------------- */
type PForm = Omit<Product, "id">;
const emptyProduct: PForm = {
  name: "",
  category: "Camiseta",
  price: 0,
  description: "",
  video: "",
  sizes: ["P", "M", "G", "GG"],
  active: true,
};

function ProductsTab() {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { value: pix, save: savePix } = useAppSetting("order_pix");
  const [pixInput, setPixInput] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PForm>(emptyProduct);
  const [sizesText, setSizesText] = useState("P, M, G, GG");

  const openNew = () => {
    setEditingId(null);
    setForm(emptyProduct);
    setSizesText("P, M, G, GG");
    setDialogOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditingId(p.id);
    const { id, ...rest } = p;
    void id;
    setForm(rest);
    setSizesText(p.sizes.join(", "));
    setDialogOpen(true);
  };
  const save = () => {
    if (!form.name.trim()) return;
    const sizes = sizesText.split(",").map((s) => s.trim()).filter(Boolean);
    const data = { ...form, sizes };
    if (editingId) updateProduct(editingId, data);
    else addProduct(data);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Config do PIX dos pedidos */}
      <Card>
        <CardHeader><CardTitle className="text-base">Pagamento dos pedidos (PIX)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label>Chave PIX (CPF, celular, e-mail ou aleatória)</Label>
          <Input
            value={pixInput ?? pix}
            onChange={(e) => setPixInput(e.target.value)}
            placeholder="ex: 01306074010 (CPF) — a mesma que você usa na InfinityPay"
          />
          <p className="text-xs text-muted-foreground">
            O sistema gera o QR com o <strong>valor exato de cada pedido</strong> a partir dessa chave.
            Não precisa emitir código no banco. (Se você já tiver um código "copia e cola" completo,
            também pode colar aqui.)
          </p>
          <Button size="sm" onClick={() => savePix((pixInput ?? pix).trim())} disabled={pixInput === null}>
            Salvar PIX
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo produto</Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {[...products].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((p) => (
          <Card key={p.id}>
            <CardContent className="pt-5 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category} · {brl(p.price)}</p>
                </div>
                {!p.active && <Badge variant="secondary">Inativo</Badge>}
              </div>
              {p.video && <p className="text-xs text-muted-foreground">🎥 vídeo anexado</p>}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(p)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => deleteProduct(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Tamanhos (separe por vírgula)</Label>
              <Input
                value={sizesText}
                onChange={(e) => setSizesText(e.target.value)}
                placeholder="P, M, G, GG"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vídeo</Label>
              <Select value={form.video || "none"} onValueChange={(v) => setForm({ ...form, video: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Sem vídeo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vídeo</SelectItem>
                  {PRODUCT_VIDEOS.map((v, i) => <SelectItem key={v} value={v}>Vídeo {i + 1}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Produto ativo (aparece pros alunos)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Pedidos() {
  const { orders } = useOrders();
  const pend = useMemo(() => orders.filter((o) => o.status === "aguardando").length, [orders]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" /> Pedidos
        </h1>
        <p className="text-sm text-muted-foreground">Produtos da loja e controle de encomendas</p>
      </div>

      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos {pend > 0 ? `(${pend})` : ""}</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>
        <TabsContent value="pedidos" className="mt-4"><OrdersTab /></TabsContent>
        <TabsContent value="produtos" className="mt-4"><ProductsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
