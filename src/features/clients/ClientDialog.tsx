import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { Loader2, Mail, Phone, User, MapPin, Cake, PencilLine, Trash2 } from 'lucide-react';
import { AppDialog } from '../../components/patterns/AppDialog';
import { FormField } from '../../components/patterns/FormField';
import type { Client } from '../../types';
import type { ClientInput } from '../../services/clientsService';

const clientFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome do cliente.'),
  phone: z.string().min(1, 'Informe um telefone valido.'),
  email: z.string().email('Informe um email valido.').optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  document_id: z.string().optional().or(z.literal('')),
  address_line1: z.string().optional().or(z.literal('')),
  address_line2: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSave: (data: ClientInput) => Promise<boolean>;
  onDelete?: (client: Client) => Promise<void>;
  isAdmin: boolean;
  isLoading?: boolean;
  initialEditMode?: boolean;
}

export function ClientDialog({
  open,
  onOpenChange,
  client,
  onSave,
  onDelete,
  isAdmin,
  isLoading = false,
  initialEditMode = false,
}: ClientDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      birth_date: '',
      document_id: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        setIsEditing(initialEditMode);
        form.reset({
          name: client.name,
          phone: client.phone,
          email: client.email || '',
          birth_date: client.birth_date || '',
          document_id: client.document_id || '',
          address_line1: client.address_line1 || '',
          address_line2: client.address_line2 || '',
          city: client.city || '',
          state: client.state || '',
          postal_code: client.postal_code || '',
          notes: client.notes || '',
        });
      } else {
        setIsEditing(true);
        form.reset({
          name: '',
          phone: '',
          email: '',
          birth_date: '',
          document_id: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          postal_code: '',
          notes: '',
        });
      }
    }
  }, [open, client, form, initialEditMode]);

  useEffect(() => {
    if (isEditing) {
      setActiveTab('profile');
    }
  }, [isEditing]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: ClientInput = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email?.trim() || null,
      birth_date: values.birth_date?.trim() || null,
      document_id: values.document_id?.trim() || null,
      address_line1: values.address_line1?.trim() || null,
      address_line2: values.address_line2?.trim() || null,
      city: values.city?.trim() || null,
      state: values.state?.trim() || null,
      postal_code: values.postal_code?.trim() || null,
      notes: values.notes?.trim() || null,
    };
    const success = await onSave(payload);
    if (success && client) {
      setIsEditing(false);
    }
  });

  const handleCancelEdit = () => {
    if (!client) {
      onOpenChange(false);
    } else {
      setIsEditing(false);
      form.reset({
        name: client.name,
        phone: client.phone,
        email: client.email || '',
        birth_date: client.birth_date || '',
        document_id: client.document_id || '',
        address_line1: client.address_line1 || '',
        address_line2: client.address_line2 || '',
        city: client.city || '',
        state: client.state || '',
        postal_code: client.postal_code || '',
        notes: client.notes || '',
      });
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setIsEditing(false);
        onOpenChange(next);
      }}
      size="lg"
      title={client ? null : (isEditing ? 'Novo Cliente' : 'Cliente')}
      description={client ? null : (isEditing ? 'Edite os dados do cliente abaixo.' : 'Visualize os dados do cliente.')}
      className={client ? undefined : "px-8 py-6"}
      contentClassName="p-0 !overflow-hidden !flex !flex-col h-[85vh] sm:h-[720px] bg-background gap-0"
    >
      {client && (
        <div className="px-8 py-6 bg-muted/20 border-b border-border shadow-sm">
          <div className="flex items-start gap-4 max-w-6xl mx-auto w-full">
            <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
              <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-1">
              <h2 className="text-2xl font-bold text-foreground">{client.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Mail className="w-3 h-3 mr-1" /> {client.email || 'Sem email'}
                </span>
                <span className="flex items-center">
                  <Phone className="w-3 h-3 mr-1" /> {client.phone}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <PencilLine className="w-4 h-4 mr-2" />
                Editar
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(client)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <FormProvider {...form}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="px-8 pt-3 border-b border-border bg-background">
            <div className="max-w-6xl mx-auto">
              <TabsList className="bg-muted h-11 px-1 py-1 rounded-full border border-border">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-full px-4 py-2 text-sm font-medium"
                >
                  Perfil
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  disabled={isEditing}
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Historico de Pedidos
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-muted/10 min-h-0">
            <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
              <TabsContent value="profile" className="mt-0 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground flex items-center">
                        <User className="w-4 h-4 mr-2 text-primary" /> Dados de Contato
                      </h3>
                      {isEditing && (
                        <span className="text-xs text-muted-foreground">Campos obrigatorios para salvar</span>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          name="name"
                          label="Nome Completo"
                          render={({ field }) => <Input {...field} placeholder="Ex: Maria da Silva" />}
                        />
                        <FormField
                          name="email"
                          label="E-mail"
                          render={({ field }) => <Input {...field} placeholder="email@exemplo.com" />}
                        />
                        <FormField
                          name="phone"
                          label="Telefone / WhatsApp"
                          render={({ field }) => <Input {...field} placeholder="(00) 00000-0000" />}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">Nome</p>
                          <p className="font-medium text-foreground">{client?.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">E-mail</p>
                          <p className="font-medium text-foreground">{client?.email || 'Sem email'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">Telefone / WhatsApp</p>
                          <p className="font-medium text-foreground">{client?.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center text-foreground">
                        <User className="w-4 h-4 mr-2 text-primary" /> Dados Pessoais
                      </h3>
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FormField
                            name="birth_date"
                            label="Data de Nascimento"
                            render={({ field }) => <Input type="date" {...field} />}
                          />
                          <FormField
                            name="document_id"
                            label="CPF/CNPJ"
                            render={({ field }) => <Input {...field} placeholder="000.000.000-00" />}
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <label className="text-muted-foreground block text-xs">Data de Nascimento</label>
                            <span className="font-medium">{client?.birth_date || 'Nao informado'}</span>
                          </div>
                          <div>
                            <label className="text-muted-foreground block text-xs">CPF/CNPJ</label>
                            <span className="font-medium">{client?.document_id || 'Nao informado'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center text-foreground">
                        <MapPin className="w-4 h-4 mr-2 text-primary" /> Endereco
                      </h3>
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FormField
                            name="address_line1"
                            label="Endereco (linha 1)"
                            render={({ field }) => <Input {...field} placeholder="Rua, numero" />}
                          />
                          <FormField
                            name="address_line2"
                            label="Complemento"
                            render={({ field }) => <Input {...field} placeholder="Apto, bloco, ref." />}
                          />
                          <FormField
                            name="city"
                            label="Cidade"
                            render={({ field }) => <Input {...field} placeholder="Cidade" />}
                          />
                          <FormField
                            name="state"
                            label="Estado"
                            render={({ field }) => <Input {...field} placeholder="UF" maxLength={2} />}
                          />
                          <FormField
                            name="postal_code"
                            label="CEP"
                            render={({ field }) => <Input {...field} placeholder="00000-000" />}
                          />
                        </div>
                      ) : (
                        <div className="text-sm space-y-1">
                          <p className="font-medium">
                            {client?.address_line1 || 'Sem endereco cadastrado'}
                          </p>
                          <p className="text-muted-foreground">
                            {[client?.address_line2, client?.city, client?.state, client?.postal_code]
                              .filter(Boolean)
                              .join(' • ') || '-'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center text-foreground">
                      <Cake className="w-4 h-4 mr-2 text-primary" /> Metricas
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted/20 p-3 rounded-lg border border-border">
                        <div className="text-xs text-muted-foreground">Total Gasto</div>
                        <div className="text-lg font-bold text-emerald-600">R$ 0,00</div>
                      </div>
                      <div className="bg-muted/20 p-3 rounded-lg border border-border">
                        <div className="text-xs text-muted-foreground">Pedidos</div>
                        <div className="text-lg font-bold text-foreground">0</div>
                      </div>
                      <div className="bg-muted/20 p-3 rounded-lg border border-border">
                        <div className="text-xs text-muted-foreground">Ticket Medio</div>
                        <div className="text-lg font-bold text-blue-600">R$ 0,00</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center">
                      <User className="w-4 h-4 mr-2 text-primary" /> Observacoes
                    </h3>
                    {isEditing ? (
                      <FormField
                        name="notes"
                        label="Anotacoes sobre o cliente"
                        render={({ field }) => (
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder="Preferencias, restricoes, observacoes gerais..."
                          />
                        )}
                      />
                    ) : (
                      <p className="text-sm text-foreground">{client?.notes || 'Sem anotacoes'}</p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t border-border mt-8 -mx-8 px-8 flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={handleCancelEdit}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Cadastro
                      </Button>
                    </div>
                  )}
                </form>
              </TabsContent>

              <TabsContent value="orders" className="mt-0">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {isEditing ? 'Conclua a edicao para ver pedidos.' : 'Nenhum pedido encontrado para este cliente.'}
                  </p>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </FormProvider>
    </AppDialog>
  );
}
