-- Admin-only notes attached to an employee's file (warnings, performance, general remarks).
create table public.employee_notes (
  id bigint generated always as identity primary key,
  employee_id uuid not null references public.employees (id) on delete cascade,
  category text not null default 'general' check (category in ('general', 'avertissement', 'rendement')),
  content text not null,
  author text not null default '',
  created_at timestamptz not null default now()
);

alter table public.employee_notes enable row level security;

create policy "admins can read employee notes"
  on public.employee_notes for select
  to authenticated
  using (public.is_admin());

-- Admin: add a note to an employee's file.
create or replace function public.add_employee_note(p_employee_id uuid, p_category text, p_content text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author text;
begin
  if not public.is_admin() then
    raise exception 'AUTH_ERROR: admin requis';
  end if;
  if p_category not in ('general', 'avertissement', 'rendement') then
    raise exception 'categorie invalide';
  end if;
  if coalesce(trim(p_content), '') = '' then
    raise exception 'note vide';
  end if;

  select full_name into v_author from public.employees where id = auth.uid();

  insert into public.employee_notes (employee_id, category, content, author)
  values (p_employee_id, p_category, trim(p_content), coalesce(v_author, 'Admin'));
end;
$$;

grant execute on function public.add_employee_note(uuid, text, text) to authenticated;

-- Admin: remove a note.
create or replace function public.delete_employee_note(p_note_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'AUTH_ERROR: admin requis';
  end if;

  delete from public.employee_notes where id = p_note_id;
end;
$$;

grant execute on function public.delete_employee_note(bigint) to authenticated;
