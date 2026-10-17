// src/api.js — InstalaSaldo 2.0 Micro SaaS Data & Auth Layer
import { createClient } from '@supabase/supabase-js';
import { toCents, validatePayment, formatBRL } from './money.js';

// Supabase anon public key only (no service role in frontend)
const DEFAULT_URL = 'https://hptaarigzvndqkhpaodp.supabase.co';
const DEFAULT_KEY = 'sb_publishable_pfg6HPxYxwhlog3l42pQ-A_fKbTRLI2';

const SUPABASE_URL =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  DEFAULT_URL;

const SUPABASE_ANON_KEY =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  DEFAULT_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const SUPER_ADMIN_EMAIL = 'agenciavallor01@gmail.com';

// -------------------------------------------------------------
// CONFIGURAÇÃO CENTRAL DE PLANOS RECORRENTES MENSAIS (MICRO SAAS)
// -------------------------------------------------------------
export const SUBSCRIPTION_PLANS = {
  essencial: {
    id: 'essencial',
    name: 'Essencial',
    price_cents: 3700,
    price_formatted: 'R$ 37,00',
    billing_cycle: 'mensal',
    max_users: 1,
    max_teams: 1,
    max_services_monthly: 50,
    support: 'email',
    support_label: 'Suporte exclusivo por e-mail',
    has_whatsapp_support: false,
    features: {
      customers: true,
      services: true,
      finance_basic: true,
      quotes: false,
      work_orders: false,
      maintenance: false,
      teams: false,
      reports: false,
      whatsapp_support: false,
      email_support: true,
    },
    description: 'Para o profissional autônomo individual. Gestão básica, financeiro e suporte exclusivamente por e-mail.',
  },
  profissional: {
    id: 'profissional',
    name: 'Profissional',
    price_cents: 9700,
    price_formatted: 'R$ 97,00',
    billing_cycle: 'mensal',
    max_users: 5,
    max_teams: 2,
    max_services_monthly: 200,
    support: 'email_whatsapp',
    support_label: 'Suporte por e-mail e WhatsApp',
    has_whatsapp_support: true,
    features: {
      customers: true,
      services: true,
      finance_basic: true,
      quotes: true,
      work_orders: true,
      maintenance: true,
      teams: false,
      reports: false,
      whatsapp_support: true,
      email_support: true,
    },
    description: 'Para quem atende com agilidade: inclui Orçamentos, OS com fotos e assinatura, agenda preventiva e WhatsApp.',
  },
  empresa: {
    id: 'empresa',
    name: 'Empresa',
    price_cents: 14700,
    price_formatted: 'R$ 147,00',
    billing_cycle: 'mensal',
    max_users: 15,
    max_teams: 5,
    max_services_monthly: 1000,
    support: 'email_whatsapp',
    support_label: 'Suporte prioritário por e-mail e WhatsApp',
    has_whatsapp_support: true,
    features: {
      customers: true,
      services: true,
      finance_basic: true,
      quotes: true,
      work_orders: true,
      maintenance: true,
      teams: true,
      reports: true,
      whatsapp_support: true,
      email_support: true,
      audit: true,
    },
    description: 'Para empresas estruturadas: gestão completa de equipes (gerentes e instaladores), relatórios e auditoria.',
  },
};

export function normalizePlanKey(plan) {
  if (!plan || typeof plan !== 'string') return 'essencial';
  const p = plan.trim().toLowerCase();
  if (p === 'empresa' || p === 'enterprise') return 'empresa';
  if (p === 'profissional' || p === 'equipe' || p === 'pro') return 'profissional';
  return 'essencial';
}

export function canAccessFeature(featureKey, userEmail, currentPlan = 'essencial') {
  if (isSuperAdmin(userEmail)) return true; // Super Admin tem acesso irrestrito
  const key = normalizePlanKey(currentPlan);
  const plan = SUBSCRIPTION_PLANS[key] || SUBSCRIPTION_PLANS.essencial;
  return !!plan.features[featureKey];
}

// Safe Storage abstraction for offline resilience and tests
const memoryStore = new Map();

export function safeGetStorage(key) {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      return localStorage.getItem(key);
    }
  } catch (e) {}
  return memoryStore.get(key) || null;
}

export function safeSetStorage(key, value) {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem(key, value);
      return;
    }
  } catch (e) {}
  memoryStore.set(key, value);
}

// -------------------------------------------------------------
// 1. AUTENTICAÇÃO E SESSÃO
// -------------------------------------------------------------

export function isSuperAdmin(email) {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Checks with the database if the current authenticated session is Super Admin
 */
export async function verifySuperAdminRole() {
  try {
    const { data, error } = await supabase.rpc('is_super_admin');
    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch (e) {}

  // Fallback to checking active session email
  const session = await getSession();
  return isSuperAdmin(session?.user?.email);
}

/**
 * Sign in with email and password
 */
export async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('E-mail e senha são obrigatórios.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('user not found')) {
      throw new Error('E-mail ou senha incorretos.');
    }
    if (msg.includes('confirm') || msg.includes('email not confirmed')) {
      throw new Error('Por favor, confirme seu e-mail antes de entrar.');
    }
    throw new Error('Não foi possível entrar. Verifique seus dados e tente novamente.');
  }

  return data.session;
}

/**
 * Sign out current session
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

/**
 * Request password reset email
 */
export async function resetPassword(email) {
  if (!email || !email.trim()) {
    throw new Error('Informe o e-mail para recuperação.');
  }

  let redirectUrl = 'https://instalasaldo.vercel.app/redefinir-senha';
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    redirectUrl = `${window.location.origin}/redefinir-senha`;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: redirectUrl,
  });

  if (error) {
    console.warn('Erro ao solicitar reset de senha:', error);
  }

  // Resposta neutra para segurança contra enumeração de e-mails
  return { message: 'Se o e-mail estiver cadastrado, você receberá o link de recuperação.' };
}

/**
 * Set new password via Supabase Auth
 */
export async function updateUserPassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
  }
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return data.user;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// -------------------------------------------------------------
// 2. EMPRESA ATIVA E PERFIL
// -------------------------------------------------------------
const LS_COMPANY = 'instalasaldo_active_company';

export async function fetchCurrentCompany() {
  try {
    const session = await getSession();
    if (!session) return null;

    // Check membership from company_members
    const { data: memberData, error: memberErr } = await supabase
      .from('company_members')
      .select('company_id, role, status, companies(*)')
      .eq('user_id', session.user.id)
      .eq('status', 'ativo')
      .limit(1);

    if (!memberErr && memberData && memberData.length > 0) {
      const comp = memberData[0].companies || { id: memberData[0].company_id, name: 'InstalaSaldo' };
      comp.userRole = memberData[0].role;
      safeSetStorage(LS_COMPANY, JSON.stringify(comp));
      return comp;
    }
  } catch (e) {}

  const cached = safeGetStorage(LS_COMPANY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  return {
    id: 'empresa-solo-01',
    name: 'Minha Empresa',
    plan_id: 'solo',
    userRole: 'admin',
  };
}

export async function migrateCompanyPlan(newPlanKey) {
  const normPlan = normalizePlanKey(newPlanKey);
  const planInfo = SUBSCRIPTION_PLANS[normPlan];
  if (!planInfo) throw new Error('Plano de assinatura inválido.');

  const comp = await fetchCurrentCompany();
  if (comp) {
    comp.plan_id = normPlan;
    safeSetStorage(LS_COMPANY, JSON.stringify(comp));

    if (comp.id && comp.id !== 'empresa-solo-01') {
      try {
        await supabase
          .from('companies')
          .update({ plan_id: normPlan, updated_at: new Date().toISOString() })
          .eq('id', comp.id);
      } catch (e) {
        console.warn('Sincronização remota de plano do Supabase:', e);
      }
    }
  }
  return planInfo;
}

// -------------------------------------------------------------
// 3. CLIENTES (CARTEIRA ATIVA)
// -------------------------------------------------------------
const LS_CUSTOMERS = 'instalasaldo_customers_cache';

export async function fetchCustomers(query = '', statusFilter = '') {
  let list = [];
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      list = data;
      safeSetStorage(LS_CUSTOMERS, JSON.stringify(data));
    }
  } catch (e) {}

  if (list.length === 0) {
    const raw = safeGetStorage(LS_CUSTOMERS);
    list = raw ? JSON.parse(raw) : getInitialCustomers();
  }

  return list.filter((c) => {
    const matchQuery =
      !query ||
      c.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.phone?.includes(query);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchQuery && matchStatus;
  });
}

export async function createCustomer(customer) {
  if (!customer.name || !customer.phone) {
    throw new Error('Nome e telefone são obrigatórios.');
  }

  // Normalização do telefone para detectar duplicidades
  const cleanPhone = customer.phone.replace(/\D/g, '');
  const existing = await fetchCustomers();
  const duplicate = existing.find((c) => c.phone?.replace(/\D/g, '') === cleanPhone);

  const newCustomer = {
    ...customer,
    id: customer.id || 'cust-' + Date.now().toString(36),
    status: customer.status || 'Ativo',
    created_at: new Date().toISOString(),
    isDuplicateWarning: !!duplicate,
  };

  try {
    const { data, error } = await supabase.from('customers').insert([customer]).select();
    if (!error && data && data[0]) {
      newCustomer.id = data[0].id;
    }
  } catch (e) {}

  const current = await fetchCustomers();
  safeSetStorage(LS_CUSTOMERS, JSON.stringify([newCustomer, ...current]));
  return newCustomer;
}

export async function updateCustomer(id, updates) {
  try {
    await supabase.from('customers').update(updates).eq('id', id);
  } catch (e) {}

  const current = await fetchCustomers();
  const updated = current.map((c) => (c.id === id ? { ...c, ...updates } : c));
  safeSetStorage(LS_CUSTOMERS, JSON.stringify(updated));
  return updated.find((c) => c.id === id);
}

function getInitialCustomers() {
  return [
    {
      id: 'cust-demo-1',
      name: 'Residencial Alphaville - Bloco B',
      person_type: 'PJ',
      phone: '(11) 98765-4321',
      whatsapp: '(11) 98765-4321',
      document: '12.345.678/0001-90',
      address: 'Av. das Palmeiras, 1500 - Barueri/SP',
      status: 'Ativo',
      notes: 'Manutenção de climatização split e quadros elétricos.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cust-demo-2',
      name: 'Dra. Camila Vasconcelos',
      person_type: 'PF',
      phone: '(11) 97123-9988',
      whatsapp: '(11) 97123-9988',
      document: '234.567.890-11',
      address: 'Rua Bela Cintra, 450 - Consolação, SP',
      status: 'Novo',
      notes: 'Instalação de 2 inversores solares.',
      created_at: new Date().toISOString(),
    },
  ];
}

// -------------------------------------------------------------
// 4. ORÇAMENTOS (QUOTES) & CONVERSÃO EM OS
// -------------------------------------------------------------
const LS_QUOTES = 'instalasaldo_quotes_cache';

export async function fetchQuotes() {
  let list = [];
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*, items:quote_items(*), customer:customers(*)')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      list = data;
      safeSetStorage(LS_QUOTES, JSON.stringify(data));
    }
  } catch (e) {}

  if (list.length === 0) {
    const raw = safeGetStorage(LS_QUOTES);
    list = raw ? JSON.parse(raw) : getInitialQuotes();
  }
  return list;
}

export async function createQuote(quoteData, items = []) {
  const hasItems = Array.isArray(items) && items.length > 0;
  const subtotal = hasItems
    ? items.reduce((acc, i) => acc + toCents(i.total_price_cents, true), 0)
    : toCents(quoteData.total_cents !== undefined ? quoteData.total_cents : 0, true);
  const discount = toCents(quoteData.discount_cents, true);
  const total = hasItems ? Math.max(0, subtotal - discount) : subtotal;
  const entry = toCents(quoteData.entry_cents, true);
  const balance = Math.max(0, total - entry);

  const newQuote = {
    ...quoteData,
    id: quoteData.id || 'quote-' + Date.now().toString(36),
    quote_number: quoteData.quote_number || Math.floor(100 + Math.random() * 900),
    subtotal_cents: subtotal,
    discount_cents: discount,
    total_cents: total,
    entry_cents: entry,
    balance_cents: balance,
    status: quoteData.status || 'Rascunho',
    public_token: Math.random().toString(36).substring(2, 14),
    items,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from('quotes').insert([newQuote]).select();
    if (!error && data && data[0]) {
      newQuote.id = data[0].id;
    }
  } catch (e) {}

  const current = await fetchQuotes();
  safeSetStorage(LS_QUOTES, JSON.stringify([newQuote, ...current]));
  return newQuote;
}

export async function updateQuoteStatus(id, newStatus) {
  const current = await fetchQuotes();
  const quote = current.find((q) => q.id === id);
  if (!quote) throw new Error('Orçamento não encontrado.');

  quote.status = newStatus;
  try {
    await supabase.from('quotes').update({ status: newStatus }).eq('id', id);
  } catch (e) {}

  safeSetStorage(LS_QUOTES, JSON.stringify(current));
  return quote;
}

/**
 * Converts an approved quote directly into a Work Order and Financial Service
 */
export async function convertQuoteToWorkOrder(quoteId) {
  const quotes = await fetchQuotes();
  const quote = quotes.find((q) => q.id === quoteId);
  if (!quote) throw new Error('Orçamento não encontrado.');

  quote.status = 'Aprovado';

  // 1. Cria a Ordem de Serviço
  const newOS = await createWorkOrder({
    quote_id: quote.id,
    customer_id: quote.customer_id,
    service_type: 'Instalação / Execução de Orçamento #' + quote.quote_number,
    description: `Orçamento aprovado. Itens: ${(quote.items || []).map((i) => i.description).join(', ')}`,
    status: 'Agendada',
    priority: 'Alta',
  });

  // 2. Cria o registro financeiro vinculado em centavos
  await createService({
    cliente: quote.customer?.name || 'Cliente do Orçamento #' + quote.quote_number,
    tipo: 'Orçamento #' + quote.quote_number,
    valor_cents: quote.total_cents,
    recebido_cents: quote.entry_cents || 0,
    status: (quote.entry_cents || 0) >= quote.total_cents ? 'concluido' : 'pendente',
    work_order_id: newOS.id,
  });

  await recordAuditLog('Conversão de Orçamento', `Orçamento #${quote.quote_number} convertido na OS #${newOS.order_number}`);
  return newOS;
}

function getInitialQuotes() {
  return [
    {
      id: 'quote-demo-1',
      quote_number: 101,
      customer_id: 'cust-demo-1',
      customer: { name: 'Residencial Alphaville - Bloco B', phone: '(11) 98765-4321' },
      status: 'Enviado',
      issue_date: '2026-10-15',
      valid_until: '2026-10-30',
      subtotal_cents: 250000,
      discount_cents: 0,
      total_cents: 250000,
      entry_cents: 100000,
      balance_cents: 150000,
      payment_terms: 'Entrada de 40% no fechamento + saldo na conclusão',
      notes: 'Garantia de 12 meses nos equipamentos e 90 dias na mão de obra.',
      items: [
        { description: 'Instalação Ar Split 12000 BTUs', quantity: 2, unit_price_cents: 75000, total_price_cents: 150000 },
        { description: 'Suporte metálico reforçado + tubulação', quantity: 2, unit_price_cents: 50000, total_price_cents: 100000 },
      ],
      created_at: new Date().toISOString(),
    },
  ];
}

// -------------------------------------------------------------
// 5. ORDENS DE SERVIÇO (WORK ORDERS) COM FOTOS E ASSINATURA
// -------------------------------------------------------------
const LS_WORK_ORDERS = 'instalasaldo_work_orders_cache';

export async function fetchWorkOrders(filter = '') {
  let list = [];
  try {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, photos:work_order_photos(*), signatures:work_order_signatures(*), customer:customers(*)')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      list = data;
      safeSetStorage(LS_WORK_ORDERS, JSON.stringify(data));
    }
  } catch (e) {}

  if (list.length === 0) {
    const raw = safeGetStorage(LS_WORK_ORDERS);
    list = raw ? JSON.parse(raw) : getInitialWorkOrders();
  }

  if (filter) {
    return list.filter((os) => os.status === filter);
  }
  return list;
}

export async function createWorkOrder(osData) {
  const newOS = {
    ...osData,
    id: osData.id || 'os-' + Date.now().toString(36),
    order_number: osData.order_number || Math.floor(1000 + Math.random() * 9000),
    status: osData.status || 'Aberta',
    priority: osData.priority || 'Média',
    photos: [],
    signatures: [],
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from('work_orders').insert([newOS]).select();
    if (!error && data && data[0]) {
      newOS.id = data[0].id;
    }
  } catch (e) {}

  const current = await fetchWorkOrders();
  safeSetStorage(LS_WORK_ORDERS, JSON.stringify([newOS, ...current]));
  return newOS;
}

/**
 * Installer starts execution: records server/system start time
 */
export async function startWorkOrder(osId) {
  const list = await fetchWorkOrders();
  const os = list.find((o) => o.id === osId);
  if (!os) throw new Error('Ordem de serviço não encontrada.');

  os.status = 'Em execução';
  os.execution_started_at = new Date().toISOString();

  try {
    await supabase.from('work_orders').update({
      status: 'Em execução',
      execution_started_at: os.execution_started_at,
    }).eq('id', osId);
  } catch (e) {}

  safeSetStorage(LS_WORK_ORDERS, JSON.stringify(list));
  await recordAuditLog('Início de OS', `Atendimento iniciado para a OS #${os.order_number}`);
  return os;
}

/**
 * Add photo evidence to OS
 */
export async function addWorkOrderPhoto(osId, photoDataUrl, caption = '') {
  const list = await fetchWorkOrders();
  const os = list.find((o) => o.id === osId);
  if (!os) throw new Error('OS não encontrada.');

  const photo = {
    id: 'photo-' + Date.now().toString(36),
    work_order_id: osId,
    file_url: photoDataUrl,
    caption,
    created_at: new Date().toISOString(),
  };

  os.photos = os.photos || [];
  os.photos.push(photo);

  try {
    await supabase.from('work_order_photos').insert([{
      work_order_id: osId,
      file_path: 'photos/' + photo.id,
      file_url: photoDataUrl,
      caption,
    }]);
  } catch (e) {}

  safeSetStorage(LS_WORK_ORDERS, JSON.stringify(list));
  return photo;
}

/**
 * Add customer digital drawn signature to OS
 */
export async function addWorkOrderSignature(osId, signerName, signatureDataUrl) {
  if (!signerName || !signerName.trim()) {
    throw new Error('Informe o nome legível do signatário.');
  }
  if (!signatureDataUrl) {
    throw new Error('A assinatura do cliente é obrigatória.');
  }

  const list = await fetchWorkOrders();
  const os = list.find((o) => o.id === osId);
  if (!os) throw new Error('OS não encontrada.');

  const signature = {
    id: 'sig-' + Date.now().toString(36),
    work_order_id: osId,
    signer_name: signerName.trim(),
    signature_data_url: signatureDataUrl,
    legal_text_version: 'v1 - Declaro que os serviços e instalações foram conferidos e entregues.',
    created_at: new Date().toISOString(),
  };

  os.signatures = os.signatures || [];
  os.signatures.push(signature);

  try {
    await supabase.from('work_order_signatures').insert([{
      work_order_id: osId,
      signer_name: signerName.trim(),
      signature_data_url: signatureDataUrl,
      legal_text_version: signature.legal_text_version,
    }]);
  } catch (e) {}

  safeSetStorage(LS_WORK_ORDERS, JSON.stringify(list));
  return signature;
}

/**
 * Conclude work order — Rigorously validates evidence:
 * 1. Must be 'Em execução' or 'Aguardando assinatura'
 * 2. Execution notes must not be empty
 * 3. At least 1 photo must be persisted
 * 4. Signature must be persisted (or justification provided)
 */
export async function completeWorkOrder(osId, executionNotes, materialsUsed, clientAbsentReason = '') {
  const list = await fetchWorkOrders();
  const os = list.find((o) => o.id === osId);
  if (!os) throw new Error('OS não encontrada.');

  if (os.status !== 'Em execução' && os.status !== 'Aguardando assinatura') {
    throw new Error('A OS precisa estar Em Execução para ser concluída.');
  }

  if (!executionNotes || !executionNotes.trim()) {
    throw new Error('A descrição do serviço realizado é obrigatória.');
  }

  const hasPhoto = os.photos && os.photos.length > 0;
  if (!hasPhoto) {
    throw new Error('Adicione pelo menos uma foto antes de concluir.');
  }

  const hasSig = os.signatures && os.signatures.length > 0;
  if (!hasSig && (!clientAbsentReason || !clientAbsentReason.trim())) {
    throw new Error('Solicite a assinatura do cliente ou informe a justificativa de ausência.');
  }

  // Attempt DB RPC
  try {
    const res = await supabase.rpc('complete_work_order', {
      p_work_order_id: osId,
      p_execution_notes: executionNotes,
      p_materials_used: materialsUsed || '',
      p_client_absent_reason: clientAbsentReason || null,
    });
    if (res && !res.error && res.data && res.data.success === false) {
      throw new Error(res.data.message);
    }
  } catch (err) {
    if (err.message && !err.message.includes('function') && !err.message.includes('rpc') && !err.message.includes('undefined')) {
      throw err;
    }
  }

  os.status = 'Concluída';
  os.execution_notes = executionNotes;
  os.materials_used = materialsUsed || '';
  os.client_absent_reason = clientAbsentReason || '';
  os.completed_at = new Date().toISOString();

  safeSetStorage(LS_WORK_ORDERS, JSON.stringify(list));
  await recordAuditLog('Conclusão de OS', `OS #${os.order_number} concluída com sucesso com evidências auditadas.`);
  return os;
}

function getInitialWorkOrders() {
  return [
    {
      id: 'os-demo-1',
      order_number: 1001,
      customer_id: 'cust-demo-1',
      customer: { name: 'Residencial Alphaville - Bloco B', address: 'Av. das Palmeiras, 1500 - Barueri/SP' },
      service_type: 'Instalação de Ar Condicionado',
      description: 'Instalação de dois aparelhos split 12k BTUs na portaria e sala de reuniões.',
      status: 'Em execução',
      priority: 'Alta',
      scheduled_date: '2026-10-16',
      scheduled_time: '14:00',
      execution_started_at: new Date(Date.now() - 3600000).toISOString(),
      photos: [],
      signatures: [],
      created_at: new Date().toISOString(),
    },
  ];
}

// -------------------------------------------------------------
// 6. MANUTENÇÕES E FOLLOW-UPS
// -------------------------------------------------------------
const LS_MAINTENANCE = 'instalasaldo_maintenance_cache';
const LS_FOLLOWUPS = 'instalasaldo_followups_cache';

export async function fetchMaintenances() {
  let list = [];
  try {
    const { data, error } = await supabase.from('maintenance_schedules').select('*, customer:customers(*)');
    if (!error && Array.isArray(data)) {
      list = data;
      safeSetStorage(LS_MAINTENANCE, JSON.stringify(data));
    }
  } catch (e) {}

  if (list.length === 0) {
    const raw = safeGetStorage(LS_MAINTENANCE);
    list = raw ? JSON.parse(raw) : getInitialMaintenances();
  }
  return list;
}

export async function createMaintenance(maintData) {
  if (!maintData.customer_id || !maintData.estimated_return_date) {
    throw new Error('Cliente e data estimada de retorno são obrigatórios.');
  }

  const newMaint = {
    ...maintData,
    id: maintData.id || 'maint-' + Date.now().toString(36),
    status: maintData.status || 'Agendada',
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from('maintenance_schedules').insert([newMaint]);
  } catch (e) {}

  const current = await fetchMaintenances();
  safeSetStorage(LS_MAINTENANCE, JSON.stringify([newMaint, ...current]));
  return newMaint;
}

export async function updateMaintenance(id, updates) {
  try {
    await supabase.from('maintenance_schedules').update(updates).eq('id', id);
  } catch (e) {}

  const current = await fetchMaintenances();
  const updated = current.map((m) => (m.id === id ? { ...m, ...updates } : m));
  safeSetStorage(LS_MAINTENANCE, JSON.stringify(updated));
  return updated.find((m) => m.id === id);
}

export async function fetchFollowUps() {
  let list = [];
  try {
    const { data, error } = await supabase.from('follow_ups').select('*, customer:customers(*)');
    if (!error && Array.isArray(data)) {
      list = data;
      safeSetStorage(LS_FOLLOWUPS, JSON.stringify(data));
    }
  } catch (e) {}

  if (list.length === 0) {
    const raw = safeGetStorage(LS_FOLLOWUPS);
    list = raw ? JSON.parse(raw) : getInitialFollowUps();
  }
  return list;
}

export async function createFollowUp(data) {
  const newF = {
    ...data,
    id: data.id || 'fup-' + Date.now().toString(36),
    status: data.status || 'Pendente',
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from('follow_ups').insert([newF]);
  } catch (e) {}

  const current = await fetchFollowUps();
  safeSetStorage(LS_FOLLOWUPS, JSON.stringify([newF, ...current]));
  return newF;
}

export async function updateFollowUp(id, updates) {
  try {
    await supabase.from('follow_ups').update(updates).eq('id', id);
  } catch (e) {}

  const current = await fetchFollowUps();
  const updated = current.map((f) => (f.id === id ? { ...f, ...updates } : f));
  safeSetStorage(LS_FOLLOWUPS, JSON.stringify(updated));
  return updated.find((f) => f.id === id);
}

function getInitialMaintenances() {
  return [
    {
      id: 'maint-demo-1',
      customer_id: 'cust-demo-1',
      customer: { name: 'Residencial Alphaville - Bloco B', phone: '(11) 98765-4321' },
      equipment: '2x Splits Daikin Inverter 12.000 BTUs',
      interval_months: 6,
      last_service_date: '2026-05-10',
      estimated_return_date: '2026-11-10',
      status: 'Agendada',
      notes: 'Limpeza de filtros, desinfecção de serpentinas e teste de pressão do gás.',
    },
  ];
}

function getInitialFollowUps() {
  return [
    {
      id: 'fup-demo-1',
      customer_id: 'cust-demo-1',
      customer: { name: 'Residencial Alphaville - Bloco B', phone: '(11) 98765-4321' },
      type: 'manutencao_preventiva',
      scheduled_date: new Date().toISOString().split('T')[0],
      status: 'Pendente',
      result_notes: '',
    },
  ];
}

// -------------------------------------------------------------
// 7. FINANCEIRO & SERVIÇOS (Valores em Centavos)
// -------------------------------------------------------------
const LS_SERVICES = 'instalaSaldo_services_cache';

export async function fetchServices() {
  let list = [];
  try {
    const { data, error } = await supabase.from('services').select('*');
    if (!error && Array.isArray(data)) {
      list = data;
      safeSetStorage(LS_SERVICES, JSON.stringify(data));
    }
  } catch (err) {}

  if (list.length === 0) {
    const raw = safeGetStorage(LS_SERVICES);
    list = raw ? JSON.parse(raw) : getInitialServices();
  }
  return list;
}

export async function createService(service) {
  const serviceType = service.service_type || service.tipo;
  const description = service.description || service.descricao;

  if (!serviceType || (serviceType !== 'Instalação' && serviceType !== 'Manutenção')) {
    throw new Error('Selecione o tipo de serviço: Instalação ou Manutenção.');
  }
  if (!description || !description.trim()) {
    throw new Error('A descrição do serviço é obrigatória.');
  }

  const valorCents = toCents(service.valor_cents !== undefined ? service.valor_cents : service.valor, service.valor_cents !== undefined);
  const recebidoCents = toCents(service.recebido_cents !== undefined ? service.recebido_cents : service.valor_recebido, service.recebido_cents !== undefined);

  const check = validatePayment(valorCents, recebidoCents);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const record = {
    ...service,
    id: service.id || 'svc-' + Date.now().toString(36),
    service_type: serviceType,
    tipo: serviceType,
    description: description.trim(),
    descricao: description.trim(),
    valor_cents: valorCents,
    recebido_cents: recebidoCents,
    status: service.status || (check.balanceCents === 0 ? 'concluido' : 'pendente'),
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from('services').insert([record]).select();
    if (!error && data && data[0]) {
      record.id = data[0].id;
    }
  } catch (err) {}

  const current = await fetchServices();
  safeSetStorage(LS_SERVICES, JSON.stringify([record, ...current]));
  return record;
}

export async function updateService(id, updates) {
  const current = await fetchServices();
  const svc = current.find((s) => s.id === id);
  if (!svc) throw new Error('Serviço não encontrado.');

  const serviceType = updates.service_type || updates.tipo || svc.service_type || svc.tipo;
  const description = updates.description !== undefined ? updates.description : (updates.descricao !== undefined ? updates.descricao : (svc.description || svc.descricao));

  if (updates.service_type !== undefined || updates.tipo !== undefined) {
    if (!serviceType || (serviceType !== 'Instalação' && serviceType !== 'Manutenção')) {
      throw new Error('Selecione o tipo de serviço: Instalação ou Manutenção.');
    }
  }

  if (updates.description !== undefined || updates.descricao !== undefined) {
    if (!description || !description.trim()) {
      throw new Error('A descrição do serviço é obrigatória.');
    }
  }

  const valorCents = updates.valor_cents !== undefined ? toCents(updates.valor_cents, true) : (updates.valor !== undefined ? toCents(updates.valor) : svc.valor_cents);
  const recebidoCents = updates.recebido_cents !== undefined ? toCents(updates.recebido_cents, true) : (updates.valor_recebido !== undefined ? toCents(updates.valor_recebido) : svc.recebido_cents);

  const check = validatePayment(valorCents, recebidoCents);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const updatedRecord = {
    ...svc,
    ...updates,
    service_type: serviceType,
    tipo: serviceType,
    description: description ? description.trim() : svc.description,
    descricao: description ? description.trim() : svc.descricao,
    valor_cents: valorCents,
    recebido_cents: recebidoCents,
  };

  try {
    await supabase.from('services').update(updatedRecord).eq('id', id);
  } catch (err) {}

  const updatedList = current.map((s) => (s.id === id ? updatedRecord : s));
  safeSetStorage(LS_SERVICES, JSON.stringify(updatedList));
  return updatedRecord;
}

export async function deleteService(id) {
  try {
    await supabase.from('services').delete().eq('id', id);
  } catch (err) {}

  const current = await fetchServices();
  const filtered = current.filter((s) => s.id !== id);
  safeSetStorage(LS_SERVICES, JSON.stringify(filtered));
  return true;
}

function getInitialServices() {
  return [
    {
      id: 'svc-demo-1',
      cliente: 'Condomínio Solar das Flores',
      tipo: 'Instalação Elétrica',
      valor_cents: 350000,
      recebido_cents: 150000,
      status: 'pendente',
      data: '2026-10-25',
      created_at: new Date().toISOString(),
    },
    {
      id: 'svc-demo-2',
      cliente: 'Mariana Duarte',
      tipo: 'Climatização Residencial',
      valor_cents: 120000,
      recebido_cents: 120000,
      status: 'concluido',
      data: '2026-10-10',
      created_at: new Date().toISOString(),
    },
  ];
}

// -------------------------------------------------------------
// 8. SUPER ADMIN, AUDITORIA E MÉTRICAS
// -------------------------------------------------------------
const LS_ADMIN_USERS = 'instalaSaldo_admin_users';
const LS_AUDIT_LOGS = 'instalaSaldo_audit_logs';

export async function fetchAdminUsers(query = '') {
  let list = [];
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      list = data;
    }
  } catch (e) {}

  if (list.length === 0) {
    const raw = safeGetStorage(LS_ADMIN_USERS);
    list = raw ? JSON.parse(raw) : getInitialAdminUsers();
  }

  // Super admin root must always be present
  if (!list.some((u) => isSuperAdmin(u.email))) {
    list.unshift(getInitialAdminUsers()[0]);
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    return list.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.nome?.toLowerCase().includes(q) ||
        u.empresa?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function saveAdminUsers(list) {
  safeSetStorage(LS_ADMIN_USERS, JSON.stringify(list));
}

export async function toggleUserStatus(id) {
  const users = await fetchAdminUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('Usuário não encontrado.');

  if (isSuperAdmin(users[idx].email)) {
    throw new Error('A conta do Super Admin não pode ser suspensa.');
  }

  const current = users[idx].status || 'ativo';
  const newStatus = current === 'ativo' ? 'bloqueado' : 'ativo';
  users[idx].status = newStatus;
  await saveAdminUsers(users);

  await recordAuditLog(
    newStatus === 'bloqueado' ? 'Bloqueio de Usuário' : 'Reativação de Usuário',
    `Status de ${users[idx].email} alterado para ${newStatus}`
  );

  return users[idx];
}

export async function updateAdminUser(id, updates) {
  const users = await fetchAdminUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('Usuário não encontrado.');

  if (isSuperAdmin(users[idx].email) && updates.role && updates.role !== 'super_admin') {
    throw new Error('O papel do Super Admin não pode ser alterado.');
  }

  users[idx] = { ...users[idx], ...updates };
  await saveAdminUsers(users);

  try {
    await supabase.from('profiles').update(updates).eq('id', id);
  } catch (e) {}

  await recordAuditLog('Edição de Usuário', `Usuário ${users[idx].email} atualizado: ${JSON.stringify(updates)}`);
  return users[idx];
}

const LS_TEAM_MEMBERS = 'instalasaldo_team_members_cache';

export async function fetchTeamMembers() {
  let list = [];
  try {
    const { data, error } = await supabase.from('company_members').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      list = data;
      safeSetStorage(LS_TEAM_MEMBERS, JSON.stringify(data));
    }
  } catch (e) {}

  if (list.length === 0) {
    const raw = safeGetStorage(LS_TEAM_MEMBERS);
    list = raw ? JSON.parse(raw) : getInitialTeamMembers();
  }
  return list;
}

export async function addTeamMember(member) {
  const newM = {
    id: 'mem-' + Date.now().toString(36),
    nome: member.nome,
    email: member.email,
    role: member.role || 'instalador',
    status: 'ativo',
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from('company_members').insert([newM]);
  } catch (e) {}

  const current = await fetchTeamMembers();
  safeSetStorage(LS_TEAM_MEMBERS, JSON.stringify([newM, ...current]));
  await recordAuditLog('Membro Adicionado', `Membro ${newM.email} adicionado como ${newM.role}`);
  return newM;
}

function getInitialTeamMembers() {
  return [
    {
      id: 'mem-admin-root',
      nome: 'Administrador Principal',
      email: SUPER_ADMIN_EMAIL,
      role: 'admin',
      status: 'ativo',
    },
    {
      id: 'mem-gerente-1',
      nome: 'Fernanda Lima',
      email: 'fernanda.gerente@gmail.com',
      role: 'gerente',
      status: 'ativo',
    },
    {
      id: 'mem-tech-1',
      nome: 'Carlos Eduardo',
      email: 'carlos.instalador@gmail.com',
      role: 'instalador',
      status: 'ativo',
    },
  ];
}

export async function deleteAdminUser(id) {
  const users = await fetchAdminUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return true;

  if (isSuperAdmin(target.email)) {
    throw new Error('A conta do Super Admin não pode ser excluída.');
  }

  const filtered = users.filter((u) => u.id !== id);
  await saveAdminUsers(filtered);
  await recordAuditLog('Remoção de Usuário', `Usuário ${target.email} removido do sistema.`);
  return true;
}

export async function fetchAdminStats() {
  const users = await fetchAdminUsers();
  const totalUsuarios = users.length;
  const usuariosAtivos = users.filter((u) => u.status === 'ativo' || u.status === 'active').length;
  const usuariosBloqueados = users.filter((u) => u.status === 'bloqueado' || u.status === 'suspended').length;
  const empresasUnicas = new Set(users.map((u) => u.empresa || 'Minha Empresa')).size;

  const planos = {
    Essencial: users.filter((u) => normalizePlanKey(u.plano) === 'essencial').length,
    Profissional: users.filter((u) => normalizePlanKey(u.plano) === 'profissional').length,
    Empresa: users.filter((u) => normalizePlanKey(u.plano) === 'empresa').length,
  };

  // Cálculo de MRR (Receita Recorrente Mensal em Centavos)
  const mrrCents =
    planos.Essencial * SUBSCRIPTION_PLANS.essencial.price_cents +
    planos.Profissional * SUBSCRIPTION_PLANS.profissional.price_cents +
    planos.Empresa * SUBSCRIPTION_PLANS.empresa.price_cents;

  const receitaPorPlano = {
    Essencial: planos.Essencial * SUBSCRIPTION_PLANS.essencial.price_cents,
    Profissional: planos.Profissional * SUBSCRIPTION_PLANS.profissional.price_cents,
    Empresa: planos.Empresa * SUBSCRIPTION_PLANS.empresa.price_cents,
  };

  return {
    totalUsuarios,
    totalEmpresas: empresasUnicas,
    usuariosAtivos,
    usuariosBloqueados,
    assinaturasAtivas: usuariosAtivos,
    assinaturasCanceladas: usuariosBloqueados,
    pagamentosPendentes: 0,
    inadimplencia: usuariosBloqueados,
    mrr_cents: mrrCents,
    mrr_formatted: formatBRL(mrrCents) + '/mês',
    empresasPorPlano: planos,
    receitaPorPlano,
  };
}

export async function fetchAuditLogs() {
  const raw = safeGetStorage(LS_AUDIT_LOGS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {}
  }

  return [
    {
      id: 'log-init',
      action: 'Sistema Inicializado',
      details: 'Super Admin agenciavallor01@gmail.com configurado.',
      timestamp: new Date().toISOString(),
    },
  ];
}

export async function recordAuditLog(action, details) {
  const logs = await fetchAuditLogs();
  const session = await getSession().catch(() => null);
  const newLog = {
    id: 'log-' + Date.now().toString(36),
    user_email: session?.user?.email || SUPER_ADMIN_EMAIL,
    action,
    details: typeof details === 'object' ? JSON.stringify(details) : details,
    timestamp: new Date().toISOString(),
  };

  logs.unshift(newLog);
  safeSetStorage(LS_AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));

  try {
    await supabase.from('audit_logs').insert([newLog]);
  } catch (e) {}

  return newLog;
}

function getInitialAdminUsers() {
  return [
    {
      id: 'super-admin-root',
      email: SUPER_ADMIN_EMAIL,
      nome: 'Super Administrador',
      role: 'super_admin',
      status: 'ativo',
      empresa: 'Agência Vallor',
      plano: 'Empresa',
      created_at: new Date().toISOString(),
    },
    {
      id: 'usr-tech-01',
      email: 'carlos.instalador@gmail.com',
      nome: 'Carlos Eduardo',
      role: 'instalador',
      status: 'ativo',
      empresa: 'Solar Tech',
      plano: 'Profissional',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'usr-mgr-02',
      email: 'fernanda.gerente@gmail.com',
      nome: 'Fernanda Lima',
      role: 'gerente',
      status: 'ativo',
      empresa: 'ClimaBom',
      plano: 'Empresa',
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
    {
      id: 'usr-solo-03',
      email: 'marcos.clima@gmail.com',
      nome: 'Marcos Refrigeração',
      role: 'admin',
      status: 'ativo',
      empresa: 'Marcos Ar & Refrigeração',
      plano: 'Essencial',
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
  ];
}
