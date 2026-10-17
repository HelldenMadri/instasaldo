-- ============================================================================
-- INSTALASALDO 2.0 — MIGRATION 01: INITIAL RELATIONAL SCHEMA (RESILIENT & COMPATIBLE)
-- Target Database: Supabase PostgreSQL (Project ref: hptaarigzvndqkhpaodp)
-- Description: Core tables, incremental column reconciliation, safe type casts, zero data loss
-- ============================================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 0.1 Custom Types (Idempotent creation)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('superadmin', 'empresa_admin', 'gerente', 'instalador');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('essencial', 'profissional', 'empresa');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE plan_status AS ENUM ('ativo', 'pendente', 'bloqueado', 'cancelado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('ativo', 'trial', 'inativo', 'suspenso');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pendente', 'em_execucao', 'concluido', 'cancelado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE service_type AS ENUM ('instalacao', 'manutencao', 'higienizacao', 'reparo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_provider AS ENUM ('meta_cloud_api', 'qr_code_webhook', 'manual_fallback');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 1. COMPANIES (TENANTS)
-- Compatible with existing table containing:
-- id, name, trade_name, cnpj_cpf, phone, email, plan_id, status
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incremental column additions (ensures all fields exist regardless of legacy schema)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS trade_name TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS document TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cnpj_cpf TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'profissional';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan_id TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'ativo';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'ativo';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS monthly_price NUMERIC(10,2) DEFAULT 97.00;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS next_billing_date DATE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS os_prefix TEXT DEFAULT 'OS-2026-';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS warranty_terms_days INTEGER DEFAULT 90;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS default_deposit_percentage INTEGER DEFAULT 50;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{
  "whatsappAutomated": true,
  "digitalSignature": true,
  "advancedReports": true,
  "customBranding": false,
  "multiTechnicianDispatch": true
}'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS whatsapp_config JSONB DEFAULT '{
  "enabled": true,
  "provider": "manual_fallback",
  "status": "conectado",
  "deliveryFormat": "documento_formatado",
  "apiKeyConfigured": false
}'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Data reconciliation for companies
UPDATE public.companies SET document = cnpj_cpf::text WHERE document IS NULL AND cnpj_cpf IS NOT NULL;
UPDATE public.companies SET cnpj_cpf = document::text WHERE cnpj_cpf IS NULL AND document IS NOT NULL;

UPDATE public.companies SET plan = CASE
  WHEN LOWER(COALESCE(plan::text, plan_id::text, '')) LIKE '%essenc%' THEN 'essencial'
  WHEN LOWER(COALESCE(plan::text, plan_id::text, '')) LIKE '%empresa%' THEN 'empresa'
  ELSE 'profissional'
END WHERE plan IS NULL OR plan NOT IN ('essencial', 'profissional', 'empresa');

-- Reconcile monthly_price strictly matching plan before applying constraint
UPDATE public.companies SET monthly_price = CASE
  WHEN plan = 'essencial' THEN 37.00
  WHEN plan = 'empresa' THEN 147.00
  ELSE 97.00
END
WHERE monthly_price IS NULL
   OR (plan = 'essencial' AND monthly_price <> 37.00)
   OR (plan = 'profissional' AND monthly_price <> 97.00)
   OR (plan = 'empresa' AND monthly_price <> 147.00);

-- Pricing sanity constraint (re-created safely)
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS check_pricing_rules;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_status_check;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_plan_status_check;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_account_status_check;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_plan_check;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_plan_id_check;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_plan_id_fkey;

ALTER TABLE public.companies ADD CONSTRAINT check_pricing_rules CHECK (
  (plan = 'essencial' AND monthly_price = 37.00) OR
  (plan = 'profissional' AND monthly_price = 97.00) OR
  (plan = 'empresa' AND monthly_price = 147.00)
);

-- ============================================================================
-- 2. USER PROFILES
-- Compatible with existing table containing:
-- id, email, nome, role, status, empresa, plano
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incremental column additions (bilingual bridge: nome <-> name, empresa <-> company_id)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'instalador';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plano TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS connected_device TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Data reconciliation for profiles
UPDATE public.profiles SET name = nome::text WHERE name IS NULL AND nome IS NOT NULL;
UPDATE public.profiles SET nome = name::text WHERE nome IS NULL AND name IS NOT NULL;
UPDATE public.profiles SET name = split_part(email::text, '@', 1) WHERE name IS NULL;
UPDATE public.profiles SET nome = split_part(email::text, '@', 1) WHERE nome IS NULL;

-- Link company_id from empresa if empresa matches a company UUID or company name
DO $$ BEGIN
  UPDATE public.profiles
  SET company_id = empresa::text::uuid
  WHERE company_id IS NULL
    AND empresa IS NOT NULL
    AND empresa::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    AND EXISTS (SELECT 1 FROM public.companies c WHERE c.id = empresa::text::uuid);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

UPDATE public.profiles p
SET company_id = c.id
FROM public.companies c
WHERE p.company_id IS NULL
  AND p.empresa IS NOT NULL
  AND LOWER(TRIM(p.empresa::text)) = LOWER(TRIM(c.name));

-- Fallback for non-superadmin profiles if only 1 company exists
UPDATE public.profiles
SET company_id = (SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1)
WHERE company_id IS NULL
  AND LOWER(email) <> 'agenciavallor01@gmail.com'
  AND (SELECT count(*) FROM public.companies) = 1;

-- Permanent owner protection initialization in profiles
UPDATE public.profiles
SET is_owner = true,
    role = 'superadmin',
    status = 'ativo'
WHERE LOWER(email) = 'agenciavallor01@gmail.com';

-- ============================================================================
-- 3. CLIENTS (CUSTOMERS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  whatsapp TEXT,
  email TEXT,
  document TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all client columns exist
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS document TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Bridge from legacy 'customers' table if present in existing database
DO $$
DECLARE
  v_doc_col TEXT := 'NULL';
  v_comp_col TEXT := '(SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1)';
  v_id_expr TEXT := 'c.id';
  v_id_type TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'company_id') THEN
      v_comp_col := 'COALESCE(c.company_id, (SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1))';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'document') THEN
      v_doc_col := 'c.document::text';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'cpf_cnpj') THEN
      v_doc_col := 'c.cpf_cnpj::text';
    END IF;

    SELECT data_type INTO v_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'id';

    IF v_id_type = 'uuid' THEN
      v_id_expr := 'c.id';
    ELSE
      v_id_expr := 'gen_random_uuid()';
    END IF;

    EXECUTE format('
      INSERT INTO public.clients (id, company_id, name, phone, email, document, address, created_at)
      SELECT
        %s,
        %s,
        COALESCE(c.name::text, ''Cliente Registrado''),
        COALESCE(c.phone::text, ''''),
        c.email::text,
        %s,
        c.address::text,
        COALESCE(c.created_at, now())
      FROM public.customers c
      ON CONFLICT (id) DO NOTHING;
    ', v_id_expr, v_comp_col, v_doc_col);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ============================================================================
-- 4. SERVICES
-- Compatible with existing table containing:
-- id, cliente, created_at, company_id, user_id, customer_id, work_order_id, tipo, status, valor_cents, recebido_cents, data
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add all required application columns incrementally
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS work_order_id UUID;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS cliente TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'instalacao';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'andamento';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS deposit_value NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS pending_balance NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS total_value NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS valor_cents INTEGER;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS recebido_cents INTEGER;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS data DATE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Data reconciliation for services (safe conversions for numeric cents, text, date and UUIDs)
UPDATE public.services SET title = COALESCE(title::text, tipo::text, cliente::text, 'Serviço Padrão') WHERE title IS NULL;

UPDATE public.services
SET total_value = COALESCE(
  total_value,
  CASE
    WHEN valor_cents IS NOT NULL AND valor_cents::text ~ '^-?\d+(\.\d+)?$' THEN (valor_cents::text::numeric / 100.0)
    ELSE NULL
  END,
  0.00
) WHERE total_value IS NULL OR total_value = 0.00;

UPDATE public.services
SET deposit_value = COALESCE(
  deposit_value,
  CASE
    WHEN recebido_cents IS NOT NULL AND recebido_cents::text ~ '^-?\d+(\.\d+)?$' THEN (recebido_cents::text::numeric / 100.0)
    ELSE NULL
  END,
  0.00
) WHERE deposit_value IS NULL;

UPDATE public.services
SET pending_balance = COALESCE(pending_balance, total_value - deposit_value, 0.00)
WHERE pending_balance IS NULL;

UPDATE public.services
SET scheduled_date = CASE
  WHEN scheduled_date IS NOT NULL THEN scheduled_date
  WHEN data IS NULL THEN NULL
  WHEN data::text ~ '^\d{4}-\d{2}-\d{2}' THEN substring(data::text, 1, 10)::date
  WHEN data::text ~ '^\d{2}/\d{2}/\d{4}' THEN to_date(substring(data::text, 1, 10), 'DD/MM/YYYY')
  WHEN data::text ~ '^\d{2}-\d{2}-\d{4}' THEN to_date(substring(data::text, 1, 10), 'DD-MM-YYYY')
  ELSE NULL
END
WHERE scheduled_date IS NULL AND data IS NOT NULL;

-- Safe cast from customer_id to client_id (using ::text::uuid with existence check)
UPDATE public.services
SET client_id = customer_id::text::uuid
WHERE client_id IS NULL
  AND customer_id IS NOT NULL
  AND customer_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND EXISTS (SELECT 1 FROM public.clients cl WHERE cl.id = customer_id::text::uuid);

-- Link client_id by client name if customer_id was null or not UUID
UPDATE public.services s
SET client_id = cl.id
FROM public.clients cl
WHERE s.client_id IS NULL
  AND s.cliente IS NOT NULL
  AND (s.company_id = cl.company_id OR s.company_id IS NULL)
  AND LOWER(TRIM(s.cliente::text)) = LOWER(TRIM(cl.name));

-- Normalize service_type and status
UPDATE public.services
SET service_type = CASE
  WHEN LOWER(COALESCE(service_type::text, tipo::text, '')) LIKE '%manut%' THEN 'manutencao'
  WHEN LOWER(COALESCE(service_type::text, tipo::text, '')) LIKE '%higien%' THEN 'higienizacao'
  WHEN LOWER(COALESCE(service_type::text, tipo::text, '')) LIKE '%repar%' THEN 'reparo'
  ELSE 'instalacao'
END
WHERE service_type IS NULL OR service_type NOT IN ('instalacao', 'manutencao', 'higienizacao', 'reparo');

UPDATE public.services
SET status = CASE
  WHEN LOWER(status::text) LIKE '%concl%' THEN 'concluido'
  WHEN LOWER(status::text) LIKE '%canc%' THEN 'cancelado'
  ELSE 'andamento'
END
WHERE status IS NULL OR status NOT IN ('andamento', 'concluido', 'cancelado');

-- ============================================================================
-- 5. BUDGETS & BUDGET LINE ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL DEFAULT '',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  service_type TEXT NOT NULL DEFAULT 'instalacao',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  suggested_deposit NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'enviado',
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incremental column additions for budgets
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS code TEXT DEFAULT '';
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT '';
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'instalacao';
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS total_value NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS suggested_deposit NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'enviado';
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  type TEXT NOT NULL DEFAULT 'mao_de_obra',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incremental column additions for budget_items
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE;
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS quantity NUMERIC(10,2) DEFAULT 1;
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'mao_de_obra';

-- Reconcile legacy quotes table if present (fully dynamic to avoid parse-time missing column errors)
DO $$
DECLARE
  v_comp_expr TEXT := '(SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1)';
  v_cust_expr TEXT := 'NULL::uuid';
  v_num_expr TEXT := 'substr(q.id::text, 1, 6)';
  v_sub_expr TEXT := '0.00';
  v_disc_expr TEXT := '0.00';
  v_tot_expr TEXT := '0.00';
  v_dep_expr TEXT := '0.00';
  v_stat_expr TEXT := '''enviado''';
  v_valid_expr TEXT := 'NULL::date';
  v_notes_expr TEXT := 'NULL::text';
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'company_id') THEN
      v_comp_expr := 'COALESCE(q.company_id, (SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1))';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'customer_id') THEN
      v_cust_expr := 'q.customer_id';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'quote_number') THEN
      v_num_expr := 'COALESCE(q.quote_number::text, substr(q.id::text, 1, 6))';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'subtotal_cents') THEN
      v_sub_expr := 'COALESCE(q.subtotal_cents / 100.0, 0.00)';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'discount_cents') THEN
      v_disc_expr := 'COALESCE(q.discount_cents / 100.0, 0.00)';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'total_cents') THEN
      v_tot_expr := 'COALESCE(q.total_cents / 100.0, 0.00)';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'entry_cents') THEN
      v_dep_expr := 'COALESCE(q.entry_cents / 100.0, 0.00)';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'status') THEN
      v_stat_expr := 'LOWER(COALESCE(q.status, ''enviado''))';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'valid_until') THEN
      v_valid_expr := 'q.valid_until';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'notes') THEN
      v_notes_expr := 'q.notes';
    END IF;

    EXECUTE format('
      INSERT INTO public.budgets (
        id, code, company_id, client_id, client_name, title, service_type,
        subtotal, discount, total_value, suggested_deposit, status, valid_until, notes, created_at, updated_at
      )
      SELECT
        q.id,
        ''ORC-'' || %s,
        %s,
        %s,
        COALESCE((SELECT c.name FROM public.clients c WHERE c.id = %s), ''Cliente''),
        ''Orçamento Comercial'',
        ''instalacao'',
        %s,
        %s,
        %s,
        %s,
        %s,
        %s,
        %s,
        COALESCE(q.created_at, now()),
        COALESCE(q.updated_at, now())
      FROM public.quotes q
      ON CONFLICT (id) DO NOTHING;
    ', v_num_expr, v_comp_expr, v_cust_expr, v_cust_expr, v_sub_expr, v_disc_expr, v_tot_expr, v_dep_expr, v_stat_expr, v_valid_expr, v_notes_expr);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- 6. WORK ORDERS
-- Compatible with existing table containing:
-- id, company_id, order_number, customer_id, quote_id, team_id, installer_id, service_type, description, equipment, address...
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add all required application columns incrementally
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS quote_id UUID;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS team_id UUID;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS installer_id UUID;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS assigned_technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS assigned_technician_name TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT '';
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS equipment TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'instalacao';
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente';
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS total_value NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS deposit_value NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS pending_balance NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS completed_date TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS client_signature TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS client_signature_date TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Data reconciliation for work orders (safe type casts)
UPDATE public.work_orders
SET code = COALESCE(code::text, order_number::text, 'OS-2026-' || UPPER(substr(id::text, 1, 6)))
WHERE code IS NULL;

UPDATE public.work_orders
SET client_id = customer_id::text::uuid
WHERE client_id IS NULL
  AND customer_id IS NOT NULL
  AND customer_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND EXISTS (SELECT 1 FROM public.clients cl WHERE cl.id = customer_id::text::uuid);

UPDATE public.work_orders
SET client_address = COALESCE(client_address::text, address::text)
WHERE client_address IS NULL AND address IS NOT NULL;

UPDATE public.work_orders
SET assigned_technician_id = installer_id::text::uuid
WHERE assigned_technician_id IS NULL
  AND installer_id IS NOT NULL
  AND installer_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = installer_id::text::uuid);

-- Enrich client name and phone from public.clients
UPDATE public.work_orders wo
SET client_name = cl.name,
    client_phone = COALESCE(wo.client_phone, cl.phone, cl.whatsapp)
FROM public.clients cl
WHERE wo.client_id = cl.id
  AND (wo.client_name IS NULL OR wo.client_name = '' OR wo.client_name = 'Cliente');

UPDATE public.work_orders
SET client_name = COALESCE(NULLIF(client_name::text, ''), 'Cliente')
WHERE client_name IS NULL OR client_name = '';

-- Enrich technician name from public.profiles
UPDATE public.work_orders wo
SET assigned_technician_name = COALESCE(p.name, p.nome, split_part(p.email, '@', 1))
FROM public.profiles p
WHERE wo.assigned_technician_id = p.id
  AND (wo.assigned_technician_name IS NULL OR wo.assigned_technician_name = '');

-- Reconcile financials from linked quotes if available (dynamic to avoid missing column errors)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'total_cents') THEN
    EXECUTE '
      UPDATE public.work_orders wo
      SET total_value = COALESCE(NULLIF(wo.total_value, 0.00), (q.total_cents / 100.0), 0.00),
          deposit_value = COALESCE(NULLIF(wo.deposit_value, 0.00), (q.entry_cents / 100.0), 0.00),
          pending_balance = COALESCE(NULLIF(wo.pending_balance, 0.00), (q.balance_cents / 100.0), 0.00)
      FROM public.quotes q
      WHERE wo.quote_id = q.id
        AND (wo.total_value IS NULL OR wo.total_value = 0.00);
    ';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Normalize service_type and status
UPDATE public.work_orders
SET service_type = CASE
  WHEN LOWER(service_type::text) LIKE '%manut%' THEN 'manutencao'
  WHEN LOWER(service_type::text) LIKE '%higien%' THEN 'higienizacao'
  WHEN LOWER(service_type::text) LIKE '%repar%' THEN 'reparo'
  ELSE 'instalacao'
END
WHERE service_type IS NOT NULL AND service_type NOT IN ('instalacao', 'manutencao', 'higienizacao', 'reparo');

UPDATE public.work_orders
SET status = CASE
  WHEN LOWER(status::text) LIKE '%concl%' THEN 'concluido'
  WHEN LOWER(status::text) LIKE '%canc%' THEN 'cancelado'
  WHEN LOWER(status::text) LIKE '%execu%' OR LOWER(status::text) LIKE '%desloc%' THEN 'em_execucao'
  ELSE 'pendente'
END
WHERE status IS NOT NULL AND status NOT IN ('pendente', 'em_execucao', 'concluido', 'cancelado');

-- ============================================================================
-- 7. TEAM MEMBERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'instalador',
  status TEXT NOT NULL DEFAULT 'ativo',
  assigned_orders_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incremental column additions for team_members
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Membro da Equipe';
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS email TEXT DEFAULT 'membro@instalasaldo.com.br';
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'instalador';
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS assigned_orders_count INTEGER DEFAULT 0;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Reconcile legacy company_members if present (dynamic to avoid parse-time errors)
DO $$
DECLARE
  v_comp_expr TEXT := '(SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1)';
  v_role_expr TEXT := '''instalador''';
  v_stat_expr TEXT := '''ativo''';
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_members') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_members' AND column_name = 'company_id') THEN
      v_comp_expr := 'COALESCE(cm.company_id, (SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1))';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_members' AND column_name = 'role') THEN
      v_role_expr := 'COALESCE(cm.role, ''instalador'')';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_members' AND column_name = 'status') THEN
      v_stat_expr := 'COALESCE(cm.status, ''ativo'')';
    END IF;

    EXECUTE format('
      INSERT INTO public.team_members (id, company_id, user_id, name, email, role, status, created_at, updated_at)
      SELECT
        cm.id,
        %s,
        cm.user_id,
        COALESCE(p.name, p.nome, split_part(p.email, ''@'', 1), ''Membro da Equipe''),
        COALESCE(p.email, ''membro@instalasaldo.com.br''),
        %s,
        %s,
        COALESCE(cm.created_at, now()),
        COALESCE(cm.updated_at, now())
      FROM public.company_members cm
      LEFT JOIN public.profiles p ON p.id = cm.user_id
      ON CONFLICT (id) DO NOTHING;
    ', v_comp_expr, v_role_expr, v_stat_expr);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- 8. INVOICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pago',
  payment_method TEXT NOT NULL DEFAULT 'pix',
  gateway_transaction_id TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incremental column additions for invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'Profissional';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) DEFAULT 97.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_date DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pago';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pix';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 9. WHATSAPP DISPATCH LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_dispatch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  format TEXT NOT NULL DEFAULT 'documento_formatado',
  provider TEXT NOT NULL DEFAULT 'manual_fallback',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'enviado',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incremental column additions for whatsapp_dispatch_logs
ALTER TABLE public.whatsapp_dispatch_logs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.whatsapp_dispatch_logs ADD COLUMN IF NOT EXISTS work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_dispatch_logs ADD COLUMN IF NOT EXISTS recipient_phone TEXT DEFAULT '';
ALTER TABLE public.whatsapp_dispatch_logs ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE public.whatsapp_dispatch_logs ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'documento_formatado';
ALTER TABLE public.whatsapp_dispatch_logs ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'manual_fallback';
ALTER TABLE public.whatsapp_dispatch_logs ADD COLUMN IF NOT EXISTS provider_message_id TEXT;
ALTER TABLE public.whatsapp_dispatch_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'enviado';
ALTER TABLE public.whatsapp_dispatch_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.whatsapp_dispatch_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 10. AUDIT LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incremental column additions for audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action TEXT DEFAULT 'update';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target TEXT DEFAULT 'system';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 11. INDEXES (SAFE & VERIFIED)
-- Executed strictly after columns are guaranteed to exist with defensive check
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'document') THEN
    CREATE INDEX IF NOT EXISTS idx_companies_document ON public.companies(document);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'cnpj_cpf') THEN
    CREATE INDEX IF NOT EXISTS idx_companies_cnpj_cpf ON public.companies(cnpj_cpf);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'company_id') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'company_id') THEN
    CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'company_id') THEN
    CREATE INDEX IF NOT EXISTS idx_services_company ON public.services(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'client_id') THEN
    CREATE INDEX IF NOT EXISTS idx_services_client ON public.services(client_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'company_id') THEN
    CREATE INDEX IF NOT EXISTS idx_budgets_company ON public.budgets(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'client_id') THEN
    CREATE INDEX IF NOT EXISTS idx_budgets_client ON public.budgets(client_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'budget_items' AND column_name = 'budget_id') THEN
    CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON public.budget_items(budget_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'company_id') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_company ON public.work_orders(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'client_id') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_client ON public.work_orders(client_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'assigned_technician_id') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_tech ON public.work_orders(assigned_technician_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_members' AND column_name = 'company_id') THEN
    CREATE INDEX IF NOT EXISTS idx_team_members_company ON public.team_members(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'company_id') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_company ON public.invoices(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'whatsapp_dispatch_logs' AND column_name = 'company_id') THEN
    CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_company ON public.whatsapp_dispatch_logs(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'company_id') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON public.audit_logs(company_id);
  END IF;
END $$;
