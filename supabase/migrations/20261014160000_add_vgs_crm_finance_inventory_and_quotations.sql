create table if not exists public.crm_expenses (
 id uuid primary key default gen_random_uuid(),
 expense_date date not null default current_date,
 category text not null default 'General',
 vendor_name text,
 description text not null,
 amount numeric(12,2) not null check (amount >= 0),
 payment_method text,
 receipt_path text,
 entered_via text not null default 'manual' check (entered_via in ('manual','voice','photo')),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.crm_spare_parts (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 sku text,
 category text,
 supplier_name text,
 quantity numeric(12,2) not null default 0 check (quantity >= 0),
 unit text not null default 'pcs',
 purchase_cost numeric(12,2) not null default 0 check (purchase_cost >= 0),
 selling_price numeric(12,2) not null default 0 check (selling_price >= 0),
 low_stock_threshold numeric(12,2) not null default 2,
 supplier_bill_path text,
 notes text,
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create table if not exists public.crm_salary_records (
 id uuid primary key default gen_random_uuid(),
 technician_user_id uuid references auth.users(id),
 technician_name text not null,
 month date not null,
 base_salary numeric(12,2) not null default 0 check (base_salary >= 0),
 incentives numeric(12,2) not null default 0,
 deductions numeric(12,2) not null default 0,
 advances numeric(12,2) not null default 0,
 paid_amount numeric(12,2) not null default 0,
 status text not null default 'pending' check (status in ('pending','partially_paid','paid')),
 notes text,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 unique (technician_user_id, month)
);
create table if not exists public.crm_quotations (
 id uuid primary key default gen_random_uuid(),
 quotation_number text not null unique,
 customer_id uuid references public.customers(id) on delete set null,
 customer_name text not null,
 customer_phone text,
 customer_address text,
 issue_date date not null default current_date,
 valid_until date,
 status text not null default 'draft' check (status in ('draft','sent','approved','rejected','converted','expired')),
 subtotal numeric(12,2) not null default 0,
 tax_rate numeric(5,2) not null default 18,
 tax_amount numeric(12,2) not null default 0,
 total_amount numeric(12,2) not null default 0,
 notes text,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.crm_quotation_items (
 id uuid primary key default gen_random_uuid(),
 quotation_id uuid not null references public.crm_quotations(id) on delete cascade,
 description text not null,
 quantity numeric(12,2) not null default 1 check (quantity > 0),
 unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
 line_total numeric(12,2) generated always as (quantity * unit_price) stored
);
alter table public.crm_expenses enable row level security;
alter table public.crm_spare_parts enable row level security;
alter table public.crm_salary_records enable row level security;
alter table public.crm_quotations enable row level security;
alter table public.crm_quotation_items enable row level security;
do $$
declare t text;
begin
 foreach t in array array['crm_expenses','crm_spare_parts','crm_salary_records','crm_quotations','crm_quotation_items'] loop
  execute format('drop policy if exists vgs_admin_all on public.%I', t);
  execute format('create policy vgs_admin_all on public.%I for all to authenticated using (lower(coalesce(auth.jwt() ->> ''email'','''')) = ''vashishthglobalsolutions@gmail.com'') with check (lower(coalesce(auth.jwt() ->> ''email'','''')) = ''vashishthglobalsolutions@gmail.com'')', t);
 end loop;
end $$;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vgs-crm-documents','vgs-crm-documents',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;
drop policy if exists vgs_crm_documents_admin_select on storage.objects;
create policy vgs_crm_documents_admin_select on storage.objects for select to authenticated using (bucket_id='vgs-crm-documents' and lower(coalesce(auth.jwt()->>'email',''))='vashishthglobalsolutions@gmail.com');
drop policy if exists vgs_crm_documents_admin_insert on storage.objects;
create policy vgs_crm_documents_admin_insert on storage.objects for insert to authenticated with check (bucket_id='vgs-crm-documents' and lower(coalesce(auth.jwt()->>'email',''))='vashishthglobalsolutions@gmail.com');
drop policy if exists vgs_crm_documents_admin_update on storage.objects;
create policy vgs_crm_documents_admin_update on storage.objects for update to authenticated using (bucket_id='vgs-crm-documents' and lower(coalesce(auth.jwt()->>'email',''))='vashishthglobalsolutions@gmail.com') with check (bucket_id='vgs-crm-documents' and lower(coalesce(auth.jwt()->>'email',''))='vashishthglobalsolutions@gmail.com');