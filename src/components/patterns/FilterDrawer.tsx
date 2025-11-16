import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onClear?: () => void;
  onApply?: () => void;
  applyLabel?: string;
  clearLabel?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Drawer para filtros no mobile (usa Dialog por baixo dos panos).
 */
export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onOpenChange,
  title = 'Filtros',
  description,
  onClear,
  onApply,
  applyLabel = 'Aplicar filtros',
  clearLabel = 'Limpar',
  children,
  className,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className={cn(
        'sm:max-w-lg bg-white',
        'max-h-[90vh] overflow-y-auto rounded-3xl sm:rounded-2xl',
        className,
      )}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      <div className="space-y-4">{children}</div>
      <DialogFooter className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end">
        {onClear ? (
          <Button variant="ghost" className="w-full sm:w-auto" onClick={onClear}>
            {clearLabel}
          </Button>
        ) : null}
        <Button className="w-full sm:w-auto" onClick={onApply ?? (() => onOpenChange(false))}>
          {applyLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
