-- VGS Technician App business-ready foundation
-- Apply via Supabase SQL Editor only if the same migration has not already been applied.
create extension if not exists pgcrypto;

create table if not exists public.technician_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  technician_code text not null unique,
  full_name text not null,
  phone text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null, phone text not null, email text, address text not null, area text, notes text,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.service_jobs (
  id uuid primary key default gen_random_uuid(), job_number text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  technician_user_id uuid references public.technician_profiles(user_id) on delete set null,
  service_name text not null, problem_description text, scheduled_at timestamptz,
  status text not null default 'assigned' check (status in ('assigned','accepted','on_the_way','in_progress','completed','cancelled')),
  estimated_amount numeric(12,2) not null default 0 check (estimated_amount >= 0),
  final_amount numeric(12,2) check (final_amount is null or final_amount >= 0),
  diagnosis text, parts_used text, completion_notes text, completed_at timestamptz,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(), invoice_number text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict, job_id uuid references public.service_jobs(id) on delete set null,
  issue_date date not null default current_date, due_date date,
  status text not null default 'draft' check (status in ('draft','issued','partially_paid','paid','void')),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0), tax_rate numeric(5,2) not null default 18 check (tax_rate >= 0 and tax_rate <= 100),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0), total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0), notes text,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null, quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) generated always as (round(quantity * unit_price, 2)) stored, created_at timestamptz not null default now()
);
create table if not exists public.job_updates (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.service_jobs(id) on delete cascade,
  technician_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null check (status in ('accepted','on_the_way','in_progress','completed')), note text, created_at timestamptz not null default now()
);
alter table public.technician_location_punches add column if not exists technician_user_id uuid references auth.users(id) on delete set null;
alter table public.technician_location_punches add column if not exists punch_type text not null default 'check_in';
alter table public.technician_location_punches drop constraint if exists technician_location_punches_punch_type_check;
alter table public.technician_location_punches add constraint technician_location_punches_punch_type_check check (punch_type in ('check_in','check_out'));

create index if not exists service_jobs_technician_schedule_idx on public.service_jobs (technician_user_id, scheduled_at desc);
create index if not exists service_jobs_status_schedule_idx on public.service_jobs (status, scheduled_at desc);
create index if not exists customers_phone_idx on public.customers (phone);
create index if not exists invoices_customer_date_idx on public.invoices (customer_id, issue_date desc);
create index if not exists invoice_items_invoice_idx on public.invoice_items (invoice_id);
create index if not exists location_punches_user_time_idx on public.technician_location_punches (technician_user_id, punched_at desc);

create or replace function public.vgs_is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select lower(coalesce(auth.jwt() ->> 'email', '')) = 'vashishthglobalsolutions@gmail.com';
$$;
create or replace function public.vgs_touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists technician_profiles_touch_updated_at on public.technician_profiles;
create trigger technician_profiles_touch_updated_at before update on public.technician_profiles for each row execute function public.vgs_touch_updated_at();
drop trigger if exists customers_touch_updated_at on public.customers;
create trigger customers_touch_updated_at before update on public.customers for each row execute function public.vgs_touch_updated_at();
drop trigger if exists service_jobs_touch_updated_at on public.service_jobs;
create trigger service_jobs_touch_updated_at before update on public.service_jobs for each row execute function public.vgs_touch_updated_at();
drop trigger if exists invoices_touch_updated_at on public.invoices;
create trigger invoices_touch_updated_at before update on public.invoices for each row execute function public.vgs_touch_updated_at();

alter table public.technician_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.service_jobs enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.job_updates enable row level security;
alter table public.technician_location_punches enable row level security;

do $$ declare p record; begin
 for p in select policyname from pg_policies where schemaname='public' and tablename='technician_location_punches'
 loop execute format('drop policy if exists %I on public.technician_location_punches', p.policyname); end loop;
end $$;

drop policy if exists "VGS admin manages technician profiles" on public.technician_profiles;
create policy "VGS admin manages technician profiles" on public.technician_profiles for all to authenticated using (public.vgs_is_admin()) with check (public.vgs_is_admin());
drop policy if exists "Technicians can read own profile" on public.technician_profiles;
create policy "Technicians can read own profile" on public.technician_profiles for select to authenticated using (user_id = auth.uid() and active = true);
drop policy if exists "VGS admin manages customers" on public.customers;
create policy "VGS admin manages customers" on public.customers for all to authenticated using (public.vgs_is_admin()) with check (public.vgs_is_admin());
drop policy if exists "Technicians read assigned customers" on public.customers;
create policy "Technicians read assigned customers" on public.customers for select to authenticated using (exists (select 1 from public.service_jobs j where j.customer_id = customers.id and j.technician_user_id = auth.uid()));
drop policy if exists "VGS admin manages all jobs" on public.service_jobs;
create policy "VGS admin manages all jobs" on public.service_jobs for all to authenticated using (public.vgs_is_admin()) with check (public.vgs_is_admin());
drop policy if exists "Technicians read assigned jobs" on public.service_jobs;
create policy "Technicians read assigned jobs" on public.service_jobs for select to authenticated using (technician_user_id = auth.uid() and exists (select 1 from public.technician_profiles tp where tp.user_id = auth.uid() and tp.active));
drop policy if exists "Technicians update assigned jobs" on public.service_jobs;
create policy "Technicians update assigned jobs" on public.service_jobs for update to authenticated using (technician_user_id = auth.uid() and exists (select 1 from public.technician_profiles tp where tp.user_id = auth.uid() and tp.active)) with check (technician_user_id = auth.uid() and exists (select 1 from public.technician_profiles tp where tp.user_id = auth.uid() and tp.active));
drop policy if exists "VGS admin manages invoices" on public.invoices;
create policy "VGS admin manages invoices" on public.invoices for all to authenticated using (public.vgs_is_admin()) with check (public.vgs_is_admin());
drop policy if exists "VGS admin manages invoice items" on public.invoice_items;
create policy "VGS admin manages invoice items" on public.invoice_items for all to authenticated using (public.vgs_is_admin()) with check (public.vgs_is_admin());
drop policy if exists "VGS admin reads job updates" on public.job_updates;
create policy "VGS admin reads job updates" on public.job_updates for select to authenticated using (public.vgs_is_admin());
drop policy if exists "Technicians read own job updates" on public.job_updates;
create policy "Technicians read own job updates" on public.job_updates for select to authenticated using (technician_user_id = auth.uid());
drop policy if exists "Technicians log own job updates" on public.job_updates;
create policy "Technicians log own job updates" on public.job_updates for insert to authenticated with check (technician_user_id = auth.uid() and exists (select 1 from public.service_jobs j where j.id = job_id and j.technician_user_id = auth.uid()));
drop policy if exists "VGS admin reads all location punches" on public.technician_location_punches;
create policy "VGS admin reads all location punches" on public.technician_location_punches for select to authenticated using (public.vgs_is_admin());
drop policy if exists "Technicians insert own location punches" on public.technician_location_punches;
create policy "Technicians insert own location punches" on public.technician_location_punches for insert to authenticated with check (technician_user_id = auth.uid() and latitude between -90 and 90 and longitude between -180 and 180 and punch_type in ('check_in','check_out') and exists (select 1 from public.technician_profiles tp where tp.user_id = auth.uid() and tp.active));

revoke all on public.technician_profiles, public.customers, public.service_jobs, public.invoices, public.invoice_items, public.job_updates, public.technician_location_punches from anon;
grant select, insert, update, delete on public.technician_profiles, public.customers, public.service_jobs, public.invoices, public.invoice_items, public.job_updates, public.technician_location_punches to authenticated;
grant execute on function public.vgs_is_admin() to authenticated;
