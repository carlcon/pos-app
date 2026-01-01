// Partner types
export interface Partner {
  id: number;
  name: string;
  code: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  is_active: boolean;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerMinimal {
  id: number;
  name: string;
  code: string;
}

export interface Store {
  id: number;
  name: string;
  code: string;
  description?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  is_default?: boolean;
  admin_count?: number;
  cashier_count?: number;
  auto_print_receipt?: boolean;
  printer_name?: string;
  receipt_template?: string;
  partner?: number;
  partner_name?: string;
  partner_code?: string;
  created_at: string;
  updated_at: string;
}

export interface StoreUser {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: 'STORE_ADMIN' | 'CASHIER';
  is_active: boolean;
  sms_phone?: string;
  created_at: string;
  default_password?: string;
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'STORE_ADMIN' | 'INVENTORY_STAFF' | 'CASHIER' | 'VIEWER';
  phone?: string;
  employee_id?: string;
  is_active_employee: boolean;
  is_active: boolean;
  is_super_admin: boolean;
  partner?: PartnerMinimal;
  assigned_store?: Store | null;
  date_joined: string;
  last_login?: string;
  default_store?: Store | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

export interface ImpersonationResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  impersonating: Partner;
  message: string;
}

export interface StoreImpersonationResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  impersonating_store: Store;
  message: string;
}

export interface ImpersonationStatus {
  is_impersonating_partner: boolean;
  partner: Partner | null;
  is_impersonating_store: boolean;
  store: Store | null;
}

// Notification types
export interface Notification {
  id: number;
  notification_type: 'STORE_ADMIN_TRANSFER' | 'LOW_STOCK_ALERT' | 'OUT_OF_STOCK_ALERT' | 'EXPORT_COMPLETE' | 'STORE_DEACTIVATED' | 'STORE_ACTIVATED';
  title: string;
  message: string;
  is_read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface ExportJob {
  id: number;
  export_type: 'SALES_CSV' | 'SALES_EXCEL' | 'SALES_PDF' | 'PRODUCTS_CSV' | 'PRODUCTS_EXCEL' | 'STOCK_CSV' | 'STOCK_EXCEL';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  file_name?: string;
  error_message?: string;
  filters?: Record<string, unknown>;
  created_at: string;
  completed_at?: string;
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
  wholesale_price?: string;
  minimum_stock_level: number;
  current_stock: number;
  barcode?: string;
  image?: string;
  is_active: boolean;
  is_low_stock?: boolean;
  stock_value?: string;
  available_stores?: number[];
  available_store_names?: string[];
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
  is_wholesale: boolean;
  subtotal: string;
  discount: string;
  total_amount: string;
  notes?: string;
  cashier: number;
  cashier_username?: string;
  store?: number | Store | null;
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
  unit_cost?: string;
  total_cost?: string;
  reference_number?: string;
  notes?: string;
  performed_by: number;
  performed_by_username?: string;
  store?: number | Store | null;
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
  [key: string]: unknown;
}

// Report types
export interface ReportFilters {
  date?: string;
  date_from?: string;
  date_to?: string;
  category?: string;
  payment_method?: string;
  days?: number;
  limit?: number;
  period?: string;
  store_id?: number;
  search?: string;
  status?: string;
  transaction_type?: string;
  vendor?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedReportData<T = unknown> {
  report_type: string;
  generated_at?: string;
  period?: string;
  start_date?: string;
  end_date?: string;
  summary: Record<string, unknown>;
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ReportColumn {
  key: string;
  label: string;
  sortable?: boolean;
  format?: 'currency' | 'number' | 'date' | 'datetime' | 'percentage' | 'text';
  align?: 'start' | 'center' | 'end';
}
