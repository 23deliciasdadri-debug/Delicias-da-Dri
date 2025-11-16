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

export interface QuotePublicPreviewPayload {
  quote: Quote;
  client: Client;
  items: QuoteItem[];
}

export interface QuotePublicLinkInfo {
  quoteId: string;
  token: string;
  expiresAt: string | null;
  url: string;
}

export interface QuoteDocumentItemLine {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  formattedUnitPrice: string;
  formattedSubtotal: string;
}

export interface QuoteDocumentData {
  quoteId: string;
  status: QuoteStatus;
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string | null;
  totalAmount: number;
  formattedTotal: string;
  eventType?: string | null;
  eventDate?: string | null;
  notes?: string | null;
  client: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  items: QuoteDocumentItemLine[];
  currency: 'BRL';
}

export type QuoteInsertInput = Omit<
  Quote,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'approved_at'
  | 'public_link_token'
  | 'public_link_token_expires_at'
  | 'public_link_last_viewed_at'
  | 'total_amount'
> & {
  total_amount: number;
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_COMPANY_NAME = 'Delicias da Dri';
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const sanitizePhone = (phone?: string | null) => phone?.replace(/\D/g, '') ?? '';

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
};

const normalizeDateString = (value?: string | null) => {
  if (!value) {
    return null;
  }
  return DATE_REGEX.test(value) ? value : null;
};

const normalizeQuoteRow = (row: Record<string, unknown>): Quote => ({
  id: row.id as string,
  client_id: row.client_id as string,
  status: row.status as QuoteStatus,
  event_type: row.event_type ?? null,
  event_date: row.event_date ?? null,
  total_amount: Number(row.total_amount ?? 0),
  notes: row.notes ?? null,
  created_at: row.created_at ?? undefined,
  updated_at: row.updated_at ?? undefined,
  approved_at: row.approved_at ?? null,
  public_link_token: row.public_link_token ?? null,
  public_link_token_expires_at: row.public_link_token_expires_at ?? null,
  public_link_last_viewed_at: row.public_link_last_viewed_at ?? null,
});

const normalizeQuoteItemRow = (row: Record<string, unknown>): QuoteItem => ({
  id: Number(row.id ?? row.item_id ?? 0),
  quote_id: row.quote_id as string,
  product_id: row.product_id ?? row.item_product_id ?? null,
  product_name_copy: row.product_name_copy ?? row.item_product_name ?? '',
  quantity: Number(row.quantity ?? row.item_quantity ?? 0),
  price_at_creation: Number(row.price_at_creation ?? row.item_price ?? 0),
});

const buildItemsPayload = (quoteId: string, items: QuoteItemDraft[]) =>
  items.map((item) => ({
    quote_id: quoteId,
    product_id: item.product_id ?? null,
    product_name_copy: item.product_name_copy,
    quantity: Number(item.quantity ?? 0),
    price_at_creation: Number(item.price_at_creation ?? 0),
  }));

const getDefaultOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
};

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

const formatCurrency = (value: number) => currencyFormatter.format(Number(value ?? 0));

export function buildQuotePublicUrl(token: string, baseUrl?: string) {
  const origin = (baseUrl ?? getDefaultOrigin()).replace(/\/$/, '');
  const safeOrigin = origin || '';
  return `${safeOrigin}/orcamento/preview/${token}`;
}

export interface QuoteWhatsAppParams {
  phone?: string | null;
  clientName?: string | null;
  quoteUrl?: string | null;
  totalAmount?: number;
  businessName?: string;
}

export function buildQuoteWhatsAppShare({
  phone,
  clientName,
  quoteUrl,
  totalAmount,
  businessName = DEFAULT_COMPANY_NAME,
}: QuoteWhatsAppParams): string | null {
  const digits = sanitizePhone(phone);
  if (!digits) {
    return null;
  }
  const formattedDigits = digits.startsWith('55') ? digits : `55${digits}`;
  const parts = [
    `Ola${clientName ? ` ${clientName}` : ''}! Aqui e ${businessName}.`,
    'Preparamos um orcamento personalizado para voce.',
  ];
  if (typeof totalAmount === 'number') {
    parts.push(`Valor estimado: ${formatCurrency(totalAmount)}.`);
  }
  if (quoteUrl) {
    parts.push(`Veja todos os detalhes e aprove direto neste link: ${quoteUrl}`);
  }
  const text = encodeURIComponent(parts.join(' '));
  return `https://wa.me/${formattedDigits}?text=${text}`;
}

export function buildQuotePdfFileName({
  clientName,
  eventDate,
  quoteId,
}: {
  clientName?: string | null;
  eventDate?: string | null;
  quoteId?: string | null;
}) {
  const parts = ['orcamento'];
  if (clientName) {
    parts.push(slugify(clientName));
  }
  if (eventDate) {
    parts.push(eventDate.replace(/-/g, ''));
  }
  if (quoteId) {
    parts.push(quoteId.slice(0, 8));
  }
  return `${parts.filter(Boolean).join('-')}.pdf`;
}

export function prepareQuoteDocumentData({
  quote,
  client,
  items,
}: {
  quote: Quote;
  client?: Client | null;
  items: QuoteItem[];
}): QuoteDocumentData {
  const lines: QuoteDocumentItemLine[] = (items ?? []).map((item, index) => {
    const unitPrice = Number(item.price_at_creation ?? 0);
    const quantity = Number(item.quantity ?? 0);
    const subtotal = unitPrice * quantity;
    return {
      id: String(item.id ?? `${index}`),
      title: item.product_name_copy ?? 'Item',
      quantity,
      unitPrice,
      subtotal,
      formattedUnitPrice: formatCurrency(unitPrice),
      formattedSubtotal: formatCurrency(subtotal),
    };
  });

  const fallbackTotal = lines.reduce((acc, line) => acc + line.subtotal, 0);
  const totalAmount = typeof quote.total_amount === 'number' ? quote.total_amount : fallbackTotal;

  return {
    quoteId: quote.id,
    status: quote.status,
    createdAt: quote.created_at,
    updatedAt: quote.updated_at,
    approvedAt: quote.approved_at ?? null,
    totalAmount,
    formattedTotal: formatCurrency(totalAmount),
    eventType: quote.event_type ?? null,
    eventDate: quote.event_date ?? null,
    notes: quote.notes ?? null,
    client: {
      name: client?.name ?? null,
      phone: client?.phone ?? null,
      email: client?.email ?? null,
    },
    items: lines,
    currency: 'BRL',
  };
}

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
    throw new Error(`Erro ao buscar orcamentos: ${error.message}`);
  }

  const rows = ((data ?? []) as unknown as Array<Quote & { client: Client }>) ?? [];

  return {
    items: rows.map((row) => ({
      ...normalizeQuoteRow(row),
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
    throw new Error(error?.message ?? 'Orcamento nao encontrado.');
  }

  const parsed = data as Quote & {
    client: Client | null;
    items: QuoteItem[];
  };

  return {
    ...normalizeQuoteRow(parsed),
    client: parsed.client ?? null,
    items: (parsed.items ?? []).map((item) => normalizeQuoteItemRow(item)),
  };
}

export async function createQuoteWithItems(quote: QuoteInsertInput, items: QuoteItemDraft[]) {
  if (!items.length) {
    throw new Error('Adicione ao menos um item ao orcamento.');
  }

  const quotePayload = {
    ...quote,
    event_date: normalizeDateString(quote.event_date),
  };

  const { data, error } = await supabase.from('quotes').insert(quotePayload).select('*').single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Erro ao criar orcamento.');
  }
  const quoteId = (data as { id: string }).id;
  const itemsPayload = buildItemsPayload(quoteId, items);

  try {
    const { error: itemsError } = await supabase.from('quote_items').insert(itemsPayload);
    if (itemsError) {
      throw new Error(itemsError.message);
    }
  } catch (itemsError) {
    try {
      await supabase.from('quotes').delete().eq('id', quoteId);
    } catch (cleanupError) {
      console.error('Falha ao remover orcamento orfao apos erro nos itens:', cleanupError);
    }
    throw itemsError instanceof Error ? itemsError : new Error('Erro ao salvar itens do orcamento.');
  }

  return normalizeQuoteRow(data);
}

export async function updateQuoteWithItems(
  quoteId: string,
  quote: QuoteInsertInput,
  items: QuoteItemDraft[],
) {
  if (!quoteId) {
    throw new Error('ID do orcamento e obrigatorio.');
  }

  if (!items.length) {
    throw new Error('Adicione ao menos um item ao orcamento.');
  }

  const quotePayload = {
    ...quote,
    event_date: normalizeDateString(quote.event_date),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('quotes')
    .update(quotePayload)
    .eq('id', quoteId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Erro ao atualizar orcamento.');
  }

  const { error: deleteError } = await supabase.from('quote_items').delete().eq('quote_id', quoteId);
  if (deleteError) {
    throw new Error(`Erro ao limpar itens do orcamento: ${deleteError.message}`);
  }

  const itemsPayload = buildItemsPayload(quoteId, items);
  const { error: insertError } = await supabase.from('quote_items').insert(itemsPayload);
  if (insertError) {
    throw new Error(`Erro ao salvar itens do orcamento: ${insertError.message}`);
  }

  return normalizeQuoteRow(data);
}

export async function regenerateQuotePublicLink(
  quoteId: string,
  { expiresAt, baseUrl }: { expiresAt?: string | null; baseUrl?: string } = {},
): Promise<QuotePublicLinkInfo> {
  if (!quoteId) {
    throw new Error('Selecione um orcamento para gerar o link publico.');
  }

  const token = generateUuid();
  const updatePayload = {
    public_link_token: token,
    public_link_token_expires_at: expiresAt ?? null,
    public_link_last_viewed_at: null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('quotes')
    .update(updatePayload)
    .eq('id', quoteId)
    .select('id, public_link_token, public_link_token_expires_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Erro ao gerar link publico.');
  }

  return {
    quoteId,
    token,
    expiresAt: data.public_link_token_expires_at ?? null,
    url: buildQuotePublicUrl(token, baseUrl),
  };
}

export async function getQuotePublicPreview(token: string): Promise<QuotePublicPreviewPayload> {
  if (!token) {
    throw new Error('Token do link publico e obrigatorio.');
  }

  const { data, error } = await supabase.rpc('get_quote_public_preview', { input_token: token });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as QuotePublicPreviewRow[];
  if (!rows.length) {
    throw new Error('Link invalido ou expirado.');
  }

  const first = rows[0];
  const quote = normalizeQuoteRow({
    id: first.quote_id,
    client_id: first.client_id,
    status: first.quote_status,
    event_type: first.quote_event_type,
    event_date: first.quote_event_date,
    total_amount: first.quote_total_amount,
    notes: first.quote_notes,
    created_at: first.quote_created_at,
    updated_at: first.quote_updated_at,
    approved_at: first.quote_approved_at,
  });

  const client: Client = {
    id: first.client_id,
    name: first.client_name ?? '',
    phone: first.client_phone ?? '',
    email: first.client_email ?? null,
    created_at: undefined,
  };

  const items = rows
    .filter((row) => row.item_id !== null)
    .map((row) =>
      normalizeQuoteItemRow({
        id: row.item_id,
        quote_id: row.quote_id,
        product_id: row.item_product_id,
        product_name_copy: row.item_product_name,
        quantity: row.item_quantity,
        price_at_creation: row.item_price,
      }),
    );

  return {
    quote,
    client,
    items,
  };
}

export async function approveQuoteViaToken(token: string): Promise<Quote> {
  if (!token) {
    throw new Error('Token invalido para aprovacao.');
  }

  const { data, error } = await supabase.rpc('approve_quote_via_token', { input_token: token });

  if (error || !data) {
    throw new Error(error?.message ?? 'Nao foi possivel aprovar este orcamento.');
  }

  return normalizeQuoteRow(data);
}

export async function updateQuoteStatus(id: string, status: QuoteStatus) {
  const { data, error } = await supabase
    .from('quotes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Erro ao atualizar status.');
  }
  return normalizeQuoteRow(data);
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
    throw new Error('Existem pedidos vinculados a este orcamento. Cancele ou remova os pedidos antes de excluir.');
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

interface QuotePublicPreviewRow {
  quote_id: string;
  quote_status: QuoteStatus;
  quote_event_type?: string | null;
  quote_event_date?: string | null;
  quote_notes?: string | null;
  quote_total_amount: number;
  quote_created_at?: string;
  quote_updated_at?: string;
  quote_approved_at?: string | null;
  client_id: string;
  client_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  item_id?: number | null;
  item_product_id?: string | null;
  item_product_name?: string | null;
  item_quantity?: number | null;
  item_price?: number | null;
}
