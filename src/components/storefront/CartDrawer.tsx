import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import { useCart } from '../../providers/CartProvider';

interface CartDrawerProps {
    trigger?: React.ReactNode;
}

/**
 * Drawer lateral do carrinho de compras.
 * Exibe lista de itens, resumo e botões de ação.
 */
const CartDrawer: React.FC<CartDrawerProps> = ({ trigger }) => {
    const { items, itemCount, clearCart } = useCart();
    const [open, setOpen] = React.useState(false);

    const defaultTrigger = (
        <Button
            variant="ghost"
            size="icon"
            className="relative text-storefront-chocolate hover:text-storefront-primary"
            aria-label="Carrinho"
        >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-storefront-primary text-white text-xs flex items-center justify-center font-medium">
                    {itemCount > 99 ? '99+' : itemCount}
                </span>
            )}
        </Button>
    );

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || defaultTrigger}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader className="border-b pb-4">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-semibold text-storefront-chocolate">
                            Seu Carrinho
                        </SheetTitle>
                        {items.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearCart}
                                className="text-muted-foreground hover:text-destructive text-xs"
                            >
                                Limpar tudo
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <div className="w-20 h-20 rounded-full bg-storefront-cream flex items-center justify-center mb-4">
                            <ShoppingBag className="w-10 h-10 text-storefront-chocolate/30" />
                        </div>
                        <h3 className="font-medium text-storefront-chocolate mb-2">
                            Seu carrinho está vazio
                        </h3>
                        <p className="text-sm text-storefront-chocolate/60 mb-6">
                            Adicione produtos deliciosos para começar!
                        </p>
                        <Button
                            asChild
                            className="bg-storefront-primary hover:bg-storefront-primary/90 rounded-full"
                            onClick={() => setOpen(false)}
                        >
                            <Link to="/catalogo">Ver Cardápio</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Items List */}
                        <ScrollArea className="flex-1 -mx-6 px-6">
                            <div className="py-2">
                                {items.map((item) => (
                                    <CartItem key={item.id} item={item} />
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Summary */}
                        <div className="border-t pt-4 mt-auto">
                            <CartSummary onCheckout={() => setOpen(false)} />
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default CartDrawer;
