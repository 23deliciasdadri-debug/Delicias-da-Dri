import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, ShoppingBag, Package, Users, Calculator } from 'lucide-react';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function GlobalFab() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleAction = (path: string) => {
        setOpen(false);
        navigate(`${path}?action=new`);
    };

    return (
        <div className="fixed bottom-20 right-4 z-50 lg:hidden">
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="icon"
                        className="h-12 w-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleAction('/budgets')}>
                        <Calculator className="mr-2 h-4 w-4" />
                        Novo Orçamento
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('/orders')}>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Novo Pedido
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('/products')}>
                        <Package className="mr-2 h-4 w-4" />
                        Novo Produto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('/inventory')}>
                        <FileText className="mr-2 h-4 w-4" />
                        Novo Item Estoque
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('/customers')}>
                        <Users className="mr-2 h-4 w-4" />
                        Novo Cliente
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
