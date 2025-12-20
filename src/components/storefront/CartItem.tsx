import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import type { CartItem as CartItemType } from '../../providers/CartProvider';
import { useCart } from '../../providers/CartProvider';

interface CartItemProps {
    item: CartItemType;
}

/**
 * Componente de item individual do carrinho.
 * Exibe imagem, nome, preço, controle de quantidade e botão remover.
 */
const CartItem: React.FC<CartItemProps> = ({ item }) => {
    const { updateQuantity, removeItem } = useCart();

    const handleIncrement = () => {
        updateQuantity(item.id, item.quantity + 1);
    };

    const handleDecrement = () => {
        if (item.quantity > 1) {
            updateQuantity(item.id, item.quantity - 1);
        } else {
            removeItem(item.id);
        }
    };

    const handleRemove = () => {
        removeItem(item.id);
    };

    const subtotal = item.price * item.quantity;

    return (
        <div className="flex gap-4 py-4 border-b border-gray-100">
            {/* Image */}
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-storefront-cream flex-shrink-0">
                {item.productImage || item.generatedImageUrl ? (
                    <img
                        src={item.productImage || item.generatedImageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-storefront-chocolate/30 text-xs">
                        Sem imagem
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-storefront-chocolate text-sm line-clamp-2">
                    {item.productName}
                </h4>

                {item.isCustomCake && item.cakeChoices && (
                    <p className="text-xs text-storefront-chocolate/60 mt-1">
                        {item.cakeChoices.size} • {item.cakeChoices.flavor}
                    </p>
                )}

                {item.notes && (
                    <p className="text-xs text-storefront-chocolate/50 italic mt-1 line-clamp-1">
                        {item.notes}
                    </p>
                )}

                <div className="flex items-center justify-between mt-2">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDecrement}
                            className="w-7 h-7 rounded-full bg-storefront-cream flex items-center justify-center hover:bg-storefront-cream/80 transition-colors"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                            onClick={handleIncrement}
                            className="w-7 h-7 rounded-full bg-storefront-cream flex items-center justify-center hover:bg-storefront-cream/80 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Price */}
                    <span className="font-semibold text-storefront-primary">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                        }).format(subtotal)}
                    </span>
                </div>
            </div>

            {/* Remove Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );
};

export default CartItem;
