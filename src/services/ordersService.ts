import type { Client, Order, OrderStatus, QuoteItem } from '../types';
import { supabase } from '../lib/supabaseClient';

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
    .maybeSingle();

  if (error) {
    if (httpStatus === 406 || error.code === 'PGRST116') {
      throw new Error('Pedido nao encontrado ou voce nao tem permissao para atualizar este status.');
    }
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Resposta do Supabase vazia ao atualizar o pedido.');
  }

  return {
    id: (data as { id: string }).id,
    status: (data as { status: OrderStatus }).status,
  };
}
