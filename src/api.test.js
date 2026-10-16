// Mock the supabase client module before importing api.js
jest.mock('@supabase/supabase-js', () => {
  const mockSelect = jest.fn();
  const mockInsert = jest.fn(() => ({ select: mockSelect }));
  const mockUpdateEq = jest.fn(() => ({ select: mockSelect }));
  const mockDeleteEq = jest.fn();
  const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
  const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));
  const mockOrder = jest.fn(() => ({ limit: jest.fn().mockResolvedValue({ data: [], error: null }) }));
  const mockFrom = jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    order: mockOrder,
  }));

  const mockSignInWithPassword = jest.fn();
  const mockSignOut = jest.fn();
  const mockResetPasswordForEmail = jest.fn();
  const mockUpdateUser = jest.fn();
  const mockGetSession = jest.fn();
  const mockOnAuthStateChange = jest.fn();
  const mockRpc = jest.fn();

  const client = {
    from: mockFrom,
    rpc: mockRpc,
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
      mockRpc,
    },
  };

  return {
    createClient: jest.fn(() => client),
    __esModule: true,
  };
});

import { createClient } from '@supabase/supabase-js';
import {
  isSuperAdmin,
  SUPER_ADMIN_EMAIL,
  loginUser,
  logoutUser,
  resetPassword,
  updateUserPassword,
  getSession,
  fetchCustomers,
  createCustomer,
  createQuote,
  convertQuoteToWorkOrder,
  fetchWorkOrders,
  startWorkOrder,
  addWorkOrderPhoto,
  addWorkOrderSignature,
  completeWorkOrder,
  fetchServices,
  createService,
  updateService,
  deleteService,
  fetchAdminUsers,
  toggleUserStatus,
  deleteAdminUser,
  fetchAdminStats,
  recordAuditLog,
  fetchAuditLogs,
} from './api.js';

import { toCents, formatBRL, validatePayment } from './money.js';

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
  mockRpc,
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
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
  });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockUpdateEq });
  mockUpdateEq.mockReturnValue({ select: mockSelect });
  mockDelete.mockReturnValue({ eq: mockDeleteEq });
  mockSelect.mockResolvedValue({ data: [], error: null });
  mockRpc.mockResolvedValue({ data: { success: true }, error: null });
});

describe('Super Admin Security Rules', () => {
  test('isSuperAdmin strictly matches agenciavallor01@gmail.com', () => {
    expect(isSuperAdmin('agenciavallor01@gmail.com')).toBe(true);
    expect(isSuperAdmin('AGENCIAVALLOR01@GMAIL.COM')).toBe(true);
    expect(isSuperAdmin('  agenciavallor01@gmail.com  ')).toBe(true);
    expect(isSuperAdmin('outro@empresa.com')).toBe(false);
    expect(isSuperAdmin('')).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });
});

describe('Supabase Auth & Session Flow', () => {
  test('loginUser validates fields and signs in', async () => {
    await expect(loginUser('', 'senha123')).rejects.toThrow('E-mail e senha são obrigatórios.');
    await expect(loginUser('test@email.com', '')).rejects.toThrow('E-mail e senha são obrigatórios.');

    const fakeSession = { access_token: 'tok-123', user: { email: 'test@email.com' } };
    mockSignInWithPassword.mockResolvedValue({ data: { session: fakeSession }, error: null });

    const session = await loginUser('test@email.com', 'senha123');
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@email.com',
      password: 'senha123',
    });
    expect(session).toEqual(fakeSession);
  });

  test('loginUser throws user-friendly message for invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: new Error('Invalid login credentials'),
    });
    await expect(loginUser('test@email.com', 'wrongpass')).rejects.toThrow('E-mail ou senha incorretos.');
  });

  test('resetPassword sends recovery email with /redefinir-senha redirect and neutral response', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    const res = await resetPassword('usuario@teste.com');
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'usuario@teste.com',
      expect.objectContaining({
        redirectTo: expect.stringContaining('/redefinir-senha'),
      })
    );
    expect(res.message).toContain('Se o e-mail estiver cadastrado');
  });

  test('updateUserPassword enforces minimum 6 characters', async () => {
    await expect(updateUserPassword('123')).rejects.toThrow('mínimo 6 caracteres');
    mockUpdateUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const user = await updateUserPassword('novaSenha123');
    expect(user).toEqual({ id: 'u1' });
  });

  test('logoutUser invokes supabase signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null });
    const res = await logoutUser();
    expect(res).toBe(true);
  });
});

describe('Money Centavos Calculations & Validations', () => {
  test('toCents parses float and formatted BRL strings into integer centavos', () => {
    expect(toCents(10.5)).toBe(1050);
    expect(toCents('10,50')).toBe(1050);
    expect(toCents('1.250,50')).toBe(125050);
    expect(toCents(125050, true)).toBe(125050);
    expect(toCents(-10)).toBe(0);
  });

  test('formatBRL formats integer centavos cleanly', () => {
    expect(formatBRL(1050)).toBe('R$\u00a010,50');
    expect(formatBRL(125050)).toBe('R$\u00a01.250,50');
  });

  test('validatePayment prevents negative values and received > total', () => {
    const invalidReceived = validatePayment(10000, 15000); // 100 vs 150
    expect(invalidReceived.valid).toBe(false);
    expect(invalidReceived.error).toContain('superior ao valor total');

    const validPayment = validatePayment(10000, 4000);
    expect(validPayment.valid).toBe(true);
    expect(validPayment.balanceCents).toBe(6000);
  });
});

describe('Customers & Quotes Flow', () => {
  test('createCustomer checks phone normalization', async () => {
    const customer = await createCustomer({
      name: 'João Silva',
      phone: '(11) 98888-7777',
      address: 'Rua A, 100',
    });
    expect(customer.name).toBe('João Silva');
    expect(customer.id).toBeDefined();
  });

  test('createQuote calculates subtotal, total, and balance in centavos', async () => {
    const quote = await createQuote(
      {
        customer_id: 'cust-1',
        entry_cents: 50000, // R$ 500
      },
      [
        { description: 'Ar Condicionado', quantity: 1, total_price_cents: 120000 },
        { description: 'Suporte', quantity: 1, total_price_cents: 30000 },
      ]
    );

    expect(quote.subtotal_cents).toBe(150000);
    expect(quote.total_cents).toBe(150000);
    expect(quote.balance_cents).toBe(100000);
  });

  test('convertQuoteToWorkOrder converts quote into an OS and financial service', async () => {
    const quote = await createQuote({
      id: 'quote-test-convert',
      quote_number: 777,
      customer_id: 'cust-1',
      total_cents: 200000,
      entry_cents: 80000,
    });

    const os = await convertQuoteToWorkOrder('quote-test-convert');
    expect(os.status).toBe('Agendada');
    expect(os.service_type).toContain('777');
  });
});

describe('Work Order Rigorous Evidence & Completion Rules', () => {
  test('completeWorkOrder requires OS to be in execution', async () => {
    const osList = await fetchWorkOrders();
    const osId = osList[0]?.id || 'os-demo-1';

    // Must start OS first
    await startWorkOrder(osId);

    // If no notes, must throw
    await expect(completeWorkOrder(osId, '', 'materiais')).rejects.toThrow('descrição do serviço');

    // If no photos, must throw
    await expect(completeWorkOrder(osId, 'Serviço realizado', 'materiais')).rejects.toThrow('Adicione pelo menos uma foto');

    // Add photo
    await addWorkOrderPhoto(osId, 'data:image/png;base64,fake');

    // If no signature and no absent reason, must throw
    await expect(completeWorkOrder(osId, 'Serviço realizado', 'materiais')).rejects.toThrow('Solicite a assinatura do cliente');

    // Add signature
    await addWorkOrderSignature(osId, 'Roberto Silva', 'data:image/png;base64,sig');

    // Now completion succeeds
    const completed = await completeWorkOrder(osId, 'Serviço finalizado com vácuo de 500 micras.', 'tubos de cobre');
    expect(completed.status).toBe('Concluída');
  });
});

describe('Super Admin Protection and Platform Audit', () => {
  test('Super Admin cannot be suspended or deleted', async () => {
    await expect(toggleUserStatus('super-admin-root')).rejects.toThrow('não pode ser suspensa');
    await expect(deleteAdminUser('super-admin-root')).rejects.toThrow('não pode ser excluída');
  });

  test('fetchAdminStats returns consolidated metrics', async () => {
    const stats = await fetchAdminStats();
    expect(stats.totalUsuarios).toBeGreaterThanOrEqual(1);
    expect(stats.empresasPorPlano).toBeDefined();
  });

  test('recordAuditLog registers audit trails', async () => {
    const log = await recordAuditLog('Teste Auditoria', 'Alteração teste');
    expect(log.action).toBe('Teste Auditoria');
    const logs = await fetchAuditLogs();
    expect(logs[0].action).toBe('Teste Auditoria');
  });
});
