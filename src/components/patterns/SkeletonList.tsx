import React from 'react';
import { cn } from '../../lib/utils';

export type SkeletonVariant = 'card' | 'row';

export interface SkeletonListProps {
  count?: number;
  variant?: SkeletonVariant;
  className?: string;
}

/**
 * Skeleton reutilizável para listas ou cards.
 */
export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  variant = 'card',
  className,
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className={cn(
          'animate-pulse rounded-xl bg-muted',
          variant === 'card' ? 'h-36' : 'h-6',
        )}
      />
    ))}
  </div>
);
