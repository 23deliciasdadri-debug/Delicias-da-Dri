import React from 'react';
import { cn } from '../../lib/utils';

type FilterBarProps = {
  /**
   * Conteúdo da seção esquerda (ex.: tabs/chips de filtro).
   */
  left?: React.ReactNode;
  /**
   * Conteúdo da seção direita (ex.: busca, ações adicionais).
   */
  right?: React.ReactNode;
  className?: string;
  leftWrapClassName?: string;
  rightWrapClassName?: string;
  /**
   * Define se a área esquerda deve usar o estilo de pílulas (padrão do Estoque).
   */
  pillStyle?: boolean;
};

export const FilterBar: React.FC<FilterBarProps> = ({
  left,
  right,
  className,
  leftWrapClassName,
  rightWrapClassName,
  pillStyle = true,
}) => {
  return (
    <div className={cn('flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-none', className)}>
      {left ? (
        <div
          className={cn(
            'flex flex-wrap gap-2',
            pillStyle && 'bg-muted/50 border border-border rounded-lg p-1',
            leftWrapClassName,
          )}
        >
          {left}
        </div>
      ) : (
        <div />
      )}
      {right ? <div className={cn('w-full sm:w-auto', rightWrapClassName)}>{right}</div> : null}
    </div>
  );
};

export default FilterBar;
