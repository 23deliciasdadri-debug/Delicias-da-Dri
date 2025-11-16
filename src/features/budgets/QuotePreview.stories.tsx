import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import QuotePreview from './QuotePreview';
import type { QuoteDetails } from '../../services/quotesService';

const baseQuote: QuoteDetails = {
  id: 'quote-123456',
  client_id: 'client-1',
  status: 'Pendente',
  event_type: 'Bolo de aniversario',
  event_date: '2025-12-18',
  total_amount: 1450,
  notes: 'Montagem no local e taxa de entrega incluida.',
  created_at: '2025-11-16T12:00:00.000Z',
  updated_at: '2025-11-16T12:00:00.000Z',
  approved_at: null,
  public_link_token: null,
  public_link_token_expires_at: null,
  public_link_last_viewed_at: null,
  client: {
    id: 'client-1',
    name: 'Marina Sousa',
    phone: '(11) 98888-7777',
    email: 'marina@example.com',
    created_at: '2025-01-10T10:00:00.000Z',
  },
  items: [
    {
      id: 1,
      quote_id: 'quote-123456',
      product_id: 'prod-1',
      product_name_copy: 'Bolo red velvet',
      quantity: 1,
      price_at_creation: 650,
    },
    {
      id: 2,
      quote_id: 'quote-123456',
      product_id: 'prod-2',
      product_name_copy: 'Mesa de doces artesanais',
      quantity: 1,
      price_at_creation: 800,
    },
  ],
};

const meta = {
  title: 'Features/QuotePreview',
  component: QuotePreview,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof QuotePreview>;

export default meta;

type Story = StoryObj<typeof QuotePreview>;

export const Pending: Story = {
  args: {
    quote: baseQuote,
    showApproveHint: true,
  },
};

export const Approved: Story = {
  args: {
    quote: {
      ...baseQuote,
      status: 'Aprovado',
      approved_at: '2025-11-20T09:00:00.000Z',
    },
  },
};
