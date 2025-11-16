import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Phone,
  Mail,
  UserCircle2,
  Trash2,
  PencilLine,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../providers/AuthProvider';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../hooks/useSupabaseMutation';
import {
  FilterBar,
  FilterDrawer,
  DataTable,
  PaginatedList,
  EmptyState,
  FormField,
  FormSection,
} from '../components/patterns';
import type { DataTableColumn } from '../components/patterns/DataTable';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Client } from '../types';
import {
  CLIENTS_PAGE_SIZE,
  createClient,
  deleteClient,
  listClients,
  updateClient,
  type ClientInput,
} from '../services/clientsService';

const clientFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome do cliente.'),
  phone: z.string().min(1, 'Informe um telefone válido.'),
  email: z.string().email('Informe um email válido.').optional().or(z.literal('')),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const getEmptyClientForm = (): ClientFormValues => ({
  name: '',
  phone: '',
  email: '',
});

const ClientsPage: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const isAdmin = profile?.role === 'admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: getEmptyClientForm(),
  });

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const fetchClients = useCallback(
    () =>
      listClients({
        page,
        pageSize: CLIENTS_PAGE_SIZE,
        search: debouncedSearch || undefined,
      }),
    [page, debouncedSearch],
  );

  const {
    data: clientsData,
    isLoading,
    error: listError,
    refetch: refetchClients,
  } = useSupabaseQuery(fetchClients, {
    deps: [fetchClients],
    initialData: { items: [], total: 0 },
  });

  const createClientMutation = useSupabaseMutation(createClient, {
    onSuccess: () => void refetchClients(),
  });
  const updateClientMutation = useSupabaseMutation(
    ({ id, values }: { id: string; values: Partial<ClientInput> }) => updateClient(id, values),
    { onSuccess: () => void refetchClients() },
  );
  const deleteClientMutation = useSupabaseMutation(deleteClient, {
    onSuccess: () => void refetchClients(),
  });

  const isSaving = createClientMutation.isMutating || updateClientMutation.isMutating;

  const totalItems = clientsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / CLIENTS_PAGE_SIZE));

  const createdAtFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    [],
  );

  const filterSummary = totalItems
    ? (
        <>
          Encontrados{' '}
          <span className="font-semibold text-rose-600">{totalItems}</span> clientes
        </>
      )
    : 'Use a busca para encontrar clientes ou cadastre um novo contato.';

  const renderClientFilters = (prefix: string) => (
    <div className="space-y-2">
      <Label htmlFor={`${prefix}-search-clients`} className="text-sm font-semibold flex items-center gap-2">
        <Search className="size-4 text-rose-500" />
        Buscar por nome ou telefone
      </Label>
      <Input
        id={`${prefix}-search-clients`}
        placeholder="Ex.: Maria, (11) 9..."
        value={searchInput}
        onChange={(event) => handleSearchChange(event.target.value)}
      />
    </div>
  );

  const handleClearFilters = () => {
    handleSearchChange('');
  };

  const clients = clientsData?.items ?? [];

  const clientColumns: DataTableColumn<Client>[] = [
    {
      id: 'client',
      label: 'Cliente',
      cell: (client) => (
        <div className="flex items-center gap-3">
          <div className="bg-rose-100 text-rose-700 rounded-full p-2">
            <UserCircle2 className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{client.name}</p>
            <p className="text-xs text-muted-foreground">ID: {client.id.slice(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      id: 'phone',
      label: 'Telefone',
      cell: (client) => (
        <div className="flex items-center gap-2 text-foreground">
          <Phone className="size-4 text-rose-500" />
          <span>{client.phone}</span>
        </div>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      cell: (client) => (
        <div className="flex items-center gap-2 text-foreground">
          <Mail className="size-4 text-rose-500" />
          <span>{client.email || '—'}</span>
        </div>
      ),
    },
    {
      id: 'created_at',
      label: 'Cadastro',
      cell: (client) => (
        <span className="text-sm text-muted-foreground">
          {client.created_at ? createdAtFormatter.format(new Date(client.created_at)) : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      label: 'Ações',
      align: 'right',
      cell: (client) => (
        <div className="flex justify-end gap-2">
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50"
            disabled={!isAdmin}
            onClick={() => handleEditClient(client)}
          >
            <PencilLine className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="destructive"
            className="hover:bg-destructive/90"
            disabled={!isAdmin || deleteClientMutation.isMutating}
            onClick={() => void handleDeleteClient(client)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
      hideOnMobile: false,
    },
  ];

  const handleModalChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingClient(null);
      clientForm.reset(getEmptyClientForm());
      clientForm.clearErrors();
    }
  };

  const handleNewClient = () => {
    if (!isAdmin) {
      return;
    }
    setEditingClient(null);
    clientForm.reset(getEmptyClientForm());
    clientForm.clearErrors();
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    if (!isAdmin) {
      return;
    }
    setEditingClient(client);
    clientForm.reset({
      name: client.name,
      phone: client.phone,
      email: client.email ?? '',
    });
    clientForm.clearErrors();
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (client: Client, opts?: { closeModal?: boolean }) => {
    if (!isAdmin) {
      return;
    }
    const confirmed = window.confirm(`Remover ${client.name} e seus contatos?`);
    if (!confirmed) {
      return;
    }
    const result = await deleteClientMutation.mutate(client.id);
    if (result === undefined && deleteClientMutation.error) {
      toast({
      title: 'Erro ao excluir cliente',
      description: deleteClientMutation.error,
      status: 'error',
    });
      return;
    }
    toast({
      title: 'Cliente removido',
      description: `${client.name} foi excluído com sucesso.`,
    });
    if (opts?.closeModal) {
      handleModalChange(false);
    }
  };

  const handleSubmitClient = clientForm.handleSubmit(async (values) => {
    if (!isAdmin) {
      return;
    }

    const payload: ClientInput = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email?.trim() || null,
    };

    const saved = editingClient
      ? await updateClientMutation.mutate({ id: editingClient.id, values: payload })
      : await createClientMutation.mutate(payload);

    if (!saved) {
      return;
    }

    toast({
      title: editingClient ? 'Cliente atualizado' : 'Cliente cadastrado',
      description: `${saved.name} agora está disponível para novos orçamentos.`,
    });
    handleModalChange(false);
  });

  const mutationError = createClientMutation.error || updateClientMutation.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Clientes</p>
          <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
            CRM
          </h1>
        </div>
        <Button
          onClick={handleNewClient}
          disabled={!isAdmin}
          className="gradient-primary text-white shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.02] h-12 px-6 disabled:cursor-not-allowed"
        >
          <Plus className="size-5" />
          Novo cliente
        </Button>
      </div>

      {!isAdmin && (
        <Alert>
          <AlertTitle>Modo somente leitura</AlertTitle>
          <AlertDescription>
            Apenas administradores podem cadastrar ou editar clientes. Entre com um usuário admin
            para liberar as ações.
          </AlertDescription>
        </Alert>
      )}

      <FilterBar
        summary={filterSummary}
        onOpenDrawer={() => setIsFilterDrawerOpen(true)}
        filtersClassName="md:grid-cols-1"
      >
        {renderClientFilters('desktop')}
      </FilterBar>
      <FilterDrawer
        open={isFilterDrawerOpen}
        onOpenChange={setIsFilterDrawerOpen}
        title="Filtros de clientes"
        onClear={handleClearFilters}
        onApply={() => setIsFilterDrawerOpen(false)}
      >
        {renderClientFilters('mobile')}
      </FilterDrawer>

      {listError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Não foi possível carregar os clientes</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>{listError}</span>
            <Button variant="outline" size="sm" onClick={() => void refetchClients()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        data={clients}
        columns={clientColumns}
        keyExtractor={(client) => client.id}
        isLoading={isLoading}
        loadingText="Carregando clientes..."
        emptyState={
          <EmptyState
            icon={<UserCircle2 className="size-10 text-rose-500" />}
            title="Nenhum cliente encontrado"
            description="Ajuste a busca ou cadastre um novo cliente."
            action={
              isAdmin ? (
                <Button onClick={handleNewClient} className="gradient-primary text-white">
                  <Plus className="size-4" />
                  Novo cliente
                </Button>
              ) : null
            }
          />
        }
      />

      {totalItems > 0 ? (
        <PaginatedList
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={CLIENTS_PAGE_SIZE}
          onPageChange={(nextPage) => setPage(Math.max(1, Math.min(totalPages, nextPage)))}
        />
      ) : null}
      <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
        <DialogContent className="max-w-lg bg-card">
          <FormProvider {...clientForm}>
            <form className="space-y-5" onSubmit={handleSubmitClient}>
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Todos os dados vão direto para a tabela <code>clients</code>.
              </DialogDescription>
            </DialogHeader>

              <FormSection
                title="Dados do cliente"
                description="Essas informações são usadas nos orçamentos e contatos."
              >
                <FormField
                  name="name"
                  label="Nome"
                  required
                  render={({ field }) => <Input {...field} placeholder="Nome completo" />}
                />
                <FormField
                  name="phone"
                  label="Telefone"
                  required
                  render={({ field }) => <Input {...field} placeholder="(11) 99999-9999" />}
                />
                <FormField
                  name="email"
                  label="Email"
                  render={({ field }) => (
                    <Input {...field} type="email" placeholder="email@cliente.com" />
                  )}
                />
              </FormSection>

              {mutationError ? (
                <Alert variant="destructive">
                  <AlertTitle>Erro de Supabase</AlertTitle>
                  <AlertDescription>{mutationError}</AlertDescription>
                </Alert>
              ) : null}

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => handleModalChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="size-4 animate-spin" />}
                  {editingClient ? 'Salvar alterações' : 'Cadastrar cliente'}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;










