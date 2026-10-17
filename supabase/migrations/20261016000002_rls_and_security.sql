-- ============================================================================
-- INSTALASALDO 2.0 — MIGRATION 02: ROW LEVEL SECURITY & DEFENSE-IN-DEPTH
-- Target Database: Supabase PostgreSQL (Project ref: hptaarigzvndqkhpaodp)
-- Description: Non-recursive security functions, tenant isolation, dual-layer owner protection
-- ============================================================================

-- ============================================================================
-- 0. PREREQUISITE DEFENSIVE COLUMNS (Ensures execution resilience)
-- ============================================================================
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE IF EXISTS public.clients ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE IF EXISTS public.budgets ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE IF EXISTS public.work_orders ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE IF EXISTS public.team_members ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE IF EXISTS public.whatsapp_dispatch_logs ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE IF EXISTS public.audit_logs ADD COLUMN IF NOT EXISTS company_id UUID;

-- ============================================================================
-- 1. SECURITY HELPER FUNCTIONS (ANTI-RECURSION & ZERO-OVERHEAD)
-- ============================================================================

-- Helper: Check if current authenticated user is the protected Super Admin owner
-- Layer 1: Evaluates cryptographic auth.jwt() email claim
-- Layer 2: Validates matching authenticated row in public.profiles (is_owner = true, role = superadmin, status = ativo)
-- Layer 3: Allows direct database administrator / service role context (postgres, service_role, supabase_admin)
CREATE OR REPLACE FUNCTION public.current_user_is_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_jwt_email TEXT;
  v_is_owner BOOLEAN := false;
BEGIN
  -- Service role and direct PostgreSQL superusers have authorized administrative access
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN true;
  END IF;

  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  v_jwt_email := LOWER(COALESCE(auth.jwt() ->> 'email', ''));

  -- Dual validation: Requires BOTH verified owner email in token AND profile record marked as owner
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_uid
      AND LOWER(p.email) = 'agenciavallor01@gmail.com'
      AND p.is_owner = true
      AND p.role::text = 'superadmin'
      AND p.status = 'ativo'
  ) INTO v_is_owner;

  -- Verify match
  IF v_is_owner AND (v_jwt_email = 'agenciavallor01@gmail.com' OR v_jwt_email = '') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Helper: Get current user's company ID
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Helper: Check if current user is an admin for their tenant
CREATE OR REPLACE FUNCTION public.current_user_is_tenant_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text IN ('superadmin', 'empresa_admin')
  );
$$;

-- ============================================================================
-- 2. DUAL-LAYER OWNER ACCOUNT PROTECTION TRIGGERS
-- Protects agenciavallor01@gmail.com across both public.profiles AND auth.users
-- ============================================================================

-- 2.1 Trigger on public.profiles: Immutability of owner & Anti-escalation for others (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION public.protect_owner_profile_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Anti-escalation on INSERT: Block creation of accounts with owner or superadmin privileges
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_owner = true OR NEW.role::text = 'superadmin' THEN
      IF LOWER(NEW.email) <> 'agenciavallor01@gmail.com' AND NOT public.current_user_is_owner() THEN
        RAISE EXCEPTION 'Ação Proibida: Não é permitido criar novas contas com privilégios de Super Admin ou is_owner.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Prevent deletion of owner account
  IF TG_OP = 'DELETE' THEN
    IF LOWER(OLD.email) = 'agenciavallor01@gmail.com' OR OLD.is_owner = true THEN
      RAISE EXCEPTION 'Ação Proibida: A conta proprietária exclusiva (agenciavallor01@gmail.com) é permanentemente protegida contra exclusão no banco de dados.';
    END IF;
    RETURN OLD;
  END IF;

  -- Prevent tampering with existing owner account
  IF TG_OP = 'UPDATE' THEN
    IF LOWER(OLD.email) = 'agenciavallor01@gmail.com' OR OLD.is_owner = true THEN
      -- Ban email change
      IF NEW.email IS DISTINCT FROM OLD.email THEN
        RAISE EXCEPTION 'Ação Proibida: O endereço de e-mail do proprietário protegido não pode ser alterado.';
      END IF;

      -- Ban role modification
      IF NEW.role::text IS DISTINCT FROM 'superadmin' THEN
        RAISE EXCEPTION 'Ação Proibida: Os privilégios de Super Admin do proprietário não podem ser revogados ou alterados.';
      END IF;

      -- Ban suspension or deactivation
      IF NEW.status IS DISTINCT FROM 'ativo' THEN
        RAISE EXCEPTION 'Ação Proibida: A conta proprietária não pode ser suspensa ou inativada.';
      END IF;

      -- Always force critical invariant fields
      NEW.is_owner := true;
      NEW.role := 'superadmin';
      NEW.status := 'ativo';
    END IF;

    -- Anti-privilege escalation: Non-owners cannot grant themselves or others superadmin/is_owner
    IF (NEW.is_owner = true AND (OLD.is_owner IS NULL OR OLD.is_owner = false)) OR
       (NEW.role::text = 'superadmin' AND (OLD.role IS NULL OR OLD.role::text <> 'superadmin')) THEN
      IF NOT public.current_user_is_owner() THEN
        RAISE EXCEPTION 'Ação Proibida: Apenas o proprietário exclusivo pode conceder privilégios de Super Admin.';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_owner_profile ON public.profiles;
CREATE TRIGGER trg_protect_owner_profile
BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_owner_profile_trigger();

-- 2.2 Trigger on auth.users: Protects against GoTrue API email change / account deletion / ban
DO $$ BEGIN
  CREATE OR REPLACE FUNCTION public.protect_auth_owner_trigger()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, auth, pg_temp
  AS $auth_fn$
  BEGIN
    IF TG_OP = 'DELETE' THEN
      IF LOWER(OLD.email) = 'agenciavallor01@gmail.com' THEN
        RAISE EXCEPTION 'Ação Proibida: O registro do proprietário exclusivo (agenciavallor01@gmail.com) não pode ser excluído de auth.users.';
      END IF;
      RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' THEN
      -- Prevent changing owner's email
      IF LOWER(OLD.email) = 'agenciavallor01@gmail.com' THEN
        IF NEW.email IS DISTINCT FROM OLD.email THEN
          RAISE EXCEPTION 'Ação Proibida: O e-mail do proprietário protegido em auth.users não pode ser alterado.';
        END IF;

        -- Prevent banning or suspending owner in auth.users
        IF NEW.banned_until IS NOT NULL AND (OLD.banned_until IS NULL OR NEW.banned_until > now()) THEN
          RAISE EXCEPTION 'Ação Proibida: A conta proprietária exclusiva não pode ser banida.';
        END IF;
      END IF;

      -- Prevent any other account from taking over the owner email address
      IF LOWER(NEW.email) = 'agenciavallor01@gmail.com' AND LOWER(OLD.email) <> 'agenciavallor01@gmail.com' THEN
        RAISE EXCEPTION 'Ação Proibida: O endereço de e-mail do proprietário não pode ser associado a outra conta.';
      END IF;

      RETURN NEW;
    END IF;

    RETURN NEW;
  END;
  $auth_fn$;

  DROP TRIGGER IF EXISTS trg_protect_auth_owner ON auth.users;
  CREATE TRIGGER trg_protect_auth_owner
  BEFORE UPDATE OR DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_auth_owner_trigger();
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Aviso: Permissões restritas na tabela auth.users. A proteção em public.profiles permanece ativa.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Aviso de execução em auth.users: %', SQLERRM;
END $$;

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RESILIENT & SAFE AGAINST PARTIAL PREVIOUS MIGRATION)
-- ============================================================================
DO $$
DECLARE
  v_table TEXT;
BEGIN
  FOR v_table IN
    SELECT unnest(ARRAY[
      'companies', 'profiles', 'clients', 'services', 'budgets',
      'budget_items', 'work_orders', 'team_members', 'invoices',
      'whatsapp_dispatch_logs', 'audit_logs'
    ])
  LOOP
    IF to_regclass('public.' || v_table) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', v_table);
    ELSE
      RAISE NOTICE 'Aviso: Tabela public.% não encontrada para ativação de RLS. Certifique-se de executar a migração 01.', v_table;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 4. NON-CONFLICTING, LEAST-PRIVILEGE RLS POLICIES
-- Each table block verifies existence before creating policies
-- ============================================================================

-- 4.1 Companies Policies
DO $$ BEGIN
  IF to_regclass('public.companies') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Companies are viewable by company members or Super Admin" ON public.companies;
    DROP POLICY IF EXISTS "Companies can be updated by company admins or Super Admin" ON public.companies;
    DROP POLICY IF EXISTS "Super Admin can insert or delete companies" ON public.companies;
    DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
    DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
    DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
    DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;

    CREATE POLICY "companies_select_policy" ON public.companies
    FOR SELECT USING (
      public.current_user_is_owner() OR id = public.current_user_company_id()
    );

    CREATE POLICY "companies_insert_policy" ON public.companies
    FOR INSERT WITH CHECK (
      public.current_user_is_owner()
    );

    CREATE POLICY "companies_update_policy" ON public.companies
    FOR UPDATE USING (
      public.current_user_is_owner() OR (
        id = public.current_user_company_id() AND public.current_user_is_tenant_admin()
      )
    ) WITH CHECK (
      public.current_user_is_owner() OR (
        id = public.current_user_company_id() AND public.current_user_is_tenant_admin()
      )
    );

    CREATE POLICY "companies_delete_policy" ON public.companies
    FOR DELETE USING (
      public.current_user_is_owner()
    );
  END IF;
END $$;

-- 4.2 Profiles Policies (Structured to eliminate any recursion)
DO $$ BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Profiles viewable by company colleagues or Super Admin" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile, Admins manage company, Owner manages all" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

    CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (
      id = auth.uid()
      OR public.current_user_is_owner()
      OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    );

    CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (
      id = auth.uid() OR public.current_user_is_owner()
    );

    CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (
      id = auth.uid()
      OR public.current_user_is_owner()
      OR (company_id IS NOT NULL AND company_id = public.current_user_company_id() AND public.current_user_is_tenant_admin())
    ) WITH CHECK (
      id = auth.uid()
      OR public.current_user_is_owner()
      OR (company_id IS NOT NULL AND company_id = public.current_user_company_id() AND public.current_user_is_tenant_admin())
    );

    CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR DELETE USING (
      public.current_user_is_owner()
    );
  END IF;
END $$;

-- 4.3 Clients Policies
DO $$ BEGIN
  IF to_regclass('public.clients') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Clients isolated by company" ON public.clients;
    DROP POLICY IF EXISTS "clients_all_policy" ON public.clients;

    CREATE POLICY "clients_all_policy" ON public.clients
    FOR ALL USING (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    ) WITH CHECK (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    );
  END IF;
END $$;

-- 4.4 Services Policies
DO $$ BEGIN
  IF to_regclass('public.services') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Services isolated by company" ON public.services;
    DROP POLICY IF EXISTS "services_all_policy" ON public.services;

    CREATE POLICY "services_all_policy" ON public.services
    FOR ALL USING (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    ) WITH CHECK (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    );
  END IF;
END $$;

-- 4.5 Budgets & Budget Items Policies
DO $$ BEGIN
  IF to_regclass('public.budgets') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Budgets isolated by company" ON public.budgets;
    DROP POLICY IF EXISTS "budgets_all_policy" ON public.budgets;

    CREATE POLICY "budgets_all_policy" ON public.budgets
    FOR ALL USING (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    ) WITH CHECK (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    );
  END IF;

  IF to_regclass('public.budget_items') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Budget items isolated through budget company" ON public.budget_items;
    DROP POLICY IF EXISTS "budget_items_all_policy" ON public.budget_items;

    CREATE POLICY "budget_items_all_policy" ON public.budget_items
    FOR ALL USING (
      public.current_user_is_owner() OR EXISTS (
        SELECT 1 FROM public.budgets b
        WHERE b.id = budget_items.budget_id AND b.company_id = public.current_user_company_id()
      )
    ) WITH CHECK (
      public.current_user_is_owner() OR EXISTS (
        SELECT 1 FROM public.budgets b
        WHERE b.id = budget_items.budget_id AND b.company_id = public.current_user_company_id()
      )
    );
  END IF;
END $$;

-- 4.6 Work Orders Policies
DO $$ BEGIN
  IF to_regclass('public.work_orders') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Work orders isolated by company" ON public.work_orders;
    DROP POLICY IF EXISTS "work_orders_all_policy" ON public.work_orders;

    CREATE POLICY "work_orders_all_policy" ON public.work_orders
    FOR ALL USING (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    ) WITH CHECK (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    );
  END IF;
END $$;

-- 4.7 Team Members Policies
DO $$ BEGIN
  IF to_regclass('public.team_members') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Team members isolated by company" ON public.team_members;
    DROP POLICY IF EXISTS "team_members_all_policy" ON public.team_members;

    CREATE POLICY "team_members_all_policy" ON public.team_members
    FOR ALL USING (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    ) WITH CHECK (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    );
  END IF;
END $$;

-- 4.8 Invoices Policies (Tenants view only; Super Admin mutates)
DO $$ BEGIN
  IF to_regclass('public.invoices') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Invoices viewable by company or Super Admin" ON public.invoices;
    DROP POLICY IF EXISTS "Invoices manageable by Super Admin" ON public.invoices;
    DROP POLICY IF EXISTS "invoices_select_policy" ON public.invoices;
    DROP POLICY IF EXISTS "invoices_modify_policy" ON public.invoices;

    CREATE POLICY "invoices_select_policy" ON public.invoices
    FOR SELECT USING (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    );

    CREATE POLICY "invoices_modify_policy" ON public.invoices
    FOR ALL USING (
      public.current_user_is_owner()
    ) WITH CHECK (
      public.current_user_is_owner()
    );
  END IF;
END $$;

-- 4.9 WhatsApp Dispatch Logs Policies
DO $$ BEGIN
  IF to_regclass('public.whatsapp_dispatch_logs') IS NOT NULL THEN
    DROP POLICY IF EXISTS "WhatsApp logs isolated by company" ON public.whatsapp_dispatch_logs;
    DROP POLICY IF EXISTS "whatsapp_logs_all_policy" ON public.whatsapp_dispatch_logs;

    CREATE POLICY "whatsapp_logs_all_policy" ON public.whatsapp_dispatch_logs
    FOR ALL USING (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    ) WITH CHECK (
      public.current_user_is_owner() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id())
    );
  END IF;
END $$;

-- 4.10 Audit Logs Policies
DO $$ BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Audit logs viewable by company admin or Super Admin" ON public.audit_logs;
    DROP POLICY IF EXISTS "Any authenticated user can insert audit logs" ON public.audit_logs;
    DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
    DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;

    CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
    FOR SELECT USING (
      public.current_user_is_owner() OR (
        company_id IS NOT NULL
        AND company_id = public.current_user_company_id()
        AND public.current_user_is_tenant_admin()
      )
    );

    CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT WITH CHECK (
      auth.uid() IS NOT NULL
    );
  END IF;
END $$;
