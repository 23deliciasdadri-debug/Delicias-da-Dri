import React from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../../lib/utils';

interface FilterPopoverProps {
    title?: string;
    onClear?: () => void;
    children: React.ReactNode;
    className?: string;
    activeCount?: number;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
    title = 'Filtrar',
    onClear,
    children,
    className,
    activeCount = 0,
}) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "relative h-10 w-10 rounded-full border-dashed border-2 hover:border-solid hover:border-rose-500 hover:text-rose-600 transition-all",
                        activeCount > 0 && "border-solid border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-900/20"
                    )}
                    title="Filtrar resultados"
                >
                    <Search className="h-4 w-4" />
                    {activeCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm">
                            {activeCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-80 p-0 sm:w-96", className)} align="end">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="font-semibold text-sm">{title}</h4>
                    {onClear && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClear}
                            className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
                        >
                            Limpar filtros
                        </Button>
                    )}
                </div>
                <div className="p-4 space-y-4">
                    {children}
                </div>
            </PopoverContent>
        </Popover>
    );
};
