-- Initial multi-tenant SaaS and public booking foundation for VGS AI Business OS.
create extension if not exists pgcrypto;

create table if not exists public.business_tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'active' check (status in ('active','trial','suspended')),
  plan_code text not null default 'free',
  support_email text,
  phone text,
  brand_primary text not null default '#102c46',
  brand_accent text not null default '#087e8b',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.tenant_memberships (
  tenant_id uuid not null references public.business_tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','dispatcher','finance','technician','support')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create table if not exists public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.business_tenants(id) on delete cascade,
  slug text not null,
  name text not null,
  category text not null,
  short_description text,
  base_price numeric(12,2) not null default 0 check (base_price >= 0),
  duration_minutes integer not null default 60 check (duration_minutes between 5 and 1440),
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create table if not exists public.service_areas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.business_tenants(id) on delete cascade,
  name text not null,
  city text not null default 'Lucknow',
  postal_codes text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, name, city)
);
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.business_tenants(id) on delete restrict,
  service_id uuid references public.service_catalog(id) on delete set null,
  customer_name text not null check (length(trim(customer_name)) between 2 and 120),
  customer_phone text not null check (length(trim(customer_phone)) between 8 and 20),
  customer_email text,
  service_address text not null check (length(trim(service_address)) between 5 and 500),
  area text,
  preferred_at timestamptz,
  problem_description text,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new','contacted','quoted','confirmed','converted','rejected','spam')),
  privacy_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tenant_memberships_user on public.tenant_memberships(user_id, active);
create index if not exists idx_service_catalog_tenant_active on public.service_catalog(tenant_id, active, display_order);
create index if not exists idx_service_areas_tenant_active on public.service_areas(tenant_id, active);
create index if not exists idx_booking_requests_tenant_status_created on public.booking_requests(tenant_id, status, created_at desc);
alter table public.business_tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.service_catalog enable row level security;
alter table public.service_areas enable row level security;
alter table public.booking_requests enable row level security;

drop policy if exists "Active service catalog is public" on public.service_catalog;
create policy "Active service catalog is public" on public.service_catalog for select to anon, authenticated using (active = true);
drop policy if exists "Active service areas are public" on public.service_areas;
create policy "Active service areas are public" on public.service_areas for select to anon, authenticated using (active = true);
drop policy if exists "Public can submit booking requests" on public.booking_requests;
create policy "Public can submit booking requests" on public.booking_requests for insert to anon, authenticated with check (
 privacy_consent = true and source = 'website' and status = 'new'
 and exists (select 1 from public.business_tenants t where t.id = tenant_id and t.status in ('active','trial'))
 and (service_id is null or exists (select 1 from public.service_catalog s where s.id = service_id and s.tenant_id = tenant_id and s.active = true))
);
drop policy if exists "Tenant members read their memberships" on public.tenant_memberships;
create policy "Tenant members read their memberships" on public.tenant_memberships for select to authenticated using (user_id = auth.uid());
drop policy if exists "Tenant members read tenant settings" on public.business_tenants;
create policy "Tenant members read tenant settings" on public.business_tenants for select to authenticated using (
 exists (select 1 from public.tenant_memberships m where m.tenant_id = id and m.user_id = auth.uid() and m.active)
);
drop policy if exists "Tenant admins manage service catalog" on public.service_catalog;
create policy "Tenant admins manage service catalog" on public.service_catalog for all to authenticated
using (exists (select 1 from public.tenant_memberships m where m.tenant_id = service_catalog.tenant_id and m.user_id = auth.uid() and m.active and m.role in ('owner','admin','dispatcher')))
with check (exists (select 1 from public.tenant_memberships m where m.tenant_id = service_catalog.tenant_id and m.user_id = auth.uid() and m.active and m.role in ('owner','admin','dispatcher')));
drop policy if exists "Tenant admins manage service areas" on public.service_areas;
create policy "Tenant admins manage service areas" on public.service_areas for all to authenticated
using (exists (select 1 from public.tenant_memberships m where m.tenant_id = service_areas.tenant_id and m.user_id = auth.uid() and m.active and m.role in ('owner','admin','dispatcher')))
with check (exists (select 1 from public.tenant_memberships m where m.tenant_id = service_areas.tenant_id and m.user_id = auth.uid() and m.active and m.role in ('owner','admin','dispatcher')));
drop policy if exists "Tenant staff manage booking requests" on public.booking_requests;
create policy "Tenant staff manage booking requests" on public.booking_requests for all to authenticated
using (exists (select 1 from public.tenant_memberships m where m.tenant_id = booking_requests.tenant_id and m.user_id = auth.uid() and m.active and m.role in ('owner','admin','dispatcher','support')))
with check (exists (select 1 from public.tenant_memberships m where m.tenant_id = booking_requests.tenant_id and m.user_id = auth.uid() and m.active and m.role in ('owner','admin','dispatcher','support')));

insert into public.business_tenants (slug,name,status,plan_code,support_email,phone)
values ('vashishth-home-service','Vashishth Home Service','active','internal','vashishthglobalsolutions@gmail.com','+917042505746')
on conflict (slug) do nothing;
insert into public.service_catalog (tenant_id,slug,name,category,short_description,base_price,duration_minutes,display_order)
select t.id,v.slug,v.name,v.category,v.description,v.price,v.duration,v.ord from public.business_tenants t
cross join (values
('ro-repair','RO Water Purifier Repair','Appliance Repair','RO inspection, repair and servicing',499::numeric,60,1),
('ac-service','AC Service and Repair','Appliance Repair','AC servicing, diagnosis and repair',499::numeric,90,2),
('fridge-repair','Refrigerator Repair','Appliance Repair','Refrigerator diagnosis and repair',499::numeric,90,3),
('washing-machine-repair','Washing Machine Repair','Appliance Repair','Washing machine diagnosis and repair',499::numeric,90,4),
('microwave-repair','Microwave Repair','Appliance Repair','Microwave diagnosis and repair',499::numeric,60,5),
('chimney-cleaning','Kitchen Chimney Cleaning','Home Care','Kitchen chimney cleaning and servicing',599::numeric,90,6),
('geyser-repair','Geyser Repair','Appliance Repair','Geyser diagnosis and repair',399::numeric,60,7),
('bathroom-cleaning','Bathroom Cleaning','Home Care','Bathroom deep cleaning',499::numeric,90,8),
('home-deep-cleaning','Home Deep Cleaning','Home Care','Home deep cleaning by size and scope',1999::numeric,180,9),
('pest-control','General Pest Control','Home Care','General pest control service',899::numeric,90,10),
('plumbing','Plumbing Service','Handyman','Plumbing inspection and repairs',299::numeric,60,11),
('electrical','Electrical Service','Handyman','Electrical inspection and repairs',299::numeric,60,12)
) as v(slug,name,category,description,price,duration,ord)
where t.slug='vashishth-home-service' on conflict (tenant_id,slug) do nothing;
insert into public.service_areas (tenant_id,name,city,active)
select id,'Lucknow','Lucknow',true from public.business_tenants where slug='vashishth-home-service'
on conflict (tenant_id,name,city) do nothing;

grant select on public.service_catalog,public.service_areas to anon,authenticated;
grant insert on public.booking_requests to anon,authenticated;
grant select,insert,update on public.booking_requests to authenticated;
grant select on public.business_tenants,public.tenant_memberships to authenticated;
grant select,insert,update,delete on public.service_catalog,public.service_areas to authenticated;
