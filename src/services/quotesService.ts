import type { Client, Quote, QuoteItem, QuoteStatus } from '../types';
import { supabase } from '../lib/supabaseClient';

export const QUOTES_PAGE_SIZE = 10;

export interface QuoteListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: QuoteStatus | 'ALL';
}

export interface QuoteListItem extends Quote {
  client?: Pick<Client, 'id' | 'name' | 'phone'> | null;
}

export interface QuoteListResponse {
  items: QuoteListItem[];
  total: number;
}

export interface QuoteDetails extends Quote {
  client?: Client | null;
  items: QuoteItem[];
}

export interface QuoteItemDraft {
  product_id?: string | null;
  product_name_copy: string;
  quantity: number;
  price_at_creation: number;
}

export type QuoteInsertInput = Omit<Quote, 'id' | 'created_at' | 'total_amount'> & {
  total_amount: number;
};

export async function listQuotes({
  page = 1,
  pageSize = QUOTES_PAGE_SIZE,
  search,
  status,
}: QuoteListParams = {}): Promise<QuoteListResponse> {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('quotes')
    .select(
      `
        *,
        client:clients!inner (
          id,
          name,
          phone
        )
      `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search?.trim()) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`, { foreignTable: 'clients' });
  }

  if (status && status !== 'ALL') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao buscar orçamentos: ${error.message}`);
  }

  const rows = ((data ?? []) as unknown as Array<Quote & { client: Client }>) ?? [];

  return {
    items: rows.map((row) => ({
      ...row,
      client: row.client ?? null,
    })),
    total: count ?? 0,
  };
}

export async function fetchQuoteDetails(id: string): Promise<QuoteDetails> {
  const { data, error } = await supabase
    .from('quotes')
    .select(
      `
        *,
        client:clients (
          id,
          name,
          phone,
          email,
          created_at
        ),
        items:quote_items (
          id,
          quote_id,
          product_id,
          product_name_copy,
          quantity,
          price_at_creation
        )
      `,
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Orçamento não encontrado.');
  }

  const parsed = (data as unknown) as Quote & {
    client: Client | null;
    items: QuoteItem[];
  };

  return {
    ...parsed,
    client: parsed.client ?? null,
    items: parsed.items ?? [],
  };
}

export async function createQuoteWithItems(quote: QuoteInsertInput, items: QuoteItemDraft[]) {
  if (!items.length) {
    throw new Error('Adicione ao menos um item ao orçamento.');
  }

  const quotePayload = {
    ...quote,
  };

  if (quotePayload.event_date && !/^\d{4}-\d{2}-\d{2}$/.test(quotePayload.event_date)) {
    quotePayload.event_date = null;
  }

  const { data, error } = await supabase.from('quotes').insert(quotePayload).select('*').single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Erro ao criar orçamento.');
  }
  const quoteId = ((data as unknown) as { id: string }).id;
  const itemsPayload = items.map((item) => ({
    quote_id: quoteId,
    product_id: item.product_id ?? null,
    product_name_copy: item.product_name_copy,
    quantity: item.quantity,
    price_at_creation: item.price_at_creation,
  }));

  const { error: itemsError } = await supabase.from('quote_items').insert(itemsPayload);
  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return (data as unknown) as Quote;
}

export async function updateQuoteStatus(id: string, status: QuoteStatus) {
  const { data, error } = await supabase.from('quotes').update({ status }).eq('id', id).select('*').single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Erro ao atualizar status.');
  }
  return (data as unknown) as Quote;
}

export async function deleteQuoteWithItems(id: string): Promise<{ success: true }> {
  const { data: relatedOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id')
    .eq('quote_id', id)
    .limit(1);

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  if (relatedOrders && relatedOrders.length > 0) {
    throw new Error('Existem pedidos vinculados a este orçamento. Cancele ou remova os pedidos antes de excluir.');
  }

  const { error: itemsError } = await supabase.from('quote_items').delete().eq('quote_id', id);
  if (itemsError) {
    throw new Error(itemsError.message);
  }
  const { error } = await supabase.from('quotes').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
  return { success: true };
}
