import type { InventoryItem } from '../types';
import { supabase } from '../lib/supabaseClient';

export const INVENTORY_PAGE_SIZE = 15;

export interface InventoryListParams {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface InventoryListResult {
  items: InventoryItem[];
  total: number;
}

const mapInventoryItem = (row: Record<string, any>): InventoryItem => ({
  id: String(row.id),
  name: String(row.name),
  quantity: Number(row.quantity ?? 0),
  unit: String(row.unit ?? ''),
  min_stock: Number(row.min_stock ?? 0),
  category: row.category ?? null,
  status: row.status ?? null,
  location: row.location ?? null,
  notes: row.notes ?? null,
  created_at: row.created_at ?? undefined,
  updated_at: row.updated_at ?? undefined,
});

export async function listInventoryItems(params: InventoryListParams = {}): Promise<InventoryListResult> {
  const { category, search, page = 1, pageSize = INVENTORY_PAGE_SIZE } = params;

  // Query para contar total
  let countQuery = supabase
    .from('inventory_items')
    .select('*', { count: 'exact', head: true });

  if (category && category !== 'all') {
    countQuery = countQuery.eq('category', category);
  }

  if (search?.trim()) {
    const term = search.trim();
    countQuery = countQuery.ilike('name', `%${term}%`);
  }

  const { count, error: countError } = await countQuery;
  if (countError) {
    throw new Error(`Erro ao contar itens: ${countError.message}`);
  }

  // Query para buscar itens paginados
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('inventory_items')
    .select('*')
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (search?.trim()) {
    const term = search.trim();
    query = query.ilike('name', `%${term}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Erro ao carregar estoque: ${error.message}`);
  }

  return {
    items: (data ?? []).map((row) => mapInventoryItem(row as Record<string, any>)),
    total: count ?? 0,
  };
}

export type InventoryItemInput = Omit<
  InventoryItem,
  'id' | 'created_at' | 'updated_at'
> & { id?: string };

export async function saveInventoryItem(input: InventoryItemInput): Promise<InventoryItem> {
  if (!input.name?.trim()) {
    throw new Error('Nome do item é obrigatório.');
  }
  if (!input.unit?.trim()) {
    throw new Error('Unidade é obrigatória.');
  }

  const payload = {
    id: input.id,
    name: input.name.trim(),
    quantity: Number(input.quantity ?? 0),
    unit: input.unit.trim(),
    min_stock: Number(input.min_stock ?? 0),
    category: input.category?.trim() || null,
    status: input.status?.trim() || null,
    location: input.location?.trim() || null,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from('inventory_items')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Erro ao salvar item de estoque.');
  }

  return mapInventoryItem(data as Record<string, any>);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  if (!id) {
    throw new Error('ID do item é obrigatório para excluir.');
  }
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);
  if (error) {
    throw new Error(`Erro ao excluir item: ${error.message}`);
  }
}
