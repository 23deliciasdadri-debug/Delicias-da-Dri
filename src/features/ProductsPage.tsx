import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  ImageIcon,
  Package,
  Loader2
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';

import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../hooks/useSupabaseMutation';
import { useAuth } from '../providers/AuthProvider';
import type { ComponentCategory, Product, ProductType } from '../types';
import {
  PRODUCTS_PAGE_SIZE,
  createProduct,
  deleteProduct,
  listComponentCategories,
  listProducts,
  updateProduct,
  type ProductInput,
} from '../services/productsService';
import {
  deleteProductMediaRecord,
  listProductMedia,
  uploadProductMediaFile,
} from '../services/productMediaService';
import { FormField, FormSection, ImagePicker, AppDialog, DialogFooter, FilterBar } from '../components/patterns';
import type { ImagePickerItem } from '../components/patterns/ImagePicker';
import { ViewSwitcher, type ViewType } from '../components/ViewSwitcher';

// --- Logic & Helpers (Preserved) ---

type ProductTypeFilter = 'ALL' | ProductType;
type ComponentCategoryFilter = 'ALL' | string;

interface MediaDraftItem {
  id: string;
  mediaId?: number;
  storagePath?: string;
  url: string;
  file?: File;
  status?: 'idle' | 'pending' | 'uploading' | 'error';
}

const createLocalId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const releaseObjectUrl = (url?: string) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

const parsePriceInput = (value: string) => {
  if (!value) return 0;
  const normalized = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : 0;
};

const productFormSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome do produto.'),
    description: z.string().optional().or(z.literal('')),
    price: z.string().min(1, 'Informe o preço.').refine(v => parsePriceInput(v) > 0, 'Preço inválido.'),
    unit_type: z.string().min(1, 'Informe a unidade.'),
    product_type: z.union([z.literal('PRODUTO_MENU'), z.literal('COMPONENTE_BOLO')]),
    component_category: z.string().optional().or(z.literal('')),
    image_url: z.union([z.literal(''), z.string().url('URL inválida.')]),
    is_public: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.product_type === 'COMPONENTE_BOLO' && !data.component_category?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Componentes precisam de uma categoria.',
        path: ['component_category'],
      });
    }
  });

type ProductFormValues = z.infer<typeof productFormSchema>;

const getDefaultProductForm = (): ProductFormValues => ({
  name: '',
  description: '',
  price: '',
  unit_type: '',
  product_type: 'PRODUTO_MENU',
  component_category: '',
  image_url: '',
  is_public: true,
});

const DEFAULT_COMPONENT_CATEGORIES: ComponentCategory[] = ['tamanho', 'recheio', 'cobertura', 'decoração'];

export default function ProductsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();

  // --- State ---
  const [view, setView] = useState<ViewType>('gallery');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: getDefaultProductForm(),
  });

  const productTypeValue = productForm.watch('product_type');
  const isComponentProduct = productTypeValue === 'COMPONENTE_BOLO';

  // Media State
  const [mediaItems, setMediaItems] = useState<MediaDraftItem[]>([]);
  const [removedMedia, setRemovedMedia] = useState<Array<{ id: number; storagePath?: string }>>([]);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [isSyncingMedia, setIsSyncingMedia] = useState(false);
  const mediaItemsRef = useRef<MediaDraftItem[]>([]);

  useEffect(() => { mediaItemsRef.current = mediaItems; }, [mediaItems]);
  useEffect(() => () => {
    mediaItemsRef.current.forEach((item) => { if (item.file) releaseObjectUrl(item.url); });
  }, []);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<ProductTypeFilter>('ALL');
  const [componentCategoryFilter, setComponentCategoryFilter] = useState<ComponentCategoryFilter>('ALL');
  const [page, setPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      if (!isAdmin) return;
      setEditingProduct(null);
      productForm.reset(getDefaultProductForm());
      setMediaItems([]);
      setIsModalOpen(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      });
    }
  }, [searchParams, setSearchParams, isAdmin, productForm]);

  // --- Data Fetching ---
  const fetchCategories = useCallback(() => listComponentCategories(), []);
  const { data: categoriesData } = useSupabaseQuery(fetchCategories, { initialData: DEFAULT_COMPONENT_CATEGORIES });

  const componentCategories = useMemo(() => {
    const unique = new Set<string>([...DEFAULT_COMPONENT_CATEGORIES, ...(categoriesData || [])]);
    return Array.from(unique).sort();
  }, [categoriesData]);

  const fetchProducts = useCallback(() => listProducts({
    page,
    pageSize: PRODUCTS_PAGE_SIZE,
    search: debouncedSearch || undefined,
    productType: productTypeFilter === 'ALL' ? undefined : productTypeFilter,
    componentCategory: productTypeFilter === 'COMPONENTE_BOLO' && componentCategoryFilter !== 'ALL' ? componentCategoryFilter : undefined,
  }), [page, debouncedSearch, productTypeFilter, componentCategoryFilter]);

  const { data: productsData, isLoading, refetch: refetchProducts } = useSupabaseQuery(fetchProducts, { deps: [fetchProducts], initialData: { items: [], total: 0 } });
  const products = productsData?.items ?? [];
  const totalItems = productsData?.total ?? 0;

  useEffect(() => {
    setSelectedProducts((prev) => {
      const visibleIds = new Set(products.map((p) => p.id));
      return new Set([...prev].filter((id) => visibleIds.has(id)));
    });
  }, [products]);

  // --- Mutations ---
  const createMutation = useSupabaseMutation(createProduct);
  const updateMutation = useSupabaseMutation(({ id, values }: { id: string; values: ProductInput }) => updateProduct(id, values));
  const deleteMutation = useSupabaseMutation(deleteProduct);

  const isSaving = createMutation.isMutating || updateMutation.isMutating || isSyncingMedia;

  // --- Handlers ---
  const handleNewProduct = () => {
    if (!isAdmin) return;
    setEditingProduct(null);
    productForm.reset(getDefaultProductForm());
    setMediaItems([]);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    if (!isAdmin) return;
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      description: product.description ?? '',
      price: product.price.toString(),
      unit_type: product.unit_type,
      product_type: product.product_type,
      component_category: product.component_category ?? '',
      image_url: product.image_url ?? '',
      is_public: product.product_type === 'COMPONENTE_BOLO' ? false : product.is_public,
    });
    loadProductMedia(product.id);
    setIsModalOpen(true);
  };

  const loadProductMedia = async (productId: string) => {
    setIsMediaLoading(true);
    try {
      const media = await listProductMedia(productId);
      setMediaItems(media.map(item => ({
        id: `media-${item.id}`,
        mediaId: item.id,
        storagePath: item.storage_path,
        url: item.public_url,
        status: 'idle'
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setIsMediaLoading(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!isAdmin || !window.confirm(`Excluir "${product.name}"?`)) return;
    await deleteMutation.mutate(product.id);
    toast.success('Produto excluído');
    refetchProducts();
  };

  const toggleSelectProduct = (id: string, checked: boolean) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAllCurrent = (checked: boolean) => {
    setSelectedProducts(checked ? new Set(products.map((p) => p.id)) : new Set());
  };

  const clearSelection = () => setSelectedProducts(new Set());

  const handleBulkDelete = async () => {
    if (!isAdmin || selectedProducts.size === 0) return;
    if (!window.confirm('Excluir produtos selecionados?')) return;
    setIsBulkProcessing(true);
    try {
      const ids = [...selectedProducts];
      await Promise.all(ids.map((id) => deleteMutation.mutate(id)));
      toast.success(`${ids.length} produto(s) excluídos`);
      clearSelection();
      await refetchProducts();
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const allCurrentSelected = products.length > 0 && products.every((p) => selectedProducts.has(p.id));
  const someSelected = selectedProducts.size > 0;
  const headerChecked = allCurrentSelected ? true : someSelected ? 'indeterminate' : false;

  const handleSubmit = productForm.handleSubmit(async (values) => {
    if (!isAdmin) return;

    const payload: ProductInput = {
      name: values.name,
      description: values.description || null,
      price: parsePriceInput(values.price),
      unit_type: values.unit_type,
      product_type: values.product_type,
      component_category: values.product_type === 'COMPONENTE_BOLO' ? values.component_category || null : null,
      image_url: values.image_url || null,
      is_public: values.is_public,
    };

    const saved = editingProduct
      ? await updateMutation.mutate({ id: editingProduct.id, values: payload })
      : await createMutation.mutate(payload);

    if (saved) {
      if (mediaItems.length > 0 || removedMedia.length > 0) {
        await syncProductMedia(saved.id);
      }
      toast.success('Produto salvo com sucesso');
      setIsModalOpen(false);
      refetchProducts();
    } else {
      toast.error('Erro ao salvar produto');
    }
  });

  const syncProductMedia = async (productId: string) => {
    setIsSyncingMedia(true);
    try {
      for (const m of removedMedia) {
        await deleteProductMediaRecord(m.id, m.storagePath!);
      }
      let index = 0;
      for (const item of mediaItems) {
        if (item.file) {
          await uploadProductMediaFile(productId, item.file, index);
        }
        index++;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingMedia(false);
    }
  };

  const handleAddMediaFiles = (files: File[]) => {
    const newItems = files.map(file => ({
      id: `local-${createLocalId()}`,
      file,
      url: URL.createObjectURL(file),
      status: 'pending' as const
    }));
    setMediaItems(prev => [...prev, ...newItems]);
  };

  const handleRemoveMediaItem = (id: string) => {
    setMediaItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.mediaId) {
        setRemovedMedia(r => [...r, { id: item.mediaId!, storagePath: item.storagePath }]);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const handleReorderMediaItems = (items: ImagePickerItem[]) => {
    // Reorder logic implementation
  };

  const imagePickerItems: ImagePickerItem[] = mediaItems.map(m => ({
    id: m.id,
    url: m.url,
    status: m.status || 'idle',
    canSetAsCover: !m.file
  }));

  const handleSelectCoverImage = (item: ImagePickerItem) => {
    if (!item.url.startsWith('blob:')) {
      productForm.setValue('image_url', item.url, { shouldDirty: true });
    }
  };



  return (
    <div className="space-y-6 fade-in h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-none">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Catálogo de Produtos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os itens disponíveis para venda.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleNewProduct} className="hidden sm:flex bg-rose-500 hover:bg-rose-600 text-white" disabled={!isAdmin}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
          <ViewSwitcher currentView={view} onViewChange={setView} availableViews={['gallery', 'list']} />
        </div>
      </div>

      <FilterBar
        left={
          <>
            <Button
              size="sm"
              variant={productTypeFilter === 'ALL' ? 'secondary' : 'ghost'}
              className={`h-9 px-3 text-sm ${productTypeFilter === 'ALL' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'}`}
              onClick={() => setProductTypeFilter('ALL')}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={productTypeFilter === 'PRODUTO_MENU' ? 'secondary' : 'ghost'}
              className={`h-9 px-3 text-sm ${productTypeFilter === 'PRODUTO_MENU' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'}`}
              onClick={() => setProductTypeFilter('PRODUTO_MENU')}
            >
              Menu
            </Button>
            <Button
              size="sm"
              variant={productTypeFilter === 'COMPONENTE_BOLO' ? 'secondary' : 'ghost'}
              className={`h-9 px-3 text-sm ${productTypeFilter === 'COMPONENTE_BOLO' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'}`}
              onClick={() => setProductTypeFilter('COMPONENTE_BOLO')}
            >
              Componentes
            </Button>
          </>
        }
        right={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              className="pl-10 bg-card"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        }
        className="mb-6"
      />

      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          </div>
        ) : productsData?.items.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">Tente ajustar os filtros ou adicione um novo produto.</p>
          </div>
        ) : view === 'gallery' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 pb-4">
            {productsData?.items.map((product) => (
              <Card key={product.id} className="overflow-hidden border-border shadow-sm hover:shadow-md transition-all group h-fit bg-card">
                <div className="aspect-square relative overflow-hidden bg-muted/20 cursor-pointer" onClick={() => handleEditProduct(product)}>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                      <ImageIcon className="h-12 w-12" />
                    </div>
                  )}

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 bg-card/90 backdrop-blur-sm shadow-sm">
                          <MoreHorizontal className="h-4 w-4 text-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteProduct(product)}>
                          <Trash className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-card/90 text-foreground hover:bg-card shadow-sm backdrop-blur-sm">
                      {product.product_type === 'COMPONENTE_BOLO' ? product.component_category : 'Menu'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4" onClick={() => handleEditProduct(product)}>
                  <h3 className="font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors" title={product.name}>{product.name}</h3>
                  <div className="flex items-baseline mt-1 text-muted-foreground text-sm">
                    <span className="text-lg font-bold text-primary mr-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </span>
                    / {product.unit_type}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border shadow-sm bg-card">
            {someSelected && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-primary/20 bg-primary/5">
                <div className="text-sm font-medium text-foreground">
                  {selectedProducts.size} selecionado(s)
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => { e.stopPropagation(); void handleBulkDelete(); }}
                    disabled={isBulkProcessing || !isAdmin}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Excluir selecionados
                  </Button>
                </div>
              </div>
            )}
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={headerChecked}
                        onCheckedChange={(checked) => selectAllCurrent(Boolean(checked))}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead className="w-[80px]">Img</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço Unit.</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow
                      key={product.id}
                      className="hover:bg-muted/50 cursor-pointer group"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('input')) return;
                        handleEditProduct(product);
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={(checked) => toggleSelectProduct(product.id, Boolean(checked))}
                          aria-label={`Selecionar produto ${product.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="h-10 w-10 rounded bg-muted/50 overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground/50">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.product_type === 'COMPONENTE_BOLO' ? product.component_category : 'Menu'}</Badge>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{product.unit_type}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-rose-600" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product); }}>
                              <Trash className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      <AppDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        size="md"
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
      >
        <FormProvider {...productForm}>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Nome do Produto"
                name="name"
                render={({ field }) => <Input {...field} placeholder="Ex: Bolo de Cenoura" />}
              />
              <FormField
                label="Preço"
                name="price"
                render={({ field }) => <Input {...field} placeholder="0,00" />}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Tipo"
                name="product_type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUTO_MENU">Produto do Menu</SelectItem>
                      <SelectItem value="COMPONENTE_BOLO">Componente de Bolo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                label="Unidade"
                name="unit_type"
                render={({ field }) => <Input {...field} placeholder="Ex: kg, un, cento" />}
              />
            </div>
            {isComponentProduct && (
              <FormField
                label="Categoria do Componente"
                name="component_category"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASSA">Massa</SelectItem>
                      <SelectItem value="RECHEIO">Recheio</SelectItem>
                      <SelectItem value="COBERTURA">Cobertura</SelectItem>
                      <SelectItem value="DECORACAO">Decoração</SelectItem>
                      <SelectItem value="OUTROS">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            )}

            <FormField
              label="Descrição"
              name="description"
              render={({ field }) => <Input {...field} placeholder="Detalhes do produto..." />}
            />

            <FormSection title="Imagens" description="Adicione fotos do produto. A primeira será a capa.">
              <ImagePicker
                items={imagePickerItems}
                onAddFiles={handleAddMediaFiles}
                onRemoveItem={handleRemoveMediaItem}
                onReorderItems={handleReorderMediaItems}
                onSelectCover={handleSelectCoverImage}
                coverUrl={productForm.watch('image_url')}
                disabled={isMediaLoading}
              />
            </FormSection>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Produto
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </AppDialog>
    </div>
  );
}
