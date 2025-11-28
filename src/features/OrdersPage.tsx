import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MoreVertical,
  Printer,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Search,
  Plus
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
  useSensors
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';

import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../hooks/useSupabaseMutation';
import { useAuth } from '../providers/AuthProvider';
import { StatusMenu } from '../components/patterns/StatusBadge';
import { ORDER_STATUS_OPTIONS, ORDER_STATUSES } from '../constants/status';
import { listOrders, updateOrderStatus, type OrderWithDetails } from '../services/ordersService';
import type { OrderStatus, ProfileRole } from '../types';
import { ViewSwitcher, type ViewType } from '../components/ViewSwitcher';
import { CalendarView } from '../components/CalendarView';
import { AppDialog } from '../components/patterns/AppDialog';
import { OrderFormDialog } from './orders/OrderFormDialog';
import OrderPreview from './orders/OrderPreview';
import { deleteOrder } from '../services/ordersService';

// Constants & Types
const ALL_STATUSES: OrderStatus[] = ORDER_STATUSES;

const COLUMNS_CONFIG: Record<OrderStatus, { title: string; icon: any; color: string }> = {
  'Aprovado': { title: 'Aprovado', icon: Clock, color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' },
  'Em Produção': { title: 'Em Produção', icon: Package, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' },
  'Pronto para Entrega': { title: 'Pronto para Entrega', icon: Truck, color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800' },
  'Em Entrega': { title: 'Em Entrega', icon: Truck, color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' },
  'Entregue': { title: 'Entregue', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' },
  'Cancelado': { title: 'Cancelado', icon: AlertCircle, color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800' }
};
const ROLE_VISIBLE_STATUSES: Record<ProfileRole, OrderStatus[]> = {
  admin: ALL_STATUSES,
  kitchen: ['Aprovado', 'Em Produção'],
  delivery: ['Pronto para Entrega', 'Em Entrega'],
};

const getVisibleStatuses = (role?: ProfileRole) =>
  role ? ROLE_VISIBLE_STATUSES[role] ?? ALL_STATUSES : ALL_STATUSES;

const buildColumns = (orders?: OrderWithDetails[]): Record<OrderStatus, OrderWithDetails[]> => {
  const base = {} as Record<OrderStatus, OrderWithDetails[]>;
  ALL_STATUSES.forEach((status) => { base[status] = []; });
  (orders ?? []).forEach((order) => {
    if (base[order.status]) base[order.status].push(order);
  });
  return base;
};

const findOrderLocation = (columns: Record<OrderStatus, OrderWithDetails[]>, orderId: string) => {
  for (const status of ALL_STATUSES) {
    const column = columns[status] ?? [];
    const index = column.findIndex((order) => order.id === orderId);
    if (index >= 0) return { status, index, order: column[index] };
  }
  return null;
};

const moveOrderToStatus = (
  columns: Record<OrderStatus, OrderWithDetails[]>,
  orderId: string,
  targetStatus: OrderStatus,
  targetIndex?: number
) => {
  const location = findOrderLocation(columns, orderId);
  if (!location) return columns;

  const clone = { ...columns };
  // Deep copy arrays
  ALL_STATUSES.forEach(s => { clone[s] = [...(columns[s] || [])]; });

  const [order] = clone[location.status].splice(location.index, 1);
  if (!order) return columns;

  const updatedOrder = { ...order, status: targetStatus };
  const targetColumn = clone[targetStatus];
  const insertionIndex = targetIndex !== undefined ? Math.min(targetIndex, targetColumn.length) : targetColumn.length;
  targetColumn.splice(insertionIndex, 0, updatedOrder);

  return clone;
};

export default function OrdersPage() {
  const { profile } = useAuth();
  const userRole = profile?.role;
  const isAdmin = userRole === 'admin';
  const visibleStatuses = useMemo(() => getVisibleStatuses(userRole), [userRole]);

  // Data
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useSupabaseQuery<OrderWithDetails[]>(listOrders, { initialData: [] });

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [view, setView] = useState<ViewType>('kanban');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setSelectedOrder(null);
      setIsNewOrderOpen(true);
      // Remove the param to avoid reopening on refresh
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      });
    }
  }, [searchParams, setSearchParams]);

  const filteredOrders = useMemo(() => {
    if (!debouncedSearch) return ordersData;
    const lower = debouncedSearch.toLowerCase();
    return ordersData.filter((order) =>
      (order.client?.name?.toLowerCase() ?? '').includes(lower) ||
      order.id.toLowerCase().includes(lower)
    );
  }, [ordersData, debouncedSearch]);

  const [boardColumns, setBoardColumns] = useState(() => buildColumns(filteredOrders));

  useEffect(() => {
    setBoardColumns(buildColumns(filteredOrders));
  }, [filteredOrders]);

  useEffect(() => {
    setSelectedOrders((prev) => {
      const visibleIds = new Set(filteredOrders.map((o) => o.id));
      return new Set([...prev].filter((id) => visibleIds.has(id)));
    });
  }, [filteredOrders]);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const activeOrder = useMemo(() =>
    activeOrderId ? findOrderLocation(boardColumns, activeOrderId)?.order : null
    , [activeOrderId, boardColumns]);

  // Mutations
  const { mutate: mutateStatus } = useSupabaseMutation(updateOrderStatus);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveOrderId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOrderId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const source = findOrderLocation(boardColumns, activeId);
    if (!source) return;

    let destinationStatus = source.status;
    let destinationIndex = source.index;

    if (ALL_STATUSES.includes(overId as OrderStatus)) {
      destinationStatus = overId as OrderStatus;
      destinationIndex = boardColumns[destinationStatus]?.length ?? 0;
    } else {
      const target = findOrderLocation(boardColumns, overId);
      if (target) {
        destinationStatus = target.status;
        destinationIndex = target.index;
      }
    }

    if (source.status === destinationStatus && source.index === destinationIndex) return;

    // Optimistic Update
    const previousColumns = boardColumns;
    setBoardColumns(prev => moveOrderToStatus(prev, activeId, destinationStatus, destinationIndex));

    const updated = await mutateStatus({ id: activeId, status: destinationStatus });
    if (!updated) {
      setBoardColumns(previousColumns);
      toast.error('Erro ao atualizar status');
    } else {
      toast.success(`Pedido movido para ${destinationStatus}`);
      await refetch();
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const updated = await mutateStatus({ id: orderId, status: newStatus });
    if (updated) {
      toast.success(`Status atualizado para ${newStatus}`);
      await refetch();
    } else {
      toast.error('Erro ao atualizar status');
    }
  };

  const toggleSelectOrder = (id: string, checked: boolean) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAllCurrent = (checked: boolean) => {
    setSelectedOrders(checked ? new Set(filteredOrders.map((o) => o.id)) : new Set());
  };

  const clearSelection = () => setSelectedOrders(new Set());

  const handleBulkStatusChange = async (status: OrderStatus) => {
    if (!isAdmin || selectedOrders.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const ids = [...selectedOrders];
      const results = await Promise.all(
        ids.map(async (id) => {
          const ok = await mutateStatus({ id, status });
          return Boolean(ok);
        }),
      );
      const successCount = results.filter(Boolean).length;
      if (successCount) toast.success(`${successCount} pedido(s) atualizados para ${status}`);
      if (successCount !== ids.length) toast.error('Alguns pedidos não foram atualizados.');
      await refetch();
      clearSelection();
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!isAdmin) {
      console.warn('Tentativa de exclusão sem permissão de admin');
      return;
    }
    if (!window.confirm('Tem certeza que deseja excluir este pedido?')) return;

    console.log('Iniciando exclusão do pedido:', orderId);
    try {
      await deleteOrder(orderId);
      toast.success('Pedido excluído com sucesso');
      setIsDetailsOpen(false);
      setSelectedOrder(null);
      await refetch();
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao excluir pedido: ${message}`);
    }
  };

  const handleEditOrder = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setIsNewOrderOpen(true);
    setIsDetailsOpen(false); // Close details when opening edit
  };

  // Calendar Events
  const calendarEvents = useMemo(() => {
    return filteredOrders.map(order => ({
      id: order.id,
      title: `${order.client?.name || 'Cliente'} (${order.items.length})`,
      date: order.delivery_date ? new Date(order.delivery_date) : new Date(),
      status: order.status
    }));
  }, [filteredOrders]);

  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const openDetails = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  const allCurrentSelected =
    filteredOrders.length > 0 && filteredOrders.every((o) => selectedOrders.has(o.id));
  const someSelected = selectedOrders.size > 0;
  const headerChecked = allCurrentSelected ? true : someSelected ? 'indeterminate' : false;

  return (
    <div className="space-y-8 fade-in h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex-none flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Pedidos e Produção</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Acompanhe o fluxo de produção da cozinha.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            onClick={() => {
              setSelectedOrder(null); // Clear selection for new order
              setIsNewOrderOpen(true);
            }}
            className="hidden sm:flex bg-rose-500 hover:bg-rose-600 text-white w-full sm:w-auto"
            disabled={userRole !== 'admin'}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
          <div className="relative w-full sm:w-auto flex-1 sm:flex-none">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar pedido..."
              className="pl-10 w-full sm:w-64"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <ViewSwitcher currentView={view} onViewChange={setView} availableViews={['kanban', 'list', 'calendar']} />
            <Button variant="outline" onClick={() => void refetch()} disabled={isLoading} size="icon">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <OrderFormDialog
        open={isNewOrderOpen}
        onOpenChange={setIsNewOrderOpen}
        onSuccess={() => void refetch()}
        orderToEdit={selectedOrder} // Pass selected order for editing
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 min-h-0 relative">
        {view === 'kanban' && (
          <div className="overflow-x-auto overflow-y-hidden h-full pb-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6 h-full min-w-[1000px]">
                {visibleStatuses.map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    orders={(boardColumns[status] || []) as any}
                    isLoading={isLoading}
                    onOrderClick={openDetails}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeOrder ? <OrderCard order={activeOrder} isOverlay /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {view === 'list' && (
          <Card className="h-full border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <CardContent className="p-0 flex-1 overflow-auto">
              {someSelected && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-primary/20 bg-primary/5">
                  <div className="text-sm font-medium text-foreground">
                    {selectedOrders.size} selecionado(s)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); void handleBulkStatusChange('Em Produção'); }}
                      disabled={isBulkProcessing || !isAdmin}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Em produção
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); void handleBulkStatusChange('Pronto para Entrega'); }}
                      disabled={isBulkProcessing || !isAdmin}
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      Pronto para entrega
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); void handleBulkStatusChange('Entregue'); }}
                      disabled={isBulkProcessing || !isAdmin}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marcar como entregue
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => { e.stopPropagation(); void handleBulkStatusChange('Cancelado'); }}
                      disabled={isBulkProcessing || !isAdmin}
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={headerChecked}
                          onCheckedChange={(checked) => selectAllCurrent(Boolean(checked))}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Entrega</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('input')) return;
                          openDetails(order);
                        }}
                      >
                        <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={(checked) => toggleSelectOrder(order.id, Boolean(checked))}
                            aria-label={`Selecionar pedido ${order.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">#{order.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.client?.name || 'Cliente sem nome'}</div>
                            <div className="text-xs text-muted-foreground">{order.delivery_details ? 'Com detalhes' : 'Sem detalhes'}</div>
                          </div>
                        </TableCell>
                        <TableCell>{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR') : '—'}</TableCell>
                        <TableCell>
                          <div className="max-w-[300px] truncate text-muted-foreground">
                            {order.items.map(i => i.product_name_copy).join(', ')}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <StatusMenu
                            status={order.status}
                            options={ORDER_STATUS_OPTIONS}
                            onChange={(status) => void handleStatusChange(order.id, status as OrderStatus)}
                            disabled={!isAdmin}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetails(order); }}>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'calendar' && (
          <div className="h-full overflow-auto">
            <CalendarView
              events={calendarEvents}
              onEventClick={(evt) => {
                const order = filteredOrders.find(o => o.id === evt.id);
                if (order) openDetails(order);
              }}
            />
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <AppDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        size="xl"
        className="p-0 bg-transparent border-0 shadow-none max-w-5xl"
        title=""
        description=""
        contentClassName="p-0 bg-transparent border-0 shadow-none"
      >
        {selectedOrder && (
          <OrderPreview
            order={selectedOrder}
            onDelete={isAdmin ? () => handleDeleteOrder(selectedOrder.id) : undefined}
            onEdit={isAdmin ? () => handleEditOrder(selectedOrder) : undefined}
            onPrint={() => window.open(`/print/order/${selectedOrder.id}`, '_blank')}
          />
        )}
      </AppDialog>
    </div>
  );
}

// Subcomponents

interface KanbanColumnProps {
  status: OrderStatus;
  orders: OrderWithDetails[];
  isLoading: boolean;
  onOrderClick: (o: OrderWithDetails) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, orders, isLoading, onOrderClick }) => {
  const { setNodeRef } = useDroppable({ id: status });
  const config = COLUMNS_CONFIG[status] || COLUMNS_CONFIG['Aprovado'];

  const Icon = config.icon;

  return (
    <div className="flex-1 flex flex-col min-w-[280px] h-full bg-muted/50 rounded-xl border border-border p-3">
      <div className={`flex items-center justify-between p-3 mb-3 rounded-lg border ${config.color} shadow-sm`}>
        <div className="flex items-center font-semibold">
          <Icon className="mr-2 h-4 w-4" />
          {config.title}
        </div>
        <Badge variant="secondary" className="bg-background/50 text-current border-0">
          {orders.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1 w-full h-full min-h-0 pr-3" hideScrollbar>
        <div ref={setNodeRef} className="space-y-3 min-h-[100px]">
          <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
            {orders.map(order => (
              <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order)} />
            ))}
          </SortableContext>
          {orders.length === 0 && !isLoading && (
            <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
              Vazio
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

interface OrderCardProps {
  order: OrderWithDetails;
  isOverlay?: boolean;
  onClick?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, isOverlay, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-card p-4 rounded-lg border border-border shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group relative ${isOverlay ? 'shadow-xl rotate-2 scale-105' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-border">
          #{order.id.slice(0, 8)}
        </Badge>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 opacity-0 group-hover:opacity-100">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </div>

      <h4 className="font-semibold text-foreground mb-1">{order.client?.name || 'Cliente sem nome'}</h4>
      <div className="flex items-center text-xs text-muted-foreground mb-3">
        <Clock className="h-3 w-3 mr-1" />
        {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR') : 'Sem data'}
      </div>

      <div className="space-y-1">
        {order.items.slice(0, 2).map((item, idx) => (
          <div key={idx} className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
            {item.quantity}x {item.product_name_copy}
          </div>
        ))}
        {order.items.length > 2 && (
          <div className="text-xs text-muted-foreground pl-1">
            +{order.items.length - 2} outros itens
          </div>
        )}
      </div>
    </div>
  );
};
