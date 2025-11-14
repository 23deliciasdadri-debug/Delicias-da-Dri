import type { Client } from '../types';
import { supabase } from '../lib/supabaseClient';

export const CLIENTS_PAGE_SIZE = 10;

const mapClient = (row: Record<string, unknown>): Client => ({
  id: String(row.id),
  name: String(row.name),
  phone: String(row.phone),
  email: (row.email as string) ?? null,
  created_at: row.created_at as string | undefined,
});

export interface ClientListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ClientListResponse {
  items: Client[];
  total: number;
}

export type ClientInput = Omit<Client, 'id' | 'created_at'>;

export async function listClients({
  page = 1,
  pageSize = CLIENTS_PAGE_SIZE,
  search,
}: ClientListParams = {}): Promise<ClientListResponse> {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search?.trim()) {
    const term = search.trim().replace(/,/g, ''); // evita conflito com delimitador de OR
    query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao buscar clientes: ${error.message}`);
  }

  const rows = (data as unknown as Record<string, unknown>[]) ?? [];

  return {
    items: rows.map((row) => mapClient(row)),
    total: count ?? 0,
  };
}

export async function createClient(payload: ClientInput): Promise<Client> {
  const { data, error } = await supabase.from('clients').insert(payload).select('*').single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Erro desconhecido ao criar cliente.');
  }

  return mapClient((data as unknown) as Record<string, unknown>);
}

export async function updateClient(id: string, payload: Partial<ClientInput>): Promise<Client> {
  const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select('*').single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Erro desconhecido ao atualizar cliente.');
  }

  return mapClient((data as unknown) as Record<string, unknown>);
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id);

  if (error) {
    throw new Error(`Erro ao remover cliente: ${error.message}`);
  }
}
