import React, { useCallback, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2, Calendar as CalendarIcon, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AppDialog } from '../../components/patterns/AppDialog';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../../hooks/useSupabaseMutation';
import { useToast } from '../../hooks/use-toast';
import { listClients } from '../../services/clientsService';
import { listProducts } from '../../services/productsService';
import { createManualOrder, updateManualOrder, type OrderWithDetails } from '../../services/ordersService';

const orderItemSchema = z.object({
    productId: z.string().optional(),
    productName: z.string().min(1, 'Informe o nome do item'),
    quantity: z.number().min(1, 'Qtd mínima: 1'),
    unitPrice: z.number().min(0, 'Valor deve ser positivo'),
});

const orderFormSchema = z.object({
    client_id: z.string().min(1, 'Selecione um cliente'),
    delivery_date: z.string().min(1, 'Selecione a data de entrega'),
    delivery_details: z.string().optional(),
    items: z.array(orderItemSchema).min(1, 'Adicione pelo menos um item'),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    orderToEdit?: OrderWithDetails | null;
}

export function OrderFormDialog({ open, onOpenChange, onSuccess, orderToEdit }: OrderFormDialogProps) {
    const { toast } = useToast();
    const isEditing = !!orderToEdit;

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderFormSchema),
        defaultValues: {
            client_id: '',
            delivery_date: '',
            delivery_details: '',
            items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
        },
    });

    useEffect(() => {
        if (open && orderToEdit) {
            form.reset({
                client_id: orderToEdit.client_id,
                delivery_date: orderToEdit.delivery_date,
                delivery_details: orderToEdit.delivery_details || '',
                items: orderToEdit.items.map(item => ({
                    productId: item.product_id || '',
                    productName: item.product_name_copy,
                    quantity: item.quantity,
                    unitPrice: item.price_at_creation,
                })),
            });
        } else if (open && !orderToEdit) {
            form.reset({
                client_id: '',
                delivery_date: '',
                delivery_details: '',
                items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
            });
        }
    }, [open, orderToEdit, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    const watchedItems = useWatch({ control: form.control, name: 'items' });

    // Load Data
    const fetchClients = useCallback(() => listClients({ pageSize: 1000 }), []);
    const { data: clientsData, isLoading: isLoadingClients } = useSupabaseQuery(
        fetchClients,
        { initialData: { items: [], total: 0 } }
    );

    const fetchProducts = useCallback(() => listProducts({ pageSize: 500 }), []);
    const { data: productsData, isLoading: isLoadingProducts } = useSupabaseQuery(
        fetchProducts,
        { initialData: { items: [], total: 0 } }
    );

    const allClients = clientsData?.items ?? [];
    const allProducts = productsData?.items ?? [];

    // Mutation
    const createOrderMutation = useSupabaseMutation(createManualOrder, {
        onSuccess: () => {
            toast({ title: 'Pedido criado com sucesso!', description: 'O pedido foi adicionado à fila de produção.' });
            form.reset();
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => {
            const errorValue = err as unknown;
            const message = errorValue instanceof Error ? errorValue.message : String(errorValue);
            toast({ title: 'Erro ao criar pedido', description: message, variant: 'destructive' });
        }
    });

    const updateOrderMutation = useSupabaseMutation(updateManualOrder, {
        onSuccess: () => {
            toast({ title: 'Pedido atualizado com sucesso!', description: 'As alterações foram salvas.' });
            form.reset();
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => {
            const errorValue = err as unknown;
            const message = errorValue instanceof Error ? errorValue.message : String(errorValue);
            toast({ title: 'Erro ao atualizar pedido', description: message, variant: 'destructive' });
        }
    });

    const totalAmount = useMemo(() =>
        watchedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0),
        [watchedItems]
    );

    const handleProductSelect = (index: number, productId: string) => {
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            form.setValue(`items.${index}.productId`, productId);
            form.setValue(`items.${index}.productName`, product.name);
            form.setValue(`items.${index}.unitPrice`, product.price);
        } else {
            form.setValue(`items.${index}.productId`, '');
        }
    };

    const onSubmit = form.handleSubmit((values) => {
        const payload = {
            client_id: values.client_id,
            delivery_date: values.delivery_date,
            delivery_details: values.delivery_details,
            items: values.items.map(item => ({
                product_id: item.productId || null,
                product_name_copy: item.productName,
                quantity: item.quantity,
                price_at_creation: item.unitPrice
            }))
        };

        if (isEditing && orderToEdit) {
            updateOrderMutation.mutate({
                orderId: orderToEdit.id,
                quoteId: orderToEdit.quote_id,
                ...payload
            });
        } else {
            createOrderMutation.mutate(payload);
        }
    });

    const isMutating = createOrderMutation.isMutating || updateOrderMutation.isMutating;

    return (
        <AppDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? "Editar Pedido" : "Novo Pedido Manual"}
            description={isEditing ? "Atualize os detalhes do pedido." : "Crie um pedido diretamente, sem passar pelo fluxo de orçamento."}
            size="lg"
            trigger={null} // Controlled externally
        >
            <FormProvider {...form}>
                <form onSubmit={onSubmit} className="space-y-6 py-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Cliente</Label>
                            <Select
                                value={form.watch('client_id')}
                                onValueChange={(val) => form.setValue('client_id', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allClients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.client_id && (
                                <p className="text-xs text-red-500">{form.formState.errors.client_id.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Data de Entrega</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input type="date" className="pl-10" {...form.register('delivery_date')} />
                            </div>
                            {form.formState.errors.delivery_date && (
                                <p className="text-xs text-red-500">{form.formState.errors.delivery_date.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Detalhes da Entrega / Observações</Label>
                        <Textarea
                            placeholder="Endereço, horário, instruções..."
                            {...form.register('delivery_details')}
                        />
                    </div>

                    <div className="space-y-4 border rounded-lg p-4 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <Label className="text-base">Itens do Pedido</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', productName: '', quantity: 1, unitPrice: 0 })}>
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-5 space-y-1">
                                        <Label className="text-xs">Produto</Label>
                                        <Select
                                            value={form.watch(`items.${index}.productId`) || 'custom'}
                                            onValueChange={(val) => handleProductSelect(index, val === 'custom' ? '' : val)}
                                        >
                                            <SelectTrigger className="h-9 bg-white">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="custom">Personalizado</SelectItem>
                                                {allProducts.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {/* If custom or just to show name */}
                                        <Input
                                            className="h-9 bg-white mt-1"
                                            placeholder="Nome do item"
                                            {...form.register(`items.${index}.productName`)}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-xs">Qtd</Label>
                                        <Input type="number" min="1" className="h-9 bg-white" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} />
                                    </div>
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-xs">Valor Un.</Label>
                                        <Input type="number" step="0.01" className="h-9 bg-white" {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
                                    </div>
                                    <div className="col-span-2 pb-1">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-slate-400 hover:text-rose-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-lg font-semibold">
                            Total: {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white" disabled={isMutating}>
                                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" /> {isEditing ? 'Salvar Alterações' : 'Criar Pedido'}
                            </Button>
                        </div>
                    </div>

                </form>
            </FormProvider>
        </AppDialog>
    );
}
