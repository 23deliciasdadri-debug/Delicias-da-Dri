export type ProductType = 'PRODUTO_MENU' | 'COMPONENTE_BOLO';
export type ComponentCategory = 'tamanho' | 'recheio' | 'cobertura' | 'decoracao' | string | null;

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price: number;
  unit_type: string;
  product_type: ProductType;
  component_category: ComponentCategory;
  is_public: boolean;
  created_at?: string;
}

export interface ProductMedia {
  id: number;
  product_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  created_at?: string;
}

export type QuoteStatus = 'Pendente' | 'Aprovado' | 'Recusado';

export interface Quote {
  id: string;
  client_id: string;
  status: QuoteStatus;
  event_type?: string | null;
  event_date?: string | null;
  total_amount: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  approved_at?: string | null;
  public_link_token?: string | null;
  public_link_token_expires_at?: string | null;
  public_link_last_viewed_at?: string | null;
}

export interface QuoteItem {
  id: number;
  quote_id: string;
  product_id?: string | null;
  product_name_copy: string;
  quantity: number;
  price_at_creation: number;
}

export type OrderStatus =
  | 'Aprovado'
  | 'Em Produção'
  | 'Pronto para Entrega'
  | 'Em Entrega'
  | 'Entregue'
  | 'Cancelado';

export interface Order {
  id: string;
  client_id: string;
  quote_id?: string | null;
  delivery_date: string;
  status: OrderStatus;
  total_amount: number;
  delivery_details?: string | null;
  created_at?: string;
}

export type ProfileRole = 'admin' | 'kitchen' | 'delivery';
