import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
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
  Pencil,
  Plus,
  Search,
  Trash2,
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

type ProductTypeFilter = 'ALL' | ProductType;
type ComponentCategoryFilter = 'ALL' | string;

interface ProductFormValues {
  name: string;
  description: string;
  price: string;
  unit_type: string;
  product_type: ProductType;
  component_category: string;
  image_url: string;
  is_public: boolean;
}

const getEmptyForm = (): ProductFormValues => ({
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
  'decoracao',
];

const ProductsPage: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<ProductFormValues>(getEmptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<ProductTypeFilter>('ALL');
  const [componentCategoryFilter, setComponentCategoryFilter] = useState<ComponentCategoryFilter>('ALL');
  const [page, setPage] = useState(1);

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

  const createProductMutation = useSupabaseMutation(createProduct);
  const updateProductMutation = useSupabaseMutation(
    ({ id, values }: { id: string; values: ProductInput }) => updateProduct(id, values),
  );
  const deleteProductMutation = useSupabaseMutation(deleteProduct);

  const isSaving = createProductMutation.isMutating || updateProductMutation.isMutating;
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

  const handleModalChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingProduct(null);
      setFormValues(getEmptyForm());
      setFormError(null);
    }
  };

  const handleNewProduct = () => {
    if (!isAdmin) {
      return;
    }
    setEditingProduct(null);
    setFormValues(getEmptyForm());
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    if (!isAdmin) {
      return;
    }
    setEditingProduct(product);
    setFormValues({
      name: product.name,
      description: product.description ?? '',
      price: product.price.toString(),
      unit_type: product.unit_type,
      product_type: product.product_type,
      component_category: product.component_category ?? '',
      image_url: product.image_url ?? '',
      is_public: product.is_public,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!isAdmin) {
      return;
    }
    const confirmed = window.confirm(`Remover "${product.name}" do catálogo?`);
    if (!confirmed) {
      return;
    }
    const deletion = await deleteProductMutation.mutate(product.id);
    if (deletion === undefined && deleteProductMutation.error) {
      toast({
        title: 'Erro ao remover',
        description: deleteProductMutation.error,
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Produto removido',
      description: `"${product.name}" foi excluído com sucesso.`,
    });
    await refetchProducts();
    await refetchComponentCategories();
  };

  const handleSaveProduct = async () => {
    if (!isAdmin) {
      setFormError('Apenas administradores podem criar ou editar produtos.');
      return;
    }

    const trimmedName = formValues.name.trim();
    const trimmedUnit = formValues.unit_type.trim();
    const normalizedPrice = Number(formValues.price.replace(',', '.'));

    if (!trimmedName) {
      setFormError('Informe o nome do produto.');
      return;
    }
    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      setFormError('Informe um preço válido (use ponto ou vírgula).');
      return;
    }
    if (!trimmedUnit) {
      setFormError('Informe a unidade de venda (ex.: kg, unidade).');
      return;
    }
    if (formValues.product_type === 'COMPONENTE_BOLO' && !formValues.component_category.trim()) {
      setFormError('Componentes precisam de uma categoria (tamanho, recheio, etc).');
      return;
    }

    const payload: ProductInput = {
      name: trimmedName,
      description: formValues.description.trim() || null,
      image_url: formValues.image_url.trim() || null,
      price: normalizedPrice,
      unit_type: trimmedUnit,
      product_type: formValues.product_type,
      component_category:
        formValues.product_type === 'COMPONENTE_BOLO'
          ? (formValues.component_category.trim() as ComponentCategory)
          : null,
      is_public: formValues.product_type === 'COMPONENTE_BOLO' ? false : formValues.is_public,
    };

    setFormError(null);

    const saved = editingProduct
      ? await updateProductMutation.mutate({ id: editingProduct.id, values: payload })
      : await createProductMutation.mutate(payload);

    if (!saved) {
      const mutationError = updateProductMutation.error || createProductMutation.error;
      setFormError(mutationError ?? 'Não foi possível salvar o produto. Tente novamente.');
      return;
    }

    toast({
      title: editingProduct ? 'Produto atualizado' : 'Produto criado',
      description: `As informações de ${saved.name} foram salvas no Supabase.`,
    });

    handleModalChange(false);
    await refetchProducts();
    await refetchComponentCategories();
  };

  const mutationError = createProductMutation.error || updateProductMutation.error;
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
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-rose-500" />
          <p>Buscando produtos...</p>
        </div>
      ) : productsData?.items.length ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {productsData.items.map((product) => (
              <Card
                key={product.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <CardContent className="p-0">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <Badge className="bg-white/90 text-foreground shadow">
                        {product.product_type === 'COMPONENTE_BOLO' ? 'Componente' : 'Menu'}
                      </Badge>
                      {product.component_category && (
                        <Badge variant="secondary" className="bg-white/80 text-foreground">
                          {product.component_category}
                        </Badge>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex gap-2">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="bg-white/90 text-rose-600 hover:bg-white"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          className="bg-white/80 text-destructive hover:bg-white"
                          onClick={() => void handleDeleteProduct(product)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold leading-tight text-foreground">
                        {product.name}
                      </h3>
                      {!product.is_public && (
                        <Badge variant="outline" className="border-dashed border-rose-200 text-rose-600">
                          oculto
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description || 'Sem descrição'}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
                        {formatCurrency.format(product.price)}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">/ {product.unit_type}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar produto' : 'Novo produto'}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Todos os campos são salvos diretamente na tabela <code>products</code>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nome</Label>
              <Input
                id="product-name"
                placeholder="Ex.: Bolo de chocolate"
                value={formValues.name}
                onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Descrição</Label>
              <textarea
                id="product-description"
                placeholder="Detalhes sobre sabor, recheio, etc."
                value={formValues.description}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, description: event.target.value }))
                }
                className="min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-price">Preço (R$)</Label>
                <Input
                  id="product-price"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formValues.price}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, price: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-unit">Unidade</Label>
                <Input
                  id="product-unit"
                  placeholder="kg, unidade, fatia..."
                  value={formValues.unit_type}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, unit_type: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-type">Tipo</Label>
                <select
                  id="product-type"
                  value={formValues.product_type}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, product_type: event.target.value as ProductType }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/30"
                >
                  <option value="PRODUTO_MENU">Produto de menu</option>
                  <option value="COMPONENTE_BOLO">Componente de bolo</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-image">Imagem (URL)</Label>
                <Input
                  id="product-image"
                  placeholder="https://..."
                  value={formValues.image_url}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, image_url: event.target.value }))
                  }
                />
              </div>
            </div>

            {formValues.product_type === 'COMPONENTE_BOLO' && (
              <div className="space-y-2">
                <Label htmlFor="component-category-input">Categoria do componente</Label>
                <Input
                  id="component-category-input"
                  placeholder="Ex.: tamanho, recheio..."
                  list="component-categories-list"
                  value={formValues.component_category}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, component_category: event.target.value }))
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Exibição</Label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-rose-500"
                  checked={formValues.product_type === 'COMPONENTE_BOLO' ? false : formValues.is_public}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, is_public: event.target.checked }))
                  }
                  disabled={formValues.product_type === 'COMPONENTE_BOLO'}
                />
                <span>
                  Mostrar na vitrine do dashboard{' '}
                  {formValues.product_type === 'COMPONENTE_BOLO' && '(apenas para produtos de menu)'}
                </span>
              </label>
            </div>

            {formError && (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível salvar</AlertTitle>
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
            <Button variant="outline" onClick={() => handleModalChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSaveProduct()} disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {editingProduct ? 'Salvar alterações' : 'Cadastrar produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <datalist id="component-categories-list">
        {componentCategories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
    </div>
  );
};

export default ProductsPage;
