revoke all on function public.vgs_guard_service_job_update() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.vgs_is_admin() from public, anon;
grant execute on function public.vgs_is_admin() to authenticated;
