import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { LoadingState } from '../components/patterns';
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
  cardBg: 'bg-card/95 text-foreground border border-border/60 shadow-lg shadow-rose-900/5 dark:bg-slate-900/70 dark:text-foreground dark:border-slate-800',
};

const STATUS_META: Record<OrderStatus, typeof DEFAULT_STATUS_META> = {
  Aprovado: {
    label: 'Aprovado',
    badgeClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    cardBg: 'bg-blue-50/95 text-slate-900 border border-blue-100 shadow-blue-500/20 dark:bg-blue-500/20 dark:text-blue-50 dark:border-blue-500/40',
  },
  'Em Produção': {
    label: 'Em Produção',
    badgeClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    cardBg: 'bg-amber-50/95 text-slate-900 border border-amber-100 shadow-orange-500/20 dark:bg-amber-500/20 dark:text-amber-50 dark:border-amber-500/40',
  },
  'Pronto para Entrega': {
    label: 'Pronto para Entrega',
    badgeClass: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white',
    cardBg: 'bg-purple-50/95 text-slate-900 border border-purple-100 shadow-purple-500/15 dark:bg-purple-500/20 dark:text-purple-50 dark:border-purple-500/40',
  },
  'Em Entrega': {
    label: 'Em Entrega',
    badgeClass: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
    cardBg: 'bg-orange-50/95 text-slate-900 border border-orange-100 shadow-orange-500/20 dark:bg-orange-500/20 dark:text-orange-50 dark:border-orange-500/40',
  },
  Entregue: {
    label: 'Entregue',
    badgeClass: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
    cardBg: 'bg-emerald-50/95 text-slate-900 border border-emerald-100 shadow-emerald-500/15 dark:bg-emerald-500/20 dark:text-emerald-50 dark:border-emerald-500/40',
  },
  Cancelado: {
    label: 'Cancelado',
    badgeClass: 'bg-gradient-to-r from-rose-600 to-red-500 text-white',
    cardBg: 'bg-rose-50/95 text-slate-900 border border-rose-100 shadow-rose-500/15 dark:bg-rose-500/20 dark:text-rose-50 dark:border-rose-500/40',
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

const buildColumns = (
  orders?: OrderWithDetails[],
): Record<OrderStatus, OrderWithDetails[]> => {
  const base = {} as Record<OrderStatus, OrderWithDetails[]>;
  ALL_STATUSES.forEach((status) => {
    base[status] = [];
  });
  (orders ?? []).forEach((order) => {
    if (!base[order.status]) {
      base[order.status] = [];
    }
    base[order.status].push(order);
  });
  return base;
};

const cloneColumns = (
  columns: Record<OrderStatus, OrderWithDetails[]>,
): Record<OrderStatus, OrderWithDetails[]> => {
  const clone = {} as Record<OrderStatus, OrderWithDetails[]>;
  ALL_STATUSES.forEach((status) => {
    clone[status] = [...(columns[status] ?? [])];
  });
  return clone;
};

const findOrderLocation = (
  columns: Record<OrderStatus, OrderWithDetails[]>,
  orderId: string,
) => {
  for (const status of ALL_STATUSES) {
    const column = columns[status] ?? [];
    const index = column.findIndex((order) => order.id === orderId);
    if (index >= 0) {
      return { status, index, order: column[index] };
    }
  }
  return null;
};

const moveOrderToStatus = (
  columns: Record<OrderStatus, OrderWithDetails[]>,
  orderId: string,
  targetStatus: OrderStatus,
  targetIndex?: number,
) => {
  const location = findOrderLocation(columns, orderId);
  if (!location) {
    return columns;
  }
  const clone = cloneColumns(columns);
  const [order] = clone[location.status].splice(location.index, 1);
  if (!order) {
    return columns;
  }
  const updatedOrder = { ...order, status: targetStatus };
  const targetColumn = clone[targetStatus] ?? [];
  const insertionIndex =
    targetIndex !== undefined ? Math.min(targetIndex, targetColumn.length) : targetColumn.length;
  targetColumn.splice(insertionIndex, 0, updatedOrder);
  clone[targetStatus] = targetColumn;
  return clone;
};

const sanitizePhone = (phone?: string | null) => phone?.replace(/\D/g, '') ?? '';

const getWhatsAppLink = (phone?: string | null, clientName?: string | null) => {
  const digits = sanitizePhone(phone);
  if (!digits) {
    return null;
  }
  const text = encodeURIComponent(
    `OlÃ¡${clientName ? ` ${clientName}` : ''}! Aqui Ã© a DelÃ­cias da Dri com novidades do seu pedido.`,
  );
  return `https://wa.me/${digits}?text=${text}`;
};

const isStatusId = (value: string): value is OrderStatus => ALL_STATUSES.includes(value as OrderStatus);

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

  const [boardColumns, setBoardColumns] = useState<Record<OrderStatus, OrderWithDetails[]>>(() =>
    buildColumns(ordersData),
  );
  const boardColumnsRef = useRef(boardColumns);
  useEffect(() => {
    boardColumnsRef.current = boardColumns;
  }, [boardColumns]);

  useEffect(() => {
    setBoardColumns(buildColumns(ordersData));
  }, [ordersData]);
  const hasOrders = useMemo(
    () => (Object.values(boardColumns) as OrderWithDetails[][]).some((column) => column.length > 0),
    [boardColumns],
  );

  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');
  const [pendingOrders, setPendingOrders] = useState<Record<string, boolean>>({});

  const setOrderPending = (orderId: string, value: boolean) => {
    setPendingOrders((prev) => {
      const next = { ...prev };
      if (value) {
        next[orderId] = true;
      } else {
        delete next[orderId];
      }
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
  );

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const activeOrder = useMemo(() => {
    if (!activeOrderId) {
      return null;
    }
    return findOrderLocation(boardColumns, activeOrderId)?.order ?? null;
  }, [activeOrderId, boardColumns]);

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

  const handleCopyDeliveryDetails = async (details?: string | null) => {
    if (!details) {
      toast({
        status: 'info',
        title: 'Sem endereço disponível',
        description: 'Este pedido ainda não possui detalhes de entrega registrados.',
      });
      return;
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(details);
        toast({
          status: 'success',
          title: 'Endereço copiado',
          description: 'Cole no app de entregas ou compartilhe com o seu time.',
        });
        return;
      }
      throw new Error('Clipboard indisponÃ­vel');
    } catch {
      toast({
        status: 'info',
        title: 'Detalhes da entrega',
        description: details,
      });
    }
  };

  const handleModalChange = (open: boolean) => {
    if (!open) {
      setSelectedOrder(null);
      setNextStatus('');
      resetMutation();
    }
  };

  const allowedTransitions = selectedOrder ? getAllowedTransitions(selectedOrder.status, userRole) : [];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveOrderId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOrderId(null);
    if (!over) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    const source = findOrderLocation(boardColumnsRef.current, activeId);
    if (!source) {
      return;
    }

    let destinationStatus = source.status;
    let destinationIndex = source.index;

    if (isStatusId(overId)) {
      destinationStatus = overId;
      destinationIndex = boardColumnsRef.current[destinationStatus]?.length ?? 0;
    } else {
      const target = findOrderLocation(boardColumnsRef.current, overId);
      if (target) {
        destinationStatus = target.status;
        destinationIndex = target.index;
      }
    }

    if (source.status === destinationStatus && source.index === destinationIndex) {
      return;
    }

    if (destinationStatus === source.status) {
      setBoardColumns((prev) => moveOrderToStatus(prev, activeId, destinationStatus, destinationIndex));
      return;
    }

    const canMove =
      userRole === 'admin' || getAllowedTransitions(source.status, userRole).includes(destinationStatus);

    if (!canMove) {
      toast({
        status: 'error',
        title: 'Transição não permitida',
        description: 'Seu papel atual não pode mover o pedido para esse status.',
      });
      return;
    }

    resetMutation();
    const previousState = cloneColumns(boardColumnsRef.current);
    setBoardColumns((prev) => moveOrderToStatus(prev, activeId, destinationStatus, destinationIndex));
    setOrderPending(activeId, true);

    const updated = await mutateStatus({ id: activeId, status: destinationStatus });
    if (!updated) {
      setBoardColumns(previousState);
      setOrderPending(activeId, false);
      return;
    }

    toast({
      status: 'success',
      title: 'Pedido atualizado',
      description: `Pedido ${activeId.slice(0, 8)} movido para ${getStatusMeta(destinationStatus).label}.`,
    });
    await refetch();
    setOrderPending(activeId, false);
  };

  const handleDragCancel = () => setActiveOrderId(null);

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !nextStatus) {
      return;
    }
    resetMutation();
    const previousState = cloneColumns(boardColumnsRef.current);
    setBoardColumns((prev) => moveOrderToStatus(prev, selectedOrder.id, nextStatus, 0));
    setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    setOrderPending(selectedOrder.id, true);
    const updated = await mutateStatus({ id: selectedOrder.id, status: nextStatus });
    if (!updated) {
      setBoardColumns(previousState);
      setOrderPending(selectedOrder.id, false);
      return;
    }
    toast({
      status: 'success',
      title: 'Status atualizado',
      description: `Pedido ${selectedOrder.id.slice(0, 8)} movido para ${getStatusMeta(nextStatus).label}.`,
    });
    await refetch();
    setOrderPending(selectedOrder.id, false);
    setSelectedOrder(null);
    setNextStatus('');
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

      {isLoading && !hasOrders ? (
        <LoadingState className="flex-1" message="Carregando pedidos..." />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={(event) => {
            void handleDragEnd(event);
          }}
        >
          <div className="flex-1 flex gap-6 overflow-x-auto pb-6">
            {visibleStatuses.map((status) => {
              const meta = getStatusMeta(status);
              const columnOrders = boardColumns[status] ?? [];
              return (
                <KanbanColumn
                  key={status}
                  status={status}
                  meta={meta}
                  count={columnOrders.length}
                >
                  {isLoading && !columnOrders.length ? (
                    <div className="space-y-3">
                      {[0, 1].map((index) => (
                        <div key={index} className="h-32 rounded-xl bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : columnOrders.length ? (
                    <SortableContext
                      items={columnOrders.map((order) => order.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {columnOrders.map((order) => (
                        <KanbanOrderCard
                          key={order.id}
                          order={order}
                          meta={meta}
                          pending={Boolean(pendingOrders[order.id])}
                          disabled={Boolean(pendingOrders[order.id]) || isUpdatingStatus}
                          onSelect={handleSelectOrder}
                          onCopyDeliveryDetails={handleCopyDeliveryDetails}
                        />
                      ))}
                    </SortableContext>
                  ) : (
                    <div className="px-4 py-10 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                      Nenhum pedido neste status.
                    </div>
                  )}
                </KanbanColumn>
              );
            })}
          </div>
          <DragOverlay>
            {activeOrder ? (
              <OrderPreviewCard order={activeOrder} meta={getStatusMeta(activeOrder.status)} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Dialog open={Boolean(selectedOrder)} onOpenChange={handleModalChange}>
        <DialogContent className="max-w-2xl bg-card">
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
                    Entrega em {formatDeliveryDate(selectedOrder.delivery_date)} â€¢{' '}
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

interface KanbanColumnProps {
  status: OrderStatus;
  meta: typeof DEFAULT_STATUS_META;
  count: number;
  children: React.ReactNode;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, meta, count, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });
  return (
    <div className="flex-shrink-0 w-80">
      <div
        ref={setNodeRef}
        className={`flex h-full flex-col rounded-3xl border bg-card/85 p-4 shadow-sm transition-all ${
          isOver ? 'border-rose-300 shadow-rose-100' : 'border-border/70'
        }`}
      >
        <div className="flex items-center justify-between">
          <Badge className={`${meta.badgeClass} px-4 py-2 text-sm font-semibold shadow`}>
            {meta.label}
          </Badge>
          <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {count}
          </span>
        </div>
        <div className="mt-4 flex-1 space-y-3">{children}</div>
      </div>
    </div>
  );
};

interface KanbanOrderCardProps {
  order: OrderWithDetails;
  meta: typeof DEFAULT_STATUS_META;
  pending: boolean;
  disabled?: boolean;
  onSelect: (order: OrderWithDetails) => void;
  onCopyDeliveryDetails: (details?: string | null) => void;
}

const KanbanOrderCard: React.FC<KanbanOrderCardProps> = ({
  order,
  meta,
  pending,
  disabled,
  onSelect,
  onCopyDeliveryDetails,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
    disabled,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const phoneHref = order.client?.phone ? `tel:${sanitizePhone(order.client.phone)}` : null;
  const whatsappHref = getWhatsAppLink(order.client?.phone, order.client?.name ?? null);

  const stopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card
        onClick={() => onSelect(order)}
        className={`border-0 shadow-md transition-all duration-300 ${meta.cardBg} ${
          isDragging ? 'ring-2 ring-rose-400' : 'hover:shadow-xl hover:scale-[1.01]'
        }`}
      >
        <CardContent className="p-5 space-y-4 group">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wide">Cliente</p>
              <p className="font-semibold text-lg text-foreground">{order.client?.name ?? 'Cliente'}</p>
              <p className="text-xs text-muted-foreground">{order.client?.phone ?? 'Sem telefone'}</p>
            </div>
            <div className="text-right">
              <Badge className="border border-rose-100 bg-card text-rose-600">
                {currencyFormatter.format(order.total_amount ?? 0)}
              </Badge>
              {pending ? <Loader2 className="mt-2 size-4 animate-spin text-rose-500" /> : null}
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{getItemsPreview(order.items)}</p>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground border-t pt-3">
            <span className="flex items-center gap-2">
              <Calendar className="size-3.5" />
              {formatDeliveryDate(order.delivery_date)}
            </span>
            <span className="font-mono text-muted-foreground/80">#{order.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground transition-opacity md:opacity-0 md:group-hover:opacity-100">
            {phoneHref ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full border border-rose-100 bg-card/80"
                asChild
              >
                <a href={phoneHref} onPointerDown={stopPropagation} onClick={stopPropagation} aria-label="Ligar para o cliente">
                  <Phone className="size-4 text-rose-500" />
                </a>
              </Button>
            ) : null}
            {whatsappHref ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full border border-emerald-100 bg-card/80"
                asChild
              >
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  onPointerDown={stopPropagation}
                  onClick={stopPropagation}
                  aria-label="Enviar WhatsApp"
                >
                  <MessageCircle className="size-4 text-emerald-600" />
                </a>
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full border border-slate-200 bg-card/80"
              onPointerDown={stopPropagation}
              onClick={(event) => {
                stopPropagation(event);
                onCopyDeliveryDetails(order.delivery_details);
              }}
              aria-label="Copiar endereço"
            >
              <MapPin className="size-4 text-slate-700" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface OrderPreviewCardProps {
  order: OrderWithDetails;
  meta: typeof DEFAULT_STATUS_META;
}

const OrderPreviewCard: React.FC<OrderPreviewCardProps> = ({ order, meta }) => (
  <Card className={`w-72 border-0 shadow-xl ${meta.cardBg}`}>
    <CardContent className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground tracking-wide">Cliente</p>
          <p className="font-semibold text-lg text-foreground">{order.client?.name ?? 'Cliente'}</p>
        </div>
        <Badge className="border border-rose-100 bg-card text-rose-600">
          {currencyFormatter.format(order.total_amount ?? 0)}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{getItemsPreview(order.items)}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
        <span className="flex items-center gap-2">
          <Calendar className="size-3.5" />
          {formatDeliveryDate(order.delivery_date)}
        </span>
        <span className="font-mono text-muted-foreground/80">#{order.id.slice(0, 8)}</span>
      </div>
    </CardContent>
  </Card>
);



