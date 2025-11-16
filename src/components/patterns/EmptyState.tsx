import React from 'react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

/**
 * Bloco padrão para estados vazios/erros suaves.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
  ...props
}) => (
  <div
    className={cn(
      'text-center',
      compact ? 'space-y-2 rounded-xl border border-dashed border-rose-200 p-6' : 'space-y-4 rounded-2xl border-2 border-dashed border-rose-200 p-10',
      'bg-gradient-to-br from-rose-50/80 to-orange-50/60',
      className,
    )}
    {...props}
  >
    {icon ? (
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/80 text-rose-500 shadow">
        {icon}
      </div>
    ) : null}
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
    {action ? <div className="flex justify-center">{action}</div> : null}
  </div>
);
