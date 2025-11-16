import React, { useCallback, useEffect, useMemo } from 'react';
import { FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { FormField, FormSection } from '../../components/patterns';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
  quantity: z.number().min(1, 'Quantidade minima: 1'),
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
  event_date: quote?.event_date ?? '',
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

const DEFAULT_SUBTITLES: Record<BudgetFormMode, string> = {
  create: 'Preencha os dados do evento, selecione itens e gere uma proposta.',
  edit: 'Ajuste valores, itens e observacoes antes de reenviar ao cliente.',
};

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

  const resolvedTitle = title ?? (mode === 'edit' ? 'Editar Orcamento' : 'Criar Orcamento');
  const resolvedSubtitle = subtitle ?? DEFAULT_SUBTITLES[mode];

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
      budgetForm.reset(mapQuoteToFormValues(quote));
    }
  }, [budgetForm, mode, quote]);

  const { fields, append, remove } = useFieldArray({
    control: budgetForm.control,
    name: 'items',
  });

  const watchedItems = useWatch<BudgetFormValues, 'items'>({
    control: budgetForm.control,
    name: 'items',
  });
  const watchedClientId = useWatch<BudgetFormValues, 'client_id'>({
    control: budgetForm.control,
    name: 'client_id',
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

  const handleAddItem = () => append(createEmptyItem());

  const handleRemoveItem = (fieldId: string) => {
    const index = fields.findIndex((field) => field.id === fieldId);
    if (index >= 0) {
      remove(index);
    }
  };

  const handleProductSelect = (fieldId: string, productId: string) => {
    const index = fields.findIndex((field) => field.id === fieldId);
    if (index < 0) {
      return;
    }

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

    if (!result) {
      return;
    }

    toast({
      title: mode === 'edit' ? 'Orcamento atualizado' : 'Orcamento criado',
      description:
        mode === 'edit'
          ? 'As alteracoes foram salvas e ja estao disponiveis na lista.'
          : 'O orcamento foi salvo e ja aparece na listagem.',
    });

    if (mode === 'create') {
      budgetForm.reset({
        client_id: '',
        event_type: '',
        event_date: '',
        notes: '',
        items: [],
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
        <p>Carregando informacoes do orcamento...</p>
      </div>
    );
  }

  if (mode === 'edit' && !quote) {
    return (
      <Alert>
        <AlertTitle>Selecione um orcamento</AlertTitle>
        <AlertDescription>Escolha um registro para carregar os dados antes de editar.</AlertDescription>
      </Alert>
    );
  }

  return (
    <FormProvider {...budgetForm}>
      <form className="space-y-8" onSubmit={handleSubmitBudget}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              {mode === 'edit' ? 'Modo edicao' : 'Novo fluxo'}
            </p>
            <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
              {resolvedTitle}
            </h1>
            <p className="text-muted-foreground">{resolvedSubtitle}</p>
          </div>
          {onBack ? (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-11 px-6 border-2 hover:border-rose-500 hover:text-rose-600"
            >
              Voltar
            </Button>
          ) : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <FormSection title="Cliente" description="Selecione quem recebera o orcamento.">
              {clientsError ? (
                <Alert variant="destructive">
                  <AlertTitle>Erro ao carregar clientes</AlertTitle>
                  <AlertDescription>{clientsError}</AlertDescription>
                </Alert>
              ) : (
                <FormField
                  name="client_id"
                  label="Selecione o cliente"
                  required
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={isLoadingClients}
                      className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30 disabled:opacity-60"
                    >
                      <option value="">Selecione...</option>
                      {allClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} - {client.phone}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
            </FormSection>

            <FormSection title="Evento" description="Contexto e observacoes.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField name="event_type" label="Tipo de evento" render={({ field }) => <Input {...field} />} />
                <FormField
                  name="event_date"
                  label="Data do evento"
                  render={({ field }) => <Input {...field} type="date" />}
                />
              </div>
              <FormField
                name="notes"
                label="Observacoes"
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={4}
                    placeholder="Detalhes de entrega, restricoes, referencias..."
                    className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
                  />
                )}
              />
            </FormSection>

            <FormSection
              title="Itens do orcamento"
              description="Monte a proposta usando itens do catalogo ou personalizados."
              actions={
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 border-dashed"
                  onClick={handleAddItem}
                  disabled={isLoadingOptions}
                >
                  <Plus className="mr-2 size-4" />
                  Adicionar item
                </Button>
              }
            >
              {productsError ? (
                <Alert variant="destructive">
                  <AlertTitle>Erro ao carregar produtos</AlertTitle>
                  <AlertDescription>{productsError}</AlertDescription>
                </Alert>
              ) : null}

              {!fields.length ? (
                <div className="rounded-xl border-2 border-dashed border-rose-200 p-6 text-center text-muted-foreground">
                  Nenhum item adicionado. Clique em <span className="font-semibold">Adicionar item</span> para comecar.
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const currentItem = watchedItems[index];
                    const currentProductId = currentItem?.productId ?? '';
                    const lineTotal = (currentItem?.quantity || 0) * (currentItem?.unitPrice || 0);

                    return (
                      <div
                        key={field.id}
                        className="rounded-xl border border-border bg-card/80 p-4 space-y-3 shadow-sm"
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Selecione do catalogo</Label>
                            <select
                              value={currentProductId}
                              onChange={(event) => handleProductSelect(field.id, event.target.value)}
                              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
                            >
                              <option value="">Personalizado</option>
                              {allProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} - R$ {product.price.toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <FormField
                            name={`items.${index}.productName` as const}
                            label="Nome no orcamento"
                            render={({ field: itemField }) => (
                              <Input
                                {...itemField}
                                value={itemField.value ?? ''}
                                onChange={(event) => itemField.onChange(event.target.value)}
                                placeholder="Descricao exibida para o cliente"
                              />
                            )}
                          />
                        </div>
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                          <FormField
                            name={`items.${index}.quantity` as const}
                            label="Quantidade"
                            render={({ field: quantityField }) => (
                              <Input
                                {...quantityField}
                                type="number"
                                min={1}
                                value={quantityField.value ?? 1}
                                onChange={(event) =>
                                  quantityField.onChange(Math.max(1, Number(event.target.value) || 1))
                                }
                              />
                            )}
                          />
                          <FormField
                            name={`items.${index}.unitPrice` as const}
                            label="Valor unitario"
                            render={({ field: priceField }) => (
                              <Input
                                {...priceField}
                                type="number"
                                min={0}
                                step="0.01"
                                value={priceField.value ?? 0}
                                onChange={(event) => priceField.onChange(Number(event.target.value) || 0)}
                              />
                            )}
                          />
                          <div className="space-y-2">
                            <Label>Total</Label>
                            <div className="h-10 rounded-md border border-dashed border-rose-200 bg-rose-50/40 flex items-center px-3 font-semibold text-rose-700">
                              {lineTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>
                          <div className="flex items-end justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleRemoveItem(field.id)}
                            >
                              <Trash2 className="size-4 mr-2" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {budgetForm.formState.errors.items?.message ? (
                <Alert variant="destructive">
                  <AlertTitle>Itens</AlertTitle>
                  <AlertDescription>{budgetForm.formState.errors.items?.message}</AlertDescription>
                </Alert>
              ) : null}
            </FormSection>
          </div>

          <div className="space-y-6">
            <Card className="border border-dashed border-rose-200 bg-rose-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Itens</span>
                  <span>{fields.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Cliente</span>
                  <span>
                    {watchedClientId
                      ? allClients.find((client) => client.id === watchedClientId)?.name ?? '-'
                      : '-'}
                  </span>
                </div>
                <div className="pt-3 border-t border-rose-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total estimado</span>
                  <span className="text-3xl font-semibold text-rose-600">
                    {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {activeMutation.error ? (
              <Alert variant="destructive">
                <AlertTitle>Erro ao comunicar com o Supabase</AlertTitle>
                <AlertDescription>{activeMutation.error}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              className="w-full h-12 text-lg gradient-primary text-white shadow-lg shadow-rose-500/30 hover:shadow-xl"
              disabled={activeMutation.isMutating || isLoadingOptions}
            >
              {activeMutation.isMutating ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  {mode === 'edit' ? 'Salvando alteracoes...' : 'Salvando orcamento...'}
                </>
              ) : mode === 'edit' ? (
                'Salvar alteracoes'
              ) : (
                'Salvar orcamento'
              )}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default BudgetForm;
