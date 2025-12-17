/**
 * Helpers para o Kanban de Pedidos
 * Funções utilitárias para drag-and-drop e organização de colunas
 */

import type { OrderStatus } from '../../../types';
import type { OrderWithDetails } from '../../../services/ordersService';
import { ORDER_STATUSES } from '../../../constants/status';
import { Clock, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

const ALL_STATUSES: OrderStatus[] = ORDER_STATUSES;

/**
 * Configuração das colunas do Kanban (títulos, ícones e cores)
 */
export const ORDER_COLUMNS_CONFIG: Record<OrderStatus, { title: string; icon: typeof Clock; color: string }> = {
    'Aprovado': {
        title: 'Aprovado',
        icon: Clock,
        color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    },
    'Em Produção': {
        title: 'Em Produção',
        icon: Package,
        color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    },
    'Pronto para Entrega': {
        title: 'Pronto para Entrega',
        icon: Truck,
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
    },
    'Em Entrega': {
        title: 'Em Entrega',
        icon: Truck,
        color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    },
    'Entregue': {
        title: 'Entregue',
        icon: CheckCircle2,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    },
    'Cancelado': {
        title: 'Cancelado',
        icon: AlertCircle,
        color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
    },
};

/**
 * Constrói as colunas do Kanban agrupando pedidos por status
 */
export const buildOrderColumns = (orders?: OrderWithDetails[]): Record<OrderStatus, OrderWithDetails[]> => {
    const base = {} as Record<OrderStatus, OrderWithDetails[]>;
    ALL_STATUSES.forEach((status) => {
        base[status] = [];
    });
    (orders ?? []).forEach((order) => {
        if (base[order.status]) base[order.status].push(order);
    });
    return base;
};

/**
 * Encontra a localização de um pedido nas colunas do Kanban
 */
export const findOrderLocation = (
    columns: Record<OrderStatus, OrderWithDetails[]>,
    orderId: string
) => {
    for (const status of ALL_STATUSES) {
        const column = columns[status] ?? [];
        const index = column.findIndex((order) => order.id === orderId);
        if (index >= 0) return { status, index, order: column[index] };
    }
    return null;
};

/**
 * Move um pedido para outro status/posição (retorna novo objeto imutável)
 */
export const moveOrderToStatus = (
    columns: Record<OrderStatus, OrderWithDetails[]>,
    orderId: string,
    targetStatus: OrderStatus,
    targetIndex?: number
) => {
    const location = findOrderLocation(columns, orderId);
    if (!location) return columns;

    const clone = { ...columns };
    ALL_STATUSES.forEach((s) => {
        clone[s] = [...(columns[s] || [])];
    });

    const [order] = clone[location.status].splice(location.index, 1);
    if (!order) return columns;

    const updatedOrder = { ...order, status: targetStatus };
    const targetColumn = clone[targetStatus];
    const insertionIndex =
        targetIndex !== undefined ? Math.min(targetIndex, targetColumn.length) : targetColumn.length;
    targetColumn.splice(insertionIndex, 0, updatedOrder);

    return clone;
};
