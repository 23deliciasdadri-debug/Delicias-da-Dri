import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectionCardProps {
    id: string;
    label: string;
    description?: string;
    imageUrl?: string;
    icon?: React.ReactNode;
    price?: number;
    isSelected: boolean;
    onSelect: (id: string) => void;
    disabled?: boolean;
}

/**
 * Card selecionável para opções do wizard.
 * Pode exibir imagem, ícone e preço opcional.
 */
const SelectionCard: React.FC<SelectionCardProps> = ({
    id,
    label,
    description,
    imageUrl,
    icon,
    price,
    isSelected,
    onSelect,
    disabled = false,
}) => {
    return (
        <button
            onClick={() => !disabled && onSelect(id)}
            disabled={disabled}
            className={cn(
                'relative w-full p-4 rounded-2xl border-2 transition-all text-left',
                'hover:border-storefront-primary/50 hover:shadow-md',
                isSelected && 'border-storefront-primary bg-storefront-primary/5 shadow-md',
                !isSelected && 'border-gray-200 bg-white',
                disabled && 'opacity-50 cursor-not-allowed hover:border-gray-200 hover:shadow-none'
            )}
        >
            {/* Selected Indicator */}
            {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-storefront-primary text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                </div>
            )}

            {/* Image or Icon */}
            {(imageUrl || icon) && (
                <div className="mb-3">
                    {imageUrl ? (
                        <div className="w-full aspect-video rounded-lg overflow-hidden bg-storefront-cream">
                            <img
                                src={imageUrl}
                                alt={label}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-storefront-cream flex items-center justify-center text-storefront-primary">
                            {icon}
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div>
                <h4 className={cn(
                    'font-medium',
                    isSelected ? 'text-storefront-primary' : 'text-storefront-chocolate'
                )}>
                    {label}
                </h4>

                {description && (
                    <p className="text-sm text-storefront-chocolate/60 mt-1">
                        {description}
                    </p>
                )}

                {price !== undefined && (
                    <p className="text-sm font-semibold text-storefront-primary mt-2">
                        + {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                        }).format(price)}
                    </p>
                )}
            </div>
        </button>
    );
};

export default SelectionCard;
