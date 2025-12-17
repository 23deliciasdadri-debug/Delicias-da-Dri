import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral financeira e operacional do seu negócio.</p>
        </div>

        <div className="flex items-center space-x-2">
          <Select onValueChange={handlePeriodChange} defaultValue="7days">
            <SelectTrigger className="w-[180px] bg-card">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Últimos 30 dias</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" className="bg-card" onClick={() => void refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Receita */}
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <h2 className="text-3xl font-bold text-foreground">
                {dashboardData ? currencyFormatter.format(dashboardData.totalRevenue) : '...'}
              </h2>
              <span className="flex items-center text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos Entregues (was Despesas in prototype) */}
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Despesas</p>
              <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-destructive" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <h2 className="text-3xl font-bold text-foreground">
                {dashboardData ? currencyFormatter.format(dashboardData.expenses) : '...'}
              </h2>
              {/* Placeholder trend */}
              <span className="flex items-center text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +4%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Orçamentos Aprovados (was Lucro Líquido in prototype) */}
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Orçamentos Aprovados</p>
              <div className="h-8 w-8 rounded-full bg-info/10 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-info" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <h2 className="text-3xl font-bold text-foreground">
                {dashboardData ? integerFormatter.format(dashboardData.approvedQuotes) : '...'}
              </h2>
              <span className="flex items-center text-xs font-medium text-info bg-info/10 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Lucro Líquido */}
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <h2 className="text-3xl font-bold text-foreground">
                {dashboardData ? currencyFormatter.format(dashboardData.totalRevenue - dashboardData.expenses) : '...'}
              </h2>
              <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${(dashboardData?.totalRevenue ?? 0) >= (dashboardData?.expenses ?? 0) ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}>
                {(dashboardData?.totalRevenue ?? 0) >= (dashboardData?.expenses ?? 0) ? (
                  <><ArrowUpRight className="h-3 w-3 mr-1" />Positivo</>
                ) : (
                  <><ArrowDownRight className="h-3 w-3 mr-1" />Negativo</>
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Médio (Matches prototype) */}
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
              <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-warning" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <h2 className="text-3xl font-bold text-foreground">
                {dashboardData && dashboardData.deliveredOrders > 0
                  ? currencyFormatter.format(dashboardData.totalRevenue / dashboardData.deliveredOrders)
                  : currencyFormatter.format(0)}
              </h2>
              <span className="flex items-center text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
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
        <Card className="lg:col-span-2 border-border shadow-sm bg-card">
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>Receitas vs Despesas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dashboardData?.revenueTrend || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickFormatter={(value) => `R$${value / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => currencyFormatter.format(value)}
                    contentStyle={{ backgroundColor: 'var(--popover)', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', color: 'var(--popover-foreground)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--success)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReceitas)"
                    name="Receita"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--destructive)"
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
        <Card className="border-border shadow-sm bg-card">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas movimentações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {dashboardData?.recentActivity?.map((item) => (
                <div key={item.id} className="flex items-start justify-between group">
                  <div className="flex items-start space-x-4">
                    <div className={`w-2 h-2 mt-2 rounded-full ${item.type === 'expense' ? 'bg-destructive' :
                      item.status === 'Entregue' ? 'bg-success' : 'bg-muted'
                      }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.date ? formatDate(item.date) : 'Data pendente'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`block text-sm font-semibold ${item.type === 'expense' ? 'text-destructive' : 'text-foreground'}`}>
                      {item.type === 'expense' ? '-' : '+'}{currencyFormatter.format(item.amount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">{item.status}</span>
                  </div>
                </div>
              ))}
              {!dashboardData?.recentActivity?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-6 text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => navigate('/orders')}
            >
              Ver todas as atividades
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
