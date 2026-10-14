-- Harden technician job updates at the database boundary.
-- Admins retain full control; technicians may only progress their assigned jobs.
create or replace function public.vgs_guard_service_job_update()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin boolean;
  v_uid uuid;
  v_allowed_next text;
begin
  v_uid := auth.uid();
  v_admin := public.vgs_is_admin();

  if v_admin then
    new.updated_at := now();
    return new;
  end if;

  if v_uid is null or old.technician_user_id is distinct from v_uid then
    raise exception 'Not authorized to update this job' using errcode = '42501';
  end if;

  if not exists (select 1 from public.technician_profiles tp where tp.user_id = v_uid and tp.active = true) then
    raise exception 'Active technician profile required' using errcode = '42501';
  end if;

  if new.id is distinct from old.id
    or new.job_number is distinct from old.job_number
    or new.customer_id is distinct from old.customer_id
    or new.technician_user_id is distinct from old.technician_user_id
    or new.service_name is distinct from old.service_name
    or new.problem_description is distinct from old.problem_description
    or new.scheduled_at is distinct from old.scheduled_at
    or new.estimated_amount is distinct from old.estimated_amount
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Technicians cannot edit booking, assignment, or pricing fields' using errcode = '42501';
  end if;

  v_allowed_next := case old.status
    when 'assigned' then 'accepted'
    when 'accepted' then 'on_the_way'
    when 'on_the_way' then 'in_progress'
    when 'in_progress' then 'completed'
    else null
  end;

  if new.status is distinct from old.status and (v_allowed_next is null or new.status is distinct from v_allowed_next) then
    raise exception 'Invalid job status transition: % to %', old.status, new.status using errcode = '22023';
  end if;

  if new.status <> 'completed' and (
    new.diagnosis is distinct from old.diagnosis
    or new.parts_used is distinct from old.parts_used
    or new.completion_notes is distinct from old.completion_notes
    or new.completed_at is distinct from old.completed_at
    or new.final_amount is distinct from old.final_amount
  ) then
    raise exception 'Completion details can only be saved when completing a job' using errcode = '42501';
  end if;

  if new.status = 'completed' and old.status <> 'completed' then
    if coalesce(trim(new.diagnosis), '') = '' then
      raise exception 'Diagnosis is required to complete a job' using errcode = '22023';
    end if;
    new.completed_at := coalesce(new.completed_at, now());
    new.final_amount := old.estimated_amount;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_vgs_guard_service_job_update on public.service_jobs;
create trigger trg_vgs_guard_service_job_update
before update on public.service_jobs
for each row execute function public.vgs_guard_service_job_update();

drop policy if exists "Technicians read own job updates" on public.job_updates;
create policy "Technicians read own job updates"
on public.job_updates for select to authenticated
using (technician_user_id = auth.uid());

drop policy if exists "Technicians log own job updates" on public.job_updates;
create policy "Technicians log own job updates"
on public.job_updates for insert to authenticated
with check (
  technician_user_id = auth.uid()
  and exists (
    select 1 from public.service_jobs j
    where j.id = job_updates.job_id
      and j.technician_user_id = auth.uid()
      and j.status = job_updates.status
  )
);

revoke update, delete on public.job_updates from authenticated;
grant select, insert on public.job_updates to authenticated;
