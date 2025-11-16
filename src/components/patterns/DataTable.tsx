import React from 'react';
import { cn } from '../../lib/utils';
import { EmptyState } from './EmptyState';
import { SkeletonList } from './SkeletonList';

export type DataTableAlign = 'left' | 'right';

export interface DataTableColumn<T> {
  id: string;
  label: string;
  cell: (row: T) => React.ReactNode;
  align?: DataTableAlign;
  hideOnMobile?: boolean;
  headClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Array<DataTableColumn<T>>;
  keyExtractor: (row: T, index: number) => React.Key;
  isLoading?: boolean;
  loadingText?: string;
  emptyState?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  onRowClick?: (row: T) => void;
}

const isActivationKey = (event: React.KeyboardEvent<HTMLElement>) =>
  event.key === 'Enter' || event.key === ' ';

export const DataTable = <T,>({
  data,
  columns,
  keyExtractor,
  isLoading,
  loadingText = 'Carregando...',
  emptyState,
  className,
  containerClassName,
  onRowClick,
}: DataTableProps<T>) => {
  if (isLoading) {
    return (
      <div className={cn('rounded-2xl border border-border/60 bg-card p-6 shadow-sm', className)}>
        <p className="mb-4 text-sm font-medium text-muted-foreground">{loadingText}</p>
        <SkeletonList variant="row" count={5} />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-dashed border-rose-200/70 bg-card/80 p-6 shadow-sm dark:bg-slate-900/40',
          className,
        )}
      >
        {emptyState ?? (
          <EmptyState
            compact
            title="Nenhum registro encontrado"
            description="Ajuste os filtros ou cadastre um novo item."
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'hidden overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm md:block',
          containerClassName,
        )}
      >
        <table className="w-full text-sm">
          <thead className="bg-muted/70 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:bg-muted/20">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'p-4',
                    column.align === 'right' ? 'text-right' : 'text-left',
                    column.headClassName,
                  )}
                  scope="col"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const key = keyExtractor(row, index);
              const clickable = Boolean(onRowClick);
              return (
                <tr
                  key={key}
                  className={cn(
                    'border-t border-border/60 transition-colors',
                    clickable
                      ? 'cursor-pointer hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:bg-slate-900/40'
                      : 'hover:bg-muted/60 dark:hover:bg-slate-900/30',
                  )}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={() => (onRowClick ? onRowClick(row) : undefined)}
                  onKeyDown={(event) => {
                    if (!onRowClick || !isActivationKey(event)) {
                      return;
                    }
                    event.preventDefault();
                    onRowClick(row);
                  }}
                  aria-label={clickable ? 'Abrir detalhes do registro' : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={`${column.id}-${key}`}
                      className={cn(
                        'p-4 align-top',
                        column.align === 'right' ? 'text-right' : 'text-left',
                        column.cellClassName,
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {data.map((row, index) => {
          const key = keyExtractor(row, index);
          return (
            <div
              key={`mobile-${key}`}
              className={cn(
                'rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors',
                onRowClick
                  ? 'cursor-pointer hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:bg-slate-900/40'
                  : undefined,
              )}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => (onRowClick ? onRowClick(row) : undefined)}
              onKeyDown={(event) => {
                if (!onRowClick || !isActivationKey(event)) {
                  return;
                }
                event.preventDefault();
                onRowClick(row);
              }}
              aria-label={onRowClick ? 'Abrir detalhes do registro' : undefined}
            >
              <div className="flex flex-col gap-3">
                {columns
                  .filter((column) => !column.hideOnMobile)
                  .map((column) => (
                    <div key={`${column.id}-mobile-${key}`} className="text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {column.label}
                      </p>
                      <div className="mt-1 text-foreground">{column.cell(row)}</div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
