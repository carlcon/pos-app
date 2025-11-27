// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'INVENTORY_STAFF' | 'CASHIER' | 'VIEWER';
  phone?: string;
  employee_id?: string;
  is_active_employee: boolean;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

// Product & Category types
export interface Category {
  id: number;
  name: string;
  description?: string;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category: number;
  category_name?: string;
  brand?: string;
  model_compatibility?: string;
  unit_of_measure: 'PIECE' | 'BOX' | 'SET' | 'PAIR' | 'LITER' | 'KG' | 'METER';
  cost_price: string;
  selling_price: string;
  minimum_stock_level: number;
  current_stock: number;
  barcode?: string;
  image?: string;
  is_active: boolean;
  is_low_stock?: boolean;
  stock_value?: string;
  created_at: string;
  updated_at: string;
}

// Supplier types
export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Purchase Order types
export interface POItem {
  id?: number;
  product: number;
  product_name?: string;
  product_sku?: string;
  ordered_quantity: number;
  received_quantity?: number;
  unit_cost: string;
  total_cost?: string;
  remaining_quantity?: number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: number;
  supplier_name?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';
  order_date: string;
  expected_delivery_date?: string;
  notes?: string;
  created_by: number;
  created_by_username?: string;
  items?: POItem[];
  total_amount?: string;
  is_fully_received?: boolean;
  created_at: string;
  updated_at: string;
}

// Sales types
export interface SaleItem {
  id?: number;
  product: number;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: string;
  discount?: string;
  line_total?: string;
  barcode?: string;
}

export interface Sale {
  id: number;
  sale_number: string;
  customer_name?: string;
  payment_method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT';
  subtotal: string;
  discount: string;
  total_amount: string;
  notes?: string;
  cashier: number;
  cashier_username?: string;
  items?: SaleItem[];
  created_at: string;
}

// Stock Transaction types
export interface StockTransaction {
  id: number;
  product: number;
  product_name?: string;
  product_sku?: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  transaction_type_display?: string;
  reason: 'PURCHASE' | 'SALE' | 'DAMAGED' | 'LOST' | 'RECONCILIATION' | 'RETURN' | 'MANUAL';
  reason_display?: string;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reference_number?: string;
  notes?: string;
  performed_by: number;
  performed_by_username?: string;
  created_at: string;
}

// API Response types
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface ApiError {
  error?: string;
  detail?: string;
  [key: string]: any;
}
