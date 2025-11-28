import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';

import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../hooks/useSupabaseMutation';
import { useAuth } from '../providers/AuthProvider';
import { StatusMenu } from '../components/patterns/StatusBadge';
import { QUOTE_STATUS_OPTIONS, QUOTE_STATUSES } from '../constants/status';
import {
  regenerateQuotePublicLink,
  buildQuotePublicUrl,
  buildQuoteWhatsAppShare,
  listQuotes,
  updateQuoteStatus,
  deleteQuoteWithItems,
  fetchQuoteDetails,
  QUOTES_PAGE_SIZE,
  type QuoteDetails,
} from '../services/quotesService';
import type { QuoteStatus } from '../types';
import QuotePreview from './budgets/QuotePreview';
import BudgetForm from './budgets/BudgetForm';

import { PaginatedList, EmptyState, AppDialog, FilterBar } from '../components/patterns';
import { ViewSwitcher, type ViewType } from '../components/ViewSwitcher';

const kanbanColumnsConfig = [
  { id: 'Pendente', label: 'Pendente / Enviado', color: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400' },
  { id: 'Aprovado', label: 'Aprovado', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' },
  { id: 'Recusado', label: 'Rejeitado / Perdido', color: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' },
];

const ALL_STATUSES: QuoteStatus[] = QUOTE_STATUSES;

const getQuoteStatusClass = (status: string) =>
  QUOTE_STATUS_OPTIONS.find((opt) => opt.value === status)?.className || '';

// --- Helpers for DnD ---

const buildColumns = (quotes?: QuoteDetails[]): Record<QuoteStatus, QuoteDetails[]> => {
  const base = {} as Record<QuoteStatus, QuoteDetails[]>;
  ALL_STATUSES.forEach((status) => { base[status] = []; });
  (quotes ?? []).forEach((quote) => {
    // Ensure status is valid, otherwise maybe fallback or ignore
    if (base[quote.status]) base[quote.status].push(quote);
  });
  return base;
};

const findQuoteLocation = (columns: Record<QuoteStatus, QuoteDetails[]>, quoteId: string) => {
  for (const status of ALL_STATUSES) {
    const column = columns[status] ?? [];
    const index = column.findIndex((q) => q.id === quoteId);
    if (index >= 0) return { status, index, quote: column[index] };
  }
  return null;
};

const moveQuoteToStatus = (
  columns: Record<QuoteStatus, QuoteDetails[]>,
  quoteId: string,
  targetStatus: QuoteStatus,
  targetIndex?: number
) => {
  const location = findQuoteLocation(columns, quoteId);
  if (!location) return columns;

  const clone = { ...columns };
  // Deep copy arrays
  ALL_STATUSES.forEach(s => { clone[s] = [...(columns[s] || [])]; });

  const [quote] = clone[location.status].splice(location.index, 1);
  if (!quote) return columns;

  const updatedQuote = { ...quote, status: targetStatus };
  const targetColumn = clone[targetStatus];
  const insertionIndex = targetIndex !== undefined ? Math.min(targetIndex, targetColumn.length) : targetColumn.length;
  targetColumn.splice(insertionIndex, 0, updatedQuote);

  return clone;
};

export default function BudgetsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [view, setView] = useState<ViewType>('list');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  // Dialog States
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsQuote, setDetailsQuote] = useState<QuoteDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteDetails | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Debounce Search
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      navigate('/budgets/new');
    }
  }, [searchParams, navigate]);

  // Data Fetching
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
    refetch: refetchQuotes,
  } = useSupabaseQuery(fetchQuotes, {
    deps: [fetchQuotes],
    initialData: { items: [], total: 0 },
  });

  // --- DnD State & Logic ---
  const [boardColumns, setBoardColumns] = useState(() => buildColumns(quotesData?.items));

  useEffect(() => {
    setBoardColumns(buildColumns(quotesData?.items));
  }, [quotesData?.items]);

  useEffect(() => {
    // Mantém seleção apenas para itens ainda visíveis
    setSelectedQuotes((prev) => {
      const visibleIds = new Set((quotesData?.items ?? []).map((q) => q.id));
      return new Set([...prev].filter((id) => visibleIds.has(id)));
    });
  }, [quotesData?.items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const activeQuote = useMemo(() =>
    activeQuoteId ? findQuoteLocation(boardColumns, activeQuoteId)?.quote : null
    , [activeQuoteId, boardColumns]);

  // Mutations
  const updateStatusMutation = useSupabaseMutation(
    ({ id, status }: { id: string; status: QuoteStatus }) => updateQuoteStatus(id, status),
    {
      onSuccess: () => void refetchQuotes(),
      onError: () => void refetchQuotes(),
    }
  );

  const deleteQuoteMutation = useSupabaseMutation(deleteQuoteWithItems, {
    onSuccess: () => void refetchQuotes()
  });

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveQuoteId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveQuoteId(null);
    if (!over) return;

    if (!isAdmin) {
      toast.error('Apenas administradores podem alterar o status.');
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    const source = findQuoteLocation(boardColumns, activeId);
    if (!source) return;

    let destinationStatus = source.status;
    let destinationIndex = source.index;

    if (ALL_STATUSES.includes(overId as QuoteStatus)) {
      destinationStatus = overId as QuoteStatus;
      destinationIndex = boardColumns[destinationStatus]?.length ?? 0;
    } else {
      const target = findQuoteLocation(boardColumns, overId);
      if (target) {
        destinationStatus = target.status;
        destinationIndex = target.index;
      }
    }

    if (source.status === destinationStatus && source.index === destinationIndex) return;

    // Optimistic Update
    const previousColumns = boardColumns;
    setBoardColumns(prev => moveQuoteToStatus(prev, activeId, destinationStatus, destinationIndex));

    const updated = await updateStatusMutation.mutate({ id: activeId, status: destinationStatus });
    if (!updated) {
      setBoardColumns(previousColumns);
      toast.error('Erro ao atualizar status');
    } else {
      toast.success(`Orçamento movido para ${destinationStatus}`);
      await refetchQuotes();
    }
  };

  // Handlers
  const handleOpenDetails = async (quoteId: string) => {
    setIsDetailsOpen(true);
    setIsDetailsLoading(true);
    try {
      const details = await fetchQuoteDetails(quoteId);
      setDetailsQuote(details);
    } catch (err) {
      toast.error('Erro ao carregar detalhes do orçamento');
      setDetailsQuote(null);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleStatusChange = async (quoteId: string, status: QuoteStatus) => {
    if (!isAdmin) return;
    const updated = await updateStatusMutation.mutate({ id: quoteId, status });
    if (updated) toast.success(`Status atualizado para ${status}`);
    else toast.error('Erro ao atualizar status');
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Deseja remover este orcamento?')) return;

    const result = await deleteQuoteMutation.mutate(quoteId);
    if (result) toast.success('Orcamento removido com sucesso');
    else toast.error('Erro ao remover orcamento');
  };

  const handleStartEdit = async (quoteId: string) => {
    if (!isAdmin) return;
    setIsDetailsOpen(false);
    setIsEditOpen(true);
    setIsEditLoading(true);
    try {
      const quoteData = await fetchQuoteDetails(quoteId);
      setEditingQuote(quoteData);
    } catch (err) {
      toast.error('Erro ao carregar orcamento para edicao');
      setIsEditOpen(false);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleEditSuccess = async (quoteId: string) => {
    setIsEditOpen(false);
    setEditingQuote(null);
    await refetchQuotes();
    if (detailsQuote?.id === quoteId) {
      await handleOpenDetails(quoteId);
    }
  };

  const toggleSelectQuote = (id: string, checked: boolean) => {
    setSelectedQuotes((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAllCurrent = (checked: boolean) => {
    if (!quotesData?.items) return;
    setSelectedQuotes(checked ? new Set(quotesData.items.map((q) => q.id)) : new Set());
  };

  const clearSelection = () => setSelectedQuotes(new Set());

  const handleGenerateLink = async () => {
    if (!detailsQuote?.id) return;
    setIsSharing(true);
    setShareError(null);
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const payload = await regenerateQuotePublicLink(detailsQuote.id, { expiresAt });
      if (payload?.token) {
        const updated = {
          ...detailsQuote,
          public_link_token: payload.token,
          public_link_token_expires_at: payload.expiresAt,
        };
        setDetailsQuote(updated);
        toast.success('Link público gerado');
        const url = buildQuotePublicUrl(payload.token);
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          toast.success('Link copiado para a área de transferência');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar link público.";
      setShareError(message);
      toast.error(message);
    } finally {
      setIsSharing(false);
    }
  };

  const handleGenerateOrCopyLink = async () => {
    if (!detailsQuote?.id) return;
    if (detailsQuote.public_link_token) {
      const url = buildQuotePublicUrl(detailsQuote.public_link_token);
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência');
      }
      return;
    }
    await handleGenerateLink();
  };

  const handleShareWhatsapp = () => {
    if (!detailsQuote?.public_link_token || !detailsQuote?.client) return;
    const url = buildQuotePublicUrl(detailsQuote.public_link_token);
    const href = buildQuoteWhatsAppShare({
      phone: detailsQuote.client.phone,
      clientName: detailsQuote.client.name,
      quoteUrl: url,
      totalAmount: detailsQuote.total_amount,
    });
    if (href) window.open(href, '_blank', 'noopener');
  };

  const handleBulkStatusChange = async (status: QuoteStatus) => {
    if (!isAdmin || selectedQuotes.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const ids = [...selectedQuotes];
      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await updateStatusMutation.mutate({ id, status });
          return Boolean(res);
        }),
      );
      const successCount = results.filter(Boolean).length;
      if (successCount) {
        toast.success(`${successCount} orçamento(s) movido(s) para ${status}`);
      }
      if (successCount !== ids.length) {
        toast.error('Alguns itens não foram atualizados.');
      }
      await refetchQuotes();
      clearSelection();
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!isAdmin || selectedQuotes.size === 0) return;
    if (!window.confirm('Deseja remover os orçamentos selecionados?')) return;
    setIsBulkProcessing(true);
    try {
      const ids = [...selectedQuotes];
      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await deleteQuoteMutation.mutate(id);
          return Boolean(res);
        }),
      );
      const successCount = results.filter(Boolean).length;
      if (successCount) toast.success(`${successCount} orçamento(s) removido(s).`);
      if (successCount !== ids.length) toast.error('Nem todos os itens foram removidos.');
      await refetchQuotes();
      clearSelection();
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const totalItems = quotesData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / QUOTES_PAGE_SIZE));
  const allCurrentSelected =
    (quotesData?.items?.length ?? 0) > 0 &&
    (quotesData?.items ?? []).every((quote) => selectedQuotes.has(quote.id));
  const someSelected = selectedQuotes.size > 0;
  const headerChecked = allCurrentSelected ? true : someSelected ? 'indeterminate' : false;

  return (
    <div className="space-y-6 fade-in h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-none">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas propostas comerciais e acompanhe o status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/budgets/new')}
            className="hidden sm:flex bg-rose-500 hover:bg-rose-600 text-white"
            disabled={!isAdmin}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Button>
          <ViewSwitcher currentView={view} onViewChange={setView} availableViews={['list', 'gallery', 'kanban']} />
        </div>
      </div>

      <FilterBar
        left={
          <>
            <Button
              size="sm"
              variant={statusFilter === 'ALL' ? 'secondary' : 'ghost'}
              className={`h-9 px-3 text-sm ${statusFilter === 'ALL' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'Pendente' ? 'secondary' : 'ghost'}
              className={`h-9 px-3 text-sm ${statusFilter === 'Pendente' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setStatusFilter('Pendente')}
            >
              Pendente
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'Aprovado' ? 'secondary' : 'ghost'}
              className={`h-9 px-3 text-sm ${statusFilter === 'Aprovado' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setStatusFilter('Aprovado')}
            >
              Aprovado
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'Recusado' ? 'secondary' : 'ghost'}
              className={`h-9 px-3 text-sm ${statusFilter === 'Recusado' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setStatusFilter('Recusado')}
            >
              Recusado
            </Button>
          </>
        }
        right={
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar cliente ou evento..."
              className="pl-10 bg-card"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        }
        className="gap-4"
      />

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
          </div>
        ) : quotesData?.items.length === 0 ? (
          <EmptyState
            title="Nenhum orçamento encontrado"
            description="Tente ajustar os filtros ou crie um novo orçamento."
            icon={<Search className="h-10 w-10 text-slate-300" />}
          />
        ) : (
          <>
            {view === 'list' && (
              <Card className="border-border shadow-sm h-full flex flex-col overflow-hidden">
                <CardContent className="p-0 flex-1 overflow-auto">
                  {someSelected && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-primary/20 bg-primary/5">
                      <div className="text-sm font-medium text-foreground">
                        {selectedQuotes.size} selecionado(s)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); void handleBulkStatusChange('Pendente'); }}
                          disabled={isBulkProcessing || !isAdmin}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Marcar como Pendente
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); void handleBulkStatusChange('Aprovado'); }}
                          disabled={isBulkProcessing || !isAdmin}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Aprovar selecionados
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); void handleBulkStatusChange('Recusado'); }}
                          disabled={isBulkProcessing || !isAdmin}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Recusar selecionados
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => { e.stopPropagation(); void handleBulkDelete(); }}
                          disabled={isBulkProcessing || !isAdmin}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="min-w-[800px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                        <TableRow className="hover:bg-muted/50">
                          <TableHead className="w-12">
                            <Checkbox
                              checked={headerChecked}
                              onCheckedChange={(checked) => selectAllCurrent(Boolean(checked))}
                              aria-label="Selecionar todos"
                            />
                          </TableHead>
                          <TableHead className="w-[100px]">ID</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Evento</TableHead>
                          <TableHead>Data do Evento</TableHead>
                          <TableHead>Valor Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotesData?.items.map((budget) => (
                          <TableRow
                            key={budget.id}
                            className="group hover:bg-muted/50 cursor-pointer"
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest('input')) return;
                              void handleOpenDetails(budget.id);
                            }}
                          >
                            <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedQuotes.has(budget.id)}
                                onCheckedChange={(checked) => toggleSelectQuote(budget.id, Boolean(checked))}
                                aria-label={`Selecionar orçamento ${budget.id}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-foreground">#{budget.id.slice(0, 8)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{budget.client?.name}</span>
                                <span className="text-xs text-muted-foreground">{budget.client?.phone}</span>
                              </div>
                            </TableCell>
                            <TableCell>{budget.event_type || '—'}</TableCell>
                            <TableCell>
                              {budget.event_date ? new Date(budget.event_date).toLocaleDateString('pt-BR') : '-'}
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.total_amount)}
                            </TableCell>
                            <TableCell>
                              <StatusMenu
                                status={budget.status}
                                options={QUOTE_STATUS_OPTIONS}
                                onChange={(status) => void handleStatusChange(budget.id, status as QuoteStatus)}
                                disabled={!isAdmin}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[180px]">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); void handleOpenDetails(budget.id); }}>
                                    <Eye className="mr-2 h-4 w-4 text-slate-500" /> Ver Detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); void handleStartEdit(budget.id); }} disabled={!isAdmin}>
                                    <Edit3 className="mr-2 h-4 w-4 text-slate-500" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); void handleStatusChange(budget.id, 'Aprovado'); }} disabled={!isAdmin}>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Aprovar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); void handleStatusChange(budget.id, 'Recusado'); }} disabled={!isAdmin}>
                                    <XCircle className="mr-2 h-4 w-4 text-rose-500" /> Recusar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={(e) => { e.stopPropagation(); void handleDeleteQuote(budget.id); }} disabled={!isAdmin}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-4 border-t border-border">
                    <PaginatedList
                      page={page}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      pageSize={QUOTES_PAGE_SIZE}
                      onPageChange={setPage}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {view === 'gallery' && (
              <div className="h-full overflow-auto pr-2 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {quotesData?.items.map((budget) => (
                    <Card key={budget.id} className="hover:shadow-md transition-shadow cursor-pointer group border-border bg-card" onClick={() => handleOpenDetails(budget.id)}>
                      <CardHeader className="pb-2 relative">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline" className="mb-2 border-border text-muted-foreground">#{budget.id.slice(0, 8)}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-3 -mt-2 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenDetails(budget.id); }}>Ver Detalhes</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartEdit(budget.id); }}>Editar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardTitle className="text-lg truncate" title={budget.client?.name}>{budget.client?.name}</CardTitle>
                        <CardDescription>{budget.event_type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mt-2 mb-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {budget.event_date ? new Date(budget.event_date).toLocaleDateString('pt-BR') : '-'}
                          </div>
                          <StatusMenu
                            status={budget.status}
                            options={QUOTE_STATUS_OPTIONS}
                            onChange={(status) => void handleStatusChange(budget.id, status as QuoteStatus)}
                            disabled={!isAdmin}
                          />
                        </div>
                        <div className="pt-4 border-t border-border flex items-baseline justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="text-xl font-bold text-foreground">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.total_amount)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-6">
                  <PaginatedList
                    page={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={QUOTES_PAGE_SIZE}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            )}

            {view === 'kanban' && (
              <div className="overflow-x-auto overflow-y-hidden h-full pb-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex gap-6 h-full min-w-[900px]">
                    {kanbanColumnsConfig.map((col) => (
                      <KanbanColumn
                        key={col.id}
                        id={col.id}
                        label={col.label}
                        color={col.color}
                        quotes={boardColumns[col.id as QuoteStatus] || []}
                        onQuoteClick={handleOpenDetails}
                        onEdit={handleStartEdit}
                        onStatusChange={handleStatusChange}
                        isAdmin={isAdmin}
                      />
                    ))}
                  </div>
                  <DragOverlay>
                    {activeQuote ? <BudgetCard quote={activeQuote} isOverlay /> : null}
                  </DragOverlay>
                </DndContext>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <AppDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        size="xl"
        title="Detalhes do Orçamento"
        description="Visualize todas as informações da proposta."
      >
        {isDetailsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : detailsQuote ? (
          <>
            <QuotePreview
              quote={detailsQuote}
              variant="admin"
              onGenerateOrCopyLink={() => void handleGenerateOrCopyLink()}
              onShareWhatsapp={() => handleShareWhatsapp()}
              onEdit={() => handleStartEdit(detailsQuote.id)}
              onDelete={() => handleDeleteQuote(detailsQuote.id)}
              isSharing={isSharing}
            />
          </>
        ) : null}
        {shareError && (
          <p className="text-sm text-rose-600 px-2 pt-2">{shareError}</p>
        )}
      </AppDialog>

      <AppDialog
        open={isEditOpen}
        onOpenChange={(open) => !open && setIsEditOpen(false)}
        size="xl"
        title="Editar Orçamento"
        description={<span className="sr-only">Edite os detalhes do orçamento abaixo.</span>}
      >
        {isEditLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : (
          <BudgetForm
            mode="edit"
            quote={editingQuote}
            isFetchingQuote={isEditLoading}
            onBack={() => setIsEditOpen(false)}
            onSuccess={({ quoteId }) => void handleEditSuccess(quoteId)}
            title="Editar"
            subtitle=""
          />
        )}
      </AppDialog>

    </div>
  );
}

// --- Subcomponents ---

interface KanbanColumnProps {
  id: string;
  label: string;
  color: string;
  quotes: QuoteDetails[];
  onQuoteClick: (id: string) => void;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: QuoteStatus) => void;
  isAdmin: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, label, color, quotes, onQuoteClick, onEdit, onStatusChange, isAdmin }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100/50 rounded-xl border border-slate-200/60 p-3">
      <div className={`flex items-center justify-between p-3 mb-3 rounded-lg border ${color} bg-white shadow-sm font-medium`}>
        {label}
        <Badge variant="secondary">{quotes.length}</Badge>
      </div>
      <ScrollArea className="flex-1 w-full h-full min-h-0 pr-3" hideScrollbar>
        <div ref={setNodeRef} className="space-y-3 min-h-[100px]">
          <SortableContext items={quotes.map(q => q.id)} strategy={verticalListSortingStrategy}>
            {quotes.map(budget => (
              <BudgetCard
                key={budget.id}
                quote={budget}
                onClick={() => onQuoteClick(budget.id)}
                onEdit={onEdit}
                onStatusChange={onStatusChange}
                isAdmin={isAdmin}
              />
            ))}
          </SortableContext>
          {quotes.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
              Vazio
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

interface BudgetCardProps {
  quote: QuoteDetails;
  isOverlay?: boolean;
  onClick?: () => void;
  onEdit?: (id: string) => void;
  onStatusChange?: (id: string, status: QuoteStatus) => void;
  isAdmin?: boolean;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ quote, isOverlay, onClick, onEdit, onStatusChange, isAdmin }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: quote.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative ${isOverlay ? 'shadow-xl rotate-2 scale-105' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-medium text-slate-400">#{quote.id.slice(0, 8)}</span>
          {!isOverlay && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mover para:</DropdownMenuLabel>
                {kanbanColumnsConfig.filter(c => c.id !== quote.status).map(targetCol => (
                  <DropdownMenuItem key={targetCol.id} onClick={(e) => { e.stopPropagation(); onStatusChange?.(quote.id, targetCol.id as any); }} disabled={!isAdmin}>
                    {targetCol.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(quote.id); }} disabled={!isAdmin}>
                  Editar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <h4 className="font-semibold text-slate-900 mb-1 truncate" title={quote.client?.name}>{quote.client?.name}</h4>
        <p className="text-sm text-slate-500 mb-3">{quote.event_type}</p>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400">{quote.event_date ? new Date(quote.event_date).toLocaleDateString('pt-BR') : '—'}</span>
          <span className="font-bold text-slate-900 text-sm">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total_amount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
