import React from 'react';
import { Tag, MessageCircle, Pencil, Trash2, Printer, Clock, MapPin } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import type { OrderWithDetails } from '../../services/ordersService';
import { cn } from '../../lib/utils';
import { ORDER_STATUS_OPTIONS } from '../../constants/status';

interface OrderPreviewProps {
    order: OrderWithDetails;
    className?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    onPrint?: () => void;
    hideActions?: boolean;
}

const formatDate = (value?: string | null) => {
    if (!value) return 'Não informado';
    try {
        return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(value));
    } catch {
        return value;
    }
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const InfoRow = ({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) => (
    <div className="space-y-1 text-sm">
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1">
            {Icon && <Icon className="h-3 w-3" />}
            {label}
        </p>
        <p className="text-foreground font-semibold">{value || 'Não informado'}</p>
    </div>
);

const OrderPreview: React.FC<OrderPreviewProps> = ({
    order,
    className,
    onEdit,
    onDelete,
    onPrint,
    hideActions = false,
}) => {
    const statusOption = ORDER_STATUS_OPTIONS.find(opt => opt.value === order.status);
    const statusClass = statusOption?.className || 'bg-slate-100 text-slate-800';

    const client = order.client;
    const items = order.items ?? [];
    const totalItems = items.reduce(
        (acc, item) => acc + Number((item as any).quantity ?? 0),
        0,
    );

    return (
        <div
            className={cn(
                'rounded-2xl border border-border shadow-xl overflow-hidden bg-card',
                className,
            )}
        >
            <div className="mx-auto max-w-5xl">
                <div className="px-6 py-5 border-b border-border bg-muted/20">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold text-foreground">
                            Detalhes do Pedido
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Visualize as informações de produção e entrega.
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col gap-4 md:gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                            <p className="text-[11px] uppercase tracking-[0.1em] text-primary">
                                PEDIDO #{order.id.slice(0, 8)}
                            </p>
                            <h1 className="text-3xl font-black text-foreground">{client?.name || 'Cliente não informado'}</h1>
                            <p className="text-sm text-muted-foreground">{client?.phone || 'Telefone não informado'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right">
                            <Badge className={cn('px-3 py-1 text-xs font-semibold', statusClass)}>{order.status}</Badge>
                            <p className="text-xs text-muted-foreground">
                                Criado em {formatDate(order.created_at)}
                            </p>
                            <div className="flex items-center gap-2">
                                {!hideActions && (
                                    <>
                                        {onPrint && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-full border border-border bg-card shadow-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPrint();
                                                }}
                                                title="Imprimir Ficha"
                                            >
                                                <Printer className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        )}
                                        {onEdit && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-full border border-border bg-card shadow-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit();
                                                }}
                                                title="Editar pedido"
                                            >
                                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-full border border-border bg-card shadow-sm text-destructive hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete();
                                                }}
                                                title="Excluir pedido"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 rounded-2xl border border-border bg-muted/10 p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-foreground tracking-wide">Informações de Entrega</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InfoRow label="Data de Entrega" value={formatDate(order.delivery_date)} icon={Clock} />
                                <InfoRow label="Detalhes/Endereço" value={order.delivery_details} icon={MapPin} />
                                <InfoRow label="E-mail do Cliente" value={client?.email} />
                            </div>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-2">
                            <p className="text-sm font-semibold text-foreground tracking-wide">Total do Pedido</p>
                            <p className="text-3xl font-extrabold text-primary">{formatCurrency(order.total_amount)}</p>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>
                                    Quantidade de itens:{' '}
                                    <span className="font-semibold">{totalItems}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground tracking-wide">Itens do Pedido</h4>
                        </div>
                        <div className="divide-y divide-border">
                            {items.length > 0 ? (
                                items.map((item, index) => {
                                    const name = item.product_name_copy || 'Item sem nome';
                                    const quantity = Number(item.quantity ?? 0);
                                    const price = Number(item.price_at_creation ?? 0);
                                    const lineTotal = price * quantity;
                                    return (
                                        <div key={item.id || index} className="py-3 flex items-center text-sm">
                                            <div className="flex-1 font-semibold text-foreground">{name}</div>
                                            <div className="w-20 text-center text-muted-foreground">{quantity} un.</div>
                                            <div className="w-28 text-right text-muted-foreground">{formatCurrency(price)}</div>
                                            <div className="w-28 text-right font-semibold text-foreground">{formatCurrency(lineTotal)}</div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-6 text-center text-muted-foreground text-sm">Nenhum item adicionado.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderPreview;
