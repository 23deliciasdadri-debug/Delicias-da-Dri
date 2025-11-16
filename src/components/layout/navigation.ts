import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Package,
  Users2,
} from 'lucide-react';

export type Page =
  | 'login'
  | 'dashboard'
  | 'orders'
  | 'budgets'
  | 'create-budget'
  | 'products'
  | 'clients';

export interface PageMeta {
  label: string;
  shortLabel?: string;
  icon?: LucideIcon;
}

export const PAGE_META: Record<Page, PageMeta> = {
  login: { label: 'Login' },
  dashboard: { label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  orders: { label: 'Pedidos', shortLabel: 'Pedidos', icon: ClipboardList },
  budgets: { label: 'Orçamentos', shortLabel: 'Orç.', icon: FileText },
  'create-budget': { label: 'Novo Orçamento', shortLabel: 'Novo Orçamento', icon: FilePlus2 },
  products: { label: 'Produtos', shortLabel: 'Produtos', icon: Package },
  clients: { label: 'Clientes', shortLabel: 'Clientes', icon: Users2 },
};

export const PRIMARY_NAV_PAGES: Page[] = ['dashboard', 'orders', 'budgets', 'products', 'clients'];

export const PRIMARY_NAV_ITEMS = PRIMARY_NAV_PAGES.map((page) => {
  const meta = PAGE_META[page];
  if (!meta.icon) {
    throw new Error(`Página ${page} não possui ícone para navegação principal.`);
  }
  return {
    page,
    label: meta.label,
    shortLabel: meta.shortLabel ?? meta.label,
    icon: meta.icon,
  };
});
