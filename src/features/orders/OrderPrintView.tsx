import React from 'react';
import type { OrderWithDetails } from '../../services/ordersService';
import { cn } from '../../lib/utils';
import { parseLocalDate } from '../../utils/dateHelpers';

interface OrderPrintViewProps {
    order: OrderWithDetails;
    className?: string;
}

const formatDate = (value?: string | null) => {
    if (!value) return 'Não informado';
    try {
        // Usa parseLocalDate para datas YYYY-MM-DD (evita problema de timezone)
        // Para timestamps ISO, usa Date diretamente
        const date = value.includes('T') ? new Date(value) : parseLocalDate(value);
        if (!date || Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
    } catch {
        return value;
    }
};

const OrderPrintView: React.FC<OrderPrintViewProps> = ({ order, className }) => {
    const client = order.client;
    const items = order.items ?? [];

    return (
        <div className={cn('bg-background text-foreground p-0 font-sans', className)}>
            {/* Header: Title and ID */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground uppercase tracking-wide">
                    FICHA DE PRODUÇÃO
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    ID do Orçamento: {order.quote_id ? `QT-${order.quote_id.slice(0, 8).toUpperCase()}` : 'N/A'}
                </p>
            </div>

            <div className="border-t border-border mb-8" />

            {/* Client Info Row */}
            <div className="flex justify-between items-end mb-10 px-1">
                <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">CLIENTE:</p>
                    <h2 className="text-xl font-bold text-foreground">
                        {client?.name || 'Cliente não informado'}
                    </h2>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">DATA DO EVENTO:</p>
                    <h2 className="text-xl font-bold text-foreground">
                        {order.delivery_date ? formatDate(order.delivery_date) : 'Não informada'}
                    </h2>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-10">
                <h3 className="text-lg font-bold text-foreground mb-4">Itens para Produzir</h3>

                <div className="w-full">
                    {/* Table Header */}
                    <div className="flex border-b border-border pb-2 mb-2">
                        <div className="flex-1 text-xs font-bold text-muted-foreground uppercase">Produto</div>
                        <div className="w-32 text-center text-xs font-bold text-muted-foreground uppercase">Quantidade</div>
                        <div className="w-20 text-center text-xs font-bold text-muted-foreground uppercase">Status</div>
                    </div>

                    {/* Table Body */}
                    <div className="space-y-4">
                        {items.length > 0 ? (
                            items.map((item, index) => {
                                const name = item.product_name_copy || 'Item sem nome';
                                const quantity = Number(item.quantity ?? 0);

                                return (
                                    <div key={item.id || index} className="flex items-center py-3 border-b border-border/50 last:border-0">
                                        <div className="flex-1 font-medium text-foreground text-base">{name}</div>
                                        <div className="w-32 text-center font-bold text-foreground text-base">{quantity}</div>
                                        <div className="w-20 flex justify-center">
                                            <div className="h-6 w-6 border-2 border-muted-foreground rounded-md" />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">Nenhum item para produzir.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Observations Section */}
            <div className="mt-8">
                <h3 className="text-sm font-bold text-foreground mb-2">Observações Importantes:</h3>
                <div className="bg-yellow-100/50 border-l-4 border-yellow-400 p-4 rounded-r-md min-h-[80px]">
                    <p className="text-foreground font-medium whitespace-pre-wrap">
                        {order.delivery_details || 'Nenhuma observação registrada.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderPrintView;
