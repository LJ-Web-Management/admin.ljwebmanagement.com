-- LJ Web Management admin dashboard - core schema.
-- Auth is handled entirely by Supabase Auth (auth.users); this file only
-- adds the app-specific tables, plus a "profiles" table that extends
-- auth.users with role + granular per-page/section permissions.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Profiles (role + permissions, keyed to auth.users)
-- ---------------------------------------------------------------------
create type public.user_role as enum ('admin', 'employee', 'demo');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'employee',
  -- { orders: ['view','edit',...], analytics: [...], messaging: [...], transcripts: [...], admin: [...] }
  permissions jsonb not null default '{}'::jsonb,
  can_change_own_password boolean not null default true,
  can_manage_other_passwords boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
create type public.order_phase as enum (
  'Consultation Booked',
  'Waiting Build',
  'In Progress',
  'Completed',
  'Sent',
  'Feedback Changes Awaiting',
  'Feedback Changes In Progress',
  'Feedback Changes Completed',
  'Finalized (Done)'
);

create sequence public.order_number_seq start 78653;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer not null unique default nextval('public.order_number_seq'),
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text not null default '',
  customer_address text not null default '',
  service_text text not null default '',
  phase public.order_phase not null default 'Consultation Booked',
  quoted_amount numeric(12, 2) not null default 0,
  consultation_date timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create table public.order_additional_costs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  label text not null default '',
  amount numeric(12, 2) not null default 0
);

create type public.tax_fee_type as enum ('flat', 'percent');

create table public.order_taxes_fees (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  label text not null default '',
  type public.tax_fee_type not null default 'percent',
  amount numeric(12, 2) not null default 0
);

-- Files live in the "files" Storage bucket at orders/{order_id}/{filename}.
create table public.order_documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references public.profiles (id)
);

-- Case-insensitive, whitespace-trimmed service grouping for autocomplete +
-- analytics, per the "LOWER(TRIM(service_text))" requirement.
create view public.service_suggestions as
select
  mode() within group (order by service_text) as service_text, -- most common original casing
  count(*) as count
from public.orders
where service_text <> ''
group by lower(trim(service_text))
order by count desc;

-- ---------------------------------------------------------------------
-- Past customers (search-and-autofill on new orders; name/address/contact only)
-- ---------------------------------------------------------------------
create table public.past_customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null default '',
  last_name text not null default '',
  address text not null default '',
  email text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

create index past_customers_name_idx on public.past_customers
  using gin (to_tsvector('simple', first_name || ' ' || last_name));

-- ---------------------------------------------------------------------
-- Messaging
-- ---------------------------------------------------------------------
create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  name text,
  last_message_preview text not null default '',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.thread_participants (
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (thread_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null,
  sent_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Chatbot transcripts (tawk.to -> Apps Script + Gemini -> ingest endpoint)
-- ---------------------------------------------------------------------
create type public.transcript_source as enum ('tawk.to', 'manual upload');

-- Files live in the "files" Storage bucket at transcripts/{transcript_id}/{filename}.
create table public.chat_transcripts (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null default '',
  customer_email text not null default '',
  received_at timestamptz not null default now(),
  file_name text not null,
  storage_path text not null,
  summary text not null default '',
  source public.transcript_source not null default 'manual upload',
  uploaded_by uuid references public.profiles (id)
);

-- Keep updated_at current on orders.
create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();
