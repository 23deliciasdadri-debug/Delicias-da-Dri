import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Interface para as escolhas do bolo personalizado
 */
export interface CakeChoices {
    format: string;
    size: string;
    flavor: string;
    fillings: string[];
    covering: string;
    theme: string;
    color: string;
    message?: string;
    referenceImageUrl?: string;
}

/**
 * Interface para um item do carrinho
 */
export interface CartItem {
    id: string;
    productId?: string;
    productName: string;
    productImage?: string;
    price: number;
    quantity: number;
    options?: Record<string, string>;
    notes?: string;
    isCustomCake?: boolean;
    cakeChoices?: CakeChoices;
    generatedImageUrl?: string;
}

/**
 * Interface do contexto do carrinho
 */
interface CartContextValue {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    updateItemNotes: (id: string, notes: string) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'deliciasdadri_cart';

/**
 * Gera um ID único para itens do carrinho
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Provider do carrinho de compras.
 * Gerencia o estado do carrinho com persistência em localStorage.
 */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>(() => {
        // Carrega do localStorage na inicialização
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch {
                    return [];
                }
            }
        }
        return [];
    });

    // Persiste no localStorage quando items mudam
    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    /**
     * Adiciona um item ao carrinho
     */
    const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
        setItems((prev) => {
            // Se não for bolo personalizado e já existe o mesmo produto com mesmas opções, incrementa quantidade
            if (!item.isCustomCake && item.productId) {
                const existingIndex = prev.findIndex(
                    (i) =>
                        i.productId === item.productId &&
                        JSON.stringify(i.options) === JSON.stringify(item.options)
                );

                if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        quantity: updated[existingIndex].quantity + item.quantity,
                    };
                    return updated;
                }
            }

            // Caso contrário, adiciona como novo item
            return [...prev, { ...item, id: generateId() }];
        });
    }, []);

    /**
     * Remove um item do carrinho
     */
    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    /**
     * Atualiza a quantidade de um item
     */
    const updateQuantity = useCallback((id: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(id);
            return;
        }

        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
    }, [removeItem]);

    /**
     * Atualiza as observações de um item
     */
    const updateItemNotes = useCallback((id: string, notes: string) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, notes } : item))
        );
    }, []);

    /**
     * Limpa todo o carrinho
     */
    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    /**
     * Calcula o total do carrinho
     */
    const total = useMemo(() => {
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [items]);

    /**
     * Conta o total de itens no carrinho
     */
    const itemCount = useMemo(() => {
        return items.reduce((sum, item) => sum + item.quantity, 0);
    }, [items]);

    const value = useMemo<CartContextValue>(
        () => ({
            items,
            addItem,
            removeItem,
            updateQuantity,
            updateItemNotes,
            clearCart,
            total,
            itemCount,
        }),
        [items, addItem, removeItem, updateQuantity, updateItemNotes, clearCart, total, itemCount]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

/**
 * Hook para acessar o contexto do carrinho
 */
export const useCart = (): CartContextValue => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};
