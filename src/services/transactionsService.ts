/**
 * transactionsService.ts
 * CRUD para transações financeiras do fluxo de caixa
 */

import { supabase } from '../lib/supabaseClient';
import type { Transaction, TransactionType } from '../types';

export interface TransactionInput {
    category_id: string;
    type: TransactionType;
    description?: string;
    amount: number;
    date: string;
}

export interface TransactionFilters {
    startDate?: string;
    endDate?: string;
    type?: TransactionType;
    categoryId?: string;
}

export interface TransactionWithCategory {
    id: string;
    user_id: string;
    category_id: string;
    type: TransactionType;
    description: string | null;
    amount: number;
    date: string;
    created_at?: string;
    updated_at?: string;
    category: {
        id: string;
        name: string;
        type: TransactionType;
    };
}

/**
 * Lista transações com filtros opcionais
 */
export async function listTransactions(filters?: TransactionFilters): Promise<TransactionWithCategory[]> {
    let query = supabase
        .from('transactions')
        .select(`
      *,
      category:transaction_categories (
        id,
        name,
        type
      )
    `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

    if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
    }
    if (filters?.type) {
        query = query.eq('type', filters.type);
    }
    if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Erro ao carregar transações: ${error.message}`);
    }

    return (data ?? []) as TransactionWithCategory[];
}

/**
 * Cria uma nova transação
 */
export async function createTransaction(input: TransactionInput): Promise<Transaction> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
        .from('transactions')
        .insert({
            user_id: user.id,
            category_id: input.category_id,
            type: input.type,
            description: input.description?.trim() || null,
            amount: input.amount,
            date: input.date,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Erro ao criar transação: ${error.message}`);
    }

    return data;
}

/**
 * Atualiza uma transação existente
 */
export async function updateTransaction(id: string, input: Partial<TransactionInput>): Promise<Transaction> {
    const { data, error } = await supabase
        .from('transactions')
        .update({
            ...(input.category_id && { category_id: input.category_id }),
            ...(input.type && { type: input.type }),
            ...(input.description !== undefined && { description: input.description?.trim() || null }),
            ...(input.amount && { amount: input.amount }),
            ...(input.date && { date: input.date }),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new Error(`Erro ao atualizar transação: ${error.message}`);
    }

    return data;
}

/**
 * Exclui uma transação
 */
export async function deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(`Erro ao excluir transação: ${error.message}`);
    }
}

/**
 * Obtém resumo financeiro
 */
export async function getFinancialSummary(startDate?: string, endDate?: string): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
}> {
    let query = supabase
        .from('transactions')
        .select('type, amount');

    if (startDate) {
        query = query.gte('date', startDate);
    }
    if (endDate) {
        query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Erro ao carregar resumo: ${error.message}`);
    }

    const transactions = data ?? [];
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + Number(t.amount), 0);
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + Number(t.amount), 0);

    return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
    };
}

/**
 * Cria uma transação de receita a partir de um pedido entregue
 */
export async function createTransactionFromOrder(
    orderId: string,
    amount: number,
    description?: string
): Promise<Transaction> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar categoria "Vendas" (padrão do sistema)
    const { data: salesCategory } = await supabase
        .from('transaction_categories')
        .select('id')
        .eq('name', 'Vendas')
        .eq('type', 'income')
        .single();

    if (!salesCategory) {
        throw new Error('Categoria "Vendas" não encontrada. Execute a migration do fluxo de caixa.');
    }

    // Criar transação
    const { data, error } = await supabase
        .from('transactions')
        .insert({
            user_id: user.id,
            category_id: salesCategory.id,
            type: 'income',
            description: description || `Pedido #${orderId.slice(0, 8)}`,
            amount,
            date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Erro ao criar transação: ${error.message}`);
    }

    return data;
}
