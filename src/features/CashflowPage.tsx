/**
 * CashflowPage.tsx
 * Página de Fluxo de Caixa - Gestão de receitas e despesas
 */

import { useState, useCallback, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, Wallet, Filter, Settings2, ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { PageHeader } from '../components/patterns/PageHeader';
import { PaginatedList } from '../components/patterns/PaginatedList';

import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useToast } from '../hooks/useToast';
import { listTransactions, getFinancialSummary, type TransactionWithCategory } from '../services/transactionsService';
import { listCategories } from '../services/categoriesService';
import { formatCurrency } from '../utils/formatters';
import { formatLocalDate } from '../utils/dateHelpers';

import { TransactionDialog } from './cashflow/TransactionDialog';
import { CategoryDialog } from './cashflow/CategoryDialog';

import type { TransactionType, TransactionCategory } from '../types';

const TRANSACTIONS_PAGE_SIZE = 15;

export default function CashflowPage() {
    const { toast } = useToast();

    // State
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
    const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [page, setPage] = useState(1);

    // Queries
    const fetchTransactions = useCallback(async () => {
        const allTransactions = await listTransactions({
            type: filterType === 'all' ? undefined : filterType,
            categoryId: filterCategory === 'all' ? undefined : filterCategory,
            startDate: filterStartDate || undefined,
            endDate: filterEndDate || undefined,
        });
        // Calcular paginação cliente-side (o serviço não suporta ainda)
        const total = allTransactions.length;
        const start = (page - 1) * TRANSACTIONS_PAGE_SIZE;
        const items = allTransactions.slice(start, start + TRANSACTIONS_PAGE_SIZE);
        return { items, total };
    }, [filterType, filterCategory, filterStartDate, filterEndDate, page]);

    const { data: transactionsData, isLoading, refetch } = useSupabaseQuery(fetchTransactions, {
        deps: [fetchTransactions],
        initialData: { items: [], total: 0 },
    });

    const transactions = transactionsData?.items ?? [];
    const totalItems = transactionsData?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / TRANSACTIONS_PAGE_SIZE));

    const fetchSummary = useCallback(() => {
        return getFinancialSummary(filterStartDate || undefined, filterEndDate || undefined);
    }, [filterStartDate, filterEndDate]);

    const { data: summary } = useSupabaseQuery(fetchSummary, {
        deps: [fetchSummary],
        initialData: { totalIncome: 0, totalExpense: 0, balance: 0 },
    });

    const fetchCategories = useCallback(() => listCategories(), []);
    const { data: categories } = useSupabaseQuery(fetchCategories, {
        deps: [],
        initialData: [],
    });

    // Grouped categories
    const incomeCategories = useMemo(() =>
        categories.filter((c: TransactionCategory) => c.type === 'income'), [categories]);
    const expenseCategories = useMemo(() =>
        categories.filter((c: TransactionCategory) => c.type === 'expense'), [categories]);

    // Handlers
    const handleAddTransaction = () => {
        setEditingTransaction(null);
        setIsTransactionDialogOpen(true);
    };

    const handleEditTransaction = (transaction: TransactionWithCategory) => {
        setEditingTransaction(transaction);
        setIsTransactionDialogOpen(true);
    };

    const handleTransactionSuccess = () => {
        setIsTransactionDialogOpen(false);
        setEditingTransaction(null);
        refetch();
        toast({ title: 'Transação salva', description: 'Operação realizada com sucesso.' });
    };

    const handleCategorySuccess = () => {
        refetch();
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Fluxo de Caixa"
                description="Gerencie suas receitas e despesas"
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
                            <Settings2 className="h-4 w-4 mr-2" />
                            Categorias
                        </Button>
                        <Button onClick={handleAddTransaction}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Transação
                        </Button>
                    </div>
                }
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Entradas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(summary.totalIncome)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Saídas</CardTitle>
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">
                            {formatCurrency(summary.totalExpense)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                            {formatCurrency(summary.balance)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={filterType} onValueChange={(v) => { setFilterType(v as TransactionType | 'all'); setPage(1); }}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="income">Entradas</SelectItem>
                                <SelectItem value="expense">Saídas</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas categorias</SelectItem>
                                <Separator className="my-1" />
                                {expenseCategories.length > 0 && (
                                    <>
                                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Despesas</div>
                                        {expenseCategories.map((cat: TransactionCategory) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </>
                                )}
                                {incomeCategories.length > 0 && (
                                    <>
                                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Receitas</div>
                                        {incomeCategories.map((cat: TransactionCategory) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </>
                                )}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Input
                                type="date"
                                value={filterStartDate}
                                onChange={(e) => { setFilterStartDate(e.target.value); setPage(1); }}
                                className="w-[140px]"
                                placeholder="Data inicial"
                            />
                            <span className="text-muted-foreground">até</span>
                            <Input
                                type="date"
                                value={filterEndDate}
                                onChange={(e) => { setFilterEndDate(e.target.value); setPage(1); }}
                                className="w-[140px]"
                                placeholder="Data final"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions List */}
            <Card>
                <CardHeader>
                    <CardTitle>Transações</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhuma transação encontrada. Clique em "Nova Transação" para começar.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {transactions.map((transaction: TransactionWithCategory) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => handleEditTransaction(transaction)}
                                >
                                    <div className="flex items-center gap-3">
                                        {transaction.type === 'income' ? (
                                            <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            <ArrowDownCircle className="h-5 w-5 text-rose-500" />
                                        )}
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {transaction.description || transaction.category?.name}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Badge variant="outline" className="text-xs">
                                                    {transaction.category?.name}
                                                </Badge>
                                                <span>{formatLocalDate(transaction.date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-lg font-semibold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                {totalItems > 0 && (
                    <div className="p-4 border-t border-border">
                        <PaginatedList
                            page={page}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={TRANSACTIONS_PAGE_SIZE}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </Card>

            {/* Dialogs */}
            <TransactionDialog
                open={isTransactionDialogOpen}
                onOpenChange={setIsTransactionDialogOpen}
                transaction={editingTransaction}
                categories={categories}
                onSuccess={handleTransactionSuccess}
            />

            <CategoryDialog
                open={isCategoryDialogOpen}
                onOpenChange={setIsCategoryDialogOpen}
                categories={categories}
                onSuccess={handleCategorySuccess}
            />
        </div>
    );
}

