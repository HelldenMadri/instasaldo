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

  const client = {
    from: mockFrom,
    auth: {
      signInWithPassword: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
    // Expose mocks so tests can control them
    _mocks: {
      mockFrom,
      mockSelect,
      mockInsert,
      mockUpdate,
      mockUpdateEq,
      mockDelete,
      mockDeleteEq,
    },
  };

  return {
    createClient: jest.fn(() => client),
    __esModule: true,
  };
});

import { createClient } from '@supabase/supabase-js';
import { fetchServices, createService, updateService, deleteService, isSuperAdmin, SUPER_ADMIN_EMAIL } from './api.js';

const dummyClient = createClient();
const {
  mockFrom,
  mockSelect,
  mockInsert,
  mockUpdate,
  mockUpdateEq,
  mockDelete,
  mockDeleteEq,
} = dummyClient._mocks;

beforeEach(() => {
  jest.clearAllMocks();
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

describe('Super Admin rules', () => {
  test('isSuperAdmin should strictly identify the super admin email', () => {
    expect(isSuperAdmin('agenciavallor01@gmail.com')).toBe(true);
    expect(isSuperAdmin('AGENCIAVALLOR01@GMAIL.COM')).toBe(true);
    expect(isSuperAdmin('outro@gmail.com')).toBe(false);
    expect(isSuperAdmin('')).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });
});

describe('Supabase API wrapper', () => {
  test('fetchServices should return data from supabase', async () => {
    const mockData = [{ id: '1', cliente: 'Teste' }];
    mockSelect.mockResolvedValue({ data: mockData, error: null });
    const result = await fetchServices();
    expect(mockFrom).toHaveBeenCalledWith('services');
    expect(mockSelect).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  test('createService should insert and return created record', async () => {
    const newService = { cliente: 'Novo' };
    const mockInserted = [{ id: '2', cliente: 'Novo' }];
    mockSelect.mockResolvedValue({ data: mockInserted, error: null });
    const result = await createService(newService);
    expect(mockFrom).toHaveBeenCalledWith('services');
    expect(mockInsert).toHaveBeenCalledWith([newService]);
    expect(result).toEqual(mockInserted[0]);
  });

  test('updateService should update and return the updated record', async () => {
    const updates = { cliente: 'Atualizado' };
    const mockUpdated = [{ id: '3', cliente: 'Atualizado' }];
    mockSelect.mockResolvedValue({ data: mockUpdated, error: null });
    const result = await updateService('3', updates);
    expect(mockFrom).toHaveBeenCalledWith('services');
    expect(mockUpdate).toHaveBeenCalledWith(updates);
    expect(mockUpdateEq).toHaveBeenCalledWith('id', '3');
    expect(result).toEqual(mockUpdated[0]);
  });

  test('deleteService should delete and return true', async () => {
    mockDeleteEq.mockResolvedValue({ error: null });
    const result = await deleteService('4');
    expect(mockFrom).toHaveBeenCalledWith('services');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith('id', '4');
    expect(result).toBe(true);
  });
});

// Additional tests for error handling
test('fetchServices should throw when supabase returns error', async () => {
  const mockError = new Error('fetch error');
  mockSelect.mockResolvedValue({ data: null, error: mockError });
  await expect(fetchServices()).rejects.toThrow('fetch error');
});

test('createService should throw on error', async () => {
  const mockError = new Error('create error');
  mockSelect.mockResolvedValue({ data: null, error: mockError });
  await expect(createService({ cliente: 'X' })).rejects.toThrow('create error');
});

test('updateService should throw on error', async () => {
  const mockError = new Error('update error');
  mockSelect.mockResolvedValue({ data: null, error: mockError });
  await expect(updateService('1', { cliente: 'Y' })).rejects.toThrow('update error');
});

test('deleteService should throw on error', async () => {
  const mockError = new Error('delete error');
  mockDeleteEq.mockResolvedValue({ error: mockError });
  await expect(deleteService('1')).rejects.toThrow('delete error');
});
