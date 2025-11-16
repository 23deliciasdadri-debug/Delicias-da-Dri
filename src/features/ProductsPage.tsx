import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { FormField, FormSection, ImagePicker, LoadingState } from '../components/patterns';
import type { ImagePickerItem } from '../components/patterns/ImagePicker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import {
  AlertCircle,
  Filter,
  Loader2,
  Package,
  Plus,
  Search,
} from 'lucide-react';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../hooks/useSupabaseMutation';
import { useToast } from '../hooks/use-toast';
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
import ProductCard from './products/components/ProductCard';
import ProductDetailsDrawer from './products/components/ProductDetailsDrawer';
import {
  deleteProductMediaRecord,
  listProductMedia,
  reorderProductMedia,
  uploadProductMediaFile,
  type ProductMediaWithUrl,
} from '../services/productMediaService';

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
  if (!value) {
    return 0;
  }
  const normalized = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : 0;
};

const productFormSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome do produto.'),
    description: z.string().optional().or(z.literal('')),
    price: z
      .string()
      .min(1, 'Informe o preço do produto.')
      .refine(
        (value) => parsePriceInput(value) > 0,
        'Informe um preço válido (use ponto ou vírgula).',
      ),
    unit_type: z.string().min(1, 'Informe a unidade de venda (ex.: kg, unidade).'),
    product_type: z.union([z.literal('PRODUTO_MENU'), z.literal('COMPONENTE_BOLO')]),
    component_category: z.string().optional().or(z.literal('')),
    image_url: z.union([z.literal(''), z.string().url('Informe uma URL válida.')]),
    is_public: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.product_type === 'COMPONENTE_BOLO' && !data.component_category?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Componentes precisam de uma categoria (tamanho, recheio, etc).',
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

const DEFAULT_COMPONENT_CATEGORIES: ComponentCategory[] = [
  'tamanho',
  'recheio',
  'cobertura',
  'decoração',
];

const ProductsPage: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: getDefaultProductForm(),
  });
  const productTypeValue = productForm.watch('product_type');
  const isComponentProduct = productTypeValue === 'COMPONENTE_BOLO';
  const [mediaItems, setMediaItems] = useState<MediaDraftItem[]>([]);
  const [removedMedia, setRemovedMedia] = useState<Array<{ id: number; storagePath?: string }>>([]);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isSyncingMedia, setIsSyncingMedia] = useState(false);
  const mediaItemsRef = useRef<MediaDraftItem[]>([]);

  useEffect(() => {
    mediaItemsRef.current = mediaItems;
  }, [mediaItems]);

  useEffect(
    () => () => {
      mediaItemsRef.current.forEach((item) => {
        if (item.file) {
          releaseObjectUrl(item.url);
        }
      });
    },
    [],
  );

  useEffect(() => {
    const currentIsPublic = productForm.getValues('is_public');
    if (isComponentProduct && currentIsPublic) {
      productForm.setValue('is_public', false, { shouldDirty: true });
    }
    if (!isComponentProduct) {
      const currentCategory = productForm.getValues('component_category') ?? '';
      if (currentCategory) {
        productForm.setValue('component_category', '', { shouldDirty: true });
      }
    }
  }, [isComponentProduct, productForm]);

  const resetMediaState = useCallback(() => {
    setMediaItems((prev) => {
      prev.forEach((item) => {
        if (item.file) {
          releaseObjectUrl(item.url);
        }
      });
      return [];
    });
    setRemovedMedia([]);
    setMediaError(null);
    setIsMediaLoading(false);
  }, []);

  const loadProductMedia = useCallback(async (productId: string) => {
    if (!productId) {
      return;
    }
    setIsMediaLoading(true);
    setMediaError(null);
    try {
      const media = await listProductMedia(productId);
      setMediaItems(
        media.map((item) => ({
          id: `media-${item.id}`,
          mediaId: item.id,
          storagePath: item.storage_path,
          url: item.public_url,
          status: 'idle',
        })),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar a galeria de imagens.';
      setMediaError(message);
    } finally {
      setIsMediaLoading(false);
    }
  }, []);

  const createMediaDraftFromFile = (file: File): MediaDraftItem => ({
    id: `local-${createLocalId()}`,
    file,
    url: URL.createObjectURL(file),
    status: 'pending',
  });

  const handleAddMediaFiles = (files: File[]) => {
    if (!files.length) {
      return;
    }
    const drafts = files.map((file) => createMediaDraftFromFile(file));
    setMediaItems((prev) => [...prev, ...drafts]);
  };

  const handleRemoveMediaItem = (mediaId: string) => {
    setMediaItems((prev) => {
      const target = prev.find((item) => item.id === mediaId);
      if (!target) {
        return prev;
      }
      if (target.file) {
        releaseObjectUrl(target.url);
      }
      if (target.mediaId) {
        setRemovedMedia((prevRemoved) => [
          ...prevRemoved,
          { id: target.mediaId as number, storagePath: target.storagePath },
        ]);
      }
      return prev.filter((item) => item.id !== mediaId);
    });
  };

  const handleReorderMediaItems = (orderedItems: ImagePickerItem[]) => {
    setMediaItems((prev) => {
      const lookup = new Map<string, MediaDraftItem>();
      prev.forEach((item) => lookup.set(item.id, item));
      const reordered: MediaDraftItem[] = [];
      orderedItems.forEach((ordered) => {
        const found = lookup.get(ordered.id);
        if (found) {
          reordered.push(found);
        }
      });
      if (reordered.length === prev.length) {
        return reordered;
      }
      prev.forEach((item) => {
        if (!reordered.includes(item)) {
          reordered.push(item);
        }
      });
      return reordered;
    });
  };

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<ProductTypeFilter>('ALL');
  const [componentCategoryFilter, setComponentCategoryFilter] = useState<ComponentCategoryFilter>('ALL');
  const [page, setPage] = useState(1);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [detailsMedia, setDetailsMedia] = useState<ProductMediaWithUrl[]>([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const fetchCategories = useCallback(() => listComponentCategories(), []);

  const {
    data: categoriesData,
    refetch: refetchComponentCategories,
  } = useSupabaseQuery<ComponentCategory[]>(fetchCategories, {
    initialData: DEFAULT_COMPONENT_CATEGORIES,
  });

  const componentCategories = useMemo(() => {
    const unique = new Set<string>();
    DEFAULT_COMPONENT_CATEGORIES.forEach((category) => {
      if (category && typeof category === 'string') {
        unique.add(category);
      }
    });
    categoriesData?.forEach((category) => {
      if (category && typeof category === 'string') {
        unique.add(category);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [categoriesData]);

  const fetchProducts = useCallback(
    () =>
      listProducts({
        page,
        pageSize: PRODUCTS_PAGE_SIZE,
        search: debouncedSearch || undefined,
        productType: productTypeFilter === 'ALL' ? undefined : (productTypeFilter as ProductType),
        componentCategory:
          productTypeFilter === 'COMPONENTE_BOLO' && componentCategoryFilter !== 'ALL'
            ? (componentCategoryFilter as ComponentCategory)
            : undefined,
      }),
    [page, debouncedSearch, productTypeFilter, componentCategoryFilter],
  );

  const {
    data: productsData,
    isLoading,
    error: listError,
    refetch: refetchProducts,
  } = useSupabaseQuery(fetchProducts, {
    deps: [fetchProducts],
    initialData: { items: [], total: 0 },
  });

  const formCreateProductMutation = useSupabaseMutation(createProduct);
  const formUpdateProductMutation = useSupabaseMutation(
    ({ id, values }: { id: string; values: ProductInput }) => updateProduct(id, values),
  );
  const deleteProductMutation = useSupabaseMutation(deleteProduct);
  const quickUpdateProductMutation = useSupabaseMutation(
    ({ id, values }: { id: string; values: Partial<ProductInput> }) => updateProduct(id, values),
  );
  const duplicateProductMutation = useSupabaseMutation(createProduct);

  const isSaving =
    formCreateProductMutation.isMutating || formUpdateProductMutation.isMutating || isSyncingMedia;
  const totalItems = productsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PRODUCTS_PAGE_SIZE));

  const formatCurrency = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
      }),
    [],
  );

  const syncProductMedia = useCallback(
    async (productId: string) => {
      if (!productId) {
        return;
      }
      const hasUploads = mediaItems.some((item) => item.file);
      const hasExisting = mediaItems.some((item) => item.mediaId);
      if (!hasUploads && !removedMedia.length && !hasExisting) {
        return;
      }
      setIsSyncingMedia(true);
      let workingItems = [...mediaItems];
      try {
        if (removedMedia.length) {
          for (const media of removedMedia) {
            await deleteProductMediaRecord(media.id, media.storagePath);
          }
          setRemovedMedia([]);
        }

        for (let index = 0; index < workingItems.length; index += 1) {
          const current = workingItems[index];
          if (!current.file) {
            continue;
          }
          workingItems = workingItems.map((item) =>
            item.id === current.id ? { ...item, status: 'uploading' } : item,
          );
          setMediaItems(workingItems);
          const uploaded = await uploadProductMediaFile(productId, current.file, index);
          releaseObjectUrl(current.url);
          workingItems = workingItems.map((item) =>
            item.id === current.id
              ? {
                  ...item,
                  mediaId: uploaded.id,
                  storagePath: uploaded.storage_path,
                  url: uploaded.public_url,
                  file: undefined,
                  status: 'idle',
                }
              : item,
          );
          setMediaItems(workingItems);
        }

        const reorderPayload = workingItems
          .filter(
            (item): item is MediaDraftItem & { mediaId: number; storagePath: string } =>
              Boolean(item.mediaId && item.storagePath),
          )
          .map((item, index) => ({
            id: item.mediaId as number,
            storage_path: item.storagePath as string,
            sort_order: index,
          }));
        if (reorderPayload.length) {
          await reorderProductMedia(productId, reorderPayload);
        }
        setMediaItems(workingItems);
      } catch (error) {
        workingItems = workingItems.map((item) =>
          item.status === 'uploading' ? { ...item, status: 'error' } : item,
        );
        setMediaItems(workingItems);
        throw error;
      } finally {
        setIsSyncingMedia(false);
      }
    },
    [mediaItems, removedMedia],
  );

  const handleModalChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingProduct(null);
      setFormError(null);
      productForm.reset(getDefaultProductForm());
      formCreateProductMutation.reset();
      formUpdateProductMutation.reset();
      resetMediaState();
    }
  };

  const handleNewProduct = () => {
    if (!isAdmin) {
      return;
    }
    setEditingProduct(null);
    setFormError(null);
    productForm.reset(getDefaultProductForm());
    formCreateProductMutation.reset();
    formUpdateProductMutation.reset();
    resetMediaState();
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    if (!isAdmin) {
      return;
    }
    setEditingProduct(product);
    setFormError(null);
    formCreateProductMutation.reset();
    formUpdateProductMutation.reset();
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
    resetMediaState();
    void loadProductMedia(product.id);
    setIsModalOpen(true);
  };

  const handleOpenProductDetails = async (product: Product) => {
    setDetailsProduct(product);
    setDetailsMedia([]);
    setDetailsError(null);
    setIsDetailsOpen(true);
    setIsDetailsLoading(true);
    try {
      const media = await listProductMedia(product.id);
      setDetailsMedia(media);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar a galeria deste produto.';
      setDetailsError(message);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleCloseProductDetails = () => {
    setIsDetailsOpen(false);
    setDetailsProduct(null);
    setDetailsMedia([]);
    setDetailsError(null);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!isAdmin) {
      return;
    }
    const confirmed = window.confirm(`Remover "${product.name}" do catálogo?`);
    if (!confirmed) {
      return;
    }
    setBusyProductId(product.id);
    const deletion = await deleteProductMutation.mutate(product.id);
    setBusyProductId(null);
    if (deletion === undefined && deleteProductMutation.error) {
      toast({
        status: 'error',
        title: 'Erro ao remover',
        description: deleteProductMutation.error,

      });
      return;
    }
    toast({
      status: 'success',
      title: 'Produto removido',
      description: `"${product.name}" foi excluído com sucesso.`,
    });
    await refetchProducts();
    await refetchComponentCategories();
    if (detailsProduct?.id === product.id) {
      handleCloseProductDetails();
    }
  };

  const updateProductVisibility = async (product: Product, nextIsPublic: boolean) => {
    if (!isAdmin) {
      return;
    }
    if (product.product_type === 'COMPONENTE_BOLO' && nextIsPublic) {
      toast({
        status: 'info',
        title: 'Visibilidade indisponível',
        description: 'Componentes de bolo não podem ser exibidos no catálogo público.',
      });
      return;
    }
    setBusyProductId(product.id);
    const updated = await quickUpdateProductMutation.mutate({
      id: product.id,
      values: { is_public: nextIsPublic },
    });
    setBusyProductId(null);
    if (!updated) {
      toast({
        status: 'error',
        title: 'Erro ao atualizar visibilidade',
        description: quickUpdateProductMutation.error ?? 'Não foi possível atualizar este produto.',

      });
      return;
    }
    toast({
      status: 'success',
      title: nextIsPublic ? 'Produto publicado' : 'Produto oculto',
      description: `${product.name} agora está ${nextIsPublic ? 'visível' : 'oculto'} no catálogo.`,
    });
    await refetchProducts();
    setDetailsProduct((prev) => (prev && prev.id === product.id ? { ...prev, is_public: nextIsPublic } : prev));
  };

  const handleToggleProductVisibility = (product: Product) =>
    updateProductVisibility(product, !product.is_public);

  const handleArchiveProduct = (product: Product) => {
    if (!product.is_public) {
      toast({
        status: 'info',
        title: 'Produto já arquivado',
        description: 'Este item já está oculto do catálogo.',
      });
      return;
    }
    void updateProductVisibility(product, false);
  };

  const handleDuplicateProduct = async (product: Product) => {
    if (!isAdmin) {
      return;
    }
    const copyPayload: ProductInput = {
      name: `${product.name} (cópia)`,
      description: product.description ?? null,
      image_url: product.image_url ?? null,
      price: product.price,
      unit_type: product.unit_type,
      product_type: product.product_type,
      component_category: product.component_category ?? null,
      is_public: false,
    };
    setBusyProductId(product.id);
    const duplicated = await duplicateProductMutation.mutate(copyPayload);
    setBusyProductId(null);
    if (!duplicated) {
      toast({
        status: 'error',
        title: 'Erro ao duplicar',
        description:
          duplicateProductMutation.error ??
          'Não foi possível criar a cópia do produto. Tente novamente.',

      });
      return;
    }
    toast({
      status: 'success',
      title: 'Produto duplicado',
      description: `"${product.name}" foi copiado e está como rascunho.`,
    });
    await refetchProducts();
  };

  const handleSubmitProduct = productForm.handleSubmit(async (values) => {
    if (!isAdmin) {
      setFormError('Apenas administradores podem criar ou editar produtos.');
      return;
    }

    setFormError(null);

    const normalizedPrice = parsePriceInput(values.price);
    const trimmedDescription = values.description?.trim() ?? '';
    const trimmedImageUrl = values.image_url?.trim() ?? '';
    const trimmedCategory = values.component_category?.trim() ?? '';

    const payload: ProductInput = {
      name: values.name.trim(),
      description: trimmedDescription || null,
      image_url: trimmedImageUrl || null,
      price: normalizedPrice,
      unit_type: values.unit_type.trim(),
      product_type: values.product_type,
      component_category:
        values.product_type === 'COMPONENTE_BOLO'
          ? ((trimmedCategory as ComponentCategory) || null)
          : null,
      is_public: values.product_type === 'COMPONENTE_BOLO' ? false : values.is_public,
    };

    const savedProduct = editingProduct
      ? await formUpdateProductMutation.mutate({ id: editingProduct.id, values: payload })
      : await formCreateProductMutation.mutate(payload);

    if (!savedProduct) {
      if (!formUpdateProductMutation.error && !formCreateProductMutation.error) {
        setFormError('Não foi possível salvar o produto. Tente novamente.');
      }
      return;
    }

    try {
      await syncProductMedia(savedProduct.id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível sincronizar as imagens do produto.';
      setFormError(message);
      return;
    }

    toast({
      status: 'success',
      title: editingProduct ? 'Produto atualizado' : 'Produto criado',
      description: `As informações de ${savedProduct.name} foram salvas no Supabase.`,
    });

    handleModalChange(false);
    await refetchProducts();
    await refetchComponentCategories();
  });

  const mutationError = formCreateProductMutation.error || formUpdateProductMutation.error;
  const imagePickerItems = useMemo<ImagePickerItem[]>(
    () =>
      mediaItems.map((item) => ({
        id: item.id,
        url: item.url,
        status: item.status ?? (item.file ? 'pending' : 'idle'),
        canSetAsCover: !item.file,
      })),
    [mediaItems],
  );
  const isMediaInteractionDisabled = isMediaLoading || isSyncingMedia || !isAdmin;
  const shouldShowPendingMediaHint = !editingProduct && mediaItems.length > 0;
  const coverImageUrl = productForm.watch('image_url');
  const handleSelectCoverImage = useCallback(
    (pickerItem: ImagePickerItem) => {
      if (!pickerItem?.url || pickerItem.url.startsWith('blob:')) {
        return;
      }
      productForm.setValue('image_url', pickerItem.url, { shouldDirty: true });
    },
    [productForm],
  );
  const handleProductTypeFilterChange = (value: ProductTypeFilter) => {
    setProductTypeFilter(value);
    if (value !== 'COMPONENTE_BOLO') {
      setComponentCategoryFilter('ALL');
    }
    setPage(1);
  };
  const handleComponentCategoryFilterChange = (value: ComponentCategoryFilter) => {
    setComponentCategoryFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
            Catálogo de Produtos
          </h1>
          <p className="text-muted-foreground text-lg">Fluxos conectados ao Supabase</p>
        </div>
        <Button
          onClick={handleNewProduct}
          disabled={!isAdmin}
          className="gradient-primary text-white shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.02] h-12 px-6 disabled:cursor-not-allowed"
        >
          <Plus className="size-5" />
          Novo produto
        </Button>
      </div>

      {!isAdmin && (
        <Alert>
          <AlertTitle>Modo somente leitura</AlertTitle>
          <AlertDescription>
            Você pode consultar o catálogo, mas apenas administradores podem criar, editar ou remover
            itens.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label htmlFor="search-products" className="text-sm font-semibold flex items-center gap-2">
            <Search className="size-4 text-rose-500" />
            Buscar por nome
          </Label>
          <Input
            id="search-products"
            placeholder="Ex.: Bolo, Brigadeiro..."
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-type-filter" className="text-sm font-semibold flex items-center gap-2">
            <Filter className="size-4 text-rose-500" />
            Tipo
          </Label>
          <select
            id="product-type-filter"
            value={productTypeFilter}
            onChange={(event) => handleProductTypeFilterChange(event.target.value as ProductTypeFilter)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
          >
            <option value="ALL">Todos</option>
            <option value="PRODUTO_MENU">Menu</option>
            <option value="COMPONENTE_BOLO">Componentes de bolo</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="component-category-filter" className="text-sm font-semibold">
            Categoria do componente
          </Label>
          <select
            id="component-category-filter"
            value={componentCategoryFilter}
            onChange={(event) =>
              handleComponentCategoryFilterChange(event.target.value as ComponentCategoryFilter)
            }
            disabled={productTypeFilter !== 'COMPONENTE_BOLO'}
            className="h-9 w-full rounded-md border border-dashed border-rose-200 bg-transparent px-3 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="ALL">Todas</option>
            {componentCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-sm font-semibold">Resultados</Label>
          <p className="text-sm text-muted-foreground">
            {totalItems > 0 ? (
              <>
                Encontrados <span className="font-semibold text-rose-600">{totalItems}</span> produtos.
              </>
            ) : isLoading ? (
              'Carregando...'
            ) : (
              'Nenhum produto corresponde aos filtros.'
            )}
          </p>
        </div>
      </div>

      {listError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Falha ao carregar</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{listError}</span>
            <Button size="sm" onClick={() => void refetchProducts()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <LoadingState className="py-16" message="Buscando produtos..." />
      ) : productsData?.items.length ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {productsData.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAdmin={isAdmin}
                formatPrice={(value) => formatCurrency.format(value)}
                onOpenDetails={handleOpenProductDetails}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onToggleVisibility={handleToggleProductVisibility}
                onArchive={handleArchiveProduct}
                onDuplicate={handleDuplicateProduct}
                disabled={
                  busyProductId === product.id &&
                  (quickUpdateProductMutation.isMutating ||
                    duplicateProductMutation.isMutating ||
                    deleteProductMutation.isMutating)
                }
              />
            ))}
          </div>

          <div className="flex flex-col gap-3 border rounded-xl border-dashed border-rose-200 bg-rose-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Página <span className="font-semibold text-rose-600">{page}</span> de {totalPages} •{' '}
              exibindo {productsData.items.length} de {totalItems} registros
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/60 p-10 text-center space-y-4">
          <Package className="mx-auto size-12 text-rose-400" />
          <h3 className="text-xl font-semibold">Nenhum produto cadastrado</h3>
          <p className="text-muted-foreground">
            Assim que você cadastrar itens, eles aparecerão aqui conectados ao Supabase.
          </p>
          {isAdmin && (
            <Button onClick={handleNewProduct} className="gradient-primary text-white">
              <Plus className="size-4" />
              Cadastrar o primeiro produto
            </Button>
          )}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
        <DialogContent className="max-w-2xl overflow-hidden bg-card p-0">
          <FormProvider {...productForm}>
            <form className="flex max-h-[90vh] flex-col" onSubmit={handleSubmitProduct} noValidate>
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <DialogHeader className="space-y-3">
                  <DialogTitle>{editingProduct ? 'Editar produto' : 'Novo produto'}</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Todos os campos são salvos diretamente na tabela <code>products</code>.
                  </DialogDescription>
                </DialogHeader>

                <FormSection
                  title="Detalhes principais"
                  description="Essas informações aparecem no catálogo e nas buscas."
                >
                <FormField
                  name="name"
                  label="Nome"
                  required
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Ex.: Bolo de chocolate"
                    />
                  )}
                />

                <FormField
                  name="description"
                  label="Descrição"
                  render={({ field }) => (
                    <textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Detalhes sobre sabor, recheio, etc."
                      className="min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
                    />
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    name="price"
                    label="Preço (R$)"
                    required
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        inputMode="decimal"
                        placeholder="0,00"
                      />
                    )}
                  />
                  <FormField
                    name="unit_type"
                    label="Unidade"
                    required
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="kg, unidade, fatia..."
                      />
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    name="product_type"
                    label="Tipo"
                    required
                    render={({ field }) => (
                      <select
                        id="product-type"
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value as ProductType)}
                        className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
                      >
                        <option value="PRODUTO_MENU">Produto de menu</option>
                        <option value="COMPONENTE_BOLO">Componente de bolo</option>
                      </select>
                    )}
                  />
                  <FormField
                    name="image_url"
                    label="Imagem (URL)"
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="https://..."
                      />
                    )}
                  />
                </div>

                {isComponentProduct ? (
                  <FormField
                    name="component_category"
                    label="Categoria do componente"
                    description="Obrigatório para componentes de bolo."
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="component-category-input"
                        value={field.value ?? ''}
                        placeholder="Ex.: tamanho, recheio..."
                        list="component-categories-list"
                      />
                    )}
                  />
                ) : null}
                </FormSection>

                <FormSection
                  title="Exibição"
                  description="Defina como o item aparece para a equipe."
                >
                <FormField
                  name="is_public"
                  render={({ field }) => (
                    <div className="rounded-lg border border-border/60 p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 accent-rose-500"
                          checked={Boolean(field.value)}
                          onChange={(event) => field.onChange(event.target.checked)}
                          disabled={isComponentProduct}
                        />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">Mostrar na vitrine do dashboard</p>
                          <p>
                            {isComponentProduct
                              ? 'Disponível apenas para produtos de menu.'
                              : 'Ative para destacar este item para quem usa o app.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                />
                </FormSection>

                <FormSection
                  title="Galeria de imagens"
                  description="Envie fotos reais do produto, arraste para reordenar e mantenha tudo alinhado ao catálogo."
                >
                {mediaError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Erro ao carregar a galeria</AlertTitle>
                    <AlertDescription>{mediaError}</AlertDescription>
                  </Alert>
                ) : null}
                {isMediaLoading ? (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                    Carregando imagens do produto...
                  </div>
                ) : (
                  <ImagePicker
                    items={imagePickerItems}
                    onAddFiles={handleAddMediaFiles}
                    onRemove={handleRemoveMediaItem}
                    onReorder={handleReorderMediaItems}
                    isDisabled={isMediaInteractionDisabled}
                    maxItems={8}
                    emptyHint="Arraste arquivos ou toque para enviar. Aceitamos até 8 imagens por produto."
                    onSelectCover={handleSelectCoverImage}
                    coverUrl={coverImageUrl}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {shouldShowPendingMediaHint
                    ? 'As imagens serão enviadas automaticamente assim que o produto for salvo.'
                    : 'Imagens excluídas são removidas do storage ao salvar.'}
                </p>
                </FormSection>

                {formError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Não foi possível salvar</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                ) : null}

                {mutationError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Erro de Supabase</AlertTitle>
                    <AlertDescription>{mutationError}</AlertDescription>
                  </Alert>
                ) : null}
              </div>

              <DialogFooter className="sticky bottom-0 flex gap-2 border-t border-border/60 bg-card px-6 py-4">
                <Button type="button" variant="outline" onClick={() => handleModalChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="size-4 animate-spin" />}
                  {editingProduct ? 'Salvar alterações' : 'Cadastrar produto'}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <ProductDetailsDrawer
        open={isDetailsOpen}
        product={detailsProduct}
        media={detailsMedia}
        isLoading={isDetailsLoading}
        error={detailsError}
        onClose={handleCloseProductDetails}
        formatPrice={(value) => formatCurrency.format(value)}
        onEdit={handleEditProduct}
        onDuplicate={handleDuplicateProduct}
        onToggleVisibility={handleToggleProductVisibility}
        onArchive={handleArchiveProduct}
        onDelete={handleDeleteProduct}
        disabled={
          detailsProduct
            ? busyProductId === detailsProduct.id &&
              (quickUpdateProductMutation.isMutating ||
                duplicateProductMutation.isMutating ||
                deleteProductMutation.isMutating)
            : false
        }
        isAdmin={isAdmin}
      />

      <datalist id="component-categories-list">
        {componentCategories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
    </div>
  );
};

export default ProductsPage;

