import { Product, uid } from "@/shared/domain";
import { useSupabaseTable } from "@/shared/hooks/useSupabaseTable";

function fromRow(r: Record<string, unknown>): Product {
  return {
    id: r.id as string,
    name: (r.name as string) ?? "",
    category: (r.category as string) ?? "Camiseta",
    price: r.price != null ? Number(r.price) : 0,
    description: (r.description as string) ?? "",
    video: (r.video as string) ?? "",
    sizes: (r.sizes as string[]) ?? [],
    active: Boolean(r.active),
  };
}

function toRow(p: Partial<Product>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (p.id !== undefined) r.id = p.id;
  if (p.name !== undefined) r.name = p.name;
  if (p.category !== undefined) r.category = p.category;
  if (p.price !== undefined) r.price = p.price;
  if (p.description !== undefined) r.description = p.description;
  if (p.video !== undefined) r.video = p.video;
  if (p.sizes !== undefined) r.sizes = p.sizes;
  if (p.active !== undefined) r.active = p.active;
  return r;
}

export function useProducts() {
  const { items, loading, add, update, remove } = useSupabaseTable<Product>("products", fromRow, toRow);
  const addProduct = (data: Omit<Product, "id">) => add({ ...data, id: uid() });
  const updateProduct = (id: string, data: Partial<Product>) => update(id, data);
  const deleteProduct = (id: string) => remove(id);
  return { products: items, loading, addProduct, updateProduct, deleteProduct };
}
