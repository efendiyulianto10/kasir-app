import type { 
  Branch, User, Supplier, Product, DailyStock, 
  Transaction, Alert, BranchPerformance,
  HourlyRevenue, SupplierRanking
} from '../types';

// Branches
export const mockBranches: Branch[] = [
  {
    id: 'branch-001',
    code: 'JKT01',
    name: 'SMP Cibubur Junction',
    address: 'Jl. Alternatif Cibubur No. 123',
    city: 'Jakarta Timur',
    province: 'DKI Jakarta',
    latitude: -6.3631,
    longitude: 106.9032,
    type: 'coco',
    status: 'active',
    daily_target: 3000000,
    opening_time: '04:30',
    closing_time: '09:00',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'branch-002',
    code: 'JKT02',
    name: 'SMP Kelapa Gading',
    address: 'Jl. Boulevard Raya No. 45',
    city: 'Jakarta Utara',
    province: 'DKI Jakarta',
    latitude: -6.1544,
    longitude: 106.9055,
    type: 'coco',
    status: 'active',
    daily_target: 2500000,
    opening_time: '04:30',
    closing_time: '09:00',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'branch-003',
    code: 'BDG01',
    name: 'SMP Dago',
    address: 'Jl. Ir. H. Juanda No. 88',
    city: 'Bandung',
    province: 'Jawa Barat',
    latitude: -6.8841,
    longitude: 107.6140,
    type: 'franchise',
    status: 'active',
    daily_target: 2000000,
    opening_time: '04:30',
    closing_time: '09:00',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
  {
    id: 'branch-004',
    code: 'SBY01',
    name: 'SMP Pakuwon Mall',
    address: 'Jl. Puncak Indah Lontar No. 2',
    city: 'Surabaya',
    province: 'Jawa Timur',
    latitude: -7.2892,
    longitude: 112.6698,
    type: 'franchise',
    status: 'active',
    daily_target: 2500000,
    opening_time: '04:30',
    closing_time: '09:00',
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z',
  },
  {
    id: 'branch-005',
    code: 'JKT03',
    name: 'SMP BSD City',
    address: 'Jl. Pahlawan Seribu No. 99',
    city: 'Tangerang Selatan',
    province: 'Banten',
    latitude: -6.2999,
    longitude: 106.6518,
    type: 'coco',
    status: 'active',
    daily_target: 2800000,
    opening_time: '04:30',
    closing_time: '09:00',
    created_at: '2024-05-01T00:00:00Z',
    updated_at: '2024-05-01T00:00:00Z',
  },
];

// Users
export const mockUsers: User[] = [
  {
    id: 'user-001',
    email: 'ceo@smp.id',
    phone: '081234567890',
    name: 'Ahmad Founder',
    role: 'ceo',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-002',
    email: 'kasir.cibubur@smp.id',
    phone: '081234567891',
    name: 'Budi Kasir',
    role: 'kasir',
    branch_id: 'branch-001',
    is_active: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-003',
    email: 'supervisor.cibubur@smp.id',
    phone: '081234567892',
    name: 'Citra Supervisor',
    role: 'supervisor',
    branch_id: 'branch-001',
    is_active: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-004',
    email: 'supplier1@gmail.com',
    phone: '081234567893',
    name: 'Dewi Supplier',
    role: 'supplier',
    branch_id: 'branch-001',
    is_active: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
];

// Suppliers
export const mockSuppliers: Supplier[] = [
  {
    id: 'supplier-001',
    branch_id: 'branch-001',
    user_id: 'user-004',
    name: 'Dewi Catering',
    phone: '081234567893',
    email: 'dewi@gmail.com',
    ktp_number: '3175012345678901',
    ktp_photo_url: '/uploads/ktp/dewi.jpg',
    address: 'Jl. Merpati No. 10, Cibubur',
    bank_name: 'BCA',
    bank_account_number: '1234567890',
    bank_account_name: 'Dewi Susanti',
    status: 'approved',
    total_products: 5,
    avg_sell_through_rate: 85.5,
    rating: 4.8,
    total_earnings: 15750000,
    approved_by: 'user-003',
    approved_at: '2024-02-02T00:00:00Z',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'supplier-002',
    branch_id: 'branch-001',
    user_id: 'user-005',
    name: 'Warung Bu Eni',
    phone: '081234567894',
    email: 'eni@gmail.com',
    ktp_number: '3175012345678902',
    ktp_photo_url: '/uploads/ktp/eni.jpg',
    address: 'Jl. Kenanga No. 5, Cibubur',
    bank_name: 'Mandiri',
    bank_account_number: '0987654321',
    bank_account_name: 'Eni Wati',
    status: 'approved',
    total_products: 8,
    avg_sell_through_rate: 78.2,
    rating: 4.5,
    total_earnings: 12500000,
    approved_by: 'user-003',
    approved_at: '2024-02-03T00:00:00Z',
    created_at: '2024-02-02T00:00:00Z',
    updated_at: '2024-02-02T00:00:00Z',
  },
  {
    id: 'supplier-003',
    branch_id: 'branch-001',
    user_id: 'user-006',
    name: 'Dapur Mama Rosa',
    phone: '081234567895',
    ktp_number: '3175012345678903',
    ktp_photo_url: '/uploads/ktp/rosa.jpg',
    address: 'Jl. Anggrek No. 15, Cibubur',
    status: 'pending',
    total_products: 0,
    avg_sell_through_rate: 0,
    rating: 0,
    total_earnings: 0,
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
];

// Products
export const mockProducts: Product[] = [
  // Dewi Catering Products
  {
    id: 'product-001',
    supplier_id: 'supplier-001',
    branch_id: 'branch-001',
    name: 'Nasi Uduk Komplit',
    description: 'Nasi uduk dengan ayam goreng, tempe orek, dan sambal',
    category: 'Nasi',
    photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    qr_code: 'SMP-JKT01-001-001',
    price: 10000,
    supplier_share: 9000,
    smp_share: 1000,
    is_active: true,
    avg_daily_stock: 20,
    avg_daily_sold: 18,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'product-002',
    supplier_id: 'supplier-001',
    branch_id: 'branch-001',
    name: 'Lontong Sayur',
    description: 'Lontong dengan sayur labu dan telur',
    category: 'Nasi',
    photo_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    qr_code: 'SMP-JKT01-001-002',
    price: 10000,
    supplier_share: 9000,
    smp_share: 1000,
    is_active: true,
    avg_daily_stock: 15,
    avg_daily_sold: 12,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'product-003',
    supplier_id: 'supplier-001',
    branch_id: 'branch-001',
    name: 'Bubur Ayam Special',
    description: 'Bubur ayam dengan cakwe dan kerupuk',
    category: 'Bubur',
    photo_url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400',
    qr_code: 'SMP-JKT01-001-003',
    price: 10000,
    supplier_share: 9000,
    smp_share: 1000,
    is_active: true,
    avg_daily_stock: 25,
    avg_daily_sold: 22,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  // Bu Eni Products
  {
    id: 'product-004',
    supplier_id: 'supplier-002',
    branch_id: 'branch-001',
    name: 'Risol Mayo',
    description: 'Risol isi sayur dengan mayones',
    category: 'Gorengan',
    photo_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    qr_code: 'SMP-JKT01-002-001',
    price: 10000,
    supplier_share: 9000,
    smp_share: 1000,
    is_active: true,
    avg_daily_stock: 30,
    avg_daily_sold: 25,
    created_at: '2024-02-02T00:00:00Z',
    updated_at: '2024-02-02T00:00:00Z',
  },
  {
    id: 'product-005',
    supplier_id: 'supplier-002',
    branch_id: 'branch-001',
    name: 'Pastel Ayam',
    description: 'Pastel isi ayam dan telur',
    category: 'Gorengan',
    photo_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400',
    qr_code: 'SMP-JKT01-002-002',
    price: 10000,
    supplier_share: 9000,
    smp_share: 1000,
    is_active: true,
    avg_daily_stock: 25,
    avg_daily_sold: 20,
    created_at: '2024-02-02T00:00:00Z',
    updated_at: '2024-02-02T00:00:00Z',
  },
  {
    id: 'product-006',
    supplier_id: 'supplier-002',
    branch_id: 'branch-001',
    name: 'Lemper Ayam',
    description: 'Lemper isi ayam suwir',
    category: 'Kue Basah',
    photo_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
    qr_code: 'SMP-JKT01-002-003',
    price: 10000,
    supplier_share: 9000,
    smp_share: 1000,
    is_active: true,
    avg_daily_stock: 20,
    avg_daily_sold: 18,
    created_at: '2024-02-02T00:00:00Z',
    updated_at: '2024-02-02T00:00:00Z',
  },
  {
    id: 'product-007',
    supplier_id: 'supplier-002',
    branch_id: 'branch-001',
    name: 'Kue Lapis',
    description: 'Kue lapis legit homemade',
    category: 'Kue Basah',
    photo_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
    qr_code: 'SMP-JKT01-002-004',
    price: 10000,
    supplier_share: 9000,
    smp_share: 1000,
    is_active: true,
    avg_daily_stock: 15,
    avg_daily_sold: 10,
    created_at: '2024-02-02T00:00:00Z',
    updated_at: '2024-02-02T00:00:00Z',
  },
  {
    id: 'product-008',
    supplier_id: 'supplier-002',
    branch_id: 'branch-001',
    name: 'Roti Bakar Coklat',
    description: 'Roti bakar dengan selai coklat',
    category: 'Roti',
    photo_url: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400',
    qr_code: 'SMP-JKT01-002-005',
    price: 10000,
    supplier_share: 9000,
    smp_share: 1000,
    is_active: true,
    avg_daily_stock: 20,
    avg_daily_sold: 15,
    created_at: '2024-02-02T00:00:00Z',
    updated_at: '2024-02-02T00:00:00Z',
  },
];

// Generate today's date
const today = new Date().toISOString().split('T')[0];

// Daily Stocks
export const mockDailyStocks: DailyStock[] = mockProducts.map((product, index) => ({
  id: `stock-${today}-${index + 1}`,
  branch_id: product.branch_id,
  supplier_id: product.supplier_id,
  product_id: product.id,
  date: today,
  initial_stock: Math.floor(Math.random() * 10) + 10,
  current_stock: Math.floor(Math.random() * 8) + 2,
  sold_qty: Math.floor(Math.random() * 8),
  returned_qty: 0,
  checked_in_at: `${today}T04:30:00Z`,
  checked_in_by: 'user-002',
  created_at: `${today}T04:30:00Z`,
  updated_at: `${today}T06:00:00Z`,
}));

// Transactions
export const generateMockTransactions = (count: number = 50): Transaction[] => {
  const transactions: Transaction[] = [];
  const paymentMethods: ('cash' | 'qris' | 'transfer')[] = ['cash', 'qris', 'cash', 'cash', 'qris'];
  
  for (let i = 0; i < count; i++) {
    const hour = 4 + Math.floor(Math.random() * 5);
    const minute = Math.floor(Math.random() * 60);
    const totalItems = Math.floor(Math.random() * 5) + 1;
    
    transactions.push({
      id: `trx-${today}-${String(i + 1).padStart(4, '0')}`,
      branch_id: 'branch-001',
      transaction_number: `JKT01${today.replace(/-/g, '').slice(2)}${String(i + 1).padStart(4, '0')}`,
      date: today,
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
      cashier_id: 'user-002',
      total_items: totalItems,
      total_amount: totalItems * 10000,
      payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      status: 'completed',
      synced_at: new Date().toISOString(),
      created_at: `${today}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`,
    });
  }
  
  return transactions.sort((a, b) => b.time.localeCompare(a.time));
};

export const mockTransactions = generateMockTransactions(50);

// Hourly Revenue
export const mockHourlyRevenue: HourlyRevenue[] = [
  { hour: '04:30', revenue: 150000, transactions: 15 },
  { hour: '05:00', revenue: 450000, transactions: 45 },
  { hour: '05:30', revenue: 680000, transactions: 68 },
  { hour: '06:00', revenue: 920000, transactions: 92 },
  { hour: '06:30', revenue: 750000, transactions: 75 },
  { hour: '07:00', revenue: 520000, transactions: 52 },
  { hour: '07:30', revenue: 380000, transactions: 38 },
  { hour: '08:00', revenue: 250000, transactions: 25 },
  { hour: '08:30', revenue: 120000, transactions: 12 },
];

// Branch Performances
export const mockBranchPerformances: BranchPerformance[] = mockBranches.map(branch => {
  const todayRevenue = Math.floor(Math.random() * 2000000) + 1000000;
  const achievementRate = (todayRevenue / branch.daily_target) * 100;
  
  return {
    branch_id: branch.id,
    branch_name: branch.name,
    branch_code: branch.code,
    city: branch.city,
    latitude: branch.latitude,
    longitude: branch.longitude,
    today_revenue: todayRevenue,
    today_target: branch.daily_target,
    achievement_rate: Math.round(achievementRate * 100) / 100,
    transactions_count: Math.floor(todayRevenue / 15000),
    active_suppliers: Math.floor(Math.random() * 30) + 20,
    items_sold: Math.floor(todayRevenue / 10000),
    status: achievementRate >= 100 ? 'excellent' : 
            achievementRate >= 75 ? 'good' : 
            achievementRate >= 50 ? 'warning' : 'critical',
  };
});

// Supplier Rankings
export const mockSupplierRankings: SupplierRanking[] = [
  { supplier_id: 'supplier-001', supplier_name: 'Dewi Catering', items_sold: 52, revenue: 520000, sell_through_rate: 92.5, rank: 1 },
  { supplier_id: 'supplier-002', supplier_name: 'Warung Bu Eni', items_sold: 48, revenue: 480000, sell_through_rate: 85.2, rank: 2 },
  { supplier_id: 'supplier-004', supplier_name: 'Dapur Mbak Siti', items_sold: 42, revenue: 420000, sell_through_rate: 82.1, rank: 3 },
  { supplier_id: 'supplier-005', supplier_name: 'Roti Pak Joko', items_sold: 38, revenue: 380000, sell_through_rate: 78.5, rank: 4 },
  { supplier_id: 'supplier-006', supplier_name: 'Kue Bu Ratna', items_sold: 35, revenue: 350000, sell_through_rate: 75.0, rank: 5 },
];

// Alerts
export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    branch_id: 'branch-003',
    type: 'warning',
    category: 'revenue',
    title: 'Target Harian Rendah',
    message: 'SMP Dago baru mencapai 45% dari target harian. Perlu evaluasi.',
    is_resolved: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'alert-002',
    branch_id: 'branch-001',
    type: 'info',
    category: 'supplier',
    title: 'Supplier Baru Menunggu Approval',
    message: '3 supplier baru di SMP Cibubur menunggu persetujuan.',
    is_resolved: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'alert-003',
    branch_id: 'branch-004',
    type: 'critical',
    category: 'stock',
    title: 'Stok Menipis',
    message: 'SMP Pakuwon Mall: 5 produk stoknya tinggal < 20%',
    is_resolved: false,
    created_at: new Date().toISOString(),
  },
];

// National KPI
export const mockNationalKPI = {
  total_branches: mockBranches.length,
  active_branches: mockBranches.filter(b => b.status === 'active').length,
  total_revenue: mockBranchPerformances.reduce((sum, b) => sum + b.today_revenue, 0),
  avg_revenue_per_branch: Math.round(mockBranchPerformances.reduce((sum, b) => sum + b.today_revenue, 0) / mockBranches.length),
  total_transactions: mockBranchPerformances.reduce((sum, b) => sum + b.transactions_count, 0),
  total_suppliers: mockSuppliers.filter(s => s.status === 'approved').length * mockBranches.length,
  total_items_sold: mockBranchPerformances.reduce((sum, b) => sum + b.items_sold, 0),
  best_branch: mockBranchPerformances.reduce((best, curr) => 
    curr.achievement_rate > best.achievement_rate ? curr : best
  ),
  worst_branch: mockBranchPerformances.reduce((worst, curr) => 
    curr.achievement_rate < worst.achievement_rate ? curr : worst
  ),
};
