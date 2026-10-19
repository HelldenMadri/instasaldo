-- ==============================================================================
-- INSTALASALDO 2.0 — SUPABASE DATABASE SCHEMA & RLS MULTIEMPRESA (CORREÇÃO DEFINITIVA)
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard/project/hptaarigzvndqkhpaodp/sql)
-- ATENÇÃO: DESATIVE A TRADUÇÃO AUTOMÁTICA DO NAVEGADOR ANTES DE COPIAR!
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABELA DE SUPER ADMINS (Root imutável)
-- ------------------------------------------------------------------------------
create table if not exists public.super_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.super_admins enable row level security;

-- ------------------------------------------------------------------------------
-- 2. FUNÇÃO SECURITY DEFINER: is_super_admin()
-- ------------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.super_admins where user_id = auth.uid()
  ) or (auth.jwt() ->> 'email') = 'agenciavallor01@gmail.com';
$$;

drop policy if exists "Super admins podem ver tabela super_admins" on public.super_admins;
create policy "Super admins podem ver tabela super_admins"
  on public.super_admins for select
  using (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 3. PLANOS & ASSINATURAS SAAS
-- ------------------------------------------------------------------------------
create table if not exists public.plans (
  id text primary key,
  name text not null,
  price_cents integer not null default 0,
  max_users integer not null default 1,
  max_teams integer not null default 1,
  max_clients integer not null default 5,
  max_monthly_services integer not null default 10,
  features jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garante colunas de cota caso a tabela plans já existisse
alter table public.plans add column if not exists max_clients integer default 5;
alter table public.plans add column if not exists max_monthly_services integer default 10;

insert into public.plans (id, name, price_cents, max_users, max_teams, max_clients, max_monthly_services, features)
values 
  ('essencial', 'Essencial', 3700, 1, 1, 5, 10, '{"billing": "mensal", "email_support": true, "whatsapp_support": false, "quotes": false, "os": false, "teams": false}'::jsonb),
  ('profissional', 'Profissional', 9700, 5, 2, 50, 120, '{"billing": "mensal", "email_support": true, "whatsapp_support": true, "quotes": true, "os": true, "maintenance": true, "teams": false}'::jsonb),
  ('empresa', 'Empresa', 14700, 15, 5, 999999, 999999, '{"billing": "mensal", "email_support": true, "whatsapp_support": true, "quotes": true, "os": true, "maintenance": true, "teams": true, "reports": true, "audit": true}'::jsonb),
  ('solo', 'Essencial', 3700, 1, 1, 5, 10, '{"billing": "mensal", "email_support": true, "whatsapp_support": false}'::jsonb),
  ('equipe', 'Profissional', 9700, 5, 2, 50, 120, '{"billing": "mensal", "email_support": true, "whatsapp_support": true}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  max_users = excluded.max_users,
  max_teams = excluded.max_teams,
  max_clients = excluded.max_clients,
  max_monthly_services = excluded.max_monthly_services,
  features = excluded.features;

-- ------------------------------------------------------------------------------
-- 4. TABELA: companies (Empresas)
-- ------------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade_name text,
  cnpj_cpf text,
  phone text,
  email text,
  plan_id text references public.plans(id) default 'solo',
  status text default 'active' check (status in ('active', 'suspended', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.companies enable row level security;

-- ------------------------------------------------------------------------------
-- 5. TABELA: company_members (Membros & Papéis)
-- ------------------------------------------------------------------------------
create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'gerente', 'instalador')),
  status text not null default 'ativo' check (status in ('ativo', 'bloqueado')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (company_id, user_id)
);

alter table public.company_members enable row level security;

-- Funções Auxiliares de Contexto e Papel
create or replace function public.current_company_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select company_id from public.company_members
  where user_id = auth.uid() and status = 'ativo'
  limit 1;
$$;

create or replace function public.has_role(required_role text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.company_members
    where user_id = auth.uid()
      and status = 'ativo'
      and (
        role = required_role 
        or role = 'admin' 
        or (required_role = 'instalador' and role in ('admin', 'gerente', 'instalador'))
      )
  ) or public.is_super_admin();
$$;

drop policy if exists "Membros leem sua empresa ou Super Admin" on public.companies;
create policy "Membros leem sua empresa ou Super Admin"
  on public.companies for select
  using (
    id in (select company_id from public.company_members where user_id = auth.uid())
    or public.is_super_admin()
  );

drop policy if exists "Admin ou Super Admin atualizam empresa" on public.companies;
create policy "Admin ou Super Admin atualizam empresa"
  on public.companies for update
  using (
    (id in (select company_id from public.company_members where user_id = auth.uid() and role = 'admin'))
    or public.is_super_admin()
  );

drop policy if exists "Membros leem integrantes da sua empresa" on public.company_members;
create policy "Membros leem integrantes da sua empresa"
  on public.company_members for select
  using (
    company_id = public.current_company_id()
    or public.is_super_admin()
  );

drop policy if exists "Admin da empresa gerencia membros" on public.company_members;
create policy "Admin da empresa gerencia membros"
  on public.company_members for all
  using (
    (company_id in (select company_id from public.company_members where user_id = auth.uid() and role = 'admin'))
    or public.is_super_admin()
  );

-- ------------------------------------------------------------------------------
-- 6. TABELA: profiles (Perfis de Usuários)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nome text default '',
  role text default 'user',
  status text default 'ativo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garante colunas caso a tabela profiles já existisse
alter table public.profiles add column if not exists nome text default '';
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add column if not exists status text default 'ativo';
alter table public.profiles add column if not exists empresa text default 'Minha Empresa';
alter table public.profiles add column if not exists plano text default 'Solo';

alter table public.profiles enable row level security;

drop policy if exists "Perfil visivel para o usuario ou Super Admin" on public.profiles;
drop policy if exists "Perfis visiveis para dono ou super admin" on public.profiles;
create policy "Perfil visivel para o usuario ou Super Admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_super_admin());

drop policy if exists "Usuario atualiza dados basicos do proprio perfil" on public.profiles;
drop policy if exists "Perfis editaveis por dono ou super admin" on public.profiles;
create policy "Usuario atualiza dados basicos do proprio perfil"
  on public.profiles for update
  using (auth.uid() = id or public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 7. TABELAS: teams & team_members
-- ------------------------------------------------------------------------------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  manager_id uuid references auth.users(id),
  status text default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.teams enable row level security;

drop policy if exists "Equipes visiveis para membros da empresa" on public.teams;
create policy "Equipes visiveis para membros da empresa"
  on public.teams for select
  using (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists "Equipes editaveis por admin ou gerente" on public.teams;
create policy "Equipes editaveis por admin ou gerente"
  on public.teams for all
  using ((company_id = public.current_company_id() and public.has_role('gerente')) or public.is_super_admin());

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (team_id, user_id)
);

alter table public.team_members enable row level security;

drop policy if exists "Integrantes de equipe visiveis na empresa" on public.team_members;
create policy "Integrantes de equipe visiveis na empresa"
  on public.team_members for select
  using (
    team_id in (select id from public.teams where company_id = public.current_company_id())
    or public.is_super_admin()
  );

-- ------------------------------------------------------------------------------
-- 8. TABELA: customers (Clientes)
-- ------------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  person_type text default 'PF' check (person_type in ('PF', 'PJ')),
  phone text not null,
  whatsapp text,
  email text,
  document text,
  address text,
  notes text,
  status text default 'Ativo' check (status in ('Novo', 'Ativo', 'Manutenção futura', 'Inativo')),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.customers enable row level security;

drop policy if exists "Clientes visiveis para membros da empresa" on public.customers;
create policy "Clientes visiveis para membros da empresa"
  on public.customers for select
  using (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists "Clientes criados e editados por membros da empresa" on public.customers;
create policy "Clientes criados e editados por membros da empresa"
  on public.customers for all
  using (company_id = public.current_company_id() or public.is_super_admin());

-- Quota Trigger: Impede cadastro além do limite do plano da empresa
create or replace function public.check_customer_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id text;
  v_max_clients integer;
  v_current_clients integer;
begin
  -- Super admin bypass
  if public.is_super_admin() then
    return new;
  end if;

  if new.company_id is null then
    new.company_id := public.current_company_id();
  end if;

  -- Localiza plano da empresa
  select coalesce(plan_id, 'essencial') into v_plan_id
  from public.companies
  where id = new.company_id;

  -- Localiza limite de clientes
  select coalesce(max_clients, 5) into v_max_clients
  from public.plans
  where id = v_plan_id;

  if v_max_clients is null then
    v_max_clients := 5;
  end if;

  -- Conta clientes ativos cadastrados
  select count(*) into v_current_clients
  from public.customers
  where company_id = new.company_id
    and status != 'Inativo';

  if v_current_clients >= v_max_clients then
    raise exception 'LIMITE_PLANO_ATINGIDO: Você atingiu o limite de % clientes cadastrados do seu plano atual (%). Faça upgrade para continuar cadastrando novos clientes.', v_max_clients, v_plan_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_customer_quota on public.customers;
create trigger trg_check_customer_quota
  before insert on public.customers
  for each row execute procedure public.check_customer_quota();

-- ------------------------------------------------------------------------------
-- 9. TABELAS: quotes & quote_items (Orçamentos)
-- ------------------------------------------------------------------------------
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_number serial,
  customer_id uuid not null references public.customers(id) on delete cascade,
  status text default 'Rascunho' check (status in ('Rascunho', 'Enviado', 'Em negociação', 'Aprovado', 'Recusado', 'Expirado', 'Cancelado')),
  issue_date date default current_date,
  valid_until date,
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  entry_cents integer not null default 0,
  balance_cents integer not null default 0,
  payment_terms text,
  notes text,
  public_token text unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quotes enable row level security;

drop policy if exists "Orcamentos visiveis na empresa ou via token publico" on public.quotes;
create policy "Orcamentos visiveis na empresa ou via token publico"
  on public.quotes for select
  using (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists "Orcamentos gerenciaveis por admin e gerente" on public.quotes;
create policy "Orcamentos gerenciaveis por admin e gerente"
  on public.quotes for all
  using ((company_id = public.current_company_id() and public.has_role('gerente')) or public.is_super_admin());

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price_cents integer not null default 0,
  total_price_cents integer not null default 0
);

alter table public.quote_items enable row level security;

drop policy if exists "Itens de orcamento visiveis na empresa" on public.quote_items;
create policy "Itens de orcamento visiveis na empresa"
  on public.quote_items for all
  using (
    quote_id in (select id from public.quotes where company_id = public.current_company_id())
    or public.is_super_admin()
  );

create table if not exists public.quote_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  event_type text not null,
  details text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quote_events enable row level security;

drop policy if exists "Eventos de orcamento visiveis na empresa" on public.quote_events;
create policy "Eventos de orcamento visiveis na empresa"
  on public.quote_events for all
  using (
    quote_id in (select id from public.quotes where company_id = public.current_company_id())
    or public.is_super_admin()
  );

-- ------------------------------------------------------------------------------
-- 10. TABELAS: work_orders & Evidências
-- ------------------------------------------------------------------------------
create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_number serial,
  customer_id uuid not null references public.customers(id),
  quote_id uuid references public.quotes(id),
  team_id uuid references public.teams(id),
  installer_id uuid references auth.users(id),
  service_type text not null default 'Instalação',
  description text,
  equipment text,
  address text,
  scheduled_date date,
  scheduled_time text,
  priority text default 'Média' check (priority in ('Baixa', 'Média', 'Alta', 'Urgente')),
  status text default 'Aberta' check (status in ('Aberta', 'Agendada', 'Em deslocamento', 'Em execução', 'Aguardando assinatura', 'Aguardando revisão', 'Concluída', 'Cancelada')),
  execution_started_at timestamp with time zone,
  execution_notes text,
  materials_used text,
  client_absent_reason text,
  approved_by uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.work_orders enable row level security;

drop policy if exists "Acesso a Ordens de Servico" on public.work_orders;
create policy "Acesso a Ordens de Servico"
  on public.work_orders for select
  using (
    public.is_super_admin()
    or (
      company_id = public.current_company_id()
      and (
        public.has_role('gerente')
        or installer_id = auth.uid()
        or team_id in (select team_id from public.team_members where user_id = auth.uid())
      )
    )
  );

drop policy if exists "Gerente e Admin alteram OS" on public.work_orders;
create policy "Gerente e Admin alteram OS"
  on public.work_orders for all
  using (
    public.is_super_admin()
    or (company_id = public.current_company_id() and public.has_role('gerente'))
    or (company_id = public.current_company_id() and installer_id = auth.uid())
  );

create table if not exists public.work_order_photos (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  file_path text not null,
  file_url text,
  caption text,
  uploaded_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.work_order_photos enable row level security;

drop policy if exists "Fotos de OS visiveis na empresa" on public.work_order_photos;
create policy "Fotos de OS visiveis na empresa"
  on public.work_order_photos for all
  using (
    work_order_id in (select id from public.work_orders where company_id = public.current_company_id())
    or public.is_super_admin()
  );

create table if not exists public.work_order_signatures (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  signer_name text not null,
  signature_data_url text not null,
  legal_text_version text not null default 'v1',
  captured_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.work_order_signatures enable row level security;

drop policy if exists "Assinatura de OS visivel na empresa" on public.work_order_signatures;
create policy "Assinatura de OS visivel na empresa"
  on public.work_order_signatures for all
  using (
    work_order_id in (select id from public.work_orders where company_id = public.current_company_id())
    or public.is_super_admin()
  );

create table if not exists public.work_order_events (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  event_type text not null,
  details text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.work_order_events enable row level security;

drop policy if exists "Eventos de OS visiveis na empresa" on public.work_order_events;
create policy "Eventos de OS visiveis na empresa"
  on public.work_order_events for all
  using (
    work_order_id in (select id from public.work_orders where company_id = public.current_company_id())
    or public.is_super_admin()
  );

-- ------------------------------------------------------------------------------
-- 11. FUNÇÃO DE CONCLUSÃO DE OS (Validação Rigorosa)
-- ------------------------------------------------------------------------------
create or replace function public.complete_work_order(
  p_work_order_id uuid,
  p_execution_notes text,
  p_materials_used text,
  p_client_absent_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_os record;
  v_photo_count integer;
  v_sig_count integer;
begin
  select * into v_os from public.work_orders where id = p_work_order_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Ordem de Serviço não encontrada.');
  end if;

  if v_os.status != 'Em execução' and v_os.status != 'Aguardando assinatura' then
    return jsonb_build_object('success', false, 'message', 'A OS precisa estar Em Execução para ser concluída.');
  end if;

  if coalesce(trim(p_execution_notes), '') = '' then
    return jsonb_build_object('success', false, 'message', 'A descrição do serviço realizado é obrigatória.');
  end if;

  select count(*) into v_photo_count from public.work_order_photos where work_order_id = p_work_order_id;
  if v_photo_count < 1 then
    return jsonb_build_object('success', false, 'message', 'Adicione pelo menos uma foto antes de concluir.');
  end if;

  select count(*) into v_sig_count from public.work_order_signatures where work_order_id = p_work_order_id;
  if v_sig_count < 1 and (p_client_absent_reason is null or trim(p_client_absent_reason) = '') then
    return jsonb_build_object('success', false, 'message', 'Solicite a assinatura do cliente ou informe a justificativa de ausência.');
  end if;

  update public.work_orders
  set 
    status = 'Concluída',
    execution_notes = p_execution_notes,
    materials_used = p_materials_used,
    client_absent_reason = p_client_absent_reason,
    updated_at = timezone('utc'::text, now())
  where id = p_work_order_id;

  insert into public.work_order_events (work_order_id, event_type, details, created_by)
  values (p_work_order_id, 'Conclusão de OS', 'OS concluída com sucesso com evidências fotográficas e validação.', auth.uid());

  return jsonb_build_object('success', true, 'message', 'Ordem de Serviço concluída com sucesso.');
end;
$$;

-- ------------------------------------------------------------------------------
-- 12. TABELAS: maintenance_schedules & follow_ups
-- ------------------------------------------------------------------------------
create table if not exists public.maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  equipment text not null,
  last_service_date date,
  interval_months integer not null default 6,
  estimated_return_date date not null,
  status text not null default 'Agendada' check (status in ('Agendada', 'Próxima do vencimento', 'Vencida', 'Concluída', 'Cancelada')),
  assigned_to uuid references auth.users(id),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.maintenance_schedules enable row level security;

drop policy if exists "Manutencoes visiveis na empresa" on public.maintenance_schedules;
create policy "Manutencoes visiveis na empresa"
  on public.maintenance_schedules for all
  using (company_id = public.current_company_id() or public.is_super_admin());

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  quote_id uuid references public.quotes(id),
  type text not null check (type in ('orçamento_sem_resposta', 'pos_instalacao', 'manutencao_preventiva', 'cliente_inativo', 'retorno_comercial')),
  scheduled_date date not null,
  status text not null default 'Pendente' check (status in ('Pendente', 'Realizado', 'Reagendado', 'Cancelado')),
  result_notes text,
  next_contact_date date,
  assigned_to uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.follow_ups enable row level security;

drop policy if exists "Follow ups visiveis na empresa" on public.follow_ups;
create policy "Follow ups visiveis na empresa"
  on public.follow_ups for all
  using (company_id = public.current_company_id() or public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 13. TABELA: services (Serviços e Recebimentos Financeiros)
-- ------------------------------------------------------------------------------
-- 1. Cria a tabela se não existir
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  cliente text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. GARANTE QUE TODAS AS COLUNAS EXISTAM MESMO SE A TABELA SERVICES JÁ EXISTIA
alter table public.services add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.services add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.services add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.services add column if not exists work_order_id uuid references public.work_orders(id) on delete set null;
alter table public.services add column if not exists tipo text default 'Instalação';
alter table public.services add column if not exists status text default 'pendente';
alter table public.services add column if not exists valor_cents integer default 0;
alter table public.services add column if not exists recebido_cents integer default 0;
alter table public.services add column if not exists data text;

alter table public.services enable row level security;

drop policy if exists "Servicos visiveis para empresa ou Super Admin" on public.services;
drop policy if exists "Servicos visiveis pelo criador ou super admin" on public.services;
drop policy if exists "Servicos criados por autenticados" on public.services;
drop policy if exists "Servicos atualizados por dono ou super admin" on public.services;
drop policy if exists "Servicos deletados por dono ou super admin" on public.services;

create policy "Servicos visiveis para empresa ou Super Admin"
  on public.services for select
  using (
    company_id = public.current_company_id() 
    or user_id = auth.uid() 
    or public.is_super_admin()
  );

drop policy if exists "Servicos gerenciaveis por admin e gerente" on public.services;
create policy "Servicos gerenciaveis por admin e gerente"
  on public.services for all
  using (
    (company_id = public.current_company_id() and public.has_role('gerente'))
    or user_id = auth.uid()
    or public.is_super_admin()
  );

-- Quota Trigger: Impede cadastro de serviços acima do limite mensal do plano
create or replace function public.check_service_monthly_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id text;
  v_max_services integer;
  v_current_services integer;
begin
  -- Super admin bypass
  if public.is_super_admin() then
    return new;
  end if;

  if new.company_id is null then
    new.company_id := public.current_company_id();
  end if;

  -- Localiza plano da empresa
  select coalesce(plan_id, 'essencial') into v_plan_id
  from public.companies
  where id = new.company_id;

  -- Localiza limite de serviços mensais
  select coalesce(max_monthly_services, 10) into v_max_services
  from public.plans
  where id = v_plan_id;

  if v_max_services is null then
    v_max_services := 10;
  end if;

  -- Conta serviços criados no mês corrente
  select count(*) into v_current_services
  from public.services
  where company_id = new.company_id
    and date_trunc('month', created_at) = date_trunc('month', now());

  if v_current_services >= v_max_services then
    raise exception 'LIMITE_PLANO_ATINGIDO: Você atingiu o limite de % serviços por mês do seu plano atual (%). Faça upgrade para continuar lançando novos serviços.', v_max_services, v_plan_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_service_monthly_quota on public.services;
create trigger trg_check_service_monthly_quota
  before insert on public.services
  for each row execute procedure public.check_service_monthly_quota();

-- ------------------------------------------------------------------------------
-- 14. TABELA: audit_logs (Auditoria Geral)
-- ------------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_email text not null,
  action text not null,
  target text default '',
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.audit_logs enable row level security;

drop policy if exists "Logs de auditoria visiveis para admin da empresa ou Super Admin" on public.audit_logs;
drop policy if exists "Apenas super admin acessa logs de auditoria" on public.audit_logs;
create policy "Logs de auditoria visiveis para admin da empresa ou Super Admin"
  on public.audit_logs for all
  using (
    (company_id = public.current_company_id() and public.has_role('admin'))
    or public.is_super_admin()
  );

-- ------------------------------------------------------------------------------
-- 15. TRIGGER: Novo Usuário -> Perfil + Empresa Pessoal (Plano Solo)
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_company_id uuid;
  v_is_super boolean;
begin
  v_is_super := (lower(new.email) = 'agenciavallor01@gmail.com');

  insert into public.profiles (id, email, nome, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when v_is_super then 'super_admin' else 'user' end,
    'ativo'
  )
  on conflict (id) do update set
    role = case when v_is_super then 'super_admin' else public.profiles.role end;

  if v_is_super then
    insert into public.super_admins (user_id, email)
    values (new.id, new.email)
    on conflict (user_id) do nothing;
  end if;

  if not exists (select 1 from public.company_members where user_id = new.id) then
    insert into public.companies (name, trade_name, email, plan_id, status)
    values (
      coalesce(new.raw_user_meta_data->>'empresa', 'InstalaSaldo - ' || split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'empresa', 'Minha Empresa'),
      new.email,
      case when v_is_super then 'empresa' else 'solo' end,
      'active'
    )
    returning id into v_company_id;

    insert into public.company_members (company_id, user_id, role, status)
    values (v_company_id, new.id, 'admin', 'ativo');
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Migração Idempotente para usuários existentes
do $$
declare
  r record;
  v_comp_id uuid;
begin
  for r in select id, email from auth.users loop
    if lower(r.email) = 'agenciavallor01@gmail.com' then
      insert into public.super_admins (user_id, email)
      values (r.id, r.email)
      on conflict (user_id) do nothing;
    end if;

    if not exists (select 1 from public.company_members where user_id = r.id) then
      insert into public.companies (name, trade_name, email, plan_id, status)
      values ('InstalaSaldo - ' || split_part(r.email, '@', 1), 'Minha Empresa', r.email, 'solo', 'active')
      returning id into v_comp_id;

      insert into public.company_members (company_id, user_id, role, status)
      values (v_comp_id, r.id, 'admin', 'ativo')
      on conflict do nothing;

      -- Vincula servicos orfaos a essa empresa
      update public.services set company_id = v_comp_id where user_id = r.id and company_id is null;
    end if;
  end loop;
end;
$$;
