import React, { useMemo, useState } from 'react';
import { Calendar, Loader2, Mail, Phone, RefreshCw, UserRound } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../hooks/useSupabaseMutation';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../providers/AuthProvider';
import type { OrderStatus, ProfileRole, QuoteItem } from '../types';
import { listOrders, updateOrderStatus, type OrderWithDetails } from '../services/ordersService';

const ALL_STATUSES: OrderStatus[] = [
  'Aprovado',
  'Em Produção',
  'Pronto para Entrega',
  'Em Entrega',
  'Entregue',
  'Cancelado',
];

const DEFAULT_STATUS_META = {
  label: 'Status',
  badgeClass: 'bg-slate-600 text-white',
  cardBg: 'bg-slate-50/80',
};

const STATUS_META: Record<OrderStatus, typeof DEFAULT_STATUS_META> = {
  Aprovado: {
    label: 'Aprovado',
    badgeClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    cardBg: 'bg-blue-50/70',
  },
  'Em Produção': {
    label: 'Em Produção',
    badgeClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    cardBg: 'bg-amber-50/70',
  },
  'Pronto para Entrega': {
    label: 'Pronto para Entrega',
    badgeClass: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white',
    cardBg: 'bg-purple-50/70',
  },
  'Em Entrega': {
    label: 'Em Entrega',
    badgeClass: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
    cardBg: 'bg-orange-50/70',
  },
  Entregue: {
    label: 'Entregue',
    badgeClass: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
    cardBg: 'bg-emerald-50/70',
  },
  Cancelado: {
    label: 'Cancelado',
    badgeClass: 'bg-gradient-to-r from-rose-600 to-red-500 text-white',
    cardBg: 'bg-rose-50/70',
  },
};

const ROLE_VISIBLE_STATUSES: Record<ProfileRole, OrderStatus[]> = {
  admin: ALL_STATUSES,
  kitchen: ['Aprovado', 'Em Produção'],
  delivery: ['Pronto para Entrega', 'Em Entrega'],
};

const ROLE_TRANSITIONS: Record<
  Exclude<ProfileRole, 'admin'>,
  Partial<Record<OrderStatus, OrderStatus[]>>
> = {
  kitchen: {
    Aprovado: ['Em Produção'],
    'Em Produção': ['Pronto para Entrega'],
  },
  delivery: {
    'Pronto para Entrega': ['Em Entrega'],
    'Em Entrega': ['Entregue'],
  },
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const getStatusMeta = (status: OrderStatus) => STATUS_META[status] ?? DEFAULT_STATUS_META;

const getVisibleStatuses = (role?: ProfileRole) =>
  role ? ROLE_VISIBLE_STATUSES[role] ?? ALL_STATUSES : ALL_STATUSES;

const getAllowedTransitions = (status: OrderStatus, role?: ProfileRole): OrderStatus[] => {
  if (!role) {
    return [];
  }
  if (role === 'admin') {
    return ALL_STATUSES.filter((item) => item !== status);
  }
  const rules = ROLE_TRANSITIONS[role];
  return rules?.[status] ?? [];
};

const formatDeliveryDate = (value?: string | null) => {
  if (!value) {
    return 'Sem data definida';
  }
  const parsed = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return dateFormatter.format(parsed);
};

const getItemsPreview = (items: QuoteItem[]) => {
  if (!items.length) {
    return 'Sem itens vinculados';
  }
  if (items.length === 1) {
    const item = items[0];
    return `${item.quantity}x ${item.product_name_copy}`;
  }
  if (items.length === 2) {
    const [first, second] = items;
    return `${first.quantity}x ${first.product_name_copy} + ${second.quantity}x ${second.product_name_copy}`;
  }
  const [first, second] = items;
  const remaining = items.length - 2;
  return `${first.quantity}x ${first.product_name_copy}, ${second.quantity}x ${second.product_name_copy} + ${remaining} itens`;
};

const getLineTotal = (item: QuoteItem) => {
  const unitPrice = Number(item.price_at_creation ?? 0);
  return unitPrice * Number(item.quantity ?? 0);
};

const OrdersPage: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const userRole = profile?.role;
  const visibleStatuses = useMemo(() => getVisibleStatuses(userRole), [userRole]);

  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useSupabaseQuery<OrderWithDetails[]>(listOrders, {
    initialData: [],
  });

  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, OrderStatus>>({});

  const ordersList = useMemo(() => {
    const base = ordersData ?? [];
    if (!base.length || !Object.keys(optimisticStatus).length) {
      return base;
    }
    return base.map((order) => {
      const override = optimisticStatus[order.id];
      if (override && override !== order.status) {
        return {
          ...order,
          status: override,
        };
      }
      return order;
    });
  }, [ordersData, optimisticStatus]);

  const groupedOrders = useMemo(() => {
    const groups: Record<OrderStatus, OrderWithDetails[]> = {} as Record<
      OrderStatus,
      OrderWithDetails[]
    >;
    ALL_STATUSES.forEach((status) => {
      groups[status] = [];
    });
    ordersList.forEach((order) => {
      if (!groups[order.status]) {
        groups[order.status] = [];
      }
      groups[order.status].push(order);
    });
    return groups;
  }, [ordersList]);

  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');

  const {
    mutate: mutateStatus,
    isMutating: isUpdatingStatus,
    error: mutationError,
    reset: resetMutation,
  } = useSupabaseMutation(updateOrderStatus);

  const handleSelectOrder = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setNextStatus('');
    resetMutation();
  };

  const handleModalChange = (open: boolean) => {
    if (!open) {
      setSelectedOrder(null);
      setNextStatus('');
      resetMutation();
    }
  };

  const allowedTransitions = selectedOrder ? getAllowedTransitions(selectedOrder.status, userRole) : [];

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !nextStatus) {
      return;
    }
    const updated = await mutateStatus({ id: selectedOrder.id, status: nextStatus });
    if (updated) {
      setOptimisticStatus((prev) => ({
        ...prev,
        [selectedOrder.id]: nextStatus,
      }));
      setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      toast({
        title: 'Status atualizado',
        description: `Pedido ${selectedOrder.id.slice(0, 8)} movido para ${getStatusMeta(nextStatus).label}.`,
      });
      await refetch();
      setOptimisticStatus((prev) => {
        const next = { ...prev };
        delete next[selectedOrder.id];
        return next;
      });
      setSelectedOrder(null);
      setNextStatus('');
    }
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="space-y-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
              Pedidos
            </h1>
            <p className="text-muted-foreground text-lg">
              Acompanhe os pedidos reais em cada etapa do fluxo.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => void refetch()} disabled={isLoading}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              <span className="ml-2">Atualizar</span>
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {profile
            ? `Seu papel atual: ${profile.role}.`
            : 'Carregando permissoes do usuario...'}
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar pedidos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex-1 flex gap-6 overflow-x-auto pb-6">
        {visibleStatuses.map((status) => {
          const meta = getStatusMeta(status);
          const columnOrders = groupedOrders[status] ?? [];
          return (
            <div key={status} className="flex-shrink-0 w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={`${meta.badgeClass} px-4 py-2 text-sm font-semibold shadow-lg`}>
                    {meta.label}
                  </Badge>
                  <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {columnOrders.length}
                  </span>
                </div>

                {isLoading && !columnOrders.length ? (
                  <div className="space-y-3">
                    {[0, 1].map((index) => (
                      <div key={index} className="h-32 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : columnOrders.length ? (
                  <div className="space-y-3">
                    {columnOrders.map((order) => (
                      <Card
                        key={order.id}
                        className={`border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] ${meta.cardBg}`}
                        onClick={() => handleSelectOrder(order)}
                      >
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs uppercase text-muted-foreground tracking-wide">Cliente</p>
                              <p className="font-semibold text-lg text-foreground">
                                {order.client?.name ?? 'Cliente sem nome'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.client?.phone ?? 'Sem telefone'}
                              </p>
                            </div>
                            <Badge className="bg-white text-rose-600 border border-rose-100">
                              {currencyFormatter.format(order.total_amount ?? 0)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {getItemsPreview(order.items)}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                            <span className="flex items-center gap-2">
                              <Calendar className="size-3.5" />
                              {formatDeliveryDate(order.delivery_date)}
                            </span>
                            <span className="font-mono text-muted-foreground/80">#{order.id.slice(0, 8)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                    Nenhum pedido neste status.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={handleModalChange}>
        <DialogContent className="max-w-2xl bg-white">
          {selectedOrder ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold">
                      Pedido #{selectedOrder.id.slice(0, 8)}
                    </span>
                    <Badge className={`${getStatusMeta(selectedOrder.status).badgeClass} px-3 py-1`}>
                      {getStatusMeta(selectedOrder.status).label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Entrega em {formatDeliveryDate(selectedOrder.delivery_date)} •{' '}
                    {currencyFormatter.format(selectedOrder.total_amount ?? 0)}
                  </p>
                </DialogTitle>
                <DialogDescription>
                  Detalhes completos do pedido selecionado, incluindo itens e informacoes do cliente.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <UserRound className="size-4 text-muted-foreground" />
                    Cliente
                  </h4>
                  <div className="rounded-xl border bg-muted/30 p-3 space-y-1 text-sm">
                    <p className="font-medium text-foreground">
                      {selectedOrder.client?.name ?? 'Cliente sem nome'}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-3.5" />
                      {selectedOrder.client?.phone ?? 'Sem telefone cadastrado'}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-3.5" />
                      {selectedOrder.client?.email ?? 'Sem email cadastrado'}
                    </p>
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Itens do pedido</h4>
                  {selectedOrder.items.length ? (
                    <div className="rounded-xl border divide-y">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 text-sm">
                          <div>
                            <p className="font-medium">{item.product_name_copy}</p>
                            <p className="text-muted-foreground">
                              {item.quantity}x {currencyFormatter.format(item.price_at_creation)}
                            </p>
                          </div>
                          <span className="font-semibold text-rose-600">
                            {currencyFormatter.format(getLineTotal(item))}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      Nenhum item vinculado. Verifique o orcamento de origem.
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Detalhes de entrega</h4>
                  <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                    {selectedOrder.delivery_details?.trim()
                      ? selectedOrder.delivery_details
                      : 'Sem observacoes registradas.'}
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Status e acoes</h4>
                  {allowedTransitions.length ? (
                    <select
                      value={nextStatus}
                      onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
                    >
                      <option value="">Selecione o novo status</option>
                      {allowedTransitions.map((status) => (
                        <option key={status} value={status}>
                          {getStatusMeta(status).label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {profile
                        ? 'Seu papel nao permite mover este pedido a partir do status atual.'
                        : 'Permissoes ainda nao carregadas.'}
                    </p>
                  )}

                  {mutationError ? (
                    <Alert variant="destructive">
                      <AlertTitle>Supabase retornou um erro</AlertTitle>
                      <AlertDescription>{mutationError}</AlertDescription>
                    </Alert>
                  ) : null}
                </section>
              </div>

              <DialogFooter className="pt-6">
                <Button variant="outline" onClick={() => handleModalChange(false)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => void handleUpdateStatus()}
                  disabled={!nextStatus || isUpdatingStatus || !allowedTransitions.length}
                >
                  {isUpdatingStatus ? <Loader2 className="size-4 animate-spin" /> : null}
                  <span className="ml-2">Atualizar status</span>
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
