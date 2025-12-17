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
  type: 'order' | 'expense' | 'income';
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

interface TransactionRow {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string | null;
  category?: {
    name: string;
  } | null;
}

/**
 * Agrupa transações por mês para o gráfico de tendência
 */
function buildRevenueTrend(
  deliveredRows: DeliveredOrderRow[],
  transactionRows: TransactionRow[]
): DashboardRevenuePoint[] {
  const today = new Date();
  const monthsToShow = 6;
  const start = new Date(today.getFullYear(), today.getMonth() - (monthsToShow - 1), 1);

  // Buckets para receita (de pedidos entregues)
  const revenueBuckets = new Map<string, number>();
  deliveredRows.forEach((row) => {
    if (!row.delivery_date) return;
    const parsed = new Date(`${row.delivery_date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return;
    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    const currentValue = revenueBuckets.get(key) ?? 0;
    revenueBuckets.set(key, currentValue + Number(row.total_amount ?? 0));
  });

  // Buckets para despesas (da tabela transactions)
  const expenseBuckets = new Map<string, number>();
  transactionRows.forEach((row) => {
    if (row.type !== 'expense') return;
    const parsed = new Date(`${row.date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return;
    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    const currentValue = expenseBuckets.get(key) ?? 0;
    expenseBuckets.set(key, currentValue + Number(row.amount ?? 0));
  });

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: '2-digit',
  });

  const result: DashboardRevenuePoint[] = [];
  for (let i = 0; i < monthsToShow; i += 1) {
    const current = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    const revenue = Number(revenueBuckets.get(key) ?? 0);
    const expenses = Number(expenseBuckets.get(key) ?? 0);

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

  // Query de pedidos entregues
  const ordersQuery = supabase
    .from('orders')
    .select('id, total_amount, delivery_date')
    .eq('status', 'Entregue')
    .order('delivery_date', { ascending: true });

  if (startDate) {
    ordersQuery.gte('delivery_date', startDate);
  }

  // Query de transações (para despesas reais)
  const transactionsQuery = supabase
    .from('transactions')
    .select(`
      id,
      type,
      amount,
      date,
      description,
      category:transaction_categories (name)
    `)
    .order('date', { ascending: false });

  if (startDate) {
    transactionsQuery.gte('date', startDate);
  }

  const [ordersResponse, quotesResponse, clientsResponse, recentOrdersResponse, transactionsResponse] = await Promise.all([
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
    transactionsQuery,
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
  if (transactionsResponse.error) {
    throw new Error(`Erro ao carregar transações: ${transactionsResponse.error.message}`);
  }

  const deliveredRows = ((ordersResponse.data ?? []) as unknown) as DeliveredOrderRow[];

  // Calcular receitas e despesas REAIS da tabela transactions
  const transactionRows = ((transactionsResponse.data ?? []) as unknown) as TransactionRow[];

  const totalRevenue = transactionRows
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount ?? 0), 0);

  const expenses = transactionRows
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount ?? 0), 0);

  const recentOrdersRaw = ((recentOrdersResponse.data ?? []) as unknown) as RecentOrderRow[];

  // Combinar atividades recentes: pedidos + transações
  const recentActivity: DashboardActivityItem[] = [];

  // Adicionar pedidos recentes
  recentOrdersRaw.forEach((row) => {
    recentActivity.push({
      id: row.id,
      type: 'order',
      label: row.client?.name ?? 'Cliente',
      status: row.status,
      amount: Number(row.total_amount ?? 0),
      date: row.delivery_date ?? null,
    });
  });

  // Adicionar transações recentes (últimas 3 despesas)
  const recentExpenses = transactionRows
    .filter(t => t.type === 'expense')
    .slice(0, 3);

  recentExpenses.forEach((t) => {
    recentActivity.push({
      id: t.id,
      type: 'expense',
      label: t.description || t.category?.name || 'Despesa',
      status: 'Pago',
      amount: Number(t.amount ?? 0),
      date: t.date,
    });
  });

  // Ordenar por data (mais recente primeiro) e limitar
  recentActivity.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  return {
    periodLabel: label,
    totalRevenue,
    expenses,
    deliveredOrders: deliveredRows.length,
    approvedQuotes: quotesResponse.count ?? 0,
    newClients: clientsResponse.count ?? 0,
    revenueTrend: buildRevenueTrend(deliveredRows, transactionRows),
    recentActivity: recentActivity.slice(0, 6),
  };
}

