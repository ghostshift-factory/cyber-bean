-- Rebuild beans and dial_in_logs to the dial-in spec: beans identifies a bean
-- by brand + bean_type (replacing name/roast_level/origin), and dial_in_logs
-- gains dose_in_g, yield_out_g, taste_rating and taste_balance, with
-- extraction_seconds as whole seconds.
-- Pre-launch reset: the 0002 tables hold only staging test data that cannot
-- satisfy the new NOT NULL measurement columns, so drop and recreate.
drop table if exists dial_in_logs;
drop table if exists beans;

create table beans (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  bean_type text not null,
  created_at timestamptz not null default now()
);

create table dial_in_logs (
  id uuid primary key default gen_random_uuid(),
  bean_id uuid not null references beans(id) on delete cascade,
  grind_size numeric not null,
  dose_in_g numeric not null,
  yield_out_g numeric not null,
  extraction_seconds integer not null,
  basket_type text not null,
  taste_rating smallint not null,
  taste_balance text,
  notes text,
  is_best boolean not null default false,
  -- user-supplied shot date, not a row-creation timestamp
  logged_at timestamptz not null
);

create index dial_in_logs_bean_id_logged_at_idx on dial_in_logs (bean_id, logged_at desc);
