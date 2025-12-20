import React, { useState, useEffect, useCallback } from 'react';
import ProductGrid from '../../components/storefront/ProductGrid';
import ProductFilters from '../../components/storefront/ProductFilters';
import { listPublicProducts, listFavorites, toggleFavorite, type StorefrontProduct } from '../../services/storefrontService';
import { useAuth } from '../../providers/AuthProvider';
import { toast } from 'sonner';

/**
 * Página de catálogo da vitrine.
 * Exibe todos os produtos públicos com filtros e paginação.
 */
const CatalogPage: React.FC = () => {
    const { clientProfile } = useAuth();

    const [products, setProducts] = useState<StorefrontProduct[]>([]);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // Filtros
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const limit = 20;

    // Carregar produtos
    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        const { data, count } = await listPublicProducts({
            category: selectedCategory || undefined,
            search: searchQuery || undefined,
            limit,
            offset: page * limit,
        });
        setProducts(data);
        setTotalCount(count);
        setIsLoading(false);
    }, [selectedCategory, searchQuery, page]);

    // Carregar favoritos do cliente
    const loadFavorites = useCallback(async () => {
        if (!clientProfile?.id) return;

        const favProducts = await listFavorites(clientProfile.id);
        setFavorites(new Set(favProducts.map(p => p.id)));
    }, [clientProfile?.id]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    useEffect(() => {
        loadFavorites();
    }, [loadFavorites]);

    // Resetar página ao mudar filtros
    useEffect(() => {
        setPage(0);
    }, [selectedCategory, searchQuery]);

    // Toggle favorito
    const handleFavoriteToggle = async (productId: string) => {
        if (!clientProfile?.id) {
            toast.info('Faça login para salvar favoritos');
            return;
        }

        const result = await toggleFavorite(clientProfile.id, productId);

        if (result.error) {
            toast.error('Erro ao atualizar favoritos');
            return;
        }

        setFavorites(prev => {
            const next = new Set(prev);
            if (result.isFavorite) {
                next.add(productId);
                toast.success('Adicionado aos favoritos');
            } else {
                next.delete(productId);
                toast.success('Removido dos favoritos');
            }
            return next;
        });
    };

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages - 1;
    const hasPrevPage = page > 0;

    return (
        <div className="min-h-screen bg-white pt-24 pb-16">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1
                        className="text-4xl md:text-5xl font-semibold text-storefront-primary mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Cardápio
                    </h1>
                    <p className="text-storefront-chocolate/60">
                        Explore nossas delícias artesanais
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-8">
                    <ProductFilters
                        selectedCategory={selectedCategory}
                        searchQuery={searchQuery}
                        onCategoryChange={setSelectedCategory}
                        onSearchChange={setSearchQuery}
                    />
                </div>

                {/* Results Count */}
                {!isLoading && (
                    <p className="text-sm text-storefront-chocolate/60 mb-4">
                        {totalCount} {totalCount === 1 ? 'produto encontrado' : 'produtos encontrados'}
                    </p>
                )}

                {/* Product Grid */}
                <ProductGrid
                    products={products}
                    favorites={favorites}
                    onFavoriteToggle={handleFavoriteToggle}
                    showFavoriteButton={!!clientProfile}
                    isLoading={isLoading}
                    emptyMessage="Nenhum produto encontrado com esses filtros"
                />

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={() => setPage(p => p - 1)}
                            disabled={!hasPrevPage}
                            className="px-4 py-2 rounded-full bg-storefront-cream text-storefront-chocolate disabled:opacity-50 disabled:cursor-not-allowed hover:bg-storefront-cream/80 transition-colors"
                        >
                            Anterior
                        </button>
                        <span className="text-storefront-chocolate">
                            Página {page + 1} de {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!hasNextPage}
                            className="px-4 py-2 rounded-full bg-storefront-cream text-storefront-chocolate disabled:opacity-50 disabled:cursor-not-allowed hover:bg-storefront-cream/80 transition-colors"
                        >
                            Próxima
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CatalogPage;
