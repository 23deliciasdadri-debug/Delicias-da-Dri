import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { listCategories } from '../../services/storefrontService';
import { cn } from '../../lib/utils';

interface ProductFiltersProps {
    selectedCategory: string;
    searchQuery: string;
    onCategoryChange: (category: string) => void;
    onSearchChange: (query: string) => void;
}

/**
 * Componente de filtros para o catálogo.
 * Inclui busca por texto e filtro por categoria.
 */
const ProductFilters: React.FC<ProductFiltersProps> = ({
    selectedCategory,
    searchQuery,
    onCategoryChange,
    onSearchChange,
}) => {
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadCategories = async () => {
            setIsLoading(true);
            const cats = await listCategories();
            setCategories(cats);
            setIsLoading(false);
        };
        loadCategories();
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const clearFilters = () => {
        onCategoryChange('');
        onSearchChange('');
    };

    const hasActiveFilters = selectedCategory || searchQuery;

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 pr-10 rounded-full border-gray-200 focus:border-storefront-primary"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </form>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => onCategoryChange('')}
                    className={cn(
                        'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                        !selectedCategory
                            ? 'bg-storefront-primary text-white'
                            : 'bg-storefront-cream text-storefront-chocolate hover:bg-storefront-cream/80'
                    )}
                >
                    Todos
                </button>

                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="px-4 py-2 rounded-full bg-gray-200 animate-pulse w-20 h-9"
                        ></div>
                    ))
                ) : (
                    categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => onCategoryChange(category)}
                            className={cn(
                                'px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize',
                                selectedCategory === category
                                    ? 'bg-storefront-primary text-white'
                                    : 'bg-storefront-cream text-storefront-chocolate hover:bg-storefront-cream/80'
                            )}
                        >
                            {category}
                        </button>
                    ))
                )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        Filtros ativos
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-7 text-storefront-primary hover:text-storefront-primary/80"
                    >
                        Limpar filtros
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ProductFilters;
