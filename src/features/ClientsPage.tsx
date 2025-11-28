import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Phone,
  Mail,
  MoreHorizontal,
  PencilLine,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../providers/AuthProvider';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../hooks/useSupabaseMutation';
import type { Client } from '../types';
import {
  CLIENTS_PAGE_SIZE,
  createClient,
  deleteClient,
  listClients,
  updateClient,
  type ClientInput,
} from '../services/clientsService';
import { PaginatedList, EmptyState, FilterBar } from '../components/patterns';
import { ClientDialog } from './clients/ClientDialog';

const ClientsPage: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();

  // --- State ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [initialEditMode, setInitialEditMode] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      if (!isAdmin) return;
      setSelectedClient(null);
      setInitialEditMode(true);
      setIsDialogOpen(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      });
    }
  }, [searchParams, setSearchParams, isAdmin]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  // --- Data Fetching ---
  const fetchClients = useCallback(() => listClients({
    page,
    pageSize: CLIENTS_PAGE_SIZE,
    search: debouncedSearch || undefined,
  }), [page, debouncedSearch]);

  const {
    data: clientsData,
    isLoading,
    error: listError,
    refetch: refetchClients,
  } = useSupabaseQuery(fetchClients, {
    deps: [fetchClients],
    initialData: { items: [], total: 0 },
  });

  const clients = clientsData?.items ?? [];
  const totalItems = clientsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / CLIENTS_PAGE_SIZE));

  useEffect(() => {
    setSelectedClients((prev) => {
      const visibleIds = new Set(clients.map((c) => c.id));
      return new Set([...prev].filter((id) => visibleIds.has(id)));
    });
  }, [clients]);

  // --- Mutations ---
  const createMutation = useSupabaseMutation(createClient, { onSuccess: () => refetchClients() });
  const updateMutation = useSupabaseMutation(({ id, values }: { id: string; values: Partial<ClientInput> }) => updateClient(id, values), { onSuccess: () => refetchClients() });
  const deleteMutation = useSupabaseMutation(deleteClient, { onSuccess: () => refetchClients() });

  const isSaving = createMutation.isMutating || updateMutation.isMutating;

  // --- Handlers ---
  const handleNewClient = () => {
    if (!isAdmin) return;
    setSelectedClient(null);
    setInitialEditMode(true);
    setIsDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    if (!isAdmin) return;
    setSelectedClient(client);
    setInitialEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteClient = async (client: Client) => {
    if (!isAdmin || !window.confirm(`Remover ${client.name}?`)) return;
    await deleteMutation.mutate(client.id);
    toast({ title: 'Cliente removido', status: 'success' });
    setIsDialogOpen(false);
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setInitialEditMode(false);
    setIsDialogOpen(true);
  };

  const toggleSelectClient = (id: string, checked: boolean) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAllCurrent = (checked: boolean) => {
    setSelectedClients(checked ? new Set(clients.map((c) => c.id)) : new Set());
  };

  const clearSelection = () => setSelectedClients(new Set());

  const handleBulkDelete = async () => {
    if (!isAdmin || selectedClients.size === 0) return;
    if (!window.confirm('Remover clientes selecionados?')) return;
    setIsBulkProcessing(true);
    try {
      const ids = [...selectedClients];
      await Promise.all(ids.map((id) => deleteMutation.mutate(id)));
      toast({ title: `${ids.length} cliente(s) removidos`, status: 'success' });
      clearSelection();
      await refetchClients();
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const allCurrentSelected = clients.length > 0 && clients.every((c) => selectedClients.has(c.id));
  const someSelected = selectedClients.size > 0;
  const headerChecked = allCurrentSelected ? true : someSelected ? 'indeterminate' : false;

  const handleSaveClient = async (values: ClientInput): Promise<boolean> => {
    if (!isAdmin) return false;

    const saved = selectedClient
      ? await updateMutation.mutate({ id: selectedClient.id, values })
      : await createMutation.mutate(values);

    if (saved) {
      toast({ title: selectedClient ? 'Cliente atualizado' : 'Cliente cadastrado', status: 'success' });
      if (!selectedClient) setIsDialogOpen(false); // Close if creating new
      // If updating, ClientDialog handles switching back to view mode
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6 fade-in h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-none">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Clientes (CRM)</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua base de clientes e histórico.</p>
        </div>

        <Button onClick={handleNewClient} className="hidden sm:flex bg-rose-500 hover:bg-rose-600 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {listError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-4 flex-none">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, email..."
            className="pl-10 bg-card"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Card className="border-border shadow-sm h-full flex flex-col overflow-hidden">
          <CardContent className="p-0 flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
              </div>
            ) : clients.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="Nenhum cliente encontrado"
                  description="Tente buscar por outro termo ou cadastre um novo cliente."
                  icon={<Search className="h-10 w-10 text-slate-300" />}
                />
              </div>
            ) : (
              <>
                {someSelected && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-primary/20 bg-primary/5">
                    <div className="text-sm font-medium text-foreground">
                      {selectedClients.size} selecionado(s)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => { e.stopPropagation(); void handleBulkDelete(); }}
                        disabled={isBulkProcessing || !isAdmin}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir selecionados
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
                        <TableHead className="w-[300px]">Cliente</TableHead>
                        <TableHead>Contatos</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow
                          key={client.id}
                          className="group hover:bg-muted/50 cursor-pointer"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('input')) return;
                            handleViewDetails(client);
                          }}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedClients.has(client.id)}
                              onCheckedChange={(checked) => toggleSelectClient(client.id, Boolean(checked))}
                              aria-label={`Selecionar cliente ${client.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-9 w-9 border border-border">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
                                <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground group-hover:text-primary transition-colors">{client.name}</p>
                                <p className="text-xs text-muted-foreground">ID: #{client.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {client.email && (
                                <div className="flex items-center">
                                  <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                                  {client.email}
                                </div>
                              )}
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                                {client.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClient(client); }} disabled={!isAdmin}>
                                  <PencilLine className="mr-2 h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteClient(client); }} disabled={!isAdmin}>
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
              </>
            )}
          </CardContent>
          {totalItems > 0 && (
            <div className="p-4 border-t border-border">
              <PaginatedList
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={CLIENTS_PAGE_SIZE}
                onPageChange={(nextPage) => setPage(Math.max(1, Math.min(totalPages, nextPage)))}
                className="w-full"
              />
            </div>
          )}
        </Card>
      </div>

      <ClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        client={selectedClient}
        onSave={handleSaveClient}
        onDelete={handleDeleteClient}
        isAdmin={isAdmin}
        isLoading={isSaving}
        initialEditMode={initialEditMode}
      />
    </div>
  );
};

export default ClientsPage;
