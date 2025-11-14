import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ListChecks,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  User2,
} from 'lucide-react';
import { Page } from '../components/layout/Sidebar';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../hooks/useSupabaseMutation';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../providers/AuthProvider';
import type { QuoteStatus } from '../types';
import {
  QUOTES_PAGE_SIZE,
  fetchQuoteDetails,
  listQuotes,
  updateQuoteStatus,
  deleteQuoteWithItems,
  type QuoteDetails,
} from '../services/quotesService';

interface BudgetsPageProps {
  setCurrentPage: (page: Page) => void;
}

const STATUS_BADGES: Record<QuoteStatus, string> = {
  Pendente: 'bg-amber-100 text-amber-700 border border-amber-200',
  Aprovado: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Recusado: 'bg-rose-100 text-rose-700 border border-rose-200',
};

const statusOptions: Array<{ label: string; value: QuoteStatus | 'ALL' }> = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendente', value: 'Pendente' },
  { label: 'Aprovado', value: 'Aprovado' },
  { label: 'Recusado', value: 'Recusado' },
];

const STATUS_ACTIONS: QuoteStatus[] = ['Pendente', 'Aprovado', 'Recusado'];

const BudgetsPage: React.FC<BudgetsPageProps> = ({ setCurrentPage }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.role === 'admin';

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsQuote, setDetailsQuote] = useState<QuoteDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const fetchQuotes = useCallback(
    () =>
      listQuotes({
        page,
        pageSize: QUOTES_PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter,
      }),
    [page, debouncedSearch, statusFilter],
  );

  const {
    data: quotesData,
    isLoading,
    error,
    refetch: refetchQuotes,
  } = useSupabaseQuery(fetchQuotes, {
    deps: [fetchQuotes],
    initialData: { items: [], total: 0 },
  });

  const updateStatusMutation = useSupabaseMutation(
    ({ id, status }: { id: string; status: QuoteStatus }) => updateQuoteStatus(id, status),
    {
      onSuccess: async () => {
        await refetchQuotes();
      },
    },
  );

  const deleteQuoteMutation = useSupabaseMutation(deleteQuoteWithItems, {
    onSuccess: async () => {
      await refetchQuotes();
    },
  });

  const handleOpenDetails = async (quoteId: string) => {
    setIsDetailsOpen(true);
    setIsDetailsLoading(true);
    try {
      const details = await fetchQuoteDetails(quoteId);
      setDetailsQuote(details);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar detalhes.';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      setDetailsQuote(null);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleStatusChange = async (quoteId: string, status: QuoteStatus) => {
    if (!isAdmin) {
      return;
    }
    const updated = await updateStatusMutation.mutate({ id: quoteId, status });
    if (!updated) {
      const message = updateStatusMutation.error ?? 'Não foi possível atualizar o status.';
      toast({
        title: 'Erro ao atualizar status',
        description: message,
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Status atualizado',
      description: `O orçamento agora está "${status}".`,
    });
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!isAdmin) {
      return;
    }
    const confirmed = window.confirm('Deseja remover este orçamento e seus itens?');
    if (!confirmed) {
      return;
    }
    const result = await deleteQuoteMutation.mutate(quoteId);
    if (!result) {
      toast({
        title: 'Erro ao remover orçamento',
        description: deleteQuoteMutation.error,
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Orçamento removido',
      description: 'O orçamento foi excluído com sucesso.',
    });
  };

  const totalItems = quotesData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / QUOTES_PAGE_SIZE));

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    [],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
      }),
    [],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">Fluxo Comercial</p>
          <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
            Orçamentos
          </h1>
          <p className="text-muted-foreground">
            Consulte propostas enviadas, atualize status e gere novos pedidos.
          </p>
        </div>
        <Button
          className="gradient-primary text-white shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.02] h-12 px-6"
          onClick={() => setCurrentPage('create-budget')}
        >
          <Plus className="size-5" />
          Criar orçamento
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="quote-search" className="text-sm font-medium">
            Buscar por cliente ou telefone
          </Label>
          <Input
            id="quote-search"
            placeholder="Ex.: Maria, (11) 9..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quote-status" className="text-sm font-medium">
            Filtrar por status
          </Label>
          <select
            id="quote-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as QuoteStatus | 'ALL')}
            className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Não foi possível carregar os orçamentos</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{error}</span>
            <Button size="sm" onClick={() => void refetchQuotes()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-rose-50 to-orange-50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-4 text-left">Cliente</th>
                  <th className="p-4 text-left">Evento</th>
                  <th className="p-4 text-left">Data</th>
                  <th className="p-4 text-left">Total</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Carregando orçamentos...
                    </td>
                  </tr>
                ) : quotesData?.items.length ? (
                  quotesData.items.map((quote) => (
                    <tr
                      key={quote.id}
                      className="border-t border-border hover:bg-rose-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {quote.client?.name ?? 'Cliente removido'}
                          </span>
                          <span className="text-xs text-muted-foreground">{quote.client?.phone}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {quote.event_type || '—'}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {quote.event_date ? dateFormatter.format(new Date(quote.event_date)) : '—'}
                      </td>
                      <td className="p-4 font-semibold text-foreground">
                        {currencyFormatter.format(quote.total_amount)}
                      </td>
                      <td className="p-4">
                        <Badge className={`${STATUS_BADGES[quote.status]}`}>{quote.status}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-white border border-border shadow-xl"
                          >
                            <DropdownMenuItem
                              className="cursor-pointer flex items-center gap-2"
                              onClick={() => void handleOpenDetails(quote.id)}
                            >
                              <ListChecks className="size-4 text-rose-500" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer flex items-center gap-2 text-destructive"
                              onClick={() => void handleDeleteQuote(quote.id)}
                              disabled={!isAdmin || deleteQuoteMutation.isMutating}
                            >
                              <Trash2 className="size-4" />
                              Excluir orçamento
                            </DropdownMenuItem>
                            {STATUS_ACTIONS.map((statusOption) => (
                              <DropdownMenuItem
                                key={statusOption}
                                disabled={!isAdmin || updateStatusMutation.isMutating}
                                className="cursor-pointer flex items-center gap-2"
                                onClick={() => void handleStatusChange(quote.id, statusOption)}
                              >
                                <CheckCircle2 className="size-4 text-emerald-500" />
                                Marcar como {statusOption}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Nenhum orçamento encontrado para o filtro aplicado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {quotesData?.items.length ? (
        <div className="flex flex-col gap-3 border rounded-xl border-dashed border-rose-200 bg-rose-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Página <span className="font-semibold text-rose-600">{page}</span> de {totalPages} •{' '}
            exibindo {quotesData.items.length} de {totalItems} orçamentos
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) {
            setDetailsQuote(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle>Resumo do orçamento</DialogTitle>
            <DialogDescription>
              Visualize os itens enviados ao cliente e notas complementares.
            </DialogDescription>
          </DialogHeader>

          {isDetailsLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="size-6 animate-spin text-rose-500" />
              <span>Carregando informações...</span>
            </div>
          ) : detailsQuote ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-dashed border-rose-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
                  <p className="font-semibold flex items-center gap-2 text-foreground mt-1">
                    <User2 className="size-4 text-rose-500" />
                    {detailsQuote.client?.name ?? 'Cliente removido'}
                  </p>
                  <p className="text-sm text-muted-foreground">{detailsQuote.client?.phone}</p>
                  <p className="text-sm text-muted-foreground">{detailsQuote.client?.email || '—'}</p>
                </div>
                <div className="rounded-lg border border-dashed border-rose-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Evento</p>
                  <p className="font-semibold flex items-center gap-2 text-foreground mt-1">
                    <Calendar className="size-4 text-rose-500" />
                    {detailsQuote.event_type || 'Não informado'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {detailsQuote.event_date
                      ? dateFormatter.format(new Date(detailsQuote.event_date))
                      : 'Sem data'}
                  </p>
                </div>
                <div className="rounded-lg border border-dashed border-rose-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                  <p className="text-3xl font-semibold text-foreground mt-1">
                    {currencyFormatter.format(detailsQuote.total_amount)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground uppercase">
                  Itens do orçamento
                </div>
                <div className="divide-y divide-border">
                  {detailsQuote.items.length ? (
                    detailsQuote.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-3 text-sm items-center"
                      >
                        <span>{item.product_name_copy}</span>
                        <span className="text-center">{item.quantity} un.</span>
                        <span className="text-right">
                          {currencyFormatter.format(item.price_at_creation)}
                        </span>
                        <span className="text-right font-semibold">
                          {currencyFormatter.format(item.price_at_creation * item.quantity)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Nenhum item cadastrado.
                    </div>
                  )}
                </div>
              </div>

              {detailsQuote.notes && (
                <div className="rounded-xl border border-dashed border-rose-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Observações
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{detailsQuote.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Selecione um orçamento para visualizar.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetsPage;
