import type { ComponentCategory, Product, ProductType } from '../types';
import { supabase } from '../lib/supabaseClient';

export const PRODUCTS_PAGE_SIZE = 12;

const coerceNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const mapProduct = (row: Record<string, unknown>): Product => ({
  id: String(row.id),
  name: String(row.name),
  description: (row.description as string) ?? null,
  image_url: (row.image_url as string) ?? null,
  price: coerceNumber(row.price),
  unit_type: String(row.unit_type),
  product_type: row.product_type as ProductType,
  component_category: (row.component_category as ComponentCategory) ?? null,
  is_public: Boolean(row.is_public),
  created_at: row.created_at as string | undefined,
});

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  productType?: ProductType;
  componentCategory?: ComponentCategory;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
}

export type ProductInput = Omit<Product, 'id' | 'created_at'>;

export async function listProducts({
  page = 1,
  pageSize = PRODUCTS_PAGE_SIZE,
  search,
  productType,
  componentCategory,
}: ProductListParams = {}): Promise<ProductListResponse> {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('products').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);

  if (search?.trim()) {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  if (productType) {
    query = query.eq('product_type', productType);
  }

  if (componentCategory) {
    query = query.eq('component_category', componentCategory);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao buscar produtos: ${error.message}`);
  }

  const rows = ((data ?? []) as unknown) as Record<string, unknown>[];

  return {
    items: rows.map((item) => mapProduct(item)),
    total: count ?? 0,
  };
}

export async function createProduct(payload: ProductInput): Promise<Product> {
  const { data, error } = await supabase.from('products').insert(payload).select('*').single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Erro desconhecido ao criar produto.');
  }

  return mapProduct((data as unknown) as Record<string, unknown>);
}

export async function updateProduct(id: string, payload: Partial<ProductInput>): Promise<Product> {
  const { data, error } = await supabase.from('products').update(payload).eq('id', id).select('*').single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Erro desconhecido ao atualizar produto.');
  }

  return mapProduct((data as unknown) as Record<string, unknown>);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    throw new Error(`Erro ao remover produto: ${error.message}`);
  }
}

export async function listComponentCategories(): Promise<ComponentCategory[]> {
  const { data, error } = await supabase.from('products').select('component_category').not('component_category', 'is', null);

  if (error) {
    throw new Error(`Erro ao carregar categorias: ${error.message}`);
  }

  const rows = ((data ?? []) as unknown) as Array<{ component_category: ComponentCategory | null }>;

  const unique = new Set<ComponentCategory>();
  rows.forEach((row) => {
    const value = row.component_category ?? null;
    if (value) {
      unique.add(value);
    }
  });

  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}
