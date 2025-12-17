/**
 * OrderKanbanColumn - Coluna do Kanban de pedidos
 * Componente extraído de OrdersPage.tsx para reutilização
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';

import type { OrderWithDetails } from '../../../services/ordersService';
import type { OrderStatus } from '../../../types';
import OrderCard from './OrderCard';
import { ORDER_COLUMNS_CONFIG } from '../helpers/kanbanHelpers';

export interface OrderKanbanColumnProps {
    status: OrderStatus;
    orders: OrderWithDetails[];
    isLoading: boolean;
    onOrderClick: (o: OrderWithDetails) => void;
    onRegisterCashflow?: (order: OrderWithDetails) => void;
}

const OrderKanbanColumn: React.FC<OrderKanbanColumnProps> = ({
    status,
    orders,
    isLoading,
    onOrderClick,
    onRegisterCashflow,
}) => {
    const { setNodeRef } = useDroppable({ id: status });
    const config = ORDER_COLUMNS_CONFIG[status] || ORDER_COLUMNS_CONFIG['Aprovado'];

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
                    <SortableContext items={orders.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                        {orders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onClick={() => onOrderClick(order)}
                                onRegisterCashflow={onRegisterCashflow}
                            />
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

export default OrderKanbanColumn;

