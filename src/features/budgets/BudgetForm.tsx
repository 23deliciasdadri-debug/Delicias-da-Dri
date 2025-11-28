import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Share2,
  Calendar as CalendarIcon
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Separator } from '../../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../../hooks/useSupabaseMutation';
import { useToast } from '../../hooks/use-toast';
import { listClients } from '../../services/clientsService';
import { listProducts } from '../../services/productsService';
import {
  createQuoteWithItems,
  updateQuoteWithItems,
  type QuoteDetails,
  type QuoteInsertInput,
  type QuoteItemDraft,
} from '../../services/quotesService';

export type BudgetFormMode = 'create' | 'edit';

const budgetItemSchema = z.object({
  id: z.string(),
  productId: z.string().optional().nullable(),
  productName: z.string().min(1, 'Informe o nome do item.'),
  quantity: z.number().min(1, 'Quantidade mínima: 1'),
  unitPrice: z.number().min(0.01, 'Valor deve ser maior que zero.'),
});

const budgetFormSchema = z.object({
  client_id: z.string().min(1, 'Selecione um cliente.'),
  event_type: z.string().optional(),
  event_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(budgetItemSchema).min(1, 'Adicione pelo menos um item.'),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

const createEmptyItem = (): BudgetFormValues['items'][number] => ({
  id: Math.random().toString(36).slice(2, 10),
  productId: '',
  productName: '',
  quantity: 1,
  unitPrice: 0,
});

const mapQuoteToFormValues = (quote?: QuoteDetails | null): BudgetFormValues => ({
  client_id: quote?.client_id ?? '',
  event_type: quote?.event_type ?? '',
  event_date: quote?.event_date ? new Date(quote.event_date).toISOString().split('T')[0] : '',
  notes: quote?.notes ?? '',
  items: (quote?.items ?? []).map((item) => ({
    id: String(item.id ?? Math.random().toString(36).slice(2, 10)),
    productId: item.product_id ?? '',
    productName: item.product_name_copy ?? '',
    quantity: Number(item.quantity ?? 1),
    unitPrice: Number(item.price_at_creation ?? 0),
  })),
});

interface BudgetFormProps {
  mode?: BudgetFormMode;
  quote?: QuoteDetails | null;
  isFetchingQuote?: boolean;
  onBack?: () => void;
  onSuccess?: (payload: { quoteId: string; mode: BudgetFormMode }) => void;
  title?: string;
  subtitle?: string;
}

const BudgetForm: React.FC<BudgetFormProps> = ({
  mode = 'create',
  quote,
  isFetchingQuote = false,
  onBack,
  onSuccess,
  title,
  subtitle,
}) => {
  const { toast } = useToast();

  const fetchClients = useCallback(() => listClients({ pageSize: 1000 }), []);
  const {
    data: clientsData,
    isLoading: isLoadingClients,
    error: clientsError,
  } = useSupabaseQuery(fetchClients, {
    deps: [fetchClients],
    initialData: { items: [], total: 0 },
  });

  const fetchProducts = useCallback(() => listProducts({ pageSize: 500 }), []);
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useSupabaseQuery(fetchProducts, {
    deps: [fetchProducts],
    initialData: { items: [], total: 0 },
  });

  const createQuoteMutation = useSupabaseMutation(
    ({ quote: quotePayload, quoteItems }: { quote: QuoteInsertInput; quoteItems: QuoteItemDraft[] }) =>
      createQuoteWithItems(quotePayload, quoteItems),
  );

  const updateQuoteMutation = useSupabaseMutation(
    ({
      quoteId,
      quote: quotePayload,
      quoteItems,
    }: {
      quoteId: string;
      quote: QuoteInsertInput;
      quoteItems: QuoteItemDraft[];
    }) => updateQuoteWithItems(quoteId, quotePayload, quoteItems),
  );

  const budgetForm = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: mapQuoteToFormValues(mode === 'edit' ? quote : undefined),
  });

  useEffect(() => {
    if (mode === 'edit' && quote) {
      // Only reset if the quote ID or updated_at changes to avoid loops
      budgetForm.reset(mapQuoteToFormValues(quote));
    }
  }, [mode, quote?.id, quote?.updated_at]); // Removed budgetForm from deps to be safe, though it's stable

  const { fields, append, remove } = useFieldArray({
    control: budgetForm.control,
    name: 'items',
  });
  const [addCount, setAddCount] = useState<number>(1);

  const watchedItems = useWatch<BudgetFormValues, 'items'>({
    control: budgetForm.control,
    name: 'items',
  });

  const allClients = clientsData?.items ?? [];
  const allProducts = productsData?.items ?? [];
  const isLoadingOptions = isLoadingClients || isLoadingProducts;

  const totalAmount = useMemo(
    () =>
      watchedItems.reduce(
        (acc, item) => acc + Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0,
      ),
    [watchedItems],
  );

  const handleAddItem = (count = 1) => {
    const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
    const payload = Array.from({ length: safeCount }, () => createEmptyItem());
    append(payload);
  };

  const handleRemoveItem = (index: number) => {
    remove(index);
  };

  const handleProductSelect = (index: number, productId: string) => {
    budgetForm.setValue(`items.${index}.productId`, productId || '', { shouldDirty: true });
    const product = allProducts.find((candidate) => candidate.id === productId);
    if (product?.name) {
      budgetForm.setValue(`items.${index}.productName`, product.name, { shouldDirty: true });
    }
    if (typeof product?.price === 'number') {
      budgetForm.setValue(`items.${index}.unitPrice`, product.price, { shouldDirty: true });
    }
  };

  const activeMutation = mode === 'edit' ? updateQuoteMutation : createQuoteMutation;

  const handleSubmitBudget = budgetForm.handleSubmit(async (values) => {
    const currentStatus = mode === 'edit' ? quote?.status ?? 'Pendente' : 'Pendente';
    const quotePayload: QuoteInsertInput = {
      client_id: values.client_id,
      status: currentStatus,
      event_type: values.event_type?.trim() || null,
      event_date: values.event_date || null,
      total_amount: Number(totalAmount.toFixed(2)),
      notes: values.notes?.trim() || null,
    };

    const quoteItemsPayload: QuoteItemDraft[] = values.items.map((item) => ({
      product_id: item.productId || null,
      product_name_copy: item.productName.trim(),
      quantity: item.quantity,
      price_at_creation: item.unitPrice,
    }));

    const result =
      mode === 'edit'
        ? await updateQuoteMutation.mutate({
          quoteId: quote?.id ?? '',
          quote: quotePayload,
          quoteItems: quoteItemsPayload,
        })
        : await createQuoteMutation.mutate({
          quote: quotePayload,
          quoteItems: quoteItemsPayload,
        });

    if (!result) return;

    toast({
      title: mode === 'edit' ? 'Orçamento atualizado' : 'Orçamento criado',
      description: mode === 'edit' ? 'Alterações salvas com sucesso.' : 'Novo orçamento gerado com sucesso.',
    });

    if (mode === 'create') {
      budgetForm.reset({
        client_id: '',
        event_type: '',
        event_date: '',
        notes: '',
        items: [createEmptyItem()],
      });
    } else {
      budgetForm.reset(values);
    }

    onSuccess?.({ quoteId: result.id, mode });
  });

  if (mode === 'edit' && isFetchingQuote) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-rose-500" />
        <p>Carregando informações...</p>
      </div>
    );
  }

  if (mode === 'edit' && !quote) {
    return (
      <Alert>
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>Orçamento não encontrado.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="fade-in pb-20">
      {/* Header */}
      <div className="flex items-center mb-8">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title || (mode === 'edit' ? 'Editar Orçamento' : 'Novo Orçamento')}</h1>
          <p className="text-muted-foreground">{subtitle || (mode === 'edit' ? 'Atualize os dados da proposta.' : 'Preencha os dados para gerar uma nova proposta.')}</p>
        </div>
      </div>

      <FormProvider {...budgetForm}>
        <form onSubmit={handleSubmitBudget} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Client & Event Details */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    {clientsError ? (
                      <p className="text-sm text-red-500">Erro ao carregar clientes</p>
                    ) : (
                      <Select
                        value={budgetForm.watch('client_id')}
                        onValueChange={(val) => budgetForm.setValue('client_id', val, { shouldDirty: true })}
                        disabled={isLoadingClients}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {allClients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {budgetForm.formState.errors.client_id && (
                      <p className="text-xs text-red-500">{budgetForm.formState.errors.client_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Evento</Label>
                    <Input {...budgetForm.register('event_type')} placeholder="Ex: Aniversário, Casamento..." />
                  </div>

                  <div className="space-y-2">
                    <Label>Data do Evento</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input {...budgetForm.register('event_date')} type="date" className="pl-10" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    {...budgetForm.register('notes')}
                    placeholder="Detalhes importantes, restrições alimentares, referências..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Items Builder */}
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Itens da Proposta</CardTitle>
              </CardHeader>
              <CardContent>
                {productsError && <p className="text-sm text-red-500 mb-4">Erro ao carregar produtos</p>}

                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const currentItem = watchedItems[index];
                    const lineTotal = (currentItem?.quantity || 0) * (currentItem?.unitPrice || 0);

                    return (
                      <div key={field.id} className="grid grid-cols-12 gap-3 items-end p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-colors">
                        <div className="col-span-12 md:col-span-5 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Produto</Label>
                          <Select
                            value={currentItem?.productId || 'custom'}
                            onValueChange={(val) => handleProductSelect(index, val === 'custom' ? '' : val)}
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">Personalizado</SelectItem>
                              {allProducts.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {/* Hidden input for custom name if needed, or just use the name field below */}
                          <Input
                            {...budgetForm.register(`items.${index}.productName`)}
                            placeholder="Nome do item"
                            className="mt-1 bg-card"
                          />
                        </div>

                        <div className="col-span-4 md:col-span-2 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Qtd</Label>
                          <Input
                            type="number"
                            min="1"
                            {...budgetForm.register(`items.${index}.quantity`, { valueAsNumber: true })}
                            className="bg-card"
                          />
                        </div>

                        <div className="col-span-4 md:col-span-2 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Valor Un.</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...budgetForm.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            className="bg-card"
                          />
                        </div>

                        <div className="col-span-3 md:col-span-2 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Subtotal</Label>
                          <div className="h-10 flex items-center font-medium text-foreground">
                            {lineTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>

                        <div className="col-span-1 flex justify-end pb-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {budgetForm.formState.errors.items && (
                  <p className="text-sm text-red-500 mt-4">{budgetForm.formState.errors.items.message}</p>
                )}
                <div className="mt-6 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Quantidade</Label>
                    <Input
                      type="number"
                      min={1}
                      value={addCount}
                      onChange={(e) => setAddCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-24"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 border-dashed"
                    disabled={isLoadingOptions}
                    onClick={() => handleAddItem(addCount)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {addCount > 1 ? `Adicionar ${addCount} itens` : 'Adicionar Item'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <Card className="border-border shadow-md bg-card overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Resumo da Proposta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Itens adicionados</span>
                    <span className="font-medium">{fields.length}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Cliente</span>
                    <span className="font-medium truncate max-w-[150px]">
                      {allClients.find(c => c.id === budgetForm.watch('client_id'))?.name || '-'}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-end pt-2">
                    <span className="font-semibold text-foreground">Total Estimado</span>
                    <span className="text-2xl font-bold text-foreground">
                      {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  {activeMutation.error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>{activeMutation.error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 bg-muted/50 p-6">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 h-11 text-lg text-primary-foreground"
                    disabled={activeMutation.isMutating || isLoadingOptions}
                  >
                    {activeMutation.isMutating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {mode === 'edit' ? 'Salvar Alterações' : 'Salvar Orçamento'}
                  </Button>
                  {mode === 'edit' && (
                    <Button type="button" variant="outline" className="w-full border-border text-foreground hover:bg-muted/50">
                      <Share2 className="mr-2 h-4 w-4" />
                      Salvar e Compartilhar
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default BudgetForm;
