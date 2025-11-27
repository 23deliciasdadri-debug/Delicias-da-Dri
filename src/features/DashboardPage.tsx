import React, { useCallback, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Activity,
  Calendar as CalendarIcon,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  Users
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { fetchDashboardData, type DashboardPeriod } from '../services/dashboardService';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const integerFormatter = new Intl.NumberFormat('pt-BR');

const formatDate = (value: string | null) => {
  if (!value) return 'Sem data';
  const parsed = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('LAST_30_DAYS');

  const dashboardFetcher = useCallback(() => fetchDashboardData(period), [period]);

  const {
    data: dashboardData,
    isLoading,
    refetch,
  } = useSupabaseQuery(dashboardFetcher, {
    deps: [dashboardFetcher],
  });

  const handlePeriodChange = (value: string) => {
    const map: Record<string, DashboardPeriod> = {
      '7days': 'LAST_30_DAYS',
      'month': 'THIS_MONTH',
      'year': 'THIS_YEAR',
      'all': 'ALL_TIME'
    };
    if (map[value]) {
      setPeriod(map[value]);
    } else {
      setPeriod('LAST_30_DAYS');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Visão geral financeira e operacional do seu negócio.</p>
        </div>

        <div className="flex items-center space-x-2">
          <Select onValueChange={handlePeriodChange} defaultValue="7days">
            <SelectTrigger className="w-[180px] bg-white">
              <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Últimos 30 dias</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" className="bg-white" onClick={() => void refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Receita */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Receita Total</p>
              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <h2 className="text-3xl font-bold text-slate-900">
                {dashboardData ? currencyFormatter.format(dashboardData.totalRevenue) : '...'}
              </h2>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos Entregues (was Despesas in prototype) */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Despesas</p>
              <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-rose-600" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <h2 className="text-3xl font-bold text-slate-900">
                {dashboardData ? currencyFormatter.format(dashboardData.expenses) : '...'}
              </h2>
              {/* Placeholder trend */}
              <span className="flex items-center text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +4%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Orçamentos Aprovados (was Lucro Líquido in prototype) */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Orçamentos Aprovados</p>
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <h2 className="text-3xl font-bold text-slate-900">
                {dashboardData ? integerFormatter.format(dashboardData.approvedQuotes) : '...'}
              </h2>
              <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Médio (Matches prototype) */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Ticket Médio</p>
              <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <h2 className="text-3xl font-bold text-slate-900">
                {dashboardData && dashboardData.deliveredOrders > 0
                  ? currencyFormatter.format(dashboardData.totalRevenue / dashboardData.deliveredOrders)
                  : currencyFormatter.format(0)}
              </h2>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +2%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        {/* Chart Section */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>Receitas vs Despesas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full min-w-0" style={{ minHeight: '350px', minWidth: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dashboardData?.revenueTrend || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `R$${value / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => currencyFormatter.format(value)}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReceitas)"
                    name="Receita"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDespesas)"
                    name="Despesas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas movimentações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {dashboardData?.recentActivity?.map((item) => (
                <div key={item.id} className="flex items-start justify-between group">
                  <div className="flex items-start space-x-4">
                    <div className={`w-2 h-2 mt-2 rounded-full ${item.type === 'expense' ? 'bg-rose-500' :
                      item.status === 'Entregue' ? 'bg-emerald-500' : 'bg-slate-300'
                      }`} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.date ? formatDate(item.date) : 'Data pendente'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`block text-sm font-semibold ${item.type === 'expense' ? 'text-rose-600' : 'text-slate-900'}`}>
                      {item.type === 'expense' ? '-' : '+'}{currencyFormatter.format(item.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">{item.status}</span>
                  </div>
                </div>
              ))}
              {!dashboardData?.recentActivity?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
              Ver todas as atividades
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
