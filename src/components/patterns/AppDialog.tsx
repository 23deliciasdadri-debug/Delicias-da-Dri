import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { cn } from '../ui/utils';

export type AppDialogSize = 'sm' | 'md' | 'lg' | 'xl';

interface AppDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    size?: AppDialogSize;
    className?: string;
    contentClassName?: string;
}

const sizeClasses: Record<AppDialogSize, string> = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-5xl',
    xl: 'sm:max-w-7xl w-[95vw]',
};

export function AppDialog({
    open,
    onOpenChange,
    trigger,
    title,
    description,
    children,
    footer,
    size = 'md',
    className,
    contentClassName,
}: AppDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent
                className={cn(
                    'max-h-[90vh] overflow-y-auto',
                    sizeClasses[size],
                    contentClassName
                )}
            >
                {(title || description) ? (
                    <DialogHeader className={className}>
                        {title && <DialogTitle>{title}</DialogTitle>}
                        {description ? (
                            <DialogDescription>{description}</DialogDescription>
                        ) : (
                            <DialogDescription className="sr-only">Dialog Description</DialogDescription>
                        )}
                    </DialogHeader>
                ) : (
                    <>
                        <DialogTitle className="sr-only">Dialog</DialogTitle>
                        <DialogDescription className="sr-only">Dialog Description</DialogDescription>
                    </>
                )}
                {children}
                {footer && <DialogFooter>{footer}</DialogFooter>}
            </DialogContent>
        </Dialog>
    );
}

// Re-export subcomponents for advanced usage if needed
export {
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
    DialogContent,
};
