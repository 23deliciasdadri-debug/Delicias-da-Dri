/**
 * BudgetKanbanColumn - Coluna do Kanban de orçamentos
 * Componente extraído de BudgetsPage.tsx para reutilização
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';

import type { QuoteDetails } from '../../../services/quotesService';
import type { QuoteStatus } from '../../../types';
import BudgetCard from './BudgetCard';

export interface BudgetKanbanColumnProps {
    id: string;
    label: string;
    color: string;
    quotes: QuoteDetails[];
    onQuoteClick: (id: string) => void;
    onEdit: (id: string) => void;
    onStatusChange: (id: string, status: QuoteStatus) => void;
    isAdmin: boolean;
}

const BudgetKanbanColumn: React.FC<BudgetKanbanColumnProps> = ({
    id,
    label,
    color,
    quotes,
    onQuoteClick,
    onEdit,
    onStatusChange,
    isAdmin,
}) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex-1 flex flex-col h-full bg-muted/50 rounded-xl border border-border/60 p-3">
            <div
                className={`flex items-center justify-between p-3 mb-3 rounded-lg border ${color} bg-card shadow-sm font-medium`}
            >
                {label}
                <Badge variant="secondary">{quotes.length}</Badge>
            </div>
            <ScrollArea className="flex-1 w-full h-full min-h-0 pr-3" hideScrollbar>
                <div ref={setNodeRef} className="space-y-3 min-h-[100px]">
                    <SortableContext items={quotes.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                        {quotes.map((budget) => (
                            <BudgetCard
                                key={budget.id}
                                quote={budget}
                                onClick={() => onQuoteClick(budget.id)}
                                onEdit={onEdit}
                                onStatusChange={onStatusChange}
                                isAdmin={isAdmin}
                            />
                        ))}
                    </SortableContext>
                    {quotes.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
                            Vazio
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default BudgetKanbanColumn;
