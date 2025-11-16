import React from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { cn } from '../../lib/utils';

export interface SectionCardProps extends Omit<React.ComponentProps<typeof Card>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
}

/**
 * Cartão de seção padrão, pensado para listas, forms ou resumos.
 * Evita duplicação de markup e garante consistência entre telas.
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  actions,
  footer,
  children,
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  ...props
}) => (
  <Card
    className={cn(
      'rounded-2xl border border-border/70 bg-card/90 shadow-glow-rose backdrop-blur transition-colors dark:bg-card/60',
      className,
    )}
    {...props}
  >
    {title || description || actions ? (
      <CardHeader className={cn('border-b border-border/50 pb-5', headerClassName)}>
        <div>
          {title ? <CardTitle className="text-lg font-semibold">{title}</CardTitle> : null}
          {description ? (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {actions ? <CardAction>{actions}</CardAction> : null}
      </CardHeader>
    ) : null}
    <CardContent className={cn('py-6', contentClassName)}>{children}</CardContent>
    {footer ? (
      <CardFooter className={cn('border-t border-border/50 pt-5', footerClassName)}>
        {footer}
      </CardFooter>
    ) : null}
  </Card>
);
