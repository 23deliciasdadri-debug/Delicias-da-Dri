import type { QuoteStatus, OrderStatus } from '../types';

export type StatusOption = {
  value: string;
  label: string;
  className: string;
};

export const QUOTE_STATUS_OPTIONS: StatusOption[] = [
  { value: 'Pendente', label: 'Pendente', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-0' },
  { value: 'Aprovado', label: 'Aprovado', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0' },
  { value: 'Recusado', label: 'Recusado', className: 'bg-rose-100 text-rose-700 hover:bg-rose-100 border-0' },
];

export const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: 'Aprovado', label: 'Aprovado', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'Em Produção', label: 'Em Produção', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'Pronto para Entrega', label: 'Pronto para Entrega', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: 'Em Entrega', label: 'Em Entrega', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { value: 'Entregue', label: 'Entregue', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'Cancelado', label: 'Cancelado', className: 'bg-rose-100 text-rose-700 border-rose-200' },
];

export const INVENTORY_STATUS_OPTIONS: StatusOption[] = [
  { value: 'ok', label: 'Em dia', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'low', label: 'Baixo', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'critical', label: 'Crítico', className: 'bg-rose-100 text-rose-700 border-rose-200' },
];

export const QUOTE_STATUSES = QUOTE_STATUS_OPTIONS.map((o) => o.value) as QuoteStatus[];
export const ORDER_STATUSES = ORDER_STATUS_OPTIONS.map((o) => o.value) as OrderStatus[];
