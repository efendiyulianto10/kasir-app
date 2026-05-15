import { Branch, Region, Supplier, Product, DailyTransaction, DailyStock, DemandTest, Notification } from './types';

// Demo data
const demoRegions: Region[] = [
  { id: 'r1', name: 'Jakarta Selatan', managerId: 'm1', managerName: 'Budi Santoso', managerPhone: '6281234567890' },
  { id: 'r2', name: 'Jakarta Timur', managerId: 'm2', managerName: 'Siti Rahayu', managerPhone: '6281234567891' },
  { id: 'r3', name: 'Depok', managerId: 'm3', managerName: 'Ahmad Fauzi', managerPhone: '6281234567892' },
  { id: 'r4', name: 'Bekasi', managerId: 'm4', managerName: 'Dewi Lestari', managerPhone: '6281234567893' },
];

const demoBranches: Branch[] = [
  { id: 'b1', name: 'SMP Tebet 1', address: 'Jl. Tebet Raya No. 10', regionId: 'r1', status: 'active', openDate: '2024-01-15', picName: 'Andi', picPhone: '6281111111111' },
  { id: 'b2', name: 'SMP Tebet 2', address: 'Jl. Tebet Utara No. 5', regionId: 'r1', status: 'active', openDate: '2024-02-01', picName: 'Rina', picPhone: '6281111111112' },
  { id: 'b3', name: 'SMP Cawang', address: 'Jl. Cawang Baru No. 3', regionId: 'r2', status: 'active', openDate: '2024-02-15', picName: 'Doni', picPhone: '6281111111113' },
  { id: 'b4', name: 'SMP Kramat Jati', address: 'Jl. Kramat Jati No. 8', regionId: 'r2', status: 'testing', openDate: '2024-03-01', picName: 'Maya', picPhone: '6281111111114' },
  { id: 'b5', name: 'SMP Depok 1', address: 'Jl. Margonda No. 20', regionId: 'r3', status: 'active', openDate: '2024-03-10', picName: 'Rudi', picPhone: '6281111111115' },
  { id: 'b6', name: 'SMP Depok 2', address: 'Jl. Sawangan No. 15', regionId: 'r3', status: 'testing', openDate: '2024-04-01', picName: 'Lina', picPhone: '6281111111116' },
  { id: 'b7', name: 'SMP Bekasi 1', address: 'Jl. Ahmad Yani No. 12', regionId: 'r4', status: 'active', openDate: '2024-04-15', picName: 'Heri', picPhone: '6281111111117' },
  { id: 'b8', name: 'SMP Bekasi 2', address: 'Jl. Juanda No. 7', regionId: 'r4', status: 'testing', openDate: '2024-05-01', picName: 'Tika', picPhone: '6281111111118' },
];

const demoSuppliers: Supplier[] = [
  { id: 's1', name: 'Bu Sari (Nasi Uduk)', phone: '6282111111111', address: 'Tebet', branchId: 'b1', products: ['Nasi Uduk'], rating: 4.8, status: 'active' },
  { id: 's2', name: 'Pak Joko (Lontong)', phone: '6282111111112', address: 'Tebet', branchId: 'b1', products: ['Lontong Sayur'], rating: 4.5, status: 'active' },
  { id: 's3', name: 'Bu Ani (Gorengan)', phone: '6282111111113', address: 'Tebet', branchId: 'b1', products: ['Gorengan Campur', 'Risol Mayo'], rating: 4.2, status: 'active' },
  { id: 's4', name: 'Pak Dede (Bubur)', phone: '6282111111114', address: 'Cawang', branchId: 'b3', products: ['Bubur Ayam'], rating: 4.6, status: 'active' },
  { id: 's5', name: 'Bu Yuli (Nasi Kuning)', phone: '6282111111115', address: 'Depok', branchId: 'b5', products: ['Nasi Kuning'], rating: 4.7, status: 'active' },
  { id: 's6', name: 'Pak Udin (Minuman)', phone: '6282111111116', address: 'Tebet', branchId: 'b1', products: ['Es Teh', 'Kopi Susu', 'Es Jeruk'], rating: 4.3, status: 'active' },
  { id: 's7', name: 'Bu Neng (Kue)', phone: '6282111111117', address: 'Bekasi', branchId: 'b7', products: ['Kue Lapis', 'Klepon'], rating: 4.4, status: 'active' },
  { id: 's8', name: 'Pak Roni (Soto)', phone: '6282111111118', address: 'Depok', branchId: 'b5', products: ['Soto Ayam'], rating: 4.9, status: 'active' },
];

const demoProducts: Product[] = [
  { id: 'p1', name: 'Nasi Uduk Komplit', category: 'makanan', supplierId: 's1', supplierName: 'Bu Sari', branchId: 'b1', price: 10000, costPrice: 9000, profit: 1000 },
  { id: 'p2', name: 'Lontong Sayur', category: 'makanan', supplierId: 's2', supplierName: 'Pak Joko', branchId: 'b1', price: 10000, costPrice: 9000, profit: 1000 },
  { id: 'p3', name: 'Gorengan Campur (3pcs)', category: 'snack', supplierId: 's3', supplierName: 'Bu Ani', branchId: 'b1', price: 10000, costPrice: 9000, profit: 1000 },
  { id: 'p4', name: 'Risol Mayo (2pcs)', category: 'snack', supplierId: 's3', supplierName: 'Bu Ani', branchId: 'b1', price: 10000, costPrice: 9000, profit: 1000 },
  { id: 'p5', name: 'Bubur Ayam Spesial', category: 'makanan', supplierId: 's4', supplierName: 'Pak Dede', branchId: 'b3', price: 10000, costPrice: 9000, profit: 1000 },
  { id: 'p6', name: 'Nasi Kuning Telur', category: 'makanan', supplierId: 's5', supplierName: 'Bu Yuli', branchId: 'b5', price: 10000, costPrice: 9000, profit: 1000 },
  { id: 'p7', name: 'Es Teh Manis', category: 'minuman', supplierId: 's6', supplierName: 'Pak Udin', branchId: 'b1', price: 10000, costPrice: 9000, profit: 1000 },
  { id: 'p8', name: 'Kopi Susu Gula Aren', category: 'minuman', supplierId: 's6', supplierName: 'Pak Udin', branchId: 'b1', price: 10000, costPrice: 9000, profit: 1000 },
  { id: 'p9', name: 'Es Jeruk Segar', category: 'minuman', supplierId: 's6', supplierName: 'Pak Udin', branchId: 'b1', price: 10000, costPrice: 9000, profit: 1000 },
  { id: 'p10', name: 'Kue Lapis (3pcs)', category: 'snack', supplierId: 's7', supplierName: 'Bu Neng', branchId: 'b7', price: 10000, costPrice: 9000, profit: 1000 },
  { id: 'p11', name: 'Klepon (5pcs)', category: 'snack', supplierId: 's7', supplierName: 'Bu Neng', branchId: 'b7', price: 10000, costPrice: 9000, profit: 1000 },
  { id: 'p12', name: 'Soto Ayam Komplit', category: 'makanan', supplierId: 's8', supplierName: 'Pak Roni', branchId: 'b5', price: 10000, costPrice: 9000, profit: 1000 },
];

// Generate demo transactions for last 30 days
function generateDemoTransactions(): DailyTransaction[] {
  const transactions: DailyTransaction[] = [];
  const methods: Array<'cash' | 'qris' | 'shopeefood' | 'gofood'> = ['cash', 'qris', 'shopeefood', 'gofood'];
  const activeBranches = ['b1', 'b2', 'b3', 'b5', 'b7'];
  
  for (let d = 30; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    
    for (const branchId of activeBranches) {
      const branchProducts = demoProducts.filter(p => p.branchId === branchId || Math.random() > 0.7);
      const numTransactions = Math.floor(Math.random() * 15) + 20;
      
      for (let t = 0; t < numTransactions; t++) {
        const numItems = Math.floor(Math.random() * 3) + 1;
        const items = [];
        for (let i = 0; i < numItems; i++) {
          const product = branchProducts[Math.floor(Math.random() * branchProducts.length)];
          items.push({
            productId: product.id,
            productName: product.name,
            supplierId: product.supplierId,
            supplierName: product.supplierName,
            qty: 1,
            price: 10000,
            subtotal: 10000,
          });
        }
        
        const totalAmount = items.reduce((s, i) => s + i.subtotal, 0);
        transactions.push({
          id: `tx-${branchId}-${dateStr}-${t}`,
          branchId,
          date: dateStr,
          items,
          paymentMethod: methods[Math.floor(Math.random() * methods.length)],
          totalAmount,
          totalProfit: totalAmount * 0.1,
          createdAt: date.toISOString(),
          inputBy: 'Kasir',
        });
      }
    }
  }
  return transactions;
}

function generateDemoStock(): DailyStock[] {
  const stocks: DailyStock[] = [];
  const today = new Date().toISOString().split('T')[0];
  
  for (const product of demoProducts) {
    const received = Math.floor(Math.random() * 30) + 20;
    const sold = Math.floor(Math.random() * received);
    stocks.push({
      id: `stk-${product.id}-${today}`,
      branchId: product.branchId,
      date: today,
      supplierId: product.supplierId,
      supplierName: product.supplierName,
      productId: product.id,
      productName: product.name,
      qtyReceived: received,
      qtySold: sold,
      qtyReturned: received - sold,
    });
  }
  return stocks;
}

const demoDemandTests: DemandTest[] = [
  { id: 'd1', branchId: 'b1', branchName: 'SMP Tebet 1', startDate: '2024-01-15', endDate: '2024-03-15', totalDays: 60, avgDailySales: 85, avgDailyRevenue: 850000, avgDailyProfit: 85000, consistency: 92, status: 'graduated', notes: 'Sangat konsisten, lokasi strategis' },
  { id: 'd2', branchId: 'b3', branchName: 'SMP Cawang', startDate: '2024-02-15', endDate: '2024-04-15', totalDays: 60, avgDailySales: 65, avgDailyRevenue: 650000, avgDailyProfit: 65000, consistency: 78, status: 'consistent', notes: 'Konsisten weekday, turun weekend' },
  { id: 'd3', branchId: 'b4', branchName: 'SMP Kramat Jati', startDate: '2024-03-01', endDate: '', totalDays: 30, avgDailySales: 35, avgDailyRevenue: 350000, avgDailyProfit: 35000, consistency: 55, status: 'testing', notes: 'Masih testing, perlu evaluasi lokasi' },
  { id: 'd4', branchId: 'b5', branchName: 'SMP Depok 1', startDate: '2024-03-10', endDate: '2024-05-10', totalDays: 60, avgDailySales: 95, avgDailyRevenue: 950000, avgDailyProfit: 95000, consistency: 95, status: 'graduated', notes: 'Top performer, dekat kampus' },
  { id: 'd5', branchId: 'b6', branchName: 'SMP Depok 2', startDate: '2024-04-01', endDate: '', totalDays: 20, avgDailySales: 25, avgDailyRevenue: 250000, avgDailyProfit: 25000, consistency: 40, status: 'testing', notes: 'Lokasi kurang ramai' },
  { id: 'd6', branchId: 'b8', branchName: 'SMP Bekasi 2', startDate: '2024-05-01', endDate: '', totalDays: 14, avgDailySales: 45, avgDailyRevenue: 450000, avgDailyProfit: 45000, consistency: 60, status: 'testing', notes: 'Baru buka, potensi bagus' },
];

const demoNotifications: Notification[] = [
  { id: 'n1', type: 'sales_report', message: '📊 Laporan SMP Tebet 1: Hari ini terjual 92 porsi, Revenue Rp920.000, Profit Rp92.000', branchId: 'b1', createdAt: new Date().toISOString(), sent: true, phone: '6281234567890' },
  { id: 'n2', type: 'stock_alert', message: '⚠️ SMP Cawang: Bubur Ayam sisa 15 porsi belum terjual, akan diretur ke Pak Dede', branchId: 'b3', createdAt: new Date().toISOString(), sent: true, phone: '6281234567891' },
  { id: 'n3', type: 'milestone', message: '🎉 SMP Depok 1 mencapai 1000 transaksi! Konsistensi 95%', branchId: 'b5', createdAt: new Date().toISOString(), sent: false, phone: '6281234567892' },
];

// Storage helpers
function loadData<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(`smp_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveData<T>(key: string, data: T): void {
  localStorage.setItem(`smp_${key}`, JSON.stringify(data));
}

export function getRegions(): Region[] {
  return loadData('regions', demoRegions);
}
export function saveRegions(data: Region[]) {
  saveData('regions', data);
}

export function getBranches(): Branch[] {
  return loadData('branches', demoBranches);
}
export function saveBranches(data: Branch[]) {
  saveData('branches', data);
}

export function getSuppliers(): Supplier[] {
  return loadData('suppliers', demoSuppliers);
}
export function saveSuppliers(data: Supplier[]) {
  saveData('suppliers', data);
}

export function getProducts(): Product[] {
  return loadData('products', demoProducts);
}
export function saveProducts(data: Product[]) {
  saveData('products', data);
}

export function getTransactions(): DailyTransaction[] {
  return loadData('transactions', generateDemoTransactions());
}
export function saveTransactions(data: DailyTransaction[]) {
  saveData('transactions', data);
}

export function getStock(): DailyStock[] {
  return loadData('stock', generateDemoStock());
}
export function saveStock(data: DailyStock[]) {
  saveData('stock', data);
}

export function getDemandTests(): DemandTest[] {
  return loadData('demand_tests', demoDemandTests);
}
export function saveDemandTests(data: DemandTest[]) {
  saveData('demand_tests', data);
}

export function getNotifications(): Notification[] {
  return loadData('notifications', demoNotifications);
}
export function saveNotifications(data: Notification[]) {
  saveData('notifications', data);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function sendWhatsAppNotification(phone: string, message: string): string {
  // Using wa.me link (free, no API needed)
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}
