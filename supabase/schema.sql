-- ============================================================
-- Furnify: Complete Supabase Schema
-- Run this in the Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- 2. USERS TABLE
-- Mirrors auth.users with role & profile info
-- ─────────────────────────────────────────────
create table if not exists public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text not null,
  role         text not null default 'user' check (role in ('admin', 'user')),
  avatar_url   text,
  mobile_number text,
  address      text,
  created_at   timestamptz default now()
);

-- Auto-create user profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop trigger if exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- 3. FURNITURE TABLE
-- ─────────────────────────────────────────────
create table if not exists public.furniture (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  price        numeric(10, 2) not null check (price > 0),
  image_url    text,
  description  text,
  category     text not null,
  is_hidden    boolean not null default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_furniture_updated_at on public.furniture;
create trigger set_furniture_updated_at
  before update on public.furniture
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────
-- 4. CART ITEMS TABLE
-- ─────────────────────────────────────────────
create table if not exists public.cart_items (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  furniture_id uuid not null references public.furniture(id) on delete cascade,
  quantity     int not null default 1 check (quantity > 0),
  created_at   timestamptz default now(),
  -- Each user can only have one row per furniture item
  unique (user_id, furniture_id)
);

-- ─────────────────────────────────────────────
-- 5. ACTIVITY LOGS TABLE
-- ─────────────────────────────────────────────
create table if not exists public.activity_logs (
  id             uuid primary key default uuid_generate_v4(),
  admin_id       uuid references public.users(id) on delete set null,
  action         text not null check (action in ('ADD', 'EDIT', 'DELETE')),
  furniture_name text not null,
  timestamp      timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 6. STORAGE BUCKET
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('furniture-images', 'furniture-images', true)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

-- Helper function to avoid infinite recursion when checking admin status
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  );
$$;

-- Enable RLS on all tables
alter table public.users         enable row level security;
alter table public.furniture      enable row level security;
alter table public.cart_items     enable row level security;
alter table public.activity_logs  enable row level security;

-- ── USERS ──────────────────────────────────
-- Drop existing policies to avoid conflicts
drop policy if exists "Users can view their own profile" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Admins can view all users" on public.users;
drop policy if exists "Users can insert their own profile" on public.users;

create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- IMPORTANT: This INSERT policy is required so the app's fallback profile creation
-- works correctly if the on_auth_user_created trigger fails or is delayed.
create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Admins can view all users"
  on public.users for select
  using (public.is_admin());

-- ── FURNITURE ──────────────────────────────
drop policy if exists "Anyone can view visible furniture" on public.furniture;
drop policy if exists "Admins can view all furniture" on public.furniture;
drop policy if exists "Admins can insert furniture" on public.furniture;
drop policy if exists "Admins can update furniture" on public.furniture;
drop policy if exists "Admins can delete furniture" on public.furniture;

-- Users only see visible items
create policy "Anyone can view visible furniture"
  on public.furniture for select
  using (
    is_hidden = false
    or public.is_admin()
  );

create policy "Admins can insert furniture"
  on public.furniture for insert
  with check (public.is_admin());

create policy "Admins can update furniture"
  on public.furniture for update
  using (public.is_admin());

create policy "Admins can delete furniture"
  on public.furniture for delete
  using (public.is_admin());

-- ── CART ITEMS ─────────────────────────────
drop policy if exists "Users can view their own cart" on public.cart_items;
drop policy if exists "Users can insert into their cart" on public.cart_items;
drop policy if exists "Users can update their cart" on public.cart_items;
drop policy if exists "Users can delete from their cart" on public.cart_items;

create policy "Users can view their own cart"
  on public.cart_items for select
  using (auth.uid() = user_id);

create policy "Users can insert into their cart"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their cart"
  on public.cart_items for update
  using (auth.uid() = user_id);

create policy "Users can delete from their cart"
  on public.cart_items for delete
  using (auth.uid() = user_id);

-- ── ACTIVITY LOGS ──────────────────────────
drop policy if exists "Admins can view activity logs" on public.activity_logs;
drop policy if exists "Admins can insert activity logs" on public.activity_logs;

create policy "Admins can view activity logs"
  on public.activity_logs for select
  using (public.is_admin());

create policy "Admins can insert activity logs"
  on public.activity_logs for insert
  with check (public.is_admin());

-- ── STORAGE POLICIES ───────────────────────
drop policy if exists "Public read furniture images" on storage.objects;
drop policy if exists "Admins can upload furniture images" on storage.objects;
drop policy if exists "Admins can delete furniture images" on storage.objects;

create policy "Public read furniture images"
  on storage.objects for select
  using (bucket_id = 'furniture-images');

create policy "Admins can upload furniture images"
  on storage.objects for insert
  with check (
    bucket_id = 'furniture-images'
    and public.is_admin()
  );

create policy "Admins can delete furniture images"
  on storage.objects for delete
  using (
    bucket_id = 'furniture-images'
    and public.is_admin()
  );

-- ─────────────────────────────────────────────
-- Done! Your Furnify schema is ready.
-- ─────────────────────────────────────────────
