import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { cn } from '../../../lib/utils';
import {
  Copy,
  Eye,
  EyeOff,
  Info,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Product } from '../../../types';

interface ProductCardProps {
  product: Product;
  formatPrice: (value: number) => string;
  onOpenDetails: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleVisibility: (product: Product) => void;
  onArchive: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  disabled?: boolean;
  isAdmin: boolean;
}

const MotionCard = motion(Card);

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  formatPrice,
  onOpenDetails,
  onEdit,
  onDelete,
  onToggleVisibility,
  onArchive,
  onDuplicate,
  disabled,
  isAdmin,
}) => {
  const displayImage = product.image_url || '/placeholder.svg';
  const visibilityLabel = product.is_public ? 'Visível' : 'Oculto';

  const handleCardClick = () => {
    if (disabled) {
      return;
    }
    onOpenDetails(product);
  };

  return (
    <MotionCard
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <CardContent className="p-0">
        <div className="relative h-56 cursor-pointer" onClick={handleCardClick}>
          <img
            src={displayImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Badge className="bg-white/90 text-foreground shadow">
              {product.product_type === 'COMPONENTE_BOLO' ? 'Componente' : 'Menu'}
            </Badge>
            {product.component_category ? (
              <Badge variant="secondary" className="bg-white/80 text-foreground">
                {product.component_category}
              </Badge>
            ) : null}
          </div>
          {isAdmin ? (
            <div className="absolute top-3 right-3 flex gap-2">
              <Button
                size="icon-sm"
                variant="secondary"
              className={cn(
                'backdrop-blur bg-white/70 text-foreground',
                product.is_public ? 'text-emerald-600' : 'text-rose-600',
              )}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleVisibility(product);
                }}
                aria-label={product.is_public ? 'Ocultar produto' : 'Exibir produto'}
              >
                {product.is_public ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="bg-white/80 text-foreground hover:bg-white"
                    onClick={(event) => event.stopPropagation()}
                    aria-label="Ações rápidas do produto"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onOpenDetails(product)}>
                    <Info className="size-4" />
                    Ver detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(product)}>
                    <Pencil className="size-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(product)}>
                    <Copy className="size-4" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onArchive(product)}>
                    <EyeOff className="size-4" />
                    Arquivar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(product)}>
                    <Trash2 className="size-4" />
                    Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold leading-tight text-foreground">{product.name}</h3>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{visibilityLabel}</p>
            </div>
            {!product.is_public ? (
              <Badge variant="outline" className="border-dashed border-rose-200 text-rose-600">
                Oculto
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description || 'Sem descrição cadastrada.'}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm text-muted-foreground font-medium">/ {product.unit_type}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center"
            onClick={handleCardClick}
            disabled={disabled}
          >
            Ver detalhes
          </Button>
        </div>
      </CardContent>
    </MotionCard>
  );
};

export default ProductCard;
