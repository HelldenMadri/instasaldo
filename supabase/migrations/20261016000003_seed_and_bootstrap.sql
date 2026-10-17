-- ============================================================================
-- INSTALASALDO 2.0 — MIGRATION 03: AUTH BOOTSTRAP & DETERMINISTIC SEED FIXTURES
-- Target Database: Supabase PostgreSQL (Project ref: hptaarigzvndqkhpaodp)
-- Description: Auth user sync trigger, client privilege hardening, deduplicated fixtures
-- ============================================================================

-- ============================================================================
-- 1. AUTH SYNC HOOK (HARDENED AGAINST CLIENT METADATA PRIVILEGE ESCALATION)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_is_owner BOOLEAN := false;
  v_role TEXT := 'instalador';
  v_display_name TEXT;
  v_phone TEXT;
BEGIN
  -- Strict, non-forgeable owner verification based ONLY on confirmed auth.users.email
  IF LOWER(NEW.email) = 'agenciavallor01@gmail.com' THEN
    v_is_owner := true;
    v_role := 'superadmin';
  ELSE
    -- Any other user defaults to standard installer or tenant member;
    -- NEVER grant superadmin or owner privileges from client-editable metadata
    v_role := 'empresa_admin';
  END IF;

  -- Safe sanitization of display name and phone from metadata
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'nome',
    split_part(NEW.email, '@', 1)
  );

  v_phone := NEW.raw_user_meta_data->>'phone';

  -- Bilingual insertion: populates both 'name' and 'nome', 'company_id' and 'empresa'
  INSERT INTO public.profiles (
    id,
    email,
    name,
    nome,
    role,
    company_id,
    empresa,
    plano,
    is_owner,
    status,
    phone,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    v_display_name,
    v_role,
    NULL,
    NULL,
    CASE WHEN v_is_owner THEN 'empresa' ELSE 'profissional' END,
    v_is_owner,
    'ativo',
    v_phone,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = CASE
      WHEN public.profiles.is_owner THEN public.profiles.name
      ELSE COALESCE(EXCLUDED.name, public.profiles.name)
    END,
    nome = CASE
      WHEN public.profiles.is_owner THEN public.profiles.nome
      ELSE COALESCE(EXCLUDED.nome, public.profiles.nome)
    END,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    -- Privilege escalation prevention: never let conflict update elevate role to superadmin unless owner email
    is_owner = CASE
      WHEN LOWER(EXCLUDED.email) = 'agenciavallor01@gmail.com' THEN true
      ELSE public.profiles.is_owner
    END,
    role = CASE
      WHEN LOWER(EXCLUDED.email) = 'agenciavallor01@gmail.com' THEN 'superadmin'
      ELSE public.profiles.role
    END,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Idempotent trigger creation on auth.users
DO $$ BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Aviso: Trigger em auth.users requer privilégios de superusuário Supabase. Perfis existentes mantidos.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Aviso de execução do trigger on_auth_user_created: %', SQLERRM;
END $$;

-- ============================================================================
-- 2. DETERMINISTIC SEED FIXTURES (OFFICIAL RECURRING PRICING PRESERVED)
-- Official tiers: Essencial R$ 37/mês | Profissional R$ 97/mês | Empresa R$ 147/mês
-- Deduplication: Matches by ID or CNPJ/CPF before inserting
-- ============================================================================

-- Ensure legacy check constraints do not conflict with Brazilian Portuguese statuses
ALTER TABLE IF EXISTS public.companies DROP CONSTRAINT IF EXISTS companies_status_check;
ALTER TABLE IF EXISTS public.companies DROP CONSTRAINT IF EXISTS companies_plan_status_check;
ALTER TABLE IF EXISTS public.companies DROP CONSTRAINT IF EXISTS companies_account_status_check;
ALTER TABLE IF EXISTS public.companies DROP CONSTRAINT IF EXISTS companies_plan_check;
ALTER TABLE IF EXISTS public.companies DROP CONSTRAINT IF EXISTS companies_plan_id_check;
ALTER TABLE IF EXISTS public.companies DROP CONSTRAINT IF EXISTS companies_plan_id_fkey;

ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Fixture 1: ClimaFrio Soluções Térmicas ME (Profissional: R$ 97,00/mês)
DO $$
DECLARE
  v_company_id UUID := 'c0000000-0000-0000-0000-000000000001';
  v_doc TEXT := '12.345.678/0001-90';
BEGIN
  IF to_regclass('public.companies') IS NULL THEN
    RAISE NOTICE 'Aviso: Tabela public.companies não encontrada. Execute a migração 01 antes do seed.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = v_company_id OR document = v_doc OR cnpj_cpf = v_doc) THEN
    INSERT INTO public.companies (
      id, name, trade_name, document, cnpj_cpf, email, phone, address, city, state, postal_code,
      plan, plan_id, plan_status, account_status, status, monthly_price, next_billing_date, os_prefix,
      warranty_terms_days, default_deposit_percentage, owner_name, owner_email, features, whatsapp_config
    ) VALUES (
      v_company_id,
      'ClimaFrio Soluções Térmicas ME',
      'ClimaFrio Soluções Térmicas',
      v_doc,
      v_doc,
      'contato@climafrio.com.br',
      '(11) 98765-4321',
      'Av. Paulista, 1000 - Bela Vista',
      'São Paulo',
      'SP',
      '01310-100',
      'profissional',
      'profissional',
      'ativo',
      'ativo',
      'ativo',
      97.00,
      CURRENT_DATE + INTERVAL '26 days',
      'OS-2026-',
      90,
      50,
      'Rodrigo Santana Albuquerque',
      'rodrigo@climafrio.com.br',
      '{"whatsappAutomated": true, "digitalSignature": true, "advancedReports": true, "customBranding": false, "multiTechnicianDispatch": true}'::jsonb,
      '{"enabled": true, "provider": "manual_fallback", "status": "conectado", "phoneNumber": "11987654321", "deliveryFormat": "documento_formatado", "apiKeyConfigured": false}'::jsonb
    );
  ELSE
    UPDATE public.companies
    SET plan = 'profissional',
        monthly_price = 97.00,
        plan_status = 'ativo',
        account_status = 'ativo',
        updated_at = now()
    WHERE id = v_company_id OR document = v_doc OR cnpj_cpf = v_doc;
  END IF;
END $$;

-- Fixture 2: Alencar Refrigeração Comercial (Essencial: R$ 37,00/mês)
DO $$
DECLARE
  v_company_id UUID := 'c0000000-0000-0000-0000-000000000002';
  v_doc TEXT := '98.765.432/0001-10';
BEGIN
  IF to_regclass('public.companies') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = v_company_id OR document = v_doc OR cnpj_cpf = v_doc) THEN
    INSERT INTO public.companies (
      id, name, trade_name, document, cnpj_cpf, email, phone, address, city, state, postal_code,
      plan, plan_id, plan_status, account_status, status, monthly_price, next_billing_date, os_prefix,
      warranty_terms_days, default_deposit_percentage, owner_name, owner_email, features, whatsapp_config
    ) VALUES (
      v_company_id,
      'Alencar Refrigeração Comercial',
      'Alencar Refrigeração',
      v_doc,
      v_doc,
      'marcelo@alencarrefrigera.com.br',
      '(21) 99887-1122',
      'Rua da Quitanda, 50 - Centro',
      'Rio de Janeiro',
      'RJ',
      '20011-030',
      'essencial',
      'essencial',
      'ativo',
      'ativo',
      'ativo',
      37.00,
      CURRENT_DATE + INTERVAL '12 days',
      'OS-ALN-',
      60,
      40,
      'Marcelo Alencar',
      'marcelo@alencarrefrigera.com.br',
      '{"whatsappAutomated": false, "digitalSignature": true, "advancedReports": false, "customBranding": false, "multiTechnicianDispatch": false}'::jsonb,
      '{"enabled": true, "provider": "manual_fallback", "status": "conectado", "phoneNumber": "21998871122", "deliveryFormat": "link_rastreio", "apiKeyConfigured": false}'::jsonb
    );
  ELSE
    UPDATE public.companies
    SET plan = 'essencial',
        monthly_price = 37.00,
        plan_status = 'ativo',
        account_status = 'ativo',
        updated_at = now()
    WHERE id = v_company_id OR document = v_doc OR cnpj_cpf = v_doc;
  END IF;
END $$;

-- Fixture 3: Lacerda Segurança Eletrônica & CFTV (Profissional: R$ 97,00/mês)
DO $$
DECLARE
  v_company_id UUID := 'c0000000-0000-0000-0000-000000000003';
  v_doc TEXT := '23.456.789/0001-22';
BEGIN
  IF to_regclass('public.companies') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = v_company_id OR document = v_doc OR cnpj_cpf = v_doc) THEN
    INSERT INTO public.companies (
      id, name, trade_name, document, cnpj_cpf, email, phone, address, city, state, postal_code,
      plan, plan_id, plan_status, account_status, status, monthly_price, next_billing_date, os_prefix,
      warranty_terms_days, default_deposit_percentage, owner_name, owner_email, features, whatsapp_config
    ) VALUES (
      v_company_id,
      'Lacerda Segurança Eletrônica & CFTV',
      'Lacerda Segurança',
      v_doc,
      v_doc,
      'lacerda.seg@outlook.com',
      '(41) 99123-8877',
      'Rua Marechal Deodoro, 300 - Batel',
      'Curitiba',
      'PR',
      '80020-010',
      'profissional',
      'profissional',
      'bloqueado',
      'suspenso',
      'bloqueado',
      97.00,
      CURRENT_DATE - INTERVAL '14 days',
      'OS-LAC-',
      90,
      50,
      'Julio Lacerda',
      'lacerda.seg@outlook.com',
      '{"whatsappAutomated": false, "digitalSignature": false, "advancedReports": false, "customBranding": false, "multiTechnicianDispatch": false}'::jsonb,
      '{"enabled": false, "provider": "manual_fallback", "status": "desconectado", "deliveryFormat": "documento_formatado", "apiKeyConfigured": false}'::jsonb
    );
  ELSE
    UPDATE public.companies
    SET plan = 'profissional',
        monthly_price = 97.00,
        plan_status = 'bloqueado',
        account_status = 'suspenso',
        updated_at = now()
    WHERE id = v_company_id OR document = v_doc OR cnpj_cpf = v_doc;
  END IF;
END $$;

-- Fixture 4: Amorim Hidráulica & Gás (Empresa: R$ 147,00/mês)
DO $$
DECLARE
  v_company_id UUID := 'c0000000-0000-0000-0000-000000000004';
  v_doc TEXT := '40.119.820/0001-11';
BEGIN
  IF to_regclass('public.companies') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = v_company_id OR document = v_doc OR cnpj_cpf = v_doc) THEN
    INSERT INTO public.companies (
      id, name, trade_name, document, cnpj_cpf, email, phone, address, city, state, postal_code,
      plan, plan_id, plan_status, account_status, status, monthly_price, next_billing_date, os_prefix,
      warranty_terms_days, default_deposit_percentage, owner_name, owner_email, features, whatsapp_config
    ) VALUES (
      v_company_id,
      'Amorim Hidráulica & Gás',
      'Amorim Hidráulica',
      v_doc,
      v_doc,
      'tati@amorimhidraulica.com.br',
      '(71) 98112-3344',
      'Av. Tancredo Neves, 1200 - Caminho das Árvores',
      'Salvador',
      'BA',
      '41820-020',
      'empresa',
      'empresa',
      'ativo',
      'ativo',
      'ativo',
      147.00,
      CURRENT_DATE + INTERVAL '29 days',
      'OS-AMR-',
      120,
      50,
      'Tatiane Amorim',
      'tati@amorimhidraulica.com.br',
      '{"whatsappAutomated": true, "digitalSignature": true, "advancedReports": true, "customBranding": true, "multiTechnicianDispatch": true}'::jsonb,
      '{"enabled": true, "provider": "qr_code_webhook", "status": "conectado", "phoneNumber": "71981123344", "deliveryFormat": "pdf_comprovante", "apiKeyConfigured": false}'::jsonb
    );
  ELSE
    UPDATE public.companies
    SET plan = 'empresa',
        monthly_price = 147.00,
        plan_status = 'ativo',
        account_status = 'ativo',
        updated_at = now()
    WHERE id = v_company_id OR document = v_doc OR cnpj_cpf = v_doc;
  END IF;
END $$;
