/**
 * CategoryDialog.tsx
 * Modal para gerenciar categorias de transações
 */

import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';

import { AppDialog } from '../../components/patterns/AppDialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';

import { useToast } from '../../hooks/useToast';
import { createCategory, deleteCategory } from '../../services/categoriesService';
import type { TransactionCategory, TransactionType } from '../../types';

interface CategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: TransactionCategory[];
    onSuccess: () => void;
}

export function CategoryDialog({
    open,
    onOpenChange,
    categories,
    onSuccess,
}: CategoryDialogProps) {
    const { toast } = useToast();
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<TransactionType>('expense');
    const [isLoading, setIsLoading] = useState(false);

    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');

    const handleCreate = async () => {
        if (!newName.trim()) {
            toast({ title: 'Erro', description: 'Informe o nome da categoria', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            await createCategory({ name: newName.trim(), type: newType });
            setNewName('');
            toast({ title: 'Categoria criada', description: 'A categoria foi adicionada.' });
            onSuccess();
        } catch (err) {
            console.error(err);
            toast({ title: 'Erro', description: 'Não foi possível criar a categoria.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta categoria?')) return;

        setIsLoading(true);
        try {
            await deleteCategory(id);
            toast({ title: 'Categoria excluída', description: 'A categoria foi removida.' });
            onSuccess();
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível excluir. Verifique se há transações vinculadas.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Gerenciar Categorias"
            size="md"
        >
            <div className="space-y-6 py-4">
                {/* Add Category Form */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Adicionar Nova Categoria</Label>
                    <div className="flex gap-2">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Nome da categoria"
                            className="flex-1"
                        />
                        <Select value={newType} onValueChange={(v) => setNewType(v as TransactionType)}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Despesa</SelectItem>
                                <SelectItem value="income">Receita</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleCreate} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Expense Categories */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium text-rose-600">Despesas</Label>
                    <div className="space-y-2">
                        {expenseCategories.map((cat) => (
                            <div
                                key={cat.id}
                                className="flex items-center justify-between p-2 rounded-lg border border-border"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{cat.name}</span>
                                    {cat.is_default && (
                                        <Badge variant="secondary" className="text-xs">Padrão</Badge>
                                    )}
                                </div>
                                {!cat.is_default && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(cat.id)}
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Income Categories */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium text-emerald-600">Receitas</Label>
                    <div className="space-y-2">
                        {incomeCategories.map((cat) => (
                            <div
                                key={cat.id}
                                className="flex items-center justify-between p-2 rounded-lg border border-border"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{cat.name}</span>
                                    {cat.is_default && (
                                        <Badge variant="secondary" className="text-xs">Padrão</Badge>
                                    )}
                                </div>
                                {!cat.is_default && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(cat.id)}
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Close */}
                <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                </div>
            </div>
        </AppDialog>
    );
}
