/**
 * Helpers para o Kanban de Orçamentos
 * Funções utilitárias para drag-and-drop e organização de colunas
 */

import type { QuoteStatus } from '../../../types';
import type { QuoteDetails } from '../../../services/quotesService';
import { QUOTE_STATUSES, QUOTE_STATUS_OPTIONS } from '../../../constants/status';

const ALL_STATUSES: QuoteStatus[] = QUOTE_STATUSES;

/**
 * Constrói as colunas do Kanban agrupando quotes por status
 */
export const buildColumns = (quotes?: QuoteDetails[]): Record<QuoteStatus, QuoteDetails[]> => {
    const base = {} as Record<QuoteStatus, QuoteDetails[]>;
    ALL_STATUSES.forEach((status) => {
        base[status] = [];
    });
    (quotes ?? []).forEach((quote) => {
        if (base[quote.status]) base[quote.status].push(quote);
    });
    return base;
};

/**
 * Encontra a localização de um quote nas colunas do Kanban
 */
export const findQuoteLocation = (
    columns: Record<QuoteStatus, QuoteDetails[]>,
    quoteId: string
) => {
    for (const status of ALL_STATUSES) {
        const column = columns[status] ?? [];
        const index = column.findIndex((q) => q.id === quoteId);
        if (index >= 0) return { status, index, quote: column[index] };
    }
    return null;
};

/**
 * Move um quote para outro status/posição (retorna novo objeto imutável)
 */
export const moveQuoteToStatus = (
    columns: Record<QuoteStatus, QuoteDetails[]>,
    quoteId: string,
    targetStatus: QuoteStatus,
    targetIndex?: number
) => {
    const location = findQuoteLocation(columns, quoteId);
    if (!location) return columns;

    const clone = { ...columns };
    // Deep copy arrays
    ALL_STATUSES.forEach((s) => {
        clone[s] = [...(columns[s] || [])];
    });

    const [quote] = clone[location.status].splice(location.index, 1);
    if (!quote) return columns;

    const updatedQuote = { ...quote, status: targetStatus };
    const targetColumn = clone[targetStatus];
    const insertionIndex =
        targetIndex !== undefined ? Math.min(targetIndex, targetColumn.length) : targetColumn.length;
    targetColumn.splice(insertionIndex, 0, updatedQuote);

    return clone;
};

/**
 * Retorna a classe CSS para um status de quote
 */
export const getQuoteStatusClass = (status: string) =>
    QUOTE_STATUS_OPTIONS.find((opt) => opt.value === status)?.className || '';

/**
 * Configuração das colunas do Kanban (labels e cores)
 */
export const KANBAN_COLUMNS_CONFIG = [
    {
        id: 'Pendente',
        label: 'Pendente / Enviado',
        color:
            'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
    },
    {
        id: 'Aprovado',
        label: 'Aprovado',
        color:
            'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400',
    },
    {
        id: 'Recusado',
        label: 'Rejeitado / Perdido',
        color:
            'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400',
    },
] as const;
