import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Phone, Mail, UserCircle2, Trash2, PencilLine, AlertCircle } from 'lucide-react';
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
import type { Client } from '../types';
import {
  CLIENTS_PAGE_SIZE,
  createClient,
  deleteClient,
  listClients,
  updateClient,
  type ClientInput,
} from '../services/clientsService';

interface ClientForm {
  name: string;
  phone: string;
  email: string;
}

const getEmptyForm = (): ClientForm => ({
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
  const [formValues, setFormValues] = useState<ClientForm>(getEmptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

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

  const handleModalChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingClient(null);
      setFormValues(getEmptyForm());
      setFormError(null);
    }
  };

  const handleNewClient = () => {
    if (!isAdmin) {
      return;
    }
    setEditingClient(null);
    setFormValues(getEmptyForm());
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    if (!isAdmin) {
      return;
    }
    setEditingClient(client);
    setFormValues({
      name: client.name,
      phone: client.phone,
      email: client.email ?? '',
    });
    setFormError(null);
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
        variant: 'destructive',
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

  const handleSaveClient = async () => {
    if (!isAdmin) {
      setFormError('Apenas administradores podem criar ou editar clientes.');
      return;
    }

    const trimmedName = formValues.name.trim();
    const trimmedPhone = formValues.phone.trim();
    const trimmedEmail = formValues.email.trim();

    if (!trimmedName) {
      setFormError('Informe o nome do cliente.');
      return;
    }
    if (!trimmedPhone) {
      setFormError('Informe um telefone válido.');
      return;
    }

    const payload: ClientInput = {
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail || null,
    };

    setFormError(null);

    const saved = editingClient
      ? await updateClientMutation.mutate({ id: editingClient.id, values: payload })
      : await createClientMutation.mutate(payload);

    if (!saved) {
      const mutationError = updateClientMutation.error || createClientMutation.error;
      setFormError(mutationError ?? 'Não foi possível salvar o cliente. Tente novamente.');
      return;
    }

    toast({
      title: editingClient ? 'Cliente atualizado' : 'Cliente cadastrado',
      description: `${saved.name} agora está disponível para novos orçamentos.`,
    });
    handleModalChange(false);
  };

  const mutationError = createClientMutation.error || updateClientMutation.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Clientes</p>
          <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
            Relacionamento & CRM
          </h1>
          <p className="text-muted-foreground">Gerencie contatos para novos orçamentos e pedidos.</p>
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

      <div className="space-y-2">
        <Label htmlFor="search-clients" className="text-sm font-semibold flex items-center gap-2">
          <Search className="size-4 text-rose-500" />
          Buscar por nome ou telefone
        </Label>
        <Input
          id="search-clients"
          placeholder="Ex.: Maria, (11) 9..."
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            setPage(1);
          }}
        />
      </div>

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

      <div className="rounded-2xl border border-dashed border-rose-200 bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-4 px-6 py-4 text-xs font-semibold uppercase text-muted-foreground tracking-wide">
          <span>Cliente</span>
          <span>Telefone</span>
          <span>Email</span>
          <span>Cadastro</span>
          <span className="text-right">Ações</span>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-muted-foreground">Carregando clientes...</div>
        ) : clientsData?.items.length ? (
          clientsData.items.map((client) => (
            <div
              key={client.id}
              className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-4 px-6 py-5 border-t border-border/60 text-sm items-center"
            >
              <div className="flex items-center gap-3">
                <div className="bg-rose-100 text-rose-700 rounded-full p-2">
                  <UserCircle2 className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{client.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {client.id.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Phone className="size-4 text-rose-500" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="size-4 text-rose-500" />
                <span>{client.email || '—'}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {client.created_at ? createdAtFormatter.format(new Date(client.created_at)) : '—'}
              </div>
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
            </div>
          ))
        ) : (
          <div className="px-6 py-12 text-center text-muted-foreground">
            Nenhum cliente encontrado para o filtro aplicado.
          </div>
        )}
      </div>

      {clientsData?.items.length ? (
        <div className="flex flex-col gap-3 border rounded-xl border-dashed border-rose-200 bg-rose-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Página <span className="font-semibold text-rose-600">{page}</span> de {totalPages} •{' '}
            exibindo {clientsData.items.length} de {totalItems} clientes
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

      <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Os dados serão salvos na tabela <code>clients</code>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome completo</Label>
              <Input
                id="client-name"
                placeholder="Ex.: Maria Silva"
                value={formValues.name}
                onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Telefone / WhatsApp</Label>
              <Input
                id="client-phone"
                placeholder="(11) 9 8888-0000"
                value={formValues.phone}
                onChange={(event) => setFormValues((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email (opcional)</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="cliente@email.com"
                value={formValues.email}
                onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>

            {formError && (
              <Alert variant="destructive">
                <AlertTitle>Verifique os dados</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {mutationError && !formError && (
              <Alert variant="destructive">
                <AlertTitle>Erro de Supabase</AlertTitle>
                <AlertDescription>{mutationError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="pt-4">
            {editingClient && (
              <Button
                variant="destructive"
                className="mr-auto"
                onClick={() => void handleDeleteClient(editingClient, { closeModal: true })}
                disabled={deleteClientMutation.isMutating}
              >
                {deleteClientMutation.isMutating ? 'Apagando...' : 'Excluir cliente'}
              </Button>
            )}
            <Button variant="outline" onClick={() => handleModalChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSaveClient()} disabled={isSaving}>
              {isSaving ? 'Salvando...' : editingClient ? 'Salvar alterações' : 'Cadastrar cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
