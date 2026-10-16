import { createClient } from '@supabase/supabase-js';

// Load Supabase credentials from environment variables (Vite exposes them with VITE_ prefix)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * CRUD helpers for the "services" table.
 * Expected table schema (Supabase):
 *   id        uuid   primary key (default `gen_random_uuid()`)
 *   title     text
 *   description text
 *   created_at timestamp (default now())
 *   updated_at timestamp (default now())
 */
export async function fetchServices() {
  const { data, error } = await supabase.from('services').select('*');
  if (error) throw error;
  return data;
}

export async function createService(service) {
  const { data, error } = await supabase.from('services').insert([service]);
  if (error) throw error;
  return data[0];
}

export async function updateService(id, updates) {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
  return data[0];
}

export async function deleteService(id) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
  return true;
}
