import React, { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Page } from '../components/layout/Sidebar';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../hooks/useSupabaseMutation';
import { useToast } from '../hooks/use-toast';
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

interface DraftItem {
  id: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
}

const generateItemId = () => Math.random().toString(36).slice(2, 10);

const CreateBudgetPage: React.FC<CreateBudgetPageProps> = ({ setCurrentPage }) => {
  const { toast } = useToast();

  const [selectedClientId, setSelectedClientId] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

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
    ({ quote, quoteItems }: { quote: QuoteInsertInput; quoteItems: QuoteItemDraft[] }) =>
      createQuoteWithItems(quote, quoteItems),
  );

  const allClients = clientsData?.items ?? [];
  const allProducts = productsData?.items ?? [];

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: generateItemId(),
        productId: undefined,
        productName: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProductSelect = (itemId: string, productId: string) => {
    const product = allProducts.find((p) => p.id === productId);
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              productId,
              productName: product?.name ?? item.productName,
              unitPrice: product?.price ?? item.unitPrice,
            }
          : item,
      ),
    );
  };

  const handleItemChange = (itemId: string, changes: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...changes } : item)),
    );
  };

  const totalAmount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
    [items],
  );

  const isLoadingOptions = isLoadingClients || isLoadingProducts;

  const handleCreateQuote = async () => {
    if (!selectedClientId) {
      setFormError('Selecione um cliente antes de salvar.');
      return;
    }
    if (!items.length) {
      setFormError('Adicione pelo menos um item ao orçamento.');
      return;
    }
    for (const item of items) {
      if (!item.productName.trim()) {
        setFormError('Informe o nome de todos os itens.');
        return;
      }
      if (item.quantity <= 0 || item.unitPrice <= 0) {
        setFormError('Quantidade e valor precisam ser maiores do que zero.');
        return;
      }
    }

    setFormError(null);
    const quotePayload: QuoteInsertInput = {
      client_id: selectedClientId,
      status: 'Pendente',
      event_type: eventType.trim() || null,
      event_date: eventDate || null,
      total_amount: Number(totalAmount.toFixed(2)),
      notes: notes.trim() || null,
    };

    const quoteItemsPayload: QuoteItemDraft[] = items.map((item) => ({
      product_id: item.productId ?? null,
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
    setCurrentPage('budgets');
  };

  return (
    <div className="space-y-8">
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
          variant="outline"
          onClick={() => setCurrentPage('budgets')}
          className="h-11 px-6 border-2 hover:border-rose-500 hover:text-rose-600"
        >
          Voltar
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clientsError ? (
                <Alert variant="destructive">
                  <AlertTitle>Erro ao carregar clientes</AlertTitle>
                  <AlertDescription>{clientsError}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="budget-client">Selecione o cliente</Label>
                  <select
                    id="budget-client"
                    disabled={isLoadingClients}
                    value={selectedClientId}
                    onChange={(event) => setSelectedClientId(event.target.value)}
                    className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30 disabled:opacity-60"
                  >
                    <option value="">Selecione...</option>
                    {allClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} — {client.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Evento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-type">Tipo de evento</Label>
                <Input
                  id="event-type"
                  placeholder="Ex.: Aniversário, Casamento"
                  value={eventType}
                  onChange={(event) => setEventType(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-date">Data do evento</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="event-notes">Observações</Label>
                <textarea
                  id="event-notes"
                  placeholder="Detalhes de entrega, referências, restrições..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-xl font-semibold">Itens do orçamento</CardTitle>
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
            </CardHeader>
            <CardContent className="space-y-4">
              {productsError ? (
                <Alert variant="destructive">
                  <AlertTitle>Erro ao carregar produtos</AlertTitle>
                  <AlertDescription>{productsError}</AlertDescription>
                </Alert>
              ) : null}
              {!items.length ? (
                <div className="rounded-xl border-2 border-dashed border-rose-200 p-6 text-center text-muted-foreground">
                  Nenhum item adicionado. Clique em <span className="font-semibold">Adicionar item</span>{' '}
                  para começar.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border p-4 space-y-3 bg-white/80 shadow-sm"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Selecione do catálogo</Label>
                          <select
                            value={item.productId ?? ''}
                            onChange={(event) =>
                              handleProductSelect(item.id, event.target.value || '')
                            }
                            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
                          >
                            <option value="">Personalizado</option>
                            {allProducts.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} — R$ {product.price.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-name-${item.id}`}>Nome no orçamento</Label>
                          <Input
                            id={`item-name-${item.id}`}
                            value={item.productName}
                            onChange={(event) =>
                              handleItemChange(item.id, { productName: event.target.value })
                            }
                            placeholder="Descrição exibida para o cliente"
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                        <div className="space-y-2">
                          <Label htmlFor={`item-qty-${item.id}`}>Quantidade</Label>
                          <Input
                            id={`item-qty-${item.id}`}
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) =>
                              handleItemChange(item.id, { quantity: Number(event.target.value) || 1 })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-price-${item.id}`}>Valor unitário</Label>
                          <Input
                            id={`item-price-${item.id}`}
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(event) =>
                              handleItemChange(item.id, {
                                unitPrice: Number(event.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Total</Label>
                          <div className="h-10 rounded-md border border-dashed border-rose-200 bg-rose-50/40 flex items-center px-3 font-semibold text-rose-700">
                            {(item.quantity * item.unitPrice || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </div>
                        </div>
                        <div className="flex items-end justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-dashed border-rose-200 bg-rose-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Itens</span>
                <span>{items.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Cliente</span>
                <span>
                  {selectedClientId
                    ? allClients.find((client) => client.id === selectedClientId)?.name
                    : '—'}
                </span>
              </div>
              <div className="pt-3 border-t border-rose-200 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total estimado</span>
                <span className="text-3xl font-semibold text-rose-600">
                  {totalAmount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {formError && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível salvar</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          {createQuoteMutation.error && !formError && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao comunicar com o Supabase</AlertTitle>
              <AlertDescription>{createQuoteMutation.error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full h-12 text-lg gradient-primary text-white shadow-lg shadow-rose-500/30 hover:shadow-xl"
            onClick={() => void handleCreateQuote()}
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
    </div>
  );
};

export default CreateBudgetPage;
