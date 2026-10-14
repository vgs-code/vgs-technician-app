drop policy if exists "Tenant staff manage booking requests" on public.booking_requests;
create policy "Tenant staff manage booking requests"
on public.booking_requests for all to authenticated
using (
  public.vgs_is_admin()
  or exists (
    select 1 from public.tenant_memberships m
    where m.tenant_id = booking_requests.tenant_id
      and m.user_id = auth.uid()
      and m.active
      and m.role in ('owner','admin','dispatcher','support')
  )
)
with check (
  public.vgs_is_admin()
  or exists (
    select 1 from public.tenant_memberships m
    where m.tenant_id = booking_requests.tenant_id
      and m.user_id = auth.uid()
      and m.active
      and m.role in ('owner','admin','dispatcher','support')
  )
);
