import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus } from 'lucide-react';
import { getProductImageUrl, type StorefrontProduct } from '../../services/storefrontService';
import { useCart } from '../../providers/CartProvider';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface ProductCardProps {
    product: StorefrontProduct;
    isFavorite?: boolean;
    onFavoriteToggle?: (productId: string) => void;
    showFavoriteButton?: boolean;
}

/**
 * Card de produto para exibição no catálogo.
 * Design mobile-first com imagem arredondada e botões compactos.
 */
const ProductCard: React.FC<ProductCardProps> = ({
    product,
    isFavorite = false,
    onFavoriteToggle,
    showFavoriteButton = false,
}) => {
    const { addItem } = useCart();

    // Pegar primeira imagem do produto
    const imageUrl = product.media && product.media.length > 0
        ? getProductImageUrl(product.media[0].storage_path)
        : product.image_url || '';

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        addItem({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: 1,
            productImage: imageUrl,
        });

        toast.success('Adicionado!', { duration: 1500 });
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onFavoriteToggle?.(product.id);
    };

    return (
        <Link
            to={`/produto/${product.id}`}
            className="group block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover-lift"
        >
            {/* Image Container - Square aspect ratio */}
            <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-gradient-to-br from-storefront-cream to-storefront-cream/50">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-storefront-primary/10 flex items-center justify-center">
                            <span className="text-2xl">🍰</span>
                        </div>
                    </div>
                )}

                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Featured Badge */}
                {product.is_featured && (
                    <span className="absolute top-2.5 left-2.5 bg-storefront-primary text-white text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                        ⭐ Destaque
                    </span>
                )}

                {/* Favorite Button */}
                {showFavoriteButton && (
                    <button
                        onClick={handleFavoriteClick}
                        className={cn(
                            'absolute top-2.5 right-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all shadow-lg btn-press',
                            isFavorite
                                ? 'bg-storefront-primary text-white scale-110'
                                : 'bg-white/90 backdrop-blur-sm text-storefront-chocolate hover:bg-white hover:scale-110'
                        )}
                        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                        <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
                    </button>
                )}

                {/* Quick Add Button - Bottom right */}
                <button
                    onClick={handleAddToCart}
                    className="absolute bottom-2.5 right-2.5 w-10 h-10 sm:w-11 sm:h-11 bg-storefront-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-storefront-primary/90 active:scale-95 transition-all btn-press"
                    aria-label="Adicionar ao carrinho"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Content - Compact for mobile */}
            <div className="p-3 sm:p-4">
                <h3 className="font-semibold text-storefront-chocolate text-sm sm:text-base leading-tight line-clamp-1 group-hover:text-storefront-primary transition-colors">
                    {product.name}
                </h3>

                {product.description && (
                    <p className="text-xs sm:text-sm text-storefront-chocolate/50 mt-1 line-clamp-1">
                        {product.description}
                    </p>
                )}

                <div className="flex items-center justify-between mt-2 sm:mt-3">
                    <span className="text-base sm:text-lg font-bold text-storefront-primary">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                        }).format(product.price)}
                    </span>

                    {product.unit_type && (
                        <span className="text-[10px] sm:text-xs text-storefront-chocolate/40">
                            /{product.unit_type}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
