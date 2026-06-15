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
  price: number; // always 10000
  costPrice: number; // 9000 (supplier gets 90%)
  profit: number; // 1000 (10%)
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
  consistency: number; // percentage
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

export type Page = 
  | 'dashboard' 
  | 'branches' 
  | 'suppliers' 
  | 'products'
  | 'kasir' 
  | 'stock' 
  | 'transactions' 
  | 'demand' 
  | 'regions' 
  | 'reports' 
  | 'notifications'
  | 'settings';
