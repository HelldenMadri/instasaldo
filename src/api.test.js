// Mock the supabase client module before importing api.js
jest.mock('@supabase/supabase-js', () => {
  const mockSelect = jest.fn();
  const mockInsert = jest.fn(() => ({ select: mockSelect }));
  const mockUpdateEq = jest.fn(() => ({ select: mockSelect }));
  const mockDeleteEq = jest.fn();
  const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
  const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));
  const mockFrom = jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  }));

  const mockSignInWithPassword = jest.fn();
  const mockSignOut = jest.fn();
  const mockResetPasswordForEmail = jest.fn();
  const mockUpdateUser = jest.fn();
  const mockGetSession = jest.fn();
  const mockOnAuthStateChange = jest.fn();

  const client = {
    from: mockFrom,
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    _mocks: {
      mockFrom,
      mockSelect,
      mockInsert,
      mockUpdate,
      mockUpdateEq,
      mockDelete,
      mockDeleteEq,
      mockSignInWithPassword,
      mockSignOut,
      mockResetPasswordForEmail,
      mockUpdateUser,
      mockGetSession,
      mockOnAuthStateChange,
    },
  };

  return {
    createClient: jest.fn(() => client),
    __esModule: true,
  };
});

import { createClient } from '@supabase/supabase-js';
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
  isSuperAdmin,
  SUPER_ADMIN_EMAIL,
  loginUser,
  logoutUser,
  resetPassword,
  updateUserPassword,
  getSession,
  fetchAdminUsers,
  toggleUserStatus,
  deleteAdminUser,
  fetchAdminStats,
  recordAuditLog,
  fetchAuditLogs,
} from './api.js';

const dummyClient = createClient();
const {
  mockFrom,
  mockSelect,
  mockInsert,
  mockUpdate,
  mockUpdateEq,
  mockDelete,
  mockDeleteEq,
  mockSignInWithPassword,
  mockSignOut,
  mockResetPasswordForEmail,
  mockUpdateUser,
  mockGetSession,
} = dummyClient._mocks;

beforeEach(() => {
  jest.clearAllMocks();
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockUpdateEq });
  mockUpdateEq.mockReturnValue({ select: mockSelect });
  mockDelete.mockReturnValue({ eq: mockDeleteEq });
});

describe('Super Admin rules and validation', () => {
  test('isSuperAdmin strictly identifies the super admin email', () => {
    expect(isSuperAdmin('agenciavallor01@gmail.com')).toBe(true);
    expect(isSuperAdmin('AGENCIAVALLOR01@GMAIL.COM')).toBe(true);
    expect(isSuperAdmin('  agenciavallor01@gmail.com  ')).toBe(true);
    expect(isSuperAdmin('outro@gmail.com')).toBe(false);
    expect(isSuperAdmin('')).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });
});

describe('Supabase Auth methods', () => {
  test('loginUser validates required fields', async () => {
    await expect(loginUser('', 'senha123')).rejects.toThrow('E-mail e senha são obrigatórios.');
    await expect(loginUser('test@email.com', '')).rejects.toThrow('E-mail e senha são obrigatórios.');
  });

  test('loginUser signs in with lowercase trimmed email and returns session', async () => {
    const fakeSession = { access_token: 'xyz', user: { email: 'test@email.com' } };
    mockSignInWithPassword.mockResolvedValue({ data: { session: fakeSession }, error: null });

    const session = await loginUser('  Test@Email.COM ', 'senha123');
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@email.com',
      password: 'senha123',
    });
    expect(session).toEqual(fakeSession);
  });

  test('loginUser throws when Supabase returns an auth error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: new Error('Invalid login credentials'),
    });
    await expect(loginUser('test@email.com', 'wrongpass')).rejects.toThrow('Invalid login credentials');
  });

  test('logoutUser invokes supabase signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null });
    const result = await logoutUser();
    expect(mockSignOut).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('resetPassword validates email input', async () => {
    await expect(resetPassword('')).rejects.toThrow('Informe o e-mail para recuperação.');
  });

  test('resetPassword calls resetPasswordForEmail with /redefinir-senha redirect', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    await resetPassword('user@teste.com');
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'user@teste.com',
      expect.objectContaining({
        redirectTo: expect.stringContaining('/redefinir-senha'),
      })
    );
  });

  test('updateUserPassword enforces minimum 6 characters', async () => {
    await expect(updateUserPassword('123')).rejects.toThrow('mínimo 6 caracteres');
  });

  test('updateUserPassword calls updateUser with new password', async () => {
    mockUpdateUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const user = await updateUserPassword('novaSenha123');
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'novaSenha123' });
    expect(user).toEqual({ id: 'u1' });
  });

  test('getSession returns active session', async () => {
    const fakeSession = { user: { id: 'usr-1' } };
    mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    const session = await getSession();
    expect(session).toEqual(fakeSession);
  });
});

describe('Resilient Services CRUD', () => {
  test('fetchServices returns data from supabase when available', async () => {
    const mockData = [{ id: '1', cliente: 'Cliente A' }];
    mockSelect.mockResolvedValue({ data: mockData, error: null });
    const result = await fetchServices();
    expect(mockFrom).toHaveBeenCalledWith('services');
    expect(result).toEqual(mockData);
  });

  test('fetchServices gracefully falls back to local storage on error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: new Error('table missing') });
    const result = await fetchServices();
    expect(Array.isArray(result)).toBe(true);
  });

  test('createService inserts to Supabase or saves locally', async () => {
    const newService = { cliente: 'Solar ABC', valor: 500 };
    mockSelect.mockResolvedValue({ data: [{ id: 'svc-1', ...newService }], error: null });
    const result = await createService(newService);
    expect(result.cliente).toBe('Solar ABC');
  });

  test('updateService updates record and returns result', async () => {
    const updates = { status: 'concluido' };
    mockSelect.mockResolvedValue({ data: [{ id: 'svc-1', status: 'concluido' }], error: null });
    const result = await updateService('svc-1', updates);
    expect(result.status).toBe('concluido');
  });

  test('deleteService removes record and returns true', async () => {
    mockDeleteEq.mockResolvedValue({ error: null });
    const result = await deleteService('svc-1');
    expect(result).toBe(true);
  });
});

describe('Super Admin user management, metrics & audit logs', () => {
  test('fetchAdminUsers includes the root super admin', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    const users = await fetchAdminUsers();
    expect(users.some((u) => u.email === SUPER_ADMIN_EMAIL)).toBe(true);
  });

  test('fetchAdminUsers filters by query', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    const filtered = await fetchAdminUsers('vallor');
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered[0].email).toBe(SUPER_ADMIN_EMAIL);
  });

  test('toggleUserStatus toggles regular user but protects Super Admin', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    // Attempting to suspend super admin must fail
    await expect(toggleUserStatus('super-admin-root')).rejects.toThrow('não pode ser suspensa');

    // Suspending a regular user works
    const toggled = await toggleUserStatus('usr-tech-01');
    expect(toggled.status).toBe('suspended');
  });

  test('deleteAdminUser protects Super Admin from deletion', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    await expect(deleteAdminUser('super-admin-root')).rejects.toThrow('não pode ser excluída');
  });

  test('fetchAdminStats returns consolidated metrics', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    const stats = await fetchAdminStats();
    expect(stats.totalUsuarios).toBeGreaterThanOrEqual(1);
    expect(stats.totalEmpresas).toBeGreaterThanOrEqual(1);
    expect(stats.usuariosAtivos).toBeGreaterThanOrEqual(1);
    expect(stats.empresasPorPlano).toBeDefined();
  });

  test('recordAuditLog and fetchAuditLogs maintain audit trail', async () => {
    const log = await recordAuditLog('Teste de Ação', 'Detalhes do teste');
    expect(log.action).toBe('Teste de Ação');

    const logs = await fetchAuditLogs();
    expect(logs[0].action).toBe('Teste de Ação');
  });
});
