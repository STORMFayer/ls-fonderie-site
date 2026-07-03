-- Employee profiles, linked 1:1 to Supabase Auth users.
create table public.employees (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'employe',
  created_at timestamptz not null default now()
);

alter table public.employees enable row level security;

create policy "employees can read their own profile"
  on public.employees for select
  to authenticated
  using (auth.uid() = id);

-- Auto-create an employee profile whenever an auth user is created (invite-only signup).
create function public.handle_new_employee()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.employees (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_employee();

-- Minimal orders table so the employee dashboard has something real to show.
create table public.orders (
  id bigint generated always as identity primary key,
  client_name text not null,
  product text not null,
  amount numeric(10, 2) not null default 0,
  status text not null default 'en_attente',
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "authenticated employees can read orders"
  on public.orders for select
  to authenticated
  using (true);

-- A few sample rows so the dashboard isn't empty on first login.
insert into public.orders (client_name, product, amount, status) values
  ('Marco T.', 'Lingot de fer', 130, 'livree'),
  ('Aline R.', 'Plaque céramique', 210, 'en_cours'),
  ('Kevin D.', 'Ressort renforcé', 60, 'en_attente'),
  ('Sofia M.', 'Lingot de fer', 260, 'livree');
