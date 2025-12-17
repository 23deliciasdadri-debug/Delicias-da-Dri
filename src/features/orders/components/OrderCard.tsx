/**
 * OrderCard - Card de pedido para visualização em Kanban
 * Componente extraído de OrdersPage.tsx para reutilização
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, MoreVertical, Wallet, CheckCircle } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';

import type { OrderWithDetails } from '../../../services/ordersService';
import { formatLocalDate } from '../../../utils/dateHelpers';

export interface OrderCardProps {
    order: OrderWithDetails;
    isOverlay?: boolean;
    onClick?: () => void;
    onRegisterCashflow?: (order: OrderWithDetails) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, isOverlay, onClick, onRegisterCashflow }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: order.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isDelivered = order.status === 'Entregue';
    const canRegisterCashflow = isDelivered && !order.cashflow_registered && onRegisterCashflow;

    const handleCashflowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRegisterCashflow) {
            onRegisterCashflow(order);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            className={`bg-card p-4 rounded-lg border border-border shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group relative ${isOverlay ? 'shadow-xl rotate-2 scale-105' : ''}`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-border">
                    #{order.id.slice(0, 8)}
                </Badge>
                <div className="flex items-center gap-1">
                    {/* Badge de já lançado */}
                    {isDelivered && order.cashflow_registered && (
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Lançado
                        </Badge>
                    )}
                    {/* Botão de lançar no caixa */}
                    {canRegisterCashflow && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800"
                            onClick={handleCashflowClick}
                        >
                            <Wallet className="h-3 w-3 mr-1" />
                            Lançar
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            <h4 className="font-semibold text-foreground mb-1">{order.client?.name || 'Cliente sem nome'}</h4>
            <div className="flex items-center text-xs text-muted-foreground mb-3">
                <Clock className="h-3 w-3 mr-1" />
                {formatLocalDate(order.delivery_date, 'Sem data')}
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

export default OrderCard;

