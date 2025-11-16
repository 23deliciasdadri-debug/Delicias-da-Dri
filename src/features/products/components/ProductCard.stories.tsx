import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ProductCard from './ProductCard';
import type { Product } from '../../../types';

const sampleProduct: Product = {
  id: 'sample-product',
  name: 'Bolo de Chocolate Belga',
  description: 'Camadas generosas com ganache e frutas frescas. Ideal para 20 porções.',
  image_url: 'https://images.unsplash.com/photo-1542838686-73e53747b3c4?auto=format&fit=crop&w=800&q=60',
  price: 180,
  unit_type: 'unidade',
  product_type: 'PRODUTO_MENU',
  component_category: null,
  is_public: true,
};

const meta: Meta<typeof ProductCard> = {
  title: 'Features/Products/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'centered',
  },
  args: {
    product: sampleProduct,
    formatPrice: (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
    isAdmin: true,
    onOpenDetails: () => {},
    onEdit: () => {},
    onDelete: () => {},
    onToggleVisibility: () => {},
    onArchive: () => {},
    onDuplicate: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {};

export const HiddenProduct: Story = {
  args: {
    product: { ...sampleProduct, is_public: false, name: 'Prancheta de degustação' },
  },
};

export const DisabledActions: Story = {
  args: {
    disabled: true,
  },
};
