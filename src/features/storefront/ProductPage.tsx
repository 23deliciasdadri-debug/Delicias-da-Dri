import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, MessageCircle, Minus, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { getProductById, getProductImageUrl, isFavorite, toggleFavorite, type StorefrontProduct } from '../../services/storefrontService';
import { useAuth } from '../../providers/AuthProvider';
import { useCart } from '../../providers/CartProvider';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

/**
 * Página de detalhes do produto.
 * Exibe imagens, informações, opções e botões de ação.
 */
const ProductPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { clientProfile } = useAuth();
    const { addItem } = useCart();

    const [product, setProduct] = useState<StorefrontProduct | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFav, setIsFav] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Carregar produto
    useEffect(() => {
        const loadProduct = async () => {
            if (!id) return;

            setIsLoading(true);
            const data = await getProductById(id);
            setProduct(data);
            setIsLoading(false);

            if (!data) {
                toast.error('Produto não encontrado');
            }
        };

        loadProduct();
    }, [id]);

    // Verificar se é favorito
    useEffect(() => {
        const checkFavorite = async () => {
            if (!clientProfile?.id || !id) return;
            const fav = await isFavorite(clientProfile.id, id);
            setIsFav(fav);
        };
        checkFavorite();
    }, [clientProfile?.id, id]);

    const handleFavoriteToggle = async () => {
        if (!clientProfile?.id || !id) {
            toast.info('Faça login para salvar favoritos');
            return;
        }

        const result = await toggleFavorite(clientProfile.id, id);
        if (result.error) {
            toast.error('Erro ao atualizar favoritos');
            return;
        }

        setIsFav(result.isFavorite);
        toast.success(result.isFavorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
    };

    const handleAddToCart = () => {
        if (!product) return;

        const imageUrl = product.media && product.media.length > 0
            ? getProductImageUrl(product.media[0].storage_path)
            : product.image_url || '';

        addItem({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity,
            productImage: imageUrl,
        });

        toast.success(`${product.name} adicionado ao carrinho`);
    };

    const handleWhatsApp = () => {
        if (!product) return;

        const message = encodeURIComponent(
            `Olá! Gostaria de saber mais sobre: ${product.name} - R$ ${product.price.toFixed(2)}`
        );
        // TODO: Pegar número do WhatsApp das configurações
        window.open(`https://wa.me/5500000000000?text=${message}`, '_blank');
    };

    const images = product?.media?.sort((a, b) => a.sort_order - b.sort_order) || [];
    const mainImage = images[selectedImageIndex]
        ? getProductImageUrl(images[selectedImageIndex].storage_path)
        : product?.image_url || '';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white pt-24 pb-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse"></div>
                        <div className="space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white pt-24 pb-16 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-storefront-chocolate mb-4">
                        Produto não encontrado
                    </h2>
                    <Button onClick={() => navigate('/catalogo')}>
                        Voltar ao Catálogo
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-24 pb-16">
            <div className="container mx-auto px-4">
                {/* Back Button */}
                <Link
                    to="/catalogo"
                    className="inline-flex items-center gap-2 text-storefront-chocolate/70 hover:text-storefront-primary mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Catálogo
                </Link>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="aspect-square bg-storefront-cream rounded-2xl overflow-hidden">
                            {mainImage ? (
                                <img
                                    src={mainImage}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-storefront-chocolate/30">
                                    <ShoppingBag className="w-24 h-24" />
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={cn(
                                            'w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                                            selectedImageIndex === index
                                                ? 'border-storefront-primary'
                                                : 'border-transparent hover:border-storefront-primary/50'
                                        )}
                                    >
                                        <img
                                            src={getProductImageUrl(img.storage_path)}
                                            alt={`${product.name} - imagem ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Title & Price */}
                        <div>
                            <h1
                                className="text-3xl md:text-4xl font-semibold text-storefront-primary mb-2"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                {product.name}
                            </h1>
                            <p className="text-2xl font-bold text-storefront-chocolate">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                }).format(product.price)}
                                {product.unit_type && (
                                    <span className="text-base font-normal text-storefront-chocolate/60 ml-1">
                                        / {product.unit_type}
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <p className="text-storefront-chocolate/70 leading-relaxed">
                                {product.description}
                            </p>
                        )}

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-4">
                            <span className="text-storefront-chocolate font-medium">Quantidade:</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="w-10 h-10 rounded-full bg-storefront-cream flex items-center justify-center hover:bg-storefront-cream/80 transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-semibold text-lg">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="w-10 h-10 rounded-full bg-storefront-cream flex items-center justify-center hover:bg-storefront-cream/80 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                size="lg"
                                onClick={handleAddToCart}
                                className="flex-1 bg-storefront-primary hover:bg-storefront-primary/90 text-white h-14 rounded-full text-lg"
                            >
                                <ShoppingBag className="w-5 h-5 mr-2" />
                                Adicionar ao Carrinho
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                onClick={handleFavoriteToggle}
                                className={cn(
                                    'h-14 rounded-full px-6',
                                    isFav && 'border-storefront-primary text-storefront-primary'
                                )}
                            >
                                <Heart className={cn('w-5 h-5', isFav && 'fill-current')} />
                            </Button>
                        </div>

                        {/* WhatsApp Button */}
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={handleWhatsApp}
                            className="w-full h-12 rounded-full border-green-500 text-green-600 hover:bg-green-50"
                        >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Falar no WhatsApp
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
