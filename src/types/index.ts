export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  type: 'macro' | 'meso' | 'micro';
  isActive: boolean;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  image?: string;
  description: string;
  isAvailable: boolean;
  branchId: string;
}

export interface Transaction {
  id: string;
  items: TransactionItem[];
  total: number;
  paymentMethod: 'cash' | 'qris' | 'transfer';
  customerName?: string;
  branchId: string;
  cashierName: string;
  date: string;
  status: 'completed' | 'cancelled' | 'pending';
}

export interface TransactionItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Employee {
  id: string;
  name: string;
  role: 'owner' | 'manager' | 'cashier' | 'cook' | 'staff';
  phone: string;
  branchId: string;
  salary: number;
  isActive: boolean;
  joinDate: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  branchId: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  items: string[];
}

export interface Inventory {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplierId: string;
  branchId: string;
  lastRestocked: string;
}

export interface DailyReport {
  date: string;
  branchId: string;
  totalSales: number;
  totalTransactions: number;
  totalExpenses: number;
  netProfit: number;
}

export interface Settings {
  googleSheetUrl: string;
  googleAppsScriptUrl: string;
  groqApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
  telegramGroupLink: string;
  autoBackupEnabled: boolean;
  backupInterval: number;
  businessName: string;
  businessLogo?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type PageType = 'dashboard' | 'pos' | 'menu' | 'branches' | 'employees' | 'transactions' | 'expenses' | 'reports' | 'ai-assistant' | 'telegram' | 'settings' | 'backup' | 'consignment';

// Re-export consignment types
export * from './consignment';
