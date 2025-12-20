import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import CustomerOrderCard from '../../components/storefront/CustomerOrderCard';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabaseClient';

interface OrderItem {
    productName: string;
    quantity: number;
    unitPrice: number;
}

interface CustomerOrder {
    id: string;
    created_at: string;
    delivery_date: string | null;
    status: string;
    total_amount: number;
    items: OrderItem[];
}

const STATUS_FILTERS = [
    { id: '', label: 'Todos' },
    { id: 'Pendente', label: 'Pendentes' },
    { id: 'Em Produção', label: 'Em Produção' },
    { id: 'Pronto', label: 'Prontos' },
    { id: 'Entregue', label: 'Entregues' },
];

/**
 * Página de pedidos do cliente.
 * Lista todos os pedidos com filtro por status.
 */
const CustomerOrdersPage: React.FC = () => {
    const { clientProfile } = useAuth();

    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadOrders();
    }, [clientProfile?.id, statusFilter]);

    const loadOrders = async () => {
        if (!clientProfile?.id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        let query = supabase
            .from('orders')
            .select('id, created_at, delivery_date, status, total_amount, items')
            .eq('client_id', clientProfile.id)
            .order('created_at', { ascending: false });

        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao carregar pedidos:', error);
        } else {
            setOrders(data || []);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-white pt-24 pb-16">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* Header */}
                <Link
                    to="/perfil"
                    className="inline-flex items-center gap-2 text-storefront-chocolate/70 hover:text-storefront-primary mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Perfil
                </Link>

                <div className="text-center mb-8">
                    <h1
                        className="text-3xl md:text-4xl font-semibold text-storefront-primary mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Meus Pedidos
                    </h1>
                    <p className="text-storefront-chocolate/60">
                        Acompanhe o status dos seus pedidos
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {STATUS_FILTERS.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setStatusFilter(filter.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === filter.id
                                        ? 'bg-storefront-primary text-white'
                                        : 'bg-storefront-cream text-storefront-chocolate hover:bg-storefront-cream/80'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-storefront-cream flex items-center justify-center mx-auto mb-4">
                            <Package className="w-10 h-10 text-storefront-chocolate/30" />
                        </div>
                        <h3 className="font-medium text-storefront-chocolate mb-2">
                            {statusFilter ? 'Nenhum pedido com este status' : 'Você ainda não fez pedidos'}
                        </h3>
                        <p className="text-sm text-storefront-chocolate/60 mb-6">
                            {statusFilter
                                ? 'Tente selecionar outro filtro'
                                : 'Explore nosso cardápio e faça seu primeiro pedido!'}
                        </p>
                        {!statusFilter && (
                            <Button
                                asChild
                                className="bg-storefront-primary hover:bg-storefront-primary/90 rounded-full"
                            >
                                <Link to="/catalogo">Ver Cardápio</Link>
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <CustomerOrderCard key={order.id} order={order} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerOrdersPage;
