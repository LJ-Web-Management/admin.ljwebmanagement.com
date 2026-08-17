-- Row Level Security. Access model:
--   admin    - full access to everything
--   employee - gated per-page/section by profiles.permissions
--   demo     - NOT granted any policy on real data tables below.
--
-- Per spec, demo role must never see real customer, order, or financial
-- data, not even aggregated. Rather than build parallel "sanitized" SQL
-- views (a real risk of leaking real data through side channels like
-- row counts or timing), the app/API layer detects role = 'demo' and
-- serves the same static placeholder dataset the frontend already ships
-- for mock mode, without querying these tables at all. RLS denying demo
-- by default here is defense in depth, not the primary control.

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_additional_costs enable row level security;
alter table public.order_taxes_fees enable row level security;
alter table public.past_customers enable row level security;
alter table public.message_threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.messages enable row level security;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create function public.current_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.current_role() = 'admin';
$$;

-- True for admins unconditionally, or for employees who were granted
-- `section` under `page` in profiles.permissions.
create function public.has_section(page text, section text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'employee'
        and permissions -> page ? section
    );
$$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "read own profile" on public.profiles
  for select using (id = auth.uid());

create policy "admins read all profiles" on public.profiles
  for select using (public.is_admin());

create policy "admins manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- orders + children
-- ---------------------------------------------------------------------
create policy "view orders" on public.orders
  for select using (public.has_section('orders', 'view'));

create policy "create orders" on public.orders
  for insert with check (public.has_section('orders', 'create'));

create policy "edit orders" on public.orders
  for update using (public.has_section('orders', 'edit'))
  with check (public.has_section('orders', 'edit'));

create policy "admins delete orders" on public.orders
  for delete using (public.is_admin());

create policy "view order costs" on public.order_additional_costs
  for select using (public.has_section('orders', 'view'));
create policy "edit order costs" on public.order_additional_costs
  for all using (public.has_section('orders', 'edit'))
  with check (public.has_section('orders', 'edit'));

create policy "view order taxes" on public.order_taxes_fees
  for select using (public.has_section('orders', 'view'));
create policy "edit order taxes" on public.order_taxes_fees
  for all using (public.has_section('orders', 'edit'))
  with check (public.has_section('orders', 'edit'));

-- ---------------------------------------------------------------------
-- past_customers (name/address/contact only, no order or financial data)
-- ---------------------------------------------------------------------
create policy "read past customers" on public.past_customers
  for select using (public.has_section('orders', 'create'));

create policy "import past customers" on public.past_customers
  for insert with check (public.has_section('orders', 'create'));

-- ---------------------------------------------------------------------
-- messaging
-- ---------------------------------------------------------------------
create policy "view own threads" on public.message_threads
  for select using (
    exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = id and tp.user_id = auth.uid()
    )
  );

create policy "create direct threads" on public.message_threads
  for insert with check (
    (is_group = false and public.has_section('messaging', 'direct'))
    or (is_group = true and public.has_section('messaging', 'groups'))
  );

create policy "view own thread participants" on public.thread_participants
  for select using (
    exists (
      select 1 from public.thread_participants self
      where self.thread_id = thread_id and self.user_id = auth.uid()
    )
  );

create policy "join threads on creation" on public.thread_participants
  for insert with check (true); -- membership is set once at thread creation time

create policy "view messages in own threads" on public.messages
  for select using (
    exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = messages.thread_id and tp.user_id = auth.uid()
    )
  );

create policy "send messages in own threads" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = messages.thread_id and tp.user_id = auth.uid()
    )
  );
