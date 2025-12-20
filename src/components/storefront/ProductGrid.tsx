import React from 'react';
import ProductCard from './ProductCard';
import type { StorefrontProduct } from '../../services/storefrontService';

interface ProductGridProps {
    products: StorefrontProduct[];
    favorites?: Set<string>;
    onFavoriteToggle?: (productId: string) => void;
    showFavoriteButton?: boolean;
    emptyMessage?: string;
    isLoading?: boolean;
}

/**
 * Grid responsivo de cards de produtos.
 */
const ProductGrid: React.FC<ProductGridProps> = ({
    products,
    favorites = new Set(),
    onFavoriteToggle,
    showFavoriteButton = false,
    emptyMessage = 'Nenhum produto encontrado',
    isLoading = false,
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="aspect-square bg-gray-200 rounded-2xl mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                        <div className="h-8 bg-gray-200 rounded w-full"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-storefront-chocolate/60 text-lg">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={favorites.has(product.id)}
                    onFavoriteToggle={onFavoriteToggle}
                    showFavoriteButton={showFavoriteButton}
                />
            ))}
        </div>
    );
};

export default ProductGrid;
