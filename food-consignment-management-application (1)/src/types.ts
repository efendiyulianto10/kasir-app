export interface Branch {
  id: string;
  name: string;
  address: string;
  regionId: string;
  status: 'active' | 'testing' | 'closed';
  openDate: string;
  picName: string;
  picPhone: string;
}

export interface Region {
  id: string;
  name: string;
  managerId: string;
  managerName: string;
  managerPhone: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  branchId: string;
  products: string[];
  rating: number;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  name: string;
  category: 'makanan' | 'minuman' | 'snack';
  supplierId: string;
  supplierName: string;
  branchId: string;
  price: number;
  costPrice: number;
  profit: number;
}

export interface DailyTransaction {
  id: string;
  branchId: string;
  date: string;
  items: TransactionItem[];
  paymentMethod: 'cash' | 'qris' | 'shopeefood' | 'gofood';
  totalAmount: number;
  totalProfit: number;
  createdAt: string;
  inputBy: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface DailyStock {
  id: string;
  branchId: string;
  date: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  qtyReceived: number;
  qtySold: number;
  qtyReturned: number;
}

export interface DemandTest {
  id: string;
  branchId: string;
  branchName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  avgDailySales: number;
  avgDailyRevenue: number;
  avgDailyProfit: number;
  consistency: number;
  status: 'testing' | 'consistent' | 'inconsistent' | 'graduated';
  notes: string;
}

export interface Notification {
  id: string;
  type: 'sales_report' | 'stock_alert' | 'return_alert' | 'milestone';
  message: string;
  branchId?: string;
  createdAt: string;
  sent: boolean;
  phone?: string;
}

// SMP pages
export type SmpPage = 'dashboard' | 'kasir' | 'cabang' | 'supplier' | 'stok' | 'demand' | 'audit' | 'logbook' | 'settings';

// Logbook — immutable activity log, anti-manipulasi
export interface LogEntry {
  id: string;
  timestamp: string;      // ISO string, auto-generated
  userId: string;
  userName: string;
  userRole: string;
  branchId: string;
  branchName: string;
  action: LogAction;
  category: LogCategory;
  detail: string;         // human readable description
  amount?: number;        // jika terkait uang
  metadata?: string;      // JSON string untuk data tambahan
}

export type LogAction = 
  | 'login' | 'logout'
  | 'tx_create'           // kasir buat transaksi
  | 'tx_void'             // void transaksi (jika ada)
  | 'stock_in'            // stok masuk dari supplier
  | 'stock_return'        // retur ke supplier
  | 'closing_done'        // kasir selesai closing
  | 'supplier_add' | 'supplier_edit' | 'supplier_delete'
  | 'branch_add' | 'branch_edit' | 'branch_status'
  | 'product_add' | 'product_edit'
  | 'user_add' | 'user_edit' | 'user_delete'
  | 'demand_test' | 'demand_status'
  | 'audit_visit'
  | 'settings_change'
  | 'data_export' | 'data_import' | 'data_reset';

export type LogCategory = 'auth' | 'transaksi' | 'stok' | 'operasional' | 'keuangan' | 'sistem';

// Top level
export type AppView = 'sabiquna' | 'smp';

// Sabiquna
export interface BusinessLine {
  id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
  status: 'active' | 'planning' | 'paused';
  targetRevenue: number;
  currentRevenue: number;
  branches: number;
  employees: number;
  startDate: string;
  color: string;
  notes: string;
}

export interface FinanceSnapshot {
  date: string;
  usdToIdr: number;
  goldPerGram: number;
  inflationRate: number;
  biRate: number;
  totalRevenue: number;
  totalProfit: number;
  totalAssets: number;
  notes: string;
}
