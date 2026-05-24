import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  User, Branch, Supplier, Product, DailyStock, 
  Transaction, CartItem, PaymentMethod, Alert,
  BranchPerformance, HourlyRevenue, SupplierRanking
} from '../types';

// Auth Store
interface AuthState {
  user: User | null;
  branch: Branch | null;
  isAuthenticated: boolean;
  login: (user: User, branch?: Branch) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      branch: null,
      isAuthenticated: false,
      login: (user, branch) => set({ user, branch, isAuthenticated: true }),
      logout: () => set({ user: null, branch: null, isAuthenticated: false }),
      updateUser: (updates) => set((state) => ({ 
        user: state.user ? { ...state.user, ...updates } : null 
      })),
    }),
    { name: 'smp-auth' }
  )
);

// POS/Cart Store
interface POSState {
  cart: CartItem[];
  paymentMethod: PaymentMethod | null;
  isProcessing: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setProcessing: (isProcessing: boolean) => void;
  getTotal: () => number;
  getTotalItems: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  paymentMethod: null,
  isProcessing: false,
  
  addToCart: (product) => set((state) => {
    const existing = state.cart.find(item => item.product.id === product.id);
    if (existing) {
      return {
        cart: state.cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    }
    return { cart: [...state.cart, { product, quantity: 1 }] };
  }),
  
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.product.id !== productId),
  })),
  
  updateQuantity: (productId, quantity) => set((state) => ({
    cart: quantity > 0
      ? state.cart.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      : state.cart.filter(item => item.product.id !== productId),
  })),
  
  clearCart: () => set({ cart: [], paymentMethod: null }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  
  getTotal: () => get().cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  getTotalItems: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),
}));

// Inventory Store
interface InventoryState {
  products: Product[];
  dailyStocks: DailyStock[];
  setProducts: (products: Product[]) => void;
  setDailyStocks: (stocks: DailyStock[]) => void;
  updateStock: (productId: string, soldQty: number) => void;
  getAvailableProducts: () => Product[];
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  dailyStocks: [],
  
  setProducts: (products) => set({ products }),
  setDailyStocks: (dailyStocks) => set({ dailyStocks }),
  
  updateStock: (productId, soldQty) => set((state) => ({
    dailyStocks: state.dailyStocks.map(stock =>
      stock.product_id === productId
        ? { 
            ...stock, 
            current_stock: stock.current_stock - soldQty,
            sold_qty: stock.sold_qty + soldQty 
          }
        : stock
    ),
  })),
  
  getAvailableProducts: () => {
    const { products, dailyStocks } = get();
    const stockMap = new Map(dailyStocks.map(s => [s.product_id, s.current_stock]));
    return products.filter(p => (stockMap.get(p.id) || 0) > 0);
  },
}));

// Transaction Store
interface TransactionState {
  transactions: Transaction[];
  pendingSync: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  markSynced: (transactionId: string) => void;
  getTodayTransactions: () => Transaction[];
  getTodayRevenue: () => number;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      pendingSync: [],
      
      addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions],
        pendingSync: transaction.synced_at 
          ? state.pendingSync 
          : [...state.pendingSync, transaction],
      })),
      
      markSynced: (transactionId) => set((state) => ({
        transactions: state.transactions.map(t =>
          t.id === transactionId ? { ...t, synced_at: new Date().toISOString() } : t
        ),
        pendingSync: state.pendingSync.filter(t => t.id !== transactionId),
      })),
      
      getTodayTransactions: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().transactions.filter(t => t.date === today);
      },
      
      getTodayRevenue: () => {
        return get().getTodayTransactions()
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.total_amount, 0);
      },
    }),
    { name: 'smp-transactions' }
  )
);

// Dashboard Store
interface DashboardState {
  branchPerformances: BranchPerformance[];
  hourlyRevenue: HourlyRevenue[];
  supplierRankings: SupplierRanking[];
  alerts: Alert[];
  isLoading: boolean;
  setBranchPerformances: (data: BranchPerformance[]) => void;
  setHourlyRevenue: (data: HourlyRevenue[]) => void;
  setSupplierRankings: (data: SupplierRanking[]) => void;
  setAlerts: (data: Alert[]) => void;
  setLoading: (isLoading: boolean) => void;
  resolveAlert: (alertId: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  branchPerformances: [],
  hourlyRevenue: [],
  supplierRankings: [],
  alerts: [],
  isLoading: false,
  
  setBranchPerformances: (branchPerformances) => set({ branchPerformances }),
  setHourlyRevenue: (hourlyRevenue) => set({ hourlyRevenue }),
  setSupplierRankings: (supplierRankings) => set({ supplierRankings }),
  setAlerts: (alerts) => set({ alerts }),
  setLoading: (isLoading) => set({ isLoading }),
  resolveAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map(a => 
      a.id === alertId ? { ...a, is_resolved: true, resolved_at: new Date().toISOString() } : a
    ),
  })),
}));

// Supplier Store
interface SupplierState {
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  approveSupplier: (supplierId: string) => void;
  rejectSupplier: (supplierId: string) => void;
}

export const useSupplierStore = create<SupplierState>((set) => ({
  suppliers: [],
  setSuppliers: (suppliers) => set({ suppliers }),
  approveSupplier: (supplierId) => set((state) => ({
    suppliers: state.suppliers.map(s =>
      s.id === supplierId ? { ...s, status: 'approved' as const, approved_at: new Date().toISOString() } : s
    ),
  })),
  rejectSupplier: (supplierId) => set((state) => ({
    suppliers: state.suppliers.map(s =>
      s.id === supplierId ? { ...s, status: 'rejected' as const } : s
    ),
  })),
}));

// UI Store
interface UIState {
  sidebarOpen: boolean;
  currentView: string;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentView: 'dashboard',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setCurrentView: (currentView) => set({ currentView }),
}));

// Offline Sync Store
interface SyncState {
  isOnline: boolean;
  lastSyncAt: string | null;
  syncInProgress: boolean;
  setOnline: (isOnline: boolean) => void;
  setLastSync: (timestamp: string) => void;
  setSyncInProgress: (inProgress: boolean) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncAt: null,
  syncInProgress: false,
  setOnline: (isOnline) => set({ isOnline }),
  setLastSync: (lastSyncAt) => set({ lastSyncAt }),
  setSyncInProgress: (syncInProgress) => set({ syncInProgress }),
}));
