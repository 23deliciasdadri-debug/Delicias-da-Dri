import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Filter } from 'lucide-react';

export interface FilterBarProps {
  summary?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  onOpenDrawer?: () => void;
  drawerLabel?: string;
  filtersClassName?: string;
  className?: string;
}

/**
 * Container padrão para filtros: mostra resumo/ações
 * e deixa os campos visíveis a partir do breakpoint md.
 * Em telas menores, os filtros abrem pelo botão que dispara o drawer.
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  summary,
  actions,
  children,
  onOpenDrawer,
  drawerLabel = 'Filtros',
  filtersClassName,
  className,
}) => (
  <section
    className={cn(
      'rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm backdrop-blur',
      className,
    )}
  >
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {summary ? <div className="text-sm text-muted-foreground">{summary}</div> : <span />}
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {onOpenDrawer ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={onOpenDrawer}
          >
            <Filter className="mr-1.5 h-4 w-4" />
            {drawerLabel}
          </Button>
        ) : null}
      </div>
    </div>
    {children ? (
      <div
        className={cn(
          'mt-4 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3',
          filtersClassName,
        )}
      >
        {children}
      </div>
    ) : null}
  </section>
);
