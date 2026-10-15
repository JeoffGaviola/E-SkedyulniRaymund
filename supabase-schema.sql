-- ==============================================================================
-- E-Skedyul: Supabase Database Schema & Setup Script
-- ==============================================================================
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- 1. Create the public profiles table linked to Supabase auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  ministry text default 'Lectors',
  parish text default 'St. Joseph Parish',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Define RLS Policies
-- Allow users to view profiles of members
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Allow users to insert their own profile
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Allow users to update their own profile
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);

-- 4. Automatic Profile Trigger on Auth Signup
-- This function runs automatically whenever a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'member')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = coalesce(excluded.role, public.profiles.role);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if existing, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- (Optional) Helper to promote an account to Administrator
-- Replace 'admin@parish.ph' with the administrator's email:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@parish.ph';
-- UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb WHERE email = 'admin@parish.ph';
-- ==============================================================================
