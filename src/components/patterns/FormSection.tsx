import React from 'react';
import { cn } from '../../lib/utils';

interface FormSectionProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}) => (
  <section
    className={cn(
      'rounded-2xl border border-border/70 bg-white/95 p-5 shadow-sm backdrop-blur',
      className,
    )}
  >
    {(title || description || actions) && (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {title ? <h3 className="text-lg font-semibold text-foreground">{title}</h3> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    )}
    <div className={cn('mt-4 space-y-4', contentClassName)}>{children}</div>
  </section>
);
