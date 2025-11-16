import React, { useCallback, useMemo } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, FormSection } from '../components/patterns';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Page } from '../components/layout/Sidebar';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../hooks/useSupabaseMutation';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../providers/AuthProvider';
import { listClients } from '../services/clientsService';
import { listProducts } from '../services/productsService';
import {
  createQuoteWithItems,
  type QuoteInsertInput,
  type QuoteItemDraft,
} from '../services/quotesService';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface CreateBudgetPageProps {
  setCurrentPage: (page: Page) => void;
}

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

const CreateBudgetPage: React.FC<CreateBudgetPageProps> = ({ setCurrentPage }) => {
  const { toast } = useToast();
  const { profile, isLoading: isAuthLoading } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const fetchClients = useCallback(() => listClients({ pageSize: 1000 }), []);
  const queriesEnabled = isAdmin && !isAuthLoading;

  const {
    data: clientsData,
    isLoading: isLoadingClients,
    error: clientsError,
  } = useSupabaseQuery(fetchClients, {
    deps: [fetchClients],
    initialData: { items: [], total: 0 },
    enabled: queriesEnabled,
  });

  const fetchProducts = useCallback(() => listProducts({ pageSize: 500 }), []);
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useSupabaseQuery(fetchProducts, {
    deps: [fetchProducts],
    initialData: { items: [], total: 0 },
    enabled: queriesEnabled,
  });

  const createQuoteMutation = useSupabaseMutation(
    ({ quote, quoteItems }: { quote: QuoteInsertInput; quoteItems: QuoteItemDraft[] }) =>
      createQuoteWithItems(quote, quoteItems),
  );

  const budgetForm = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      client_id: '',
      event_type: '',
      event_date: '',
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: budgetForm.control,
    name: 'items',
  });

  const watchedItems = budgetForm.watch('items');
  const watchedClientId = budgetForm.watch('client_id');

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

  const handleSubmitBudget = budgetForm.handleSubmit(async (values) => {
    const quotePayload: QuoteInsertInput = {
      client_id: values.client_id,
      status: 'Pendente',
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

    const created = await createQuoteMutation.mutate({
      quote: quotePayload,
      quoteItems: quoteItemsPayload,
    });

    if (!created) {
      return;
    }

    toast({
      title: 'Orçamento criado',
      description: 'O orçamento foi salvo e já aparece na listagem.',
    });
    budgetForm.reset({ client_id: '', event_type: '', event_date: '', notes: '', items: [] });
    setCurrentPage('budgets');
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-rose-500" />
        <p>Carregando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Novo fluxo</p>
            <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
              Criar Orçamento
            </h1>
            <p className="text-muted-foreground">
              Apenas administradores podem gerar orçamentos para evitar alterações indevidas.
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Sua conta atual não possui permissão para criar orçamentos. Solicite acesso ou volte para a
            listagem de orçamentos.
          </AlertDescription>
        </Alert>
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentPage('budgets')}
          className="h-11 px-6 border-2 hover:border-rose-500 hover:text-rose-600"
        >
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <FormProvider {...budgetForm}>
      <form className="space-y-8" onSubmit={handleSubmitBudget}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Novo fluxo</p>
            <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
              Criar Orçamento
            </h1>
            <p className="text-muted-foreground">
              Preencha os dados do evento, selecione itens do catálogo e gere uma proposta formal.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentPage('budgets')}
            className="h-11 px-6 border-2 hover:border-rose-500 hover:text-rose-600"
          >
            Voltar
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <FormSection title="Cliente" description="Selecione quem receberá o orçamento.">
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
                          {client.name} · {client.phone}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
            </FormSection>

            <FormSection title="Evento" description="Contexto e observações.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  name="event_type"
                  label="Tipo de evento"
                  render={({ field }) => (
                    <Input {...field} placeholder="Ex.: Aniversário, Casamento" />
                  )}
                />
                <FormField
                  name="event_date"
                  label="Data do evento"
                  render={({ field }) => <Input {...field} type="date" />}
                />
              </div>
              <FormField
                name="notes"
                label="Observações"
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={4}
                    placeholder="Detalhes de entrega, referências, restrições..."
                    className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
                  />
                )}
              />
            </FormSection>

            <FormSection
              title="Itens do orçamento"
              description="Monte a proposta usando itens do catálogo ou personalizados."
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
                  Nenhum item adicionado. Clique em <span className="font-semibold">Adicionar item</span> para começar.
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
                        className="rounded-xl border border-border p-4 space-y-3 bg-white/80 shadow-sm"
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Selecione do catálogo</Label>
                            <select
                              value={currentProductId}
                              onChange={(event) => handleProductSelect(field.id, event.target.value)}
                              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
                            >
                              <option value="">Personalizado</option>
                              {allProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} · R$ {product.price.toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <FormField
                            name={`items.${index}.productName` as const}
                            label="Nome no orçamento"
                            render={({ field: itemField }) => (
                              <Input
                                {...itemField}
                                value={itemField.value ?? ''}
                                onChange={(event) => itemField.onChange(event.target.value)}
                                placeholder="Descrição exibida para o cliente"
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
                            label="Valor unitário"
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
                      ? allClients.find((client) => client.id === watchedClientId)?.name ?? '—'
                      : '—'}
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

            {createQuoteMutation.error ? (
              <Alert variant="destructive">
                <AlertTitle>Erro ao comunicar com o Supabase</AlertTitle>
                <AlertDescription>{createQuoteMutation.error}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              className="w-full h-12 text-lg gradient-primary text-white shadow-lg shadow-rose-500/30 hover:shadow-xl"
              disabled={createQuoteMutation.isMutating || isLoadingOptions}
            >
              {createQuoteMutation.isMutating ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  Salvando orçamento...
                </>
              ) : (
                'Salvar orçamento'
              )}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default CreateBudgetPage;
