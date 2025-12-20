import React from 'react';
import { cn } from '../../lib/utils';

type OrderStatus = 'Pendente' | 'Em Produção' | 'Pronto' | 'Entregue' | 'Cancelado';

interface OrderStatusBadgeProps {
    status: OrderStatus | string;
    size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    'Pendente': {
        label: 'Pendente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    'Em Produção': {
        label: 'Em Produção',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    'Pronto': {
        label: 'Pronto',
        className: 'bg-green-100 text-green-800 border-green-200',
    },
    'Entregue': {
        label: 'Entregue',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    'Cancelado': {
        label: 'Cancelado',
        className: 'bg-red-100 text-red-800 border-red-200',
    },
};

/**
 * Badge colorido para status de pedido.
 */
const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
    status,
    size = 'md'
}) => {
    const config = STATUS_CONFIG[status] || {
        label: status,
        className: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center font-medium border rounded-full',
                size === 'sm' && 'px-2 py-0.5 text-xs',
                size === 'md' && 'px-3 py-1 text-sm',
                config.className
            )}
        >
            {config.label}
        </span>
    );
};

export default OrderStatusBadge;
