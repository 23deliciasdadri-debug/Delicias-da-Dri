import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingStateProps {
  message?: React.ReactNode;
  className?: string;
  inline?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Carregando...', className, inline }) => {
  if (inline) {
    return (
      <div className={cn('inline-flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Loader2 className="size-4 animate-spin text-rose-500" aria-hidden />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 text-sm font-semibold text-muted-foreground',
        className,
      )}
    >
      <Loader2 className="size-6 animate-spin text-rose-500" aria-hidden />
      <p>{message}</p>
    </div>
  );
};

export default LoadingState;
