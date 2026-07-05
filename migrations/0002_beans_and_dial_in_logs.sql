-- Bean catalogue and per-bean dial-in shot logs.
-- Deleting a bean removes all of its shot logs (ON DELETE CASCADE).
create table beans (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  name text not null,
  roast_level text not null,
  origin text not null,
  created_at timestamptz not null default now()
);

create table dial_in_logs (
  id uuid primary key default gen_random_uuid(),
  bean_id uuid not null references beans(id) on delete cascade,
  grind_size numeric not null,
  extraction_seconds numeric not null,
  basket_type text not null,
  notes text,
  is_best boolean not null default false,
  -- user-supplied shot date, not a row-creation timestamp
  logged_at timestamptz not null
);

create index dial_in_logs_bean_id_logged_at_idx on dial_in_logs (bean_id, logged_at desc);
