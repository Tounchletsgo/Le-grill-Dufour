-- Plats du jour (daily specials) for delivery menu
create table if not exists daily_specials (
  id uuid primary key default gen_random_uuid(),
  slot smallint not null check (slot in (1, 2)),
  valid_date date not null default current_date,
  name text not null,
  description text,
  price numeric(6,2) not null default 14.00,
  cooking_group text check (cooking_group in (null, 'boeuf', 'cuisson_imposee')),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slot, valid_date)
);

-- RLS
alter table daily_specials enable row level security;

create policy "Public read daily_specials"
  on daily_specials for select
  using (true);

create policy "Service role full access daily_specials"
  on daily_specials for all
  using (auth.role() = 'service_role');
