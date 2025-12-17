import { useEffect, useMemo, useState } from 'react';
import { parseLocalDate, formatLocalDate } from '../utils/dateHelpers';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Search,
  Plus,
  Wallet,
  CheckCircle
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';

// Componentes e helpers extraídos
import OrderCard from './orders/components/OrderCard';
import OrderKanbanColumn from './orders/components/OrderKanbanColumn';
import {
  buildOrderColumns,
  findOrderLocation,
  moveOrderToStatus,
} from './orders/helpers/kanbanHelpers';

import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
import { deleteOrder, markOrderAsCashflowRegistered } from '../services/ordersService';
import { createTransactionFromOrder } from '../services/transactionsService';

// Constants & Types
const ALL_STATUSES: OrderStatus[] = ORDER_STATUSES;

const ROLE_VISIBLE_STATUSES: Record<ProfileRole, OrderStatus[]> = {
  admin: ALL_STATUSES,
  kitchen: ['Aprovado', 'Em Produção'],
  delivery: ['Pronto para Entrega', 'Em Entrega'],
};

const getVisibleStatuses = (role?: ProfileRole) =>
  role ? ROLE_VISIBLE_STATUSES[role] ?? ALL_STATUSES : ALL_STATUSES;

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

  const [boardColumns, setBoardColumns] = useState(() => buildOrderColumns(filteredOrders));

  useEffect(() => {
    setBoardColumns(buildOrderColumns(filteredOrders));
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

  // Handler para lançar pedido no fluxo de caixa
  const handleRegisterCashflow = async (order: OrderWithDetails) => {
    try {
      const description = `Pedido #${order.id.slice(0, 8)} - ${order.client?.name || 'Cliente'}`;
      await createTransactionFromOrder(order.id, order.total_amount, description);
      await markOrderAsCashflowRegistered(order.id);
      toast.success('Receita lançada no fluxo de caixa!');
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao lançar receita: ${message}`);
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
      date: parseLocalDate(order.delivery_date) || new Date(),
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
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
                  <OrderKanbanColumn
                    key={status}
                    status={status}
                    orders={(boardColumns[status] || [])}
                    isLoading={isLoading}
                    onOrderClick={openDetails}
                    onRegisterCashflow={handleRegisterCashflow}
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
                        <TableCell>{formatLocalDate(order.delivery_date)}</TableCell>
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
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {/* Botão de lançar no caixa */}
                            {order.status === 'Entregue' && !order.cashflow_registered && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                onClick={() => void handleRegisterCashflow(order)}
                              >
                                <Wallet className="h-3 w-3 mr-1" />
                                Lançar
                              </Button>
                            )}
                            {/* Badge de já lançado */}
                            {order.status === 'Entregue' && order.cashflow_registered && (
                              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border-0">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Lançado
                              </Badge>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => openDetails(order)}>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
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
