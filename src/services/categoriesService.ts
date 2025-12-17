/**
 * categoriesService.ts
 * CRUD para categorias de transações financeiras
 */

import { supabase } from '../lib/supabaseClient';
import type { TransactionCategory, TransactionType } from '../types';

export interface CategoryInput {
    name: string;
    type: TransactionType;
}

/**
 * Lista todas as categorias (padrão + do usuário)
 */
export async function listCategories(): Promise<TransactionCategory[]> {
    const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

    if (error) {
        throw new Error(`Erro ao carregar categorias: ${error.message}`);
    }

    return data ?? [];
}

/**
 * Lista categorias por tipo
 */
export async function listCategoriesByType(type: TransactionType): Promise<TransactionCategory[]> {
    const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')
        .eq('type', type)
        .order('is_default', { ascending: false })
        .order('name');

    if (error) {
        throw new Error(`Erro ao carregar categorias: ${error.message}`);
    }

    return data ?? [];
}

/**
 * Cria uma nova categoria customizada
 */
export async function createCategory(input: CategoryInput): Promise<TransactionCategory> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
        .from('transaction_categories')
        .insert({
            user_id: user.id,
            name: input.name.trim(),
            type: input.type,
            is_default: false,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Erro ao criar categoria: ${error.message}`);
    }

    return data;
}

/**
 * Exclui uma categoria customizada (não padrão)
 */
export async function deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
        .from('transaction_categories')
        .delete()
        .eq('id', id)
        .eq('is_default', false); // Segurança: nunca deletar padrão

    if (error) {
        throw new Error(`Erro ao excluir categoria: ${error.message}`);
    }
}
