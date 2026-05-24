// ==========================================
// SMP (Sarapan Murah Pagi) - Type Definitions
// Complete Business Management System Types
// ==========================================

// Enums
export type UserRole = 
  | 'kasir' 
  | 'supervisor' 
  | 'owner_cabang' 
  | 'area_manager' 
  | 'hq_admin' 
  | 'ceo' 
  | 'investor' 
  | 'supplier';

export type BranchStatus = 'active' | 'inactive' | 'maintenance' | 'pending';
export type BranchType = 'coco' | 'franchise';
export type SupplierStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type TransactionStatus = 'completed' | 'voided' | 'pending';
export type PaymentMethod = 'cash' | 'qris' | 'transfer';
export type AlertType = 'warning' | 'critical' | 'info';
export type AlertCategory = 'revenue' | 'supplier' | 'stock' | 'fraud' | 'system';

// Base interfaces
export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  type: BranchType;
  status: BranchStatus;
  daily_target: number;
  opening_time: string; // "04:30"
  closing_time: string; // "09:00"
  supervisor_id?: string;
  franchise_owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  branch_id?: string;
  pin_hash?: string;
  pin_expires_at?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  branch_id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  ktp_number: string;
  ktp_photo_url: string;
  address: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  status: SupplierStatus;
  total_products: number;
  avg_sell_through_rate: number;
  rating: number;
  total_earnings: number;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  supplier_id: string;
  branch_id: string;
  name: string;
  description?: string;
  category: string;
  photo_url: string;
  qr_code: string;
  price: number; // Always 10000
  supplier_share: number; // Always 9000
  smp_share: number; // Always 1000
  is_active: boolean;
  avg_daily_stock: number;
  avg_daily_sold: number;
  created_at: string;
  updated_at: string;
}

export interface DailyStock {
  id: string;
  branch_id: string;
  supplier_id: string;
  product_id: string;
  date: string;
  initial_stock: number;
  current_stock: number;
  sold_qty: number;
  returned_qty: number;
  checked_in_at: string;
  checked_in_by: string;
  checked_out_at?: string;
  checked_out_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  branch_id: string;
  transaction_number: string;
  date: string;
  time: string;
  cashier_id: string;
  total_items: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  status: TransactionStatus;
  voided_by?: string;
  voided_at?: string;
  void_reason?: string;
  synced_at?: string;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  supplier_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  supplier_share: number;
  smp_share: number;
}

export interface DailySettlement {
  id: string;
  branch_id: string;
  date: string;
  total_transactions: number;
  total_items_sold: number;
  total_revenue: number;
  total_supplier_payout: number;
  total_smp_revenue: number;
  cash_collected: number;
  qris_collected: number;
  transfer_collected: number;
  expected_cash: number;
  cash_difference: number;
  is_reconciled: boolean;
  reconciled_by?: string;
  reconciled_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierPayment {
  id: string;
  branch_id: string;
  supplier_id: string;
  date: string;
  total_items_sold: number;
  gross_amount: number;
  net_amount: number; // After SMP share
  payment_status: 'pending' | 'paid' | 'hold';
  paid_at?: string;
  paid_by?: string;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierScorecard {
  id: string;
  supplier_id: string;
  branch_id: string;
  month: string; // "2025-01"
  sell_through_rate: number; // 40%
  attendance_rate: number; // 25%
  quality_score: number; // 25%
  packaging_score: number; // 10%
  total_score: number;
  rank_in_branch: number;
  total_items_supplied: number;
  total_items_sold: number;
  total_earnings: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  branch_id?: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  branch_id?: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'whatsapp' | 'telegram' | 'email' | 'push';
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

// Dashboard & Analytics Types
export interface BranchPerformance {
  branch_id: string;
  branch_name: string;
  branch_code: string;
  city: string;
  latitude: number;
  longitude: number;
  today_revenue: number;
  today_target: number;
  achievement_rate: number;
  transactions_count: number;
  active_suppliers: number;
  items_sold: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface HourlyRevenue {
  hour: string;
  revenue: number;
  transactions: number;
}

export interface SupplierRanking {
  supplier_id: string;
  supplier_name: string;
  items_sold: number;
  revenue: number;
  sell_through_rate: number;
  rank: number;
}

export interface NationalKPI {
  total_branches: number;
  active_branches: number;
  total_revenue: number;
  avg_revenue_per_branch: number;
  total_transactions: number;
  total_suppliers: number;
  total_items_sold: number;
  best_branch: BranchPerformance;
  worst_branch: BranchPerformance;
}

// Cart & POS Types
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface POSState {
  cart: CartItem[];
  paymentMethod: PaymentMethod | null;
  isProcessing: boolean;
}

// Offline Sync Types
export interface PendingSync {
  id: string;
  type: 'transaction' | 'stock_in' | 'stock_out';
  data: Record<string, unknown>;
  created_at: string;
  retry_count: number;
}

// Form Types
export interface SupplierRegistrationForm {
  name: string;
  phone: string;
  email: string;
  ktp_number: string;
  ktp_photo: File | null;
  address: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  products: ProductRegistrationForm[];
}

export interface ProductRegistrationForm {
  name: string;
  category: string;
  description: string;
  photo: File | null;
  avg_daily_quantity: number;
}

// Constants
export const FIXED_PRICE = 10000;
export const SUPPLIER_SHARE_PERCENT = 90;
export const SMP_SHARE_PERCENT = 10;
export const SUPPLIER_SHARE_AMOUNT = 9000;
export const SMP_SHARE_AMOUNT = 1000;

export const OPERATING_HOURS = {
  open: '04:30',
  close: '09:00',
  peak_start: '05:00',
  peak_end: '07:30',
};

export const SCORECARD_WEIGHTS = {
  sell_through_rate: 0.40,
  attendance: 0.25,
  quality: 0.25,
  packaging: 0.10,
};

export const PRODUCT_CATEGORIES = [
  'Nasi',
  'Gorengan',
  'Kue Basah',
  'Kue Kering',
  'Bubur',
  'Roti',
  'Minuman',
  'Snack',
  'Lainnya',
];
