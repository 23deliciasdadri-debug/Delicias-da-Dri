/**
 * Helpers para manipulação de mídia de Produtos
 * Extração de ProductsPage.tsx para reutilização
 */

import type { ProductType } from '../../../types';

/**
 * Tipos para filtros de produtos
 */
export type ProductTypeFilter = 'ALL' | ProductType;
export type ComponentCategoryFilter = 'ALL' | string;

/**
 * Interface para item de mídia em modo rascunho (antes de salvar)
 */
export interface MediaDraftItem {
    id: string;
    mediaId?: number;
    storagePath?: string;
    url: string;
    file?: File;
    status?: 'idle' | 'pending' | 'uploading' | 'error';
}

/**
 * Gera um ID local único para itens de mídia temporários
 */
export const createLocalId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2, 10);
};

/**
 * Libera URL de objeto blob quando não mais necessária
 * Importante para evitar memory leaks
 */
export const releaseObjectUrl = (url?: string): void => {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};

/**
 * Converte string de preço para número
 * Aceita formatos: "100", "100.50", "100,50"
 * @example parsePriceInput('100,50') => 100.5
 */
export const parsePriceInput = (value: string): number => {
    if (!value) return 0;
    const normalized = Number(value.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(normalized) ? normalized : 0;
};
