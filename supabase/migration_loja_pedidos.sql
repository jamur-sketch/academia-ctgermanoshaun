-- ============================================================
-- CT Germano Schaun — Loja de produtos e pedidos
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
-- ============================================================

-- Produtos (gerenciados pela equipe)
create table if not exists products (
  id text primary key,
  name text not null,
  category text not null default 'Camiseta',
  price numeric(10,2) not null default 0,
  description text default '',
  video text default '',
  sizes text[] not null default '{P,M,G,GG}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Pedidos
create table if not exists orders (
  id text primary key,
  student_id text references students(id) on delete set null,
  status text not null default 'aguardando',      -- aguardando | confirmado | entregue | cancelado
  total numeric(10,2) not null default 0,
  deposit numeric(10,2) not null default 0,        -- 50% pago no ato
  remaining numeric(10,2) not null default 0,      -- 50% restante (em 30 dias)
  deposit_paid boolean not null default false,     -- equipe confirma o 50%
  remaining_paid boolean not null default false,
  remaining_due date,
  order_number text default '',                    -- Nº do pedido do fabricante
  notes text default '',
  created_at timestamptz not null default now()
);

-- Itens do pedido
create table if not exists order_items (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  product_id text,
  product_name text default '',
  size text default '',
  quantity integer not null default 1,
  unit_price numeric(10,2) not null default 0
);

alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- products: equipe gerencia; qualquer logado lê o catálogo
drop policy if exists "staff_all" on products;
drop policy if exists "read_all_auth" on products;
create policy "staff_all" on products for all using (public.is_staff()) with check (public.is_staff());
create policy "read_all_auth" on products for select using (auth.role() = 'authenticated');

-- orders: equipe total; aluno cria e vê os próprios
drop policy if exists "staff_all" on orders;
drop policy if exists "aluno_insert_own" on orders;
drop policy if exists "aluno_select_own" on orders;
create policy "staff_all" on orders for all using (public.is_staff()) with check (public.is_staff());
create policy "aluno_insert_own" on orders for insert with check (student_id in (select public.my_student_ids()));
create policy "aluno_select_own" on orders for select using (student_id in (select public.my_student_ids()));

-- order_items: equipe total; aluno insere/vê itens dos próprios pedidos
drop policy if exists "staff_all" on order_items;
drop policy if exists "aluno_insert_own" on order_items;
drop policy if exists "aluno_select_own" on order_items;
create policy "staff_all" on order_items for all using (public.is_staff()) with check (public.is_staff());
create policy "aluno_insert_own" on order_items for insert
  with check (order_id in (select id from public.orders where student_id in (select public.my_student_ids())));
create policy "aluno_select_own" on order_items for select
  using (order_id in (select id from public.orders where student_id in (select public.my_student_ids())));

-- Produtos iniciais (a equipe ajusta preços/descrição/vídeo depois)
insert into products (id, name, category, price, sizes) values
  ('prod-camiseta', 'Camiseta', 'Camiseta', 0, '{P,M,G,GG}'),
  ('prod-short',    'Short',    'Short',    0, '{P,M,G,GG}'),
  ('prod-top',      'Top',      'Top',      0, '{P,M,G,GG}'),
  ('prod-conjunto', 'Conjunto', 'Conjunto', 0, '{P,M,G,GG}')
on conflict (id) do nothing;

-- Configurações compartilhadas (ex: código PIX para pedidos)
create table if not exists app_settings (
  key text primary key,
  value text default ''
);
alter table app_settings enable row level security;
drop policy if exists "staff_all" on app_settings;
drop policy if exists "read_all_auth" on app_settings;
create policy "staff_all" on app_settings for all using (public.is_staff()) with check (public.is_staff());
create policy "read_all_auth" on app_settings for select using (auth.role() = 'authenticated');
