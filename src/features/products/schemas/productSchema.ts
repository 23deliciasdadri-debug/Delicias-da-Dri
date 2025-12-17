/**
 * Schema de validação e tipos para formulário de Produto
 * Extração de ProductsPage.tsx para reutilização e testabilidade
 */

import { z } from 'zod';
import { parsePriceInput } from '../helpers/mediaHelpers';

/**
 * Schema Zod para validação do formulário de produto
 */
export const productFormSchema = z
    .object({
        name: z.string().min(1, 'Informe o nome do produto.'),
        description: z.string().optional().or(z.literal('')),
        price: z
            .string()
            .min(1, 'Informe o preço.')
            .refine((v) => parsePriceInput(v) > 0, 'Preço inválido.'),
        unit_type: z.string().min(1, 'Informe a unidade.'),
        product_type: z.union([z.literal('PRODUTO_MENU'), z.literal('COMPONENTE_BOLO')]),
        component_category: z.string().optional().or(z.literal('')),
        image_url: z.union([z.literal(''), z.string().url('URL inválida.')]),
        is_public: z.boolean(),
    })
    .superRefine((data, ctx) => {
        if (data.product_type === 'COMPONENTE_BOLO' && !data.component_category?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Componentes precisam de uma categoria.',
                path: ['component_category'],
            });
        }
    });

/**
 * Tipo inferido do schema para uso no formulário
 */
export type ProductFormValues = z.infer<typeof productFormSchema>;

/**
 * Valores padrão para o formulário de produto
 */
export const getDefaultProductForm = (): ProductFormValues => ({
    name: '',
    description: '',
    price: '',
    unit_type: '',
    product_type: 'PRODUTO_MENU',
    component_category: '',
    image_url: '',
    is_public: true,
});

/**
 * Categorias padrão para componentes de bolo
 */
export const DEFAULT_COMPONENT_CATEGORIES = ['tamanho', 'recheio', 'cobertura', 'decoração'] as const;
