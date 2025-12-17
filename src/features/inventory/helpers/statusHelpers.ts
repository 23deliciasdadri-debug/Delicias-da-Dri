/**
 * Helpers para status e categorias de Inventário
 * Extração de InventoryPage.tsx para reutilização
 */

import { Package, ShoppingCart, Hammer, Archive, HardHat } from 'lucide-react';
import type { InventoryItem } from '../../../types';
import type { InventoryItemInput } from '../../../services/inventoryService';

/**
 * Categorias disponíveis para itens de inventário
 */
export const INVENTORY_CATEGORIES = [
    { id: 'all', label: 'Todos', icon: Package },
    { id: 'mercado', label: 'Mercado', icon: ShoppingCart },
    { id: 'ferramentas', label: 'Ferramentas', icon: Hammer },
    { id: 'embalagens', label: 'Embalagens', icon: Archive },
    { id: 'epis', label: 'EPIs', icon: HardHat },
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number]['id'];

/**
 * Formulário padrão para novo item de inventário
 */
export const DEFAULT_INVENTORY_FORM: InventoryItemInput = {
    id: undefined,
    name: '',
    quantity: 0,
    unit: 'un',
    min_stock: 0,
    category: 'mercado',
    status: null,
    location: '',
    notes: '',
};

/**
 * Deriva o status de um item baseado na quantidade vs estoque mínimo
 * - critical: quantidade <= 0 ou <= 50% do mínimo
 * - low: quantidade <= mínimo
 * - ok: quantidade > mínimo
 */
export function deriveStatus(item: InventoryItem): 'critical' | 'low' | 'ok' {
    const qty = Number(item.quantity ?? 0);
    const min = Number(item.min_stock ?? 0);

    // Se já tem status manual definido, retorna
    if (item.status) return item.status as 'critical' | 'low' | 'ok';

    // Deriva automaticamente baseado na quantidade
    if (qty <= 0 || qty <= min * 0.5) return 'critical';
    if (qty <= min) return 'low';
    return 'ok';
}

/**
 * Obtém a cor CSS para cada status
 */
export function getStatusColor(status: string): string {
    switch (status) {
        case 'critical':
            return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
        case 'low':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
        case 'ok':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
}
