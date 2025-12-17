import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreHorizontal,
  AlertTriangle,
  Package,
  Trash2,
  PencilLine,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AppDialog } from '../components/patterns/AppDialog';
import { FilterBar } from '../components/patterns/FilterBar';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../hooks/useSupabaseMutation';
import type { InventoryItem } from '../types';
import { deleteInventoryItem, listInventoryItems, saveInventoryItem, type InventoryItemInput } from '../services/inventoryService';
import { StatusMenu } from '../components/patterns/StatusBadge';
import { INVENTORY_STATUS_OPTIONS } from '../constants/status';

// Helpers extraídos
import { INVENTORY_CATEGORIES, DEFAULT_INVENTORY_FORM, deriveStatus } from './inventory/helpers/statusHelpers';
export default function InventoryPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<InventoryItemInput>(DEFAULT_INVENTORY_FORM);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setEditing(null);
      setForm(DEFAULT_INVENTORY_FORM);
      setIsDialogOpen(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      });
    }
  }, [searchParams, setSearchParams]);

  const fetchInventory = useCallback(
    () => listInventoryItems({ category: activeTab, search }),
    [activeTab, search],
  );

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useSupabaseQuery<InventoryItem[]>(fetchInventory, { initialData: [], deps: [activeTab, search] });

  const saveMutation = useSupabaseMutation(saveInventoryItem, {
    onSuccess: () => {
      toast.success('Item salvo com sucesso.');
      setIsDialogOpen(false);
      setEditing(null);
      setForm(DEFAULT_INVENTORY_FORM);
      void refetch();
    },
    onError: (message) => toast.error(message),
  });

  const toggleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAllCurrent = (checked: boolean) => {
    setSelectedItems(checked ? new Set(items.map((i) => i.id!)) : new Set());
  };

  const clearSelection = () => setSelectedItems(new Set());

  const handleBulkStatus = async (status: string) => {
    if (selectedItems.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const ids = [...selectedItems];
      await Promise.all(
        ids.map(async (id) => {
          const current = items.find((i) => i.id === id);
          if (!current) return;
          await saveMutation.mutate({ ...current, status });
        }),
      );
      toast.success('Status atualizado em lote.');
      clearSelection();
      void refetch();
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!window.confirm('Excluir itens selecionados do estoque?')) return;
    setIsBulkProcessing(true);
    try {
      const ids = [...selectedItems];
      await Promise.all(ids.map((id) => deleteMutation.mutate(id)));
      toast.success(`${ids.length} item(s) removidos.`);
      clearSelection();
      void refetch();
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const deleteMutation = useSupabaseMutation(deleteInventoryItem, {
    onSuccess: () => {
      toast.success('Item removido.');
      void refetch();
    },
    onError: (message) => toast.error(message),
  });

  const metrics = useMemo(() => {
    const critical = items.filter((i) => deriveStatus(i) === 'critical').length;
    const low = items.filter((i) => deriveStatus(i) === 'low').length;
    const total = items.length;
    return { critical, low, total };
  }, [items]);

  const allCurrentSelected = items.length > 0 && items.every((i) => selectedItems.has(i.id!));
  const someSelected = selectedItems.size > 0;
  const headerChecked = allCurrentSelected ? true : someSelected ? 'indeterminate' : false;

  useEffect(() => {
    setSelectedItems((prev) => {
      const visibleIds = new Set(items.map((i) => i.id));
      return new Set([...prev].filter((id) => visibleIds.has(id)));
    });
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm(DEFAULT_INVENTORY_FORM);
    setIsDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      min_stock: item.min_stock,
      category: item.category || 'mercado',
      status: item.status,
      location: item.location || '',
      notes: item.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void saveMutation.mutate(form);
  };

  const handleDelete = (item: InventoryItem) => {
    void deleteMutation.mutate(item.id);
  };

  const handleStatusChange = (item: InventoryItem, status: string) => {
    void saveMutation.mutate({
      ...item,
      status,
    });
  };

  return (
    <div className="space-y-6 fade-in h-auto md:h-[calc(100vh-8rem)] flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-none">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Controle de Estoque</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerencie insumos, embalagens e materiais de trabalho.</p>
        </div>

        <AppDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          size="sm"
          title={editing ? 'Editar Item' : 'Adicionar ao Estoque'}
          trigger={
            <Button className="hidden sm:flex bg-rose-500 hover:bg-rose-600 text-white w-full sm:w-auto" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          }
          footer={
            <Button type="submit" onClick={handleSubmit} disabled={saveMutation.isMutating}>
              {saveMutation.isMutating ? 'Salvando...' : 'Salvar Item'}
            </Button>
          }
        >
          <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label>Nome do Item</Label>
              <Input
                placeholder="Ex: Chocolate em pó 50%"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantidade Atual</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Unidade</Label>
                <Select
                  value={form.unit}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, unit: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Un." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Quilo (kg)</SelectItem>
                    <SelectItem value="g">Grama (g)</SelectItem>
                    <SelectItem value="l">Litro (L)</SelectItem>
                    <SelectItem value="ml">Mililitro (ml)</SelectItem>
                    <SelectItem value="un">Unidade (un)</SelectItem>
                    <SelectItem value="cx">Caixa (cx)</SelectItem>
                    <SelectItem value="pct">Pacote (pct)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Estoque Mínimo</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.min_stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, min_stock: Number(e.target.value) }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select
                  value={form.category || 'mercado'}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVENTORY_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Local de Armazenagem</Label>
              <Input
                placeholder="Ex: Prateleira 3, Despensa B"
                value={form.location ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Input
                placeholder="Preferências, validade, fornecedor..."
                value={form.notes ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </form>
        </AppDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 flex-none">
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Itens críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-rose-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-foreground">{metrics.critical}</div>
                <p className="text-xs text-muted-foreground">Precisam de reposição urgente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Baixo estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-8 w-8 text-amber-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-foreground">{metrics.low}</div>
                <p className="text-xs text-muted-foreground">Abaixo da margem mínima</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Itens cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-8 w-8 text-muted-foreground mr-3" />
              <div>
                <div className="text-2xl font-bold text-foreground">{metrics.total}</div>
                <p className="text-xs text-muted-foreground">Total de registros de estoque</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-none md:flex-1 flex flex-col min-h-0 w-full">
        <FilterBar
          left={
            <TabsList className="bg-muted p-1 w-full sm:w-auto flex overflow-x-auto">
              {INVENTORY_CATEGORIES.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="data-[state=active]:bg-card data-[state=active]:text-primary flex-1 sm:flex-none"
                >
                  <cat.icon className="h-4 w-4 mr-2 sm:mr-0 md:mr-2" />
                  <span className="hidden md:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          }
          right={
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                className="pl-10 bg-card w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
          className="mb-4"
        />

        <Card className="border-border shadow-sm flex-none md:flex-1 flex flex-col overflow-hidden">
          <CardContent className="p-0 flex-1 overflow-auto">
            {someSelected && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-primary/20 bg-primary/5">
                <div className="text-sm font-medium text-foreground">{selectedItems.size} selecionado(s)</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); void handleBulkStatus('ok'); }}
                    disabled={isBulkProcessing}
                  >
                    <Badge className="mr-2 bg-emerald-100 text-emerald-800">OK</Badge>
                    Marcar como ok
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); void handleBulkStatus('low'); }}
                    disabled={isBulkProcessing}
                  >
                    <Badge className="mr-2 bg-amber-100 text-amber-800">Baixo</Badge>
                    Baixo estoque
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); void handleBulkStatus('critical'); }}
                    disabled={isBulkProcessing}
                  >
                    <Badge className="mr-2 bg-rose-100 text-rose-800">Crítico</Badge>
                    Crítico
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => { e.stopPropagation(); void handleBulkDelete(); }}
                    disabled={isBulkProcessing}
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
                    <TableHead className="w-[300px]">Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                        Carregando estoque...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                        Nenhum item encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((item) => {
                    const status = deriveStatus(item);
                    return (
                      <TableRow
                        key={item.id}
                        className="group hover:bg-muted/50 cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('input')) return;
                          openEdit(item);
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedItems.has(item.id!)}
                            onCheckedChange={(checked) => toggleSelectItem(item.id!, Boolean(checked))}
                            aria-label={`Selecionar ${item.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{item.name}</div>
                          {item.quantity <= item.min_stock && (
                            <div className="text-xs text-rose-600 flex items-center mt-1">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Repor: mínimo {item.min_stock} {item.unit}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize font-normal">
                            {item.category || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{item.location || '—'}</TableCell>
                        <TableCell>
                          <StatusMenu
                            status={status}
                            options={INVENTORY_STATUS_OPTIONS}
                            onChange={(next) => handleStatusChange(item, next)}
                            disabled={saveMutation.isMutating}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {item.quantity} <span className="text-muted-foreground text-xs">{item.unit}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(item);
                                }}
                              >
                                <PencilLine className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-rose-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(item);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {error && (
              <div className="text-sm text-rose-600 px-4 py-3 border-t border-rose-100 bg-rose-50">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
