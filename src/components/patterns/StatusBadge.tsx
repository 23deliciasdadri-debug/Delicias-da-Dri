import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '../ui/dropdown-menu';
import type { StatusOption } from '../../constants/status';

interface StatusBadgeProps {
  status: string;
  options: StatusOption[];
  className?: string;
}

export function StatusBadge({ status, options, className }: StatusBadgeProps) {
  const option = options.find((o) => o.value === status);
  return (
    <Badge className={`${option?.className ?? ''} border-0 ${className ?? ''}`}>
      {option?.label ?? status}
    </Badge>
  );
}

interface StatusMenuProps {
  status: string;
  options: StatusOption[];
  onChange: (status: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function StatusMenu({ status, options, onChange, disabled, className, label = 'Alterar status' }: StatusMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`px-2 py-1 h-8 ${className ?? ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <StatusBadge status={status} options={options} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            disabled={disabled}
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(opt.value);
            }}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
