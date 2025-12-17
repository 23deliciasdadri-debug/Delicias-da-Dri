/**
 * TransactionDialog.tsx
 * Modal para criar/editar transações financeiras
 */

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';

import { AppDialog } from '../../components/patterns/AppDialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

import { createTransaction, updateTransaction, deleteTransaction, type TransactionWithCategory, type TransactionInput } from '../../services/transactionsService';
import type { TransactionCategory, TransactionType } from '../../types';
import { useState } from 'react';

const transactionSchema = z.object({
    type: z.enum(['income', 'expense']),
    category_id: z.string().min(1, 'Selecione uma categoria'),
    amount: z.string().min(1, 'Informe o valor'),
    date: z.string().min(1, 'Informe a data'),
    description: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: TransactionWithCategory | null;
    categories: TransactionCategory[];
    onSuccess: () => void;
}

export function TransactionDialog({
    open,
    onOpenChange,
    transaction,
    categories,
    onSuccess,
}: TransactionDialogProps) {
    const isEditing = !!transaction;
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: 'expense',
            category_id: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
        },
    });

    const watchedType = form.watch('type');
    const filteredCategories = categories.filter(c => c.type === watchedType);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            if (transaction) {
                form.reset({
                    type: transaction.type,
                    category_id: transaction.category_id,
                    amount: transaction.amount.toString(),
                    date: transaction.date,
                    description: transaction.description || '',
                });
            } else {
                form.reset({
                    type: 'expense',
                    category_id: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                });
            }
        }
    }, [open, transaction, form]);

    // Reset category when type changes - using ref to track previous type
    const prevTypeRef = useRef(watchedType);
    useEffect(() => {
        // Only reset if type actually changed (not on initial render)
        if (prevTypeRef.current !== watchedType) {
            prevTypeRef.current = watchedType;
            const currentCategoryId = form.getValues('category_id');
            const categoryBelongsToType = categories.some(
                c => c.id === currentCategoryId && c.type === watchedType
            );
            if (!categoryBelongsToType && currentCategoryId) {
                form.setValue('category_id', '');
            }
        }
    }, [watchedType, categories, form]);

    const handleSubmit = form.handleSubmit(async (values) => {
        setIsLoading(true);
        try {
            const input: TransactionInput = {
                type: values.type as TransactionType,
                category_id: values.category_id,
                amount: parseFloat(values.amount.replace(',', '.')),
                date: values.date,
                description: values.description,
            };

            if (isEditing && transaction) {
                await updateTransaction(transaction.id, input);
            } else {
                await createTransaction(input);
            }
            onSuccess();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    });

    const handleDelete = async () => {
        if (!transaction) return;
        if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

        setIsLoading(true);
        try {
            await deleteTransaction(transaction.id);
            onSuccess();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? 'Editar Transação' : 'Nova Transação'}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                {/* Tipo */}
                <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                        value={form.watch('type')}
                        onValueChange={(v) => form.setValue('type', v as 'income' | 'expense')}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="expense">Despesa (Saída)</SelectItem>
                            <SelectItem value="income">Receita (Entrada)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                        value={form.watch('category_id')}
                        onValueChange={(v) => form.setValue('category_id', v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.category_id && (
                        <p className="text-xs text-destructive">{form.formState.errors.category_id.message}</p>
                    )}
                </div>

                {/* Valor */}
                <div className="space-y-2">
                    <Label>Valor</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                        <Input
                            {...form.register('amount')}
                            placeholder="0,00"
                            className="pl-10"
                        />
                    </div>
                    {form.formState.errors.amount && (
                        <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
                    )}
                </div>

                {/* Data */}
                <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                        type="date"
                        {...form.register('date')}
                    />
                    {form.formState.errors.date && (
                        <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
                    )}
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                        {...form.register('description')}
                        placeholder="Descreva a transação..."
                        rows={2}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                    {isEditing ? (
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                        </Button>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {isEditing ? 'Salvar' : 'Criar'}
                        </Button>
                    </div>
                </div>
            </form>
        </AppDialog>
    );
}
