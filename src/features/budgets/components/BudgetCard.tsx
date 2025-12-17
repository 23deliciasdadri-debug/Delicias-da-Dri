/**
 * BudgetCard - Card de orçamento para visualização em Kanban
 * Componente extraído de BudgetsPage.tsx para reutilização
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

import type { QuoteDetails } from '../../../services/quotesService';
import type { QuoteStatus } from '../../../types';
import { KANBAN_COLUMNS_CONFIG } from '../helpers/kanbanHelpers';
import { formatLocalDate } from '../../../utils/dateHelpers';

export interface BudgetCardProps {
    quote: QuoteDetails;
    isOverlay?: boolean;
    onClick?: () => void;
    onEdit?: (id: string) => void;
    onStatusChange?: (id: string, status: QuoteStatus) => void;
    isAdmin?: boolean;
}

const BudgetCard: React.FC<BudgetCardProps> = ({
    quote,
    isOverlay,
    onClick,
    onEdit,
    onStatusChange,
    isAdmin,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: quote.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative ${isOverlay ? 'shadow-xl rotate-2 scale-105' : ''}`}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-muted-foreground">#{quote.id.slice(0, 8)}</span>
                    {!isOverlay && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 -mr-2 -mt-2 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Mover para:</DropdownMenuLabel>
                                {KANBAN_COLUMNS_CONFIG.filter((c) => c.id !== quote.status).map((targetCol) => (
                                    <DropdownMenuItem
                                        key={targetCol.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusChange?.(quote.id, targetCol.id as QuoteStatus);
                                        }}
                                        disabled={!isAdmin}
                                    >
                                        {targetCol.label}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit?.(quote.id);
                                    }}
                                    disabled={!isAdmin}
                                >
                                    Editar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                <h4 className="font-semibold text-foreground mb-1 truncate" title={quote.client?.name}>
                    {quote.client?.name}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">{quote.event_type}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                        {formatLocalDate(quote.event_date)}
                    </span>
                    <span className="font-bold text-foreground text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            quote.total_amount
                        )}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};

export default BudgetCard;
