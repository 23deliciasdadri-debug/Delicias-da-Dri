import React from 'react';
import { cn } from '../../lib/utils';


export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: React.ReactNode;
  hint?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  align?: 'start' | 'center';
  className?: string;
}

/**
 * Cabeçalho padronizado para páginas principais do app.
 * Usa gradiente oficial e acomoda ações/slots extras.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  eyebrow,
  hint,
  actions,
  children,
  align = 'start',
  className,
}) => {
  const alignmentClasses =
    align === 'center'
      ? 'text-center lg:text-left lg:items-start'
      : 'text-left items-start';

  return (
    <header
      className={cn(
        'flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      <div className={cn('space-y-3', alignmentClasses)}>
        {eyebrow ? (
          <div className="text-sm font-semibold uppercase tracking-wide text-destructive">
            {eyebrow}
          </div>
        ) : null}

        <div>
          <h1
            className="text-3xl font-serif font-bold leading-tight text-transparent lg:text-4xl gradient-primary bg-clip-text"
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {hint ? <div className="text-sm text-muted-foreground">{hint}</div> : null}
        {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
      </div>

      {actions ? (
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
          {actions}
        </div>
      ) : null}
    </header>
  );
};
