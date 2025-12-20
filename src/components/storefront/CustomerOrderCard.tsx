import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Package, ChevronRight } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';

interface OrderItem {
    productName: string;
    quantity: number;
    unitPrice: number;
}

interface CustomerOrder {
    id: string;
    created_at: string;
    delivery_date: string | null;
    status: string;
    total_amount: number;
    items: OrderItem[];
}

interface CustomerOrderCardProps {
    order: CustomerOrder;
}

/**
 * Card de pedido para lista de pedidos do cliente.
 */
const CustomerOrderCard: React.FC<CustomerOrderCardProps> = ({ order }) => {
    const createdDate = new Date(order.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const deliveryDate = order.delivery_date
        ? new Date(order.delivery_date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
        })
        : null;

    const items = Array.isArray(order.items) ? order.items : [];
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const firstItems = items.slice(0, 2).map((i) => i.productName).join(', ');

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-storefront-chocolate">
                            Pedido #{order.id.slice(0, 8)}
                        </span>
                        <OrderStatusBadge status={order.status} size="sm" />
                    </div>

                    {/* Items Preview */}
                    <p className="text-sm text-storefront-chocolate/70 line-clamp-1 mb-2">
                        {firstItems || 'Sem itens'}
                        {items.length > 2 && ` e mais ${items.length - 2}...`}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-storefront-chocolate/50">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {createdDate}
                        </span>
                        {deliveryDate && (
                            <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                Entrega: {deliveryDate}
                            </span>
                        )}
                        <span>
                            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                        </span>
                    </div>
                </div>

                {/* Price & Action */}
                <div className="text-right flex flex-col items-end">
                    <span className="font-bold text-storefront-primary">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                        }).format(order.total_amount)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground mt-2" />
                </div>
            </div>
        </div>
    );
};

export default CustomerOrderCard;
