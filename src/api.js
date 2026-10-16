if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'test') {
  try {
    const { config } = require('dotenv');
    config();
  } catch (e) {
    // browser ignore
  }
}
import { createClient } from '@supabase/supabase-js';

// Credentials for Supabase (Anon public key only - no service role in frontend)
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

/**
 * Validates whether an email has Super Admin privileges
 */
export function isSuperAdmin(email) {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Supabase Auth: Sign in with email and password
 */
export async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('E-mail e senha são obrigatórios.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data.session;
}

/**
 * Supabase Auth: Sign out
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

/**
 * Supabase Auth: Request password recovery email
 */
export async function resetPassword(email) {
  if (!email) {
    throw new Error('Informe o e-mail para recuperação.');
  }

  // Define redirect URL pointing to /redefinir-senha
  let redirectUrl = 'https://instasaldo.vercel.app/redefinir-senha';
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    redirectUrl = `${window.location.origin}/redefinir-senha`;
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: redirectUrl,
  });
  if (error) throw error;
  return data;
}

/**
 * Supabase Auth: Update user password after recovery
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

/**
 * Get currently active Supabase session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Listen to auth state changes (login, logout, password recovery)
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// -------------------------------------------------------------
// Resilient Storage Helper (Browser LocalStorage + Node/Memory fallback)
// -------------------------------------------------------------
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
// Resilient Services CRUD (Supabase with LocalStorage fallback)
// -------------------------------------------------------------
const LS_SERVICES = 'instalaSaldo_services_cache';

function getLocalServices() {
  const raw = safeGetStorage(LS_SERVICES);
  return raw ? JSON.parse(raw) : [];
}

function saveLocalServices(services) {
  safeSetStorage(LS_SERVICES, JSON.stringify(services));
}

export async function fetchServices() {
  try {
    const { data, error } = await supabase.from('services').select('*');
    if (error) throw error;
    if (Array.isArray(data)) {
      saveLocalServices(data);
      return data;
    }
  } catch (err) {
    // If table does not exist or network is offline, fallback to local storage
  }
  return getLocalServices();
}

export async function createService(service) {
  try {
    const { data, error } = await supabase.from('services').insert([service]).select();
    if (error) throw error;
    const created = data && data[0] ? data[0] : service;
    const current = getLocalServices();
    saveLocalServices([created, ...current]);
    return created;
  } catch (err) {
    const current = getLocalServices();
    saveLocalServices([service, ...current]);
    return service;
  }
}

export async function updateService(id, updates) {
  try {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    const updated = data && data[0] ? data[0] : updates;
    const current = getLocalServices().map((s) => (s.id === id ? { ...s, ...updates } : s));
    saveLocalServices(current);
    return updated;
  } catch (err) {
    const current = getLocalServices().map((s) => (s.id === id ? { ...s, ...updates } : s));
    saveLocalServices(current);
    return updates;
  }
}

export async function deleteService(id) {
  try {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {}
  const current = getLocalServices().filter((s) => s.id !== id);
  saveLocalServices(current);
  return true;
}

// -------------------------------------------------------------
// Super Admin Management (Users, Metrics, Audit Logs)
// -------------------------------------------------------------
const LS_ADMIN_USERS = 'instalaSaldo_admin_users';
const LS_AUDIT_LOGS = 'instalaSaldo_audit_logs';

function getInitialAdminUsers() {
  return [
    {
      id: 'super-admin-root',
      email: SUPER_ADMIN_EMAIL,
      nome: 'Administrador Principal',
      role: 'super_admin',
      status: 'active',
      empresa: 'Agência Vallor',
      plano: 'Enterprise',
      created_at: new Date().toISOString(),
    },
    {
      id: 'usr-tech-01',
      email: 'tecnico.solar@empresa.com',
      nome: 'Carlos Eduardo',
      role: 'technician',
      status: 'active',
      empresa: 'Solar Tech Instalações',
      plano: 'Pro',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'usr-fin-02',
      email: 'financeiro@climatizacao.com',
      nome: 'Mariana Santos',
      role: 'financial',
      status: 'active',
      empresa: 'ClimaBom Ar Condicionado',
      plano: 'Básico',
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    },
    {
      id: 'usr-blk-03',
      email: 'contato.bloqueado@teste.com',
      nome: 'Roberto Dias',
      role: 'user',
      status: 'suspended',
      empresa: 'RD Serviços',
      plano: 'Básico',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ];
}

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

  // Ensure super admin root is always present
  if (!list.some((u) => isSuperAdmin(u.email))) {
    list.unshift(getInitialAdminUsers()[0]);
  }

  // Filter if query provided
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    return list.filter(
      (u) =>
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.nome && u.nome.toLowerCase().includes(q)) ||
        (u.empresa && u.empresa.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
    );
  }

  return list;
}

export async function saveAdminUsers(list) {
  safeSetStorage(LS_ADMIN_USERS, JSON.stringify(list));
}

export async function createAdminUser(user) {
  const users = await fetchAdminUsers();
  const newUser = {
    ...user,
    id: user.id || 'usr-' + Date.now().toString(36),
    status: user.status || 'active',
    created_at: new Date().toISOString(),
  };
  users.push(newUser);
  await saveAdminUsers(users);
  await recordAuditLog('Criação de Usuário', `Usuário ${newUser.email} criado com papel ${newUser.role}`);
  return newUser;
}

export async function updateAdminUser(id, updates) {
  const users = await fetchAdminUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('Usuário não encontrado.');

  users[idx] = { ...users[idx], ...updates };
  await saveAdminUsers(users);
  await recordAuditLog('Edição de Usuário', `Usuário ${users[idx].email} atualizado: ${JSON.stringify(updates)}`);
  return users[idx];
}

export async function toggleUserStatus(id) {
  const users = await fetchAdminUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('Usuário não encontrado.');

  if (isSuperAdmin(users[idx].email)) {
    throw new Error('A conta do Super Admin não pode ser suspensa.');
  }

  const current = users[idx].status || 'active';
  const newStatus = current === 'active' ? 'suspended' : 'active';
  users[idx].status = newStatus;
  await saveAdminUsers(users);

  await recordAuditLog(
    newStatus === 'suspended' ? 'Suspensão de Conta' : 'Reativação de Conta',
    `Status de ${users[idx].email} alterado para ${newStatus}`
  );

  return users[idx];
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
  const usuariosAtivos = users.filter((u) => u.status === 'active').length;
  const usuariosBloqueados = users.filter((u) => u.status === 'suspended').length;

  const empresasUnicas = new Set(users.map((u) => u.empresa || 'Empresa Padrão')).size;
  const planos = {
    Basico: users.filter((u) => u.plano === 'Básico').length,
    Pro: users.filter((u) => u.plano === 'Pro').length,
    Enterprise: users.filter((u) => u.plano === 'Enterprise').length,
  };

  return {
    totalUsuarios,
    totalEmpresas: empresasUnicas,
    usuariosAtivos,
    usuariosBloqueados,
    empresasPorPlano: planos,
    assinaturasAtivas: usuariosAtivos,
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
      id: 'log-01',
      action: 'Sistema Inicializado',
      details: 'Super Admin agenciavallor01@gmail.com configurado.',
      timestamp: new Date().toISOString(),
    },
  ];
}

export async function recordAuditLog(action, details) {
  const logs = await fetchAuditLogs();
  const newLog = {
    id: 'log-' + Date.now().toString(36),
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  safeSetStorage(LS_AUDIT_LOGS, JSON.stringify(logs.slice(0, 100))); // keep 100 logs
  return newLog;
}
