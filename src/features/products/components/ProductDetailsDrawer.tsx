import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import type { Product } from '../../../types';
import type { ProductMediaWithUrl } from '../../../services/productMediaService';
import { cn } from '../../../lib/utils';
import { Copy, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';

interface ProductDetailsDrawerProps {
  open: boolean;
  product: Product | null;
  media: ProductMediaWithUrl[];
  isLoading: boolean;
  error?: string | null;
  onClose: () => void;
  formatPrice: (value: number) => string;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onToggleVisibility: (product: Product) => void;
  onArchive: (product: Product) => void;
  onDelete: (product: Product) => void;
  disabled?: boolean;
  isAdmin: boolean;
}

const ProductDetailsDrawer: React.FC<ProductDetailsDrawerProps> = ({
  open,
  product,
  media,
  isLoading,
  error,
  onClose,
  formatPrice,
  onEdit,
  onDuplicate,
  onToggleVisibility,
  onArchive,
  onDelete,
  disabled,
  isAdmin,
}) => {
  const galleryItems = useMemo(() => {
    if (!product) {
      return [];
    }
    const items: Array<{ id: string; url: string }> = [];
    if (product.image_url) {
      items.push({ id: `${product.id}-cover`, url: product.image_url });
    }
    media.forEach((item) => {
      if (!items.find((existing) => existing.url === item.public_url)) {
        items.push({ id: `${item.id}`, url: item.public_url });
      }
    });
    if (!items.length) {
      items.push({ id: 'placeholder', url: '/placeholder.svg' });
    }
    return items;
  }, [media, product]);

  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const resolvedActiveImageId = useMemo(() => {
    if (activeImageId && galleryItems.some((item) => item.id === activeImageId)) {
      return activeImageId;
    }
    return galleryItems[0]?.id ?? null;
  }, [activeImageId, galleryItems]);
  const activeImage = galleryItems.find((item) => item.id === resolvedActiveImageId) ?? galleryItems[0];

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  if (!product) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-full rounded-none border-0 bg-card p-0 sm:rounded-3xl sm:max-w-2xl md:max-w-4xl md:border shadow-2xl">
        <div className="grid max-h-[90vh] grid-rows-[auto,1fr] overflow-hidden">
          <DialogHeader className="border-b border-border/70 px-6 py-4">
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {product.product_type === 'COMPONENTE_BOLO'
                ? 'Componente usado na montagem de bolos personalizados.'
                : 'Produto exibido no catálogo do menu.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-0 overflow-y-auto md:grid-cols-[1.4fr_1fr]">
            <div className="border-b border-border/60 p-6 md:border-b-0 md:border-r">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
                  <AnimatePresence mode="wait">
                    {activeImage ? (
                      <motion.img
                        key={activeImage.id}
                        src={activeImage.url}
                        alt={product.name}
                        className="h-80 w-full object-cover"
                        loading="lazy"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      />
                    ) : null}
                  </AnimatePresence>
                </div>
                {galleryItems.length > 1 ? (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {galleryItems.map((item) => (
                      <motion.button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveImageId(item.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          'h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-all',
                          resolvedActiveImageId === item.id
                            ? 'border-rose-500 ring-2 ring-rose-200'
                            : 'border-transparent opacity-70 hover:opacity-100',
                        )}
                      >
                        <img src={item.url} alt="Miniatura" className="h-full w-full object-cover" />
                      </motion.button>
                    ))}
                  </div>
                ) : null}

                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando galeria...</p>
                ) : error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wide">
                  {product.product_type === 'COMPONENTE_BOLO' ? 'Componente' : 'Menu'}
                </Badge>
                {product.component_category ? (
                  <Badge>{product.component_category}</Badge>
                ) : null}
                {!product.is_public ? (
                  <Badge variant="outline" className="border-dashed border-rose-300 text-rose-600">
                    Oculto
                  </Badge>
                ) : null}
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Preço unitário</p>
                <p className="text-3xl font-semibold text-foreground">
                  {formatPrice(product.price)}{' '}
                  <span className="text-base font-normal text-muted-foreground">/ {product.unit_type}</span>
                </p>
              </div>

              <div className="my-1 h-px bg-border/70" />

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="text-sm leading-relaxed text-foreground">
                  {product.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              {isAdmin ? (
                <>
                <div className="my-1 h-px bg-border/70" />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(product)}
                      disabled={disabled}
                    >
                      <Pencil className="size-4" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDuplicate(product)} disabled={disabled}>
                      <Copy className="size-4" />
                      Duplicar
                    </Button>
                    <Button
                      size="sm"
                      variant={product.is_public ? 'outline' : 'secondary'}
                      onClick={() => onToggleVisibility(product)}
                      disabled={disabled}
                    >
                      {product.is_public ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      {product.is_public ? 'Ocultar' : 'Tornar visível'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onArchive(product)} disabled={disabled}>
                      <EyeOff className="size-4" />
                      Arquivar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(product)}
                      disabled={disabled}
                    >
                      <Trash2 className="size-4" />
                      Remover
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDrawer;
