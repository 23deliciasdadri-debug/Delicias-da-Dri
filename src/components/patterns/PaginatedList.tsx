import React from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface PaginatedListProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  summary?: React.ReactNode;
  className?: string;
}

export const PaginatedList: React.FC<PaginatedListProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  summary,
  className,
}) => {
  const startItem = pageSize ? (page - 1) * pageSize + 1 : null;
  const endItem = pageSize ? Math.min(page * pageSize, totalItems) : null;

  const defaultSummary = (
    <p className="text-sm text-muted-foreground">
      Página <span className="font-semibold text-rose-600">{page}</span> de {totalPages}{' '}
      {pageSize && totalItems ? (
        <>
          · exibindo {startItem}-{endItem} de {totalItems}
        </>
      ) : (
        <>· {totalItems} registros</>
      )}
    </p>
  );

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 p-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      {summary ?? defaultSummary}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
};
