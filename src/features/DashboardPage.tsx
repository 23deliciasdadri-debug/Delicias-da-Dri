import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { DollarSign, RefreshCw, ShoppingBag, Users, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { fetchDashboardData, type DashboardPeriod } from '../services/dashboardService';
import type { OrderStatus } from '../types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const integerFormatter = new Intl.NumberFormat('pt-BR');

const periodOptions: { label: string; value: DashboardPeriod }[] = [
  { label: 'Últimos 30 dias', value: 'LAST_30_DAYS' },
  { label: 'Este mês', value: 'THIS_MONTH' },
  { label: 'Este ano', value: 'THIS_YEAR' },
  { label: 'Desde o início', value: 'ALL_TIME' },
];

const statusBadgeStyles: Record<OrderStatus, string> = {
  Aprovado: 'bg-blue-100 text-blue-700',
  'Em Produção': 'bg-amber-100 text-amber-800',
  'Pronto para Entrega': 'bg-purple-100 text-purple-700',
  'Em Entrega': 'bg-orange-100 text-orange-700',
  Entregue: 'bg-emerald-100 text-emerald-700',
  Cancelado: 'bg-rose-100 text-rose-700',
};

const formatDate = (value: string | null) => {
  if (!value) {
    return 'Sem data';
  }
  const parsed = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
};

const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<DashboardPeriod>('LAST_30_DAYS');
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const isResizeObserverSupported = typeof ResizeObserver !== 'undefined';
  const [chartSize, setChartSize] = useState<{ width: number; height: number }>(
    isResizeObserverSupported ? { width: 0, height: 0 } : { width: 600, height: 300 },
  );

  useEffect(() => {
    if (!isResizeObserverSupported) {
      return;
    }
    const element = chartContainerRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setChartSize({ width, height });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [isResizeObserverSupported]);

  const dashboardFetcher = useCallback(() => fetchDashboardData(period), [period]);

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useSupabaseQuery(dashboardFetcher, {
    deps: [dashboardFetcher],
  });

  const metrics = useMemo(
    () => [
      {
        label: 'Receita no período',
        value: dashboardData ? currencyFormatter.format(dashboardData.totalRevenue) : '—',
        icon: DollarSign,
        helpText: dashboardData?.periodLabel ?? '',
      },
      {
        label: 'Pedidos entregues',
        value: dashboardData ? integerFormatter.format(dashboardData.deliveredOrders) : '—',
        icon: ShoppingBag,
        helpText: 'Somente status "Entregue"',
      },
      {
        label: 'Orçamentos aprovados',
        value: dashboardData ? integerFormatter.format(dashboardData.approvedQuotes) : '—',
        icon: ClipboardList,
        helpText: 'Quotes com status Aprovado',
      },
      {
        label: 'Novos clientes',
        value: dashboardData ? integerFormatter.format(dashboardData.newClients) : '—',
        icon: Users,
        helpText: 'Cadastros no período',
      },
    ],
    [dashboardData],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">Resumo em tempo real do funil de vendas.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}
            className="h-11 rounded-xl border border-input bg-background px-4 text-sm font-medium outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => void refetch()} disabled={isLoading}>
            {isLoading ? <RefreshCw className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            <span className="ml-2">Atualizar</span>
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar dashboard</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-0 shadow-lg">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-orange-50 flex items-center justify-center">
                <metric.icon className="size-6 text-rose-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-3xl font-semibold text-foreground">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.helpText}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Receita mensal</CardTitle>
            <span className="text-sm text-muted-foreground">{dashboardData?.periodLabel ?? ''}</span>
          </CardHeader>
          <CardContent className="h-[320px]">
            <div ref={chartContainerRef} className="h-full w-full min-h-[280px]">
              {dashboardData?.revenueTrend?.length && chartSize.width > 0 && chartSize.height > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={dashboardData.revenueTrend}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb7185" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" stroke="#a1a1aa" />
                    <YAxis
                      stroke="#a1a1aa"
                      tickFormatter={(value: number) => currencyFormatter.format(value).replace('R$', '').trim()}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => currencyFormatter.format(value)}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(0,0,0,0.08)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#fb7185"
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                  {isLoading ? 'Gerando gráfico...' : 'Sem dados suficientes para o período selecionado.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Pedidos recentes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Últimas atualizações (status + valor + data de entrega).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData?.recentOrders?.length ? (
              dashboardData.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-dashed border-rose-100 p-4 space-y-3 bg-rose-50/30"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">#{order.id.slice(0, 8)}</p>
                      <p className="text-lg font-semibold">{order.clientName}</p>
                    </div>
                    <Badge className={`${statusBadgeStyles[order.status]} text-xs`}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Entrega: {formatDate(order.deliveryDate)}</span>
                    <span className="font-semibold text-rose-600">
                      {currencyFormatter.format(order.totalAmount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Carregando pedidos...' : 'Nenhum pedido recente encontrado.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
