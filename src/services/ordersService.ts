import type { Client, Order, OrderStatus, QuoteItem } from '../types';
import { supabase } from '../lib/supabaseClient';
import { createQuoteWithItems, type QuoteInsertInput, type QuoteItemDraft } from './quotesService';

export interface OrderWithDetails extends Order {
  client: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null;
  items: QuoteItem[];
}

type RawOrderRow = Order & {
  client?: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null;
  quote?: {
    id: string;
    items?: QuoteItem[] | null;
  } | null;
};

const mapOrder = (row: RawOrderRow): OrderWithDetails => ({
  id: row.id,
  client_id: row.client_id,
  quote_id: row.quote_id ?? null,
  delivery_date: row.delivery_date,
  status: row.status as OrderStatus,
  total_amount: Number(row.total_amount ?? 0),
  delivery_details: row.delivery_details ?? null,
  created_at: row.created_at,
  client: row.client ?? null,
  items: Array.isArray(row.quote?.items) ? (row.quote?.items as QuoteItem[]) : [],
});

export async function listOrders(): Promise<OrderWithDetails[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
        *,
        client:clients (
          id,
          name,
          phone,
          email
        ),
        quote:quotes (
          id,
          items:quote_items (
            id,
            quote_id,
            product_id,
            product_name_copy,
            quantity,
            price_at_creation
          )
        )
      `,
    )
    .order('delivery_date', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erro ao carregar pedidos: ${error.message}`);
  }

  const rows = ((data ?? []) as unknown) as RawOrderRow[];

  return rows.map((row) => mapOrder(row));
}

export async function updateOrderStatus({
  id,
  status,
}: {
  id: string;
  status: OrderStatus;
}): Promise<{ id: string; status: OrderStatus }> {
  const { data, error, status: httpStatus } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select('id, status')
    .maybeSingle<{ id: string; status: OrderStatus }>();

  if (error) {
    if (httpStatus === 406 || error.code === 'PGRST116') {
      throw new Error('Pedido não encontrado ou você não tem permissao para atualizar este status.');
    }
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Resposta do Supabase vazia ao atualizar o pedido.');
  }

  return {
    id: data.id,
    status: data.status,
  };
}

export async function createManualOrder({
  client_id,
  delivery_date,
  delivery_details,
  items,
  notes
}: {
  client_id: string;
  delivery_date: string;
  delivery_details?: string;
  items: QuoteItemDraft[];
  notes?: string;
}) {
  // 1. Create a Quote with status 'Aprovado' to serve as the source of truth for items
  const totalAmount = items.reduce((acc, item) => acc + (item.price_at_creation * item.quantity), 0);

  const quotePayload: QuoteInsertInput = {
    client_id,
    status: 'Aprovado', // Auto-approved
    event_date: delivery_date, // Map delivery date to event date
    event_type: 'Pedido Manual',
    notes: notes || 'Pedido criado manualmente via painel',
    total_amount: totalAmount,
  };

  // Reuse the existing service to create quote + items
  const newQuote = await createQuoteWithItems(quotePayload, items);

  // 2. Create the Order linked to this Quote
  // Note: If there is a DB trigger that auto-creates orders on Quote Approval, this might duplicate.
  // However, since we are inserting with 'Aprovado' directly, triggers listening to 'UPDATE' might not fire.
  // Triggers listening to 'INSERT' with status 'Aprovado' might fire.
  // To be safe against duplicates, we can check if one exists or just rely on the fact that
  // usually these triggers are on 'UPDATE' of status.

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('quote_id', newQuote.id)
    .maybeSingle();

  if (existingOrder) {
    return existingOrder;
  }

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      client_id,
      quote_id: newQuote.id,
      status: 'Aprovado',
      total_amount: totalAmount,
      delivery_date,
      delivery_details: delivery_details || notes
    })
    .select()
    .single();

  if (orderError) {
    console.error('Erro ao criar pedido manual:', orderError);
    // Optional: Rollback quote creation? For now, we leave it as a "stuck" approved quote.
    throw new Error('Erro ao gerar o pedido após criar o orçamento.');
  }

  return newOrder;
}

export async function deleteOrder(id: string): Promise<void> {
  console.log('Service: deleteOrder called for id:', id);

  // 1. Check Auth
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Service: Current User ID:', session?.user?.id);
  console.log('Service: Current User Role:', session?.user?.role);

  if (!session) {
    console.error('Service: No active session found!');
    throw new Error('Usuário não autenticado.');
  }

  // 2. Check Visibility (Can we see the order?)
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    console.error('Service: Error fetching order before delete:', fetchError);
  } else if (!order) {
    console.warn('Service: Order not found via SELECT. RLS might be hiding it.');
  } else {
    console.log('Service: Order found via SELECT:', order);
  }

  // 3. Attempt Delete
  const { error, count } = await supabase.from('orders').delete({ count: 'exact' }).eq('id', id);

  if (error) {
    console.error('Service: Supabase delete error:', error);
    throw new Error(`Erro ao excluir pedido: ${error.message}`);
  }

  if (count === 0) {
    console.warn('Service: No rows deleted. Order might not exist or RLS prevented deletion.');
    throw new Error('Pedido não encontrado ou permissão negada para excluir (RLS).');
  }

  console.log('Service: Order deleted successfully');
}
export async function updateOrder(
  id: string,
  updates: {
    client_id?: string;
    delivery_date?: string;
    delivery_details?: string;
    total_amount?: number;
    status?: OrderStatus;
  }
): Promise<void> {
  const { error } = await supabase.from('orders').update(updates).eq('id', id);

  if (error) {
    throw new Error(`Erro ao atualizar pedido: ${error.message}`);
  }
}
export async function updateManualOrder({
  orderId,
  quoteId,
  client_id,
  delivery_date,
  delivery_details,
  items,
  notes
}: {
  orderId: string;
  quoteId: string;
  client_id: string;
  delivery_date: string;
  delivery_details?: string;
  items: QuoteItemDraft[];
  notes?: string;
}) {
  const totalAmount = items.reduce((acc, item) => acc + (item.price_at_creation * item.quantity), 0);

  // 1. Update Order
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      client_id,
      delivery_date,
      delivery_details,
      total_amount: totalAmount
    })
    .eq('id', orderId);

  if (orderError) throw new Error(`Erro ao atualizar pedido: ${orderError.message}`);

  // 2. Update Quote
  const { error: quoteError } = await supabase
    .from('quotes')
    .update({
      client_id,
      event_date: delivery_date,
      notes: notes || 'Pedido atualizado manualmente',
      total_amount: totalAmount
    })
    .eq('id', quoteId);

  if (quoteError) throw new Error(`Erro ao atualizar orçamento: ${quoteError.message}`);

  // 3. Update Items (Delete all and re-insert)
  const { error: deleteItemsError } = await supabase
    .from('quote_items')
    .delete()
    .eq('quote_id', quoteId);

  if (deleteItemsError) throw new Error(`Erro ao limpar itens antigos: ${deleteItemsError.message}`);

  if (items.length > 0) {
    const itemsToInsert = items.map(item => ({
      quote_id: quoteId,
      product_id: item.product_id || null,
      product_name_copy: item.product_name_copy,
      quantity: item.quantity,
      price_at_creation: item.price_at_creation,
      total_price: item.quantity * item.price_at_creation
    }));

    const { error: insertItemsError } = await supabase
      .from('quote_items')
      .insert(itemsToInsert);

    if (insertItemsError) throw new Error(`Erro ao inserir novos itens: ${insertItemsError.message}`);
  }
}
