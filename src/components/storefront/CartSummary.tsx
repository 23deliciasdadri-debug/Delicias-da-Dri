import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { useCart } from '../../providers/CartProvider';

interface CartSummaryProps {
    showCheckoutButton?: boolean;
    onCheckout?: () => void;
}

/**
 * Resumo do carrinho com subtotal, total e botão de finalizar.
 */
const CartSummary: React.FC<CartSummaryProps> = ({
    showCheckoutButton = true,
    onCheckout
}) => {
    const { total, itemCount } = useCart();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <div className="bg-storefront-cream/50 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-storefront-chocolate text-lg">
                Resumo do Pedido
            </h3>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-storefront-chocolate/70">Itens ({itemCount})</span>
                    <span className="text-storefront-chocolate">{formatCurrency(total)}</span>
                </div>
                {/* Delivery será calculado depois da seleção de endereço */}
                <div className="flex justify-between text-storefront-chocolate/50">
                    <span>Entrega</span>
                    <span>A calcular</span>
                </div>
            </div>

            <div className="border-t border-storefront-chocolate/10 pt-4">
                <div className="flex justify-between text-lg font-bold">
                    <span className="text-storefront-chocolate">Total</span>
                    <span className="text-storefront-primary">{formatCurrency(total)}</span>
                </div>
            </div>

            {showCheckoutButton && (
                <div className="pt-2">
                    {onCheckout ? (
                        <Button
                            onClick={onCheckout}
                            className="w-full bg-storefront-primary hover:bg-storefront-primary/90 text-white h-12 rounded-full text-base"
                            disabled={itemCount === 0}
                        >
                            Finalizar Pedido
                        </Button>
                    ) : (
                        <Button
                            asChild
                            className="w-full bg-storefront-primary hover:bg-storefront-primary/90 text-white h-12 rounded-full text-base"
                            disabled={itemCount === 0}
                        >
                            <Link to="/carrinho">Finalizar Pedido</Link>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CartSummary;
