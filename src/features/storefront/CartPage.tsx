import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import CartItem from '../../components/storefront/CartItem';
import CartSummary from '../../components/storefront/CartSummary';
import { useCart } from '../../providers/CartProvider';
import { useAuth } from '../../providers/AuthProvider';
import { createStorefrontOrder } from '../../services/storefrontService';
import { toast } from 'sonner';

/**
 * Página completa do carrinho de compras.
 * Permite revisar itens, adicionar observações e finalizar pedido.
 */
const CartPage: React.FC = () => {
    const navigate = useNavigate();
    const { items, itemCount, total, clearCart } = useCart();
    const { session, clientProfile } = useAuth();

    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCheckout = async () => {
        // Verificar se está logado
        if (!session) {
            toast.info('Faça login para finalizar seu pedido');
            navigate('/login', { state: { from: '/carrinho' } });
            return;
        }

        if (!clientProfile?.id) {
            toast.error('Perfil de cliente não encontrado');
            return;
        }

        if (items.length === 0) {
            toast.error('Seu carrinho está vazio');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createStorefrontOrder({
                clientId: clientProfile.id,
                items: items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    isCustomCake: item.isCustomCake || false,
                    cakeChoices: item.cakeChoices,
                    generatedImageUrl: item.generatedImageUrl,
                    notes: item.notes,
                })),
                totalAmount: total,
                notes,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            // Limpar carrinho e redirecionar
            clearCart();
            toast.success('Pedido criado com sucesso!');
            navigate(`/pedido/${result.orderId}`, { replace: true });
        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            toast.error('Erro ao criar pedido. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pt-24 pb-16">
            <div className="container mx-auto px-4">
                {/* Back Button */}
                <Link
                    to="/catalogo"
                    className="inline-flex items-center gap-2 text-storefront-chocolate/70 hover:text-storefront-primary mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Continuar Comprando
                </Link>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1
                        className="text-3xl md:text-4xl font-semibold text-storefront-primary"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Seu Carrinho
                    </h1>
                    {items.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearCart}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Limpar Carrinho
                        </Button>
                    )}
                </div>

                {items.length === 0 ? (
                    // Empty Cart
                    <div className="text-center py-16">
                        <div className="w-24 h-24 rounded-full bg-storefront-cream flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-12 h-12 text-storefront-chocolate/30" />
                        </div>
                        <h2 className="text-xl font-semibold text-storefront-chocolate mb-2">
                            Seu carrinho está vazio
                        </h2>
                        <p className="text-storefront-chocolate/60 mb-8">
                            Explore nosso cardápio e adicione produtos deliciosos!
                        </p>
                        <Button
                            asChild
                            className="bg-storefront-primary hover:bg-storefront-primary/90 rounded-full px-8"
                        >
                            <Link to="/catalogo">Ver Cardápio</Link>
                        </Button>
                    </div>
                ) : (
                    // Cart Content
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Items List */}
                        <div className="lg:col-span-2 space-y-2">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="font-semibold text-storefront-chocolate mb-4">
                                    Itens ({itemCount})
                                </h2>
                                <div className="divide-y divide-gray-100">
                                    {items.map((item) => (
                                        <CartItem key={item.id} item={item} />
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="font-semibold text-storefront-chocolate mb-4">
                                    Observações do Pedido
                                </h2>
                                <Textarea
                                    placeholder="Alguma observação? (opcional)"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        {/* Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-28">
                                <CartSummary
                                    showCheckoutButton={true}
                                    onCheckout={handleCheckout}
                                />

                                {isSubmitting && (
                                    <div className="mt-4 text-center text-sm text-storefront-chocolate/60">
                                        Processando pedido...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;
