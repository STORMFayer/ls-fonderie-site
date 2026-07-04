-- Admin: also allow editing an employee's display name from the same call.
-- Signature changed (extra param), so drop the old 3-arg overload first to avoid ambiguity.
drop function if exists public.update_employee(uuid, text, text);

create or replace function public.update_employee(p_id uuid, p_discord text, p_role text, p_full_name text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'AUTH_ERROR: admin requis';
  end if;
  if p_role not in ('admin', 'employe') then
    raise exception 'role invalide';
  end if;

  update public.employees
  set discord = p_discord,
      role = p_role,
      full_name = coalesce(nullif(trim(p_full_name), ''), full_name)
  where id = p_id;
end;
$$;

grant execute on function public.update_employee(uuid, text, text, text) to authenticated;
