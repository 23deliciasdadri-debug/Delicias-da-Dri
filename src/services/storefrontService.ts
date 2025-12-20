import { supabase } from '../lib/supabaseClient';
import type { Product } from '../types';

/**
 * Serviço para operações da vitrine pública.
 * Funções para listar produtos, favoritos e categorias.
 */

export interface StorefrontProduct extends Product {
    is_featured?: boolean;
    media?: { storage_path: string; sort_order: number }[];
}

/**
 * Lista produtos públicos (is_public = true)
 */
export async function listPublicProducts(options?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{ data: StorefrontProduct[]; count: number }> {
    let query = supabase
        .from('products')
        .select('*, product_media(storage_path, sort_order)', { count: 'exact' })
        .eq('is_public', true)
        .order('name');

    if (options?.category) {
        query = query.eq('component_category', options.category);
    }

    if (options?.search) {
        query = query.ilike('name', `%${options.search}%`);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        return { data: [], count: 0 };
    }

    // Mapear media
    const products = (data || []).map((p: any) => ({
        ...p,
        media: p.product_media || [],
    }));

    return { data: products, count: count || 0 };
}

/**
 * Lista produtos em destaque (is_featured = true)
 */
export async function listFeaturedProducts(limit = 6): Promise<StorefrontProduct[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*, product_media(storage_path, sort_order)')
        .eq('is_public', true)
        .eq('is_featured', true)
        .order('name')
        .limit(limit);

    if (error) {
        console.error('Erro ao buscar produtos destacados:', error);
        return [];
    }

    return (data || []).map((p: any) => ({
        ...p,
        media: p.product_media || [],
    }));
}

/**
 * Busca um produto pelo ID
 */
export async function getProductById(id: string): Promise<StorefrontProduct | null> {
    const { data, error } = await supabase
        .from('products')
        .select('*, product_media(storage_path, sort_order)')
        .eq('id', id)
        .eq('is_public', true)
        .maybeSingle();

    if (error || !data) {
        console.error('Erro ao buscar produto:', error);
        return null;
    }

    return {
        ...data,
        media: data.product_media || [],
    };
}

/**
 * Lista categorias únicas de produtos públicos
 */
export async function listCategories(): Promise<string[]> {
    const { data, error } = await supabase
        .from('products')
        .select('component_category')
        .eq('is_public', true)
        .not('component_category', 'is', null);

    if (error) {
        console.error('Erro ao buscar categorias:', error);
        return [];
    }

    // Extrair categorias únicas
    const categories = [...new Set(
        (data || [])
            .map((p: any) => p.component_category)
            .filter((c: any) => c && typeof c === 'string')
    )] as string[];

    return categories.sort();
}

/**
 * Adiciona ou remove um produto dos favoritos
 */
export async function toggleFavorite(
    clientId: string,
    productId: string
): Promise<{ isFavorite: boolean; error: string | null }> {
    // Verificar se já é favorito
    const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('client_id', clientId)
        .eq('product_id', productId)
        .maybeSingle();

    if (existing) {
        // Remover dos favoritos
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', existing.id);

        if (error) {
            return { isFavorite: true, error: error.message };
        }
        return { isFavorite: false, error: null };
    } else {
        // Adicionar aos favoritos
        const { error } = await supabase
            .from('favorites')
            .insert({ client_id: clientId, product_id: productId });

        if (error) {
            return { isFavorite: false, error: error.message };
        }
        return { isFavorite: true, error: null };
    }
}

/**
 * Lista favoritos do cliente logado
 */
export async function listFavorites(clientId: string): Promise<StorefrontProduct[]> {
    const { data, error } = await supabase
        .from('favorites')
        .select(`
      product_id,
      products:product_id (
        *,
        product_media(storage_path, sort_order)
      )
    `)
        .eq('client_id', clientId);

    if (error) {
        console.error('Erro ao buscar favoritos:', error);
        return [];
    }

    return (data || [])
        .map((f: any) => f.products)
        .filter((p: any) => p !== null)
        .map((p: any) => ({
            ...p,
            media: p.product_media || [],
        }));
}

/**
 * Verifica se um produto é favorito do cliente
 */
export async function isFavorite(clientId: string, productId: string): Promise<boolean> {
    const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('client_id', clientId)
        .eq('product_id', productId)
        .maybeSingle();

    return !!data;
}

/**
 * Gera URL pública para imagem do produto
 */
export function getProductImageUrl(storagePath: string): string {
    if (!storagePath) return '';

    const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(storagePath);

    return data?.publicUrl || '';
}

/**
 * Interface para item do pedido da vitrine
 */
export interface StorefrontOrderItem {
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    isCustomCake: boolean;
    cakeChoices?: {
        format: string;
        size: string;
        flavor: string;
        fillings: string[];
        covering: string;
        theme: string;
        color: string;
        message?: string;
        referenceImageUrl?: string;
    };
    generatedImageUrl?: string;
    notes?: string;
}

/**
 * Interface para criação de pedido da vitrine
 */
export interface CreateStorefrontOrderParams {
    clientId: string;
    items: StorefrontOrderItem[];
    totalAmount: number;
    notes?: string;
    deliveryDate?: string;
}

/**
 * Cria um pedido a partir da vitrine
 */
export async function createStorefrontOrder(
    params: CreateStorefrontOrderParams
): Promise<{ orderId: string | null; error: string | null }> {
    try {
        // Criar o pedido
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                client_id: params.clientId,
                status: 'Pendente',
                total_amount: params.totalAmount,
                notes: params.notes || null,
                delivery_date: params.deliveryDate || null,
                source: 'storefront',
                // Salvar items como JSONB
                items: params.items,
            })
            .select('id')
            .single();

        if (orderError) {
            console.error('Erro ao criar pedido:', orderError);
            return { orderId: null, error: 'Erro ao criar pedido. Tente novamente.' };
        }

        return { orderId: order.id, error: null };
    } catch (error) {
        console.error('Erro inesperado ao criar pedido:', error);
        return { orderId: null, error: 'Erro inesperado. Tente novamente.' };
    }
}

