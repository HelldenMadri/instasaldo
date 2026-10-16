if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'test') {
  try {
    const { config } = require('dotenv');
    config();
  } catch (e) {
    // browser ignore
  }
}
import { createClient } from '@supabase/supabase-js';

// Get credentials in Node / Jest environment or browser
const SUPABASE_URL = (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_URL : '') || '';
const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_ANON_KEY : '') || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SUPER_ADMIN_EMAIL = 'agenciavallor01@gmail.com';

export function isSuperAdmin(email) {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    // redirectTo can be set if needed
  });
  if (error) throw error;
  return data;
}

/**
 * CRUD helpers for the "services" table.
 */
export async function fetchServices() {
  const { data, error } = await supabase.from('services').select('*');
  if (error) throw error;
  return data || [];
}

export async function createService(service) {
  const { data, error } = await supabase.from('services').insert([service]).select();
  if (error) throw error;
  return data ? data[0] : service;
}

export async function updateService(id, updates) {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data ? data[0] : updates;
}

export async function deleteService(id) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ----- Super Admin User Management Helpers -----
export async function fetchUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
}

export async function createUser(user) {
  const { data, error } = await supabase.from('users').insert([user]).select();
  if (error) throw error;
  return data ? data[0] : user;
}

export async function updateUser(id, updates) {
  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select();
  if (error) throw error;
  return data ? data[0] : updates;
}

export async function deleteUser(id) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
  return true;
}
