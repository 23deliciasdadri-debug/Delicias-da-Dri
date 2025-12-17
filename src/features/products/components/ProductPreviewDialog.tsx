/**
 * ProductPreviewDialog - Modal de visualização de produto
 * Exibe detalhes do produto sem permitir edição
 */

import { X, Edit3, Package, Tag, DollarSign, Scale } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';

import type { Product } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface ProductPreviewDialogProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (product: Product) => void;
    isAdmin?: boolean;
}

export function ProductPreviewDialog({
    product,
    open,
    onOpenChange,
    onEdit,
    isAdmin = false,
}: ProductPreviewDialogProps) {
    if (!product) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                {/* Header com imagem */}
                <div className="relative">
                    {product.image_url ? (
                        <div className="h-48 w-full bg-muted">
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-48 w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                            <Package className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Conteúdo */}
                <div className="p-6 space-y-4">
                    <DialogHeader className="p-0">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <DialogTitle className="text-xl font-bold text-foreground">
                                    {product.name}
                                </DialogTitle>
                                {product.component_category && (
                                    <Badge variant="secondary" className="mt-2">
                                        <Tag className="h-3 w-3 mr-1" />
                                        {product.component_category}
                                    </Badge>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                    {formatCurrency(product.price)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    por {product.unit_type || 'unidade'}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <Separator />

                    {/* Informações detalhadas */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                <span>Preço:</span>
                            </div>
                            <span className="font-medium">{formatCurrency(product.price)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Scale className="h-4 w-4" />
                                <span>Unidade:</span>
                            </div>
                            <span className="font-medium">{product.unit_type || 'Unidade'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Tag className="h-4 w-4" />
                                <span>Tipo:</span>
                            </div>
                            <Badge variant="outline">
                                {product.product_type === 'COMPONENTE_BOLO' ? 'Componente' : 'Produto Final'}
                            </Badge>
                        </div>
                    </div>

                    {/* Descrição */}
                    {product.description && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Descrição</h4>
                                <p className="text-sm text-foreground">{product.description}</p>
                            </div>
                        </>
                    )}

                    {/* Ações */}
                    {isAdmin && onEdit && (
                        <>
                            <Separator />
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        onOpenChange(false);
                                        onEdit(product);
                                    }}
                                >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Editar Produto
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ProductPreviewDialog;
