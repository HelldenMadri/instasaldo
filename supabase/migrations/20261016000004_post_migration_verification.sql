-- ============================================================================
-- INSTALASALDO 2.0 — POST-MIGRATION VERIFICATION SCRIPT
-- Target Database: Supabase PostgreSQL (Project ref: hptaarigzvndqkhpaodp)
-- Description: Diagnostic queries to validate schema integrity, RLS, policies, indexes, and triggers
-- ============================================================================

-- 1. VERIFY CORE TABLES EXISTENCE
SELECT
  table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND information_schema.tables.table_name = expected.table_name
  ) AS is_present
FROM (
  VALUES
    ('companies'),
    ('profiles'),
    ('clients'),
    ('services'),
    ('budgets'),
    ('budget_items'),
    ('work_orders'),
    ('team_members'),
    ('invoices'),
    ('whatsapp_dispatch_logs'),
    ('audit_logs')
) AS expected(table_name)
ORDER BY table_name;

-- 2. VERIFY CRITICAL COLUMNS AND DATA BRIDGES
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'companies' AND column_name IN ('id', 'name', 'document', 'cnpj_cpf', 'plan', 'monthly_price', 'status', 'plan_status', 'whatsapp_config'))
    OR (table_name = 'profiles' AND column_name IN ('id', 'email', 'name', 'nome', 'role', 'company_id', 'empresa', 'is_owner', 'status'))
    OR (table_name = 'services' AND column_name IN ('id', 'company_id', 'client_id', 'customer_id', 'title', 'total_value', 'deposit_value', 'pending_balance'))
    OR (table_name = 'work_orders' AND column_name IN ('id', 'company_id', 'code', 'order_number', 'client_id', 'customer_id', 'total_value', 'assigned_technician_id'))
    OR (table_name = 'clients' AND column_name IN ('id', 'company_id', 'name', 'phone', 'email', 'document'))
  )
ORDER BY table_name, column_name;

-- 3. VERIFY ROW LEVEL SECURITY (RLS) STATUS ON ALL PUBLIC TABLES
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'companies', 'profiles', 'clients', 'services', 'budgets',
    'budget_items', 'work_orders', 'team_members', 'invoices',
    'whatsapp_dispatch_logs', 'audit_logs'
  )
ORDER BY tablename;

-- 4. VERIFY ACTIVE RLS POLICIES
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. VERIFY SYSTEM TRIGGERS (OWNER IMMUTABILITY & AUTH HOOK)
SELECT
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE (event_object_schema = 'public' AND event_object_table = 'profiles')
   OR (event_object_schema = 'auth' AND event_object_table = 'users')
ORDER BY event_object_table, trigger_name;

-- 6. VERIFY OWNER ACCOUNT IMMUTABILITY IN PROFILES
SELECT
  id,
  email,
  name,
  nome,
  role,
  is_owner,
  status
FROM public.profiles
WHERE LOWER(email) = 'agenciavallor01@gmail.com';

-- 7. VERIFY OFFICIAL SUBSCRIPTION PRICING IN SEED/EXISTING COMPANIES
-- Expected: Essencial R$ 37.00 | Profissional R$ 97.00 | Empresa R$ 147.00
SELECT
  id,
  name,
  document,
  plan,
  monthly_price,
  plan_status,
  account_status
FROM public.companies
ORDER BY monthly_price ASC;
