import type { OrderStatus } from '../types';
import { supabase } from '../lib/supabaseClient';

export type DashboardPeriod = 'LAST_30_DAYS' | 'THIS_MONTH' | 'THIS_YEAR' | 'ALL_TIME';

export interface DashboardRevenuePoint {
  key: string;
  label: string;
  revenue: number;
  expenses: number;
}

export interface DashboardActivityItem {
  id: string;
  type: 'order' | 'expense';
  label: string;
  status: string;
  amount: number;
  date: string | null;
}

export interface DashboardData {
  periodLabel: string;
  totalRevenue: number;
  expenses: number;
  deliveredOrders: number;
  approvedQuotes: number;
  newClients: number;
  revenueTrend: DashboardRevenuePoint[];
  recentActivity: DashboardActivityItem[];
}

interface PeriodConfig {
  startDate: string | null;
  label: string;
}

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  LAST_30_DAYS: 'Últimos 30 dias',
  THIS_MONTH: 'Este mês',
  THIS_YEAR: 'Este ano',
  ALL_TIME: 'Desde o início',
};

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolvePeriod(period: DashboardPeriod): PeriodConfig {
  const today = new Date();
  let startDate: string | null = null;

  switch (period) {
    case 'LAST_30_DAYS': {
      const reference = new Date(today);
      reference.setDate(reference.getDate() - 30);
      startDate = formatDateOnly(reference);
      break;
    }
    case 'THIS_MONTH': {
      const reference = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = formatDateOnly(reference);
      break;
    }
    case 'THIS_YEAR': {
      const reference = new Date(today.getFullYear(), 0, 1);
      startDate = formatDateOnly(reference);
      break;
    }
    default:
      startDate = null;
  }

  return { startDate, label: PERIOD_LABELS[period] };
}

interface DeliveredOrderRow {
  id: string;
  total_amount: number;
  delivery_date: string | null;
}

interface RecentOrderRow {
  id: string;
  status: OrderStatus;
  total_amount: number;
  delivery_date: string | null;
  client?: {
    id: string;
    name: string | null;
  } | null;
}

function buildRevenueTrend(rows: DeliveredOrderRow[]): DashboardRevenuePoint[] {
  const today = new Date();
  const monthsToShow = 6;
  const start = new Date(today.getFullYear(), today.getMonth() - (monthsToShow - 1), 1);

  const buckets = new Map<string, number>();

  rows.forEach((row) => {
    if (!row.delivery_date) {
      return;
    }
    const parsed = new Date(`${row.delivery_date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }
    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    const currentValue = buckets.get(key) ?? 0;
    buckets.set(key, currentValue + Number(row.total_amount ?? 0));
  });

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: '2-digit',
  });

  const result: DashboardRevenuePoint[] = [];
  for (let i = 0; i < monthsToShow; i += 1) {
    const current = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    const revenue = Number(buckets.get(key) ?? 0);
    // Mock expenses as 40-60% of revenue + some random variance
    const expenses = Math.floor(revenue * (0.4 + Math.random() * 0.2));

    result.push({
      key,
      label: formatter.format(current),
      revenue,
      expenses,
    });
  }

  return result;
}

export async function fetchDashboardData(period: DashboardPeriod): Promise<DashboardData> {
  const { startDate, label } = resolvePeriod(period);

  const ordersQuery = supabase
    .from('orders')
    .select('id, total_amount, delivery_date')
    .eq('status', 'Entregue')
    .order('delivery_date', { ascending: true });

  if (startDate) {
    ordersQuery.gte('delivery_date', startDate);
  }

  const [ordersResponse, quotesResponse, clientsResponse, recentOrdersResponse] = await Promise.all([
    ordersQuery,
    (() => {
      const query = supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'Aprovado');
      if (startDate) {
        query.gte('created_at', `${startDate}T00:00:00`);
      }
      return query;
    })(),
    (() => {
      const query = supabase.from('clients').select('id', { count: 'exact', head: true });
      if (startDate) {
        query.gte('created_at', `${startDate}T00:00:00`);
      }
      return query;
    })(),
    supabase
      .from('orders')
      .select(
        `
        id,
        status,
        total_amount,
        delivery_date,
        client:clients (
          id,
          name
        )
      `,
      )
      .order('delivery_date', { ascending: false, nullsFirst: true })
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (ordersResponse.error) {
    throw new Error(`Erro ao carregar pedidos entregues: ${ordersResponse.error.message}`);
  }
  if (quotesResponse.error) {
    throw new Error(`Erro ao contar orçamentos aprovados: ${quotesResponse.error.message}`);
  }
  if (clientsResponse.error) {
    throw new Error(`Erro ao contar novos clientes: ${clientsResponse.error.message}`);
  }
  if (recentOrdersResponse.error) {
    throw new Error(`Erro ao buscar pedidos recentes: ${recentOrdersResponse.error.message}`);
  }

  const deliveredRows = ((ordersResponse.data ?? []) as unknown) as DeliveredOrderRow[];
  const totalRevenue = deliveredRows.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);

  // Mock total expenses
  const expenses = Math.floor(totalRevenue * 0.45);

  const recentOrdersRaw = ((recentOrdersResponse.data ?? []) as unknown) as RecentOrderRow[];

  const recentActivity: DashboardActivityItem[] = recentOrdersRaw.map((row) => ({
    id: row.id,
    type: 'order',
    label: row.client?.name ?? 'Cliente',
    status: row.status,
    amount: Number(row.total_amount ?? 0),
    date: row.delivery_date ?? null,
  }));

  // Inject some mock expenses into recent activity if list is short or just to mix it up
  if (recentActivity.length > 0) {
    recentActivity.splice(1, 0, {
      id: 'exp-1',
      type: 'expense',
      label: 'Supermercado Atacadão',
      status: 'Pago',
      amount: 450.00,
      date: new Date().toISOString(),
    });
    if (recentActivity.length > 3) {
      recentActivity.splice(3, 0, {
        id: 'exp-2',
        type: 'expense',
        label: 'Embalagens & Cia',
        status: 'Pendente',
        amount: 120.50,
        date: new Date(Date.now() - 86400000).toISOString(),
      });
    }
  }

  return {
    periodLabel: label,
    totalRevenue,
    expenses,
    deliveredOrders: deliveredRows.length,
    approvedQuotes: quotesResponse.count ?? 0,
    newClients: clientsResponse.count ?? 0,
    revenueTrend: buildRevenueTrend(deliveredRows),
    recentActivity: recentActivity.slice(0, 6), // Limit to 6 items
  };
}
