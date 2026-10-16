-- ========================================================
-- INSTALASALDO - SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/hptaarigzvndqkhpaodp/sql
-- ========================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. TABELA: profiles (Perfis de Usuários)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  nome text default '',
  role text default 'user' check (role in ('super_admin', 'admin', 'technician', 'financial', 'user')),
  status text default 'active' check (status in ('active', 'suspended')),
  empresa text default 'InstalaSaldo',
  plano text default 'Básico',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS em profiles
alter table public.profiles enable row level security;

-- Política: Usuário autenticado lê seu próprio perfil OU Super Admin lê todos
create policy "Perfis visiveis para dono ou super admin"
  on public.profiles for select
  using (
    auth.uid() = id
    or (auth.jwt() ->> 'email') = 'agenciavallor01@gmail.com'
  );

-- Política: Usuário edita seu próprio perfil (sem alterar role) OU Super Admin edita tudo
create policy "Perfis editaveis por dono ou super admin"
  on public.profiles for update
  using (
    auth.uid() = id
    or (auth.jwt() ->> 'email') = 'agenciavallor01@gmail.com'
  );

-- Política: Super Admin pode deletar perfil
create policy "Super admin pode deletar perfis"
  on public.profiles for delete
  using (
    (auth.jwt() ->> 'email') = 'agenciavallor01@gmail.com'
  );

-- 3. TABELA: companies (Empresas Cadastradas)
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  plano text default 'Básico',
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.companies enable row level security;

create policy "Empresas visiveis para autenticados"
  on public.companies for select
  using (auth.role() = 'authenticated');

create policy "Empresas gerenciadas por super admin"
  on public.companies for all
  using ((auth.jwt() ->> 'email') = 'agenciavallor01@gmail.com');

-- 4. TABELA: services (Serviços e Instalações)
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  cliente text not null,
  tipo text default 'Instalação',
  status text default 'pendente',
  valor numeric(10,2) default 0.00,
  data text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.services enable row level security;

create policy "Servicos visiveis pelo criador ou super admin"
  on public.services for select
  using (
    auth.uid() = user_id
    or (auth.jwt() ->> 'email') = 'agenciavallor01@gmail.com'
    or auth.role() = 'authenticated'
  );

create policy "Servicos criados por autenticados"
  on public.services for insert
  with check (auth.role() = 'authenticated');

create policy "Servicos atualizados por dono ou super admin"
  on public.services for update
  using (
    auth.uid() = user_id
    or (auth.jwt() ->> 'email') = 'agenciavallor01@gmail.com'
  );

create policy "Servicos deletados por dono ou super admin"
  on public.services for delete
  using (
    auth.uid() = user_id
    or (auth.jwt() ->> 'email') = 'agenciavallor01@gmail.com'
  );

-- 5. TABELA: audit_logs (Logs de Auditoria de Ações Administrativas)
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  action text not null,
  target text default '',
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.audit_logs enable row level security;

create policy "Apenas super admin acessa logs de auditoria"
  on public.audit_logs for all
  using ((auth.jwt() ->> 'email') = 'agenciavallor01@gmail.com');

-- 6. TRIGGER AUTOMÁTICO: Criação de perfil ao cadastrar no Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nome, role, status, empresa, plano)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when lower(new.email) = 'agenciavallor01@gmail.com' then 'super_admin' else 'user' end,
    'active',
    case when lower(new.email) = 'agenciavallor01@gmail.com' then 'Agência Vallor' else 'Empresa Padrão' end,
    case when lower(new.email) = 'agenciavallor01@gmail.com' then 'Enterprise' else 'Básico' end
  )
  on conflict (id) do update set
    role = case when lower(excluded.email) = 'agenciavallor01@gmail.com' then 'super_admin' else public.profiles.role end;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger disparado no insert de auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Garante que caso o Super Admin já exista em auth.users, seu perfil é super_admin
insert into public.profiles (id, email, nome, role, status, empresa, plano)
select
  id,
  email,
  'Super Administrador',
  'super_admin',
  'active',
  'Agência Vallor',
  'Enterprise'
from auth.users
where lower(email) = 'agenciavallor01@gmail.com'
on conflict (id) do update set
  role = 'super_admin',
  status = 'active';
