import React, { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import OrderPrintView from './OrderPrintView';
import type { OrderWithDetails } from '../../services/ordersService';
import { listOrders } from '../../services/ordersService';

export default function OrderPrintPage() {
    const { id } = useParams<{ id: string }>();

    // We reuse listOrders but we could optimize to fetch single order.
    // Since listOrders fetches all, let's create a specific fetcher here or reuse listOrders and filter.
    // For better performance, let's fetch specifically.

    const fetchOrder = useCallback(async () => {
        if (!id) throw new Error('ID do pedido não fornecido');

        // We can reuse the logic from listOrders but filtered by ID
        const { data, error } = await supabase
            .from('orders')
            .select(
                `
        *,
        client:clients (
          id,
          name,
          phone,
          email
        ),
        quote:quotes (
          id,
          items:quote_items (
            id,
            quote_id,
            product_id,
            product_name_copy,
            quantity,
            price_at_creation
          )
        )
      `,
            )
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);

        // Map to OrderWithDetails structure
        const order: OrderWithDetails = {
            id: data.id,
            client_id: data.client_id,
            quote_id: data.quote_id ?? null,
            delivery_date: data.delivery_date,
            status: data.status as any,
            total_amount: Number(data.total_amount ?? 0),
            delivery_details: data.delivery_details ?? null,
            created_at: data.created_at,
            client: data.client ?? null,
            items: Array.isArray(data.quote?.items) ? (data.quote?.items as any[]) : [],
        };

        return order;
    }, [id]);

    const { data: order, isLoading, error } = useSupabaseQuery(fetchOrder, {
        enabled: !!id,
        deps: [id],
    });

    useEffect(() => {
        if (order && !isLoading) {
            // Small delay to ensure rendering is complete before print dialog
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [order, isLoading]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
                <h1 className="text-xl font-bold text-foreground mb-2">Erro ao carregar pedido</h1>
                <p className="text-muted-foreground">{error ? (error as Error).message : 'Pedido não encontrado'}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8 print-container">
            <OrderPrintView
                order={order}
                className="shadow-none border-0"
            />
        </div>
    );
}
