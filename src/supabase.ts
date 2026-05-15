// Supabase sync configuration and functions

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
  lastSync?: string;
  tablesCreated?: boolean;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  try {
    const data = localStorage.getItem('smp_supabase_config');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem('smp_supabase_config', JSON.stringify(config));
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem('smp_supabase_config');
}

// Clean and validate Supabase URL
function cleanSupabaseUrl(url: string): string {
  let cleaned = url.trim();
  // Remove trailing slash
  while (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  // Ensure https
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned;
}

// Test connection to Supabase
export async function testConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const cleanUrl = cleanSupabaseUrl(url);
    
    // Validate URL format
    if (!cleanUrl.includes('.supabase.co')) {
      return { 
        success: false, 
        message: '❌ URL tidak valid. Format harus: https://[project-ref].supabase.co' 
      };
    }

    // Validate API key format (JWT)
    if (!anonKey.startsWith('eyJ')) {
      return { 
        success: false, 
        message: '❌ API Key tidak valid. Key harus dimulai dengan "eyJ..."' 
      };
    }

    // Try to access the REST API - we'll try to query a non-existent table
    // This will return 404 if connected (table doesn't exist) or 401 if not authorized
    const response = await fetch(`${cleanUrl}/rest/v1/smp_connection_test?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });
    
    // 200 = table exists (great!)
    // 404 or response with "relation does not exist" = connected but table doesn't exist (still good!)
    // 401/403 = authentication failed
    
    if (response.status === 200) {
      return { success: true, message: '✅ Koneksi berhasil!' };
    }
    
    if (response.status === 401 || response.status === 403) {
      return { 
        success: false, 
        message: '❌ API Key ditolak. Pastikan:\n• Menggunakan "anon public" key\n• Key di-copy dengan lengkap\n• Project Supabase masih aktif' 
      };
    }
    
    // Check response body for more info
    const text = await response.text();
    
    // If it says relation doesn't exist, that's fine - it means we're connected!
    if (text.includes('does not exist') || text.includes('relation') || response.status === 404) {
      return { success: true, message: '✅ Koneksi berhasil! Tabel belum dibuat.' };
    }
    
    // Any other response, consider it a success if not 4xx/5xx auth error
    if (response.status >= 200 && response.status < 400) {
      return { success: true, message: '✅ Koneksi berhasil!' };
    }

    return { success: false, message: `❌ Error ${response.status}: ${text.substring(0, 100)}` };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('TypeError')) {
      return { 
        success: false, 
        message: '❌ Tidak bisa terhubung ke server.\n\nKemungkinan penyebab:\n• URL salah\n• Tidak ada koneksi internet\n• Project Supabase tidak aktif/paused' 
      };
    }
    
    return { success: false, message: `❌ Error: ${errorMsg}` };
  }
}

// Table definitions for auto-setup
const tableDefinitions = [
  {
    name: 'smp_users',
    sql: `
CREATE TABLE IF NOT EXISTS smp_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager_wilayah', 'pic_cabang', 'kasir')),
  region_id TEXT,
  branch_id TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
  },
  {
    name: 'smp_regions',
    sql: `
CREATE TABLE IF NOT EXISTS smp_regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  manager_id TEXT,
  manager_name TEXT,
  manager_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
  },
  {
    name: 'smp_branches',
    sql: `
CREATE TABLE IF NOT EXISTS smp_branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  region_id TEXT,
  status TEXT DEFAULT 'testing' CHECK (status IN ('active', 'testing', 'closed')),
  open_date TEXT,
  pic_name TEXT,
  pic_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
  },
  {
    name: 'smp_suppliers',
    sql: `
CREATE TABLE IF NOT EXISTS smp_suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  branch_id TEXT,
  products JSONB DEFAULT '[]',
  rating NUMERIC DEFAULT 5,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
  },
  {
    name: 'smp_products',
    sql: `
CREATE TABLE IF NOT EXISTS smp_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('makanan', 'minuman', 'snack')),
  supplier_id TEXT,
  supplier_name TEXT,
  branch_id TEXT,
  price INTEGER DEFAULT 10000,
  cost_price INTEGER DEFAULT 9000,
  profit INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
  },
  {
    name: 'smp_transactions',
    sql: `
CREATE TABLE IF NOT EXISTS smp_transactions (
  id TEXT PRIMARY KEY,
  branch_id TEXT,
  date TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  payment_method TEXT CHECK (payment_method IN ('cash', 'qris', 'shopeefood', 'gofood')),
  total_amount INTEGER DEFAULT 0,
  total_profit INTEGER DEFAULT 0,
  input_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
  },
  {
    name: 'smp_stock',
    sql: `
CREATE TABLE IF NOT EXISTS smp_stock (
  id TEXT PRIMARY KEY,
  branch_id TEXT,
  date TEXT NOT NULL,
  supplier_id TEXT,
  supplier_name TEXT,
  product_id TEXT,
  product_name TEXT,
  qty_received INTEGER DEFAULT 0,
  qty_sold INTEGER DEFAULT 0,
  qty_returned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
  },
  {
    name: 'smp_demand_tests',
    sql: `
CREATE TABLE IF NOT EXISTS smp_demand_tests (
  id TEXT PRIMARY KEY,
  branch_id TEXT,
  branch_name TEXT,
  start_date TEXT,
  end_date TEXT,
  total_days INTEGER DEFAULT 0,
  avg_daily_sales INTEGER DEFAULT 0,
  avg_daily_revenue INTEGER DEFAULT 0,
  avg_daily_profit INTEGER DEFAULT 0,
  consistency INTEGER DEFAULT 0,
  status TEXT DEFAULT 'testing' CHECK (status IN ('testing', 'consistent', 'inconsistent', 'graduated')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
  },
  {
    name: 'smp_notifications',
    sql: `
CREATE TABLE IF NOT EXISTS smp_notifications (
  id TEXT PRIMARY KEY,
  type TEXT CHECK (type IN ('sales_report', 'stock_alert', 'return_alert', 'milestone')),
  message TEXT,
  branch_id TEXT,
  phone TEXT,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
  }
];

// Generate full setup SQL
export function generateFullSetupSQL(): string {
  let sql = `-- =============================================
-- SMP (Sarapan Murah Pagi) - Database Setup
-- Copy semua SQL ini dan jalankan di Supabase SQL Editor
-- =============================================

`;

  // Add all table definitions
  for (const table of tableDefinitions) {
    sql += `-- Table: ${table.name}\n`;
    sql += table.sql.trim() + '\n\n';
  }

  // Add RLS policies
  sql += `
-- =============================================
-- Row Level Security (RLS) - WAJIB untuk akses API
-- =============================================

`;

  for (const table of tableDefinitions) {
    sql += `ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for ${table.name}" ON ${table.name};
CREATE POLICY "Enable all access for ${table.name}" ON ${table.name} FOR ALL USING (true) WITH CHECK (true);

`;
  }

  sql += `
-- =============================================
-- SELESAI! Klik "Run" untuk menjalankan SQL ini
-- =============================================
`;

  return sql;
}

// Check if a table exists
async function tableExists(config: SupabaseConfig, tableName: string): Promise<boolean> {
  try {
    const cleanUrl = cleanSupabaseUrl(config.url);
    const response = await fetch(`${cleanUrl}/rest/v1/${tableName}?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });
    
    // 200 = exists, anything else with "does not exist" = doesn't exist
    if (response.ok) return true;
    
    const text = await response.text();
    if (text.includes('does not exist')) return false;
    
    // 404 usually means table doesn't exist
    return response.status !== 404 && response.status < 400;
  } catch {
    return false;
  }
}

// Auto-setup: Check all tables
export async function autoSetupTables(config: SupabaseConfig): Promise<{ 
  success: boolean; 
  message: string; 
  details: { table: string; status: string }[];
  needsManualSetup: boolean;
  allTablesExist: boolean;
}> {
  const details: { table: string; status: string }[] = [];
  let allExist = true;
  
  for (const table of tableDefinitions) {
    const exists = await tableExists(config, table.name);
    details.push({
      table: table.name,
      status: exists ? '✅ Ada' : '❌ Belum ada'
    });
    if (!exists) allExist = false;
  }
  
  if (allExist) {
    const updatedConfig = { ...config, tablesCreated: true };
    saveSupabaseConfig(updatedConfig);
    return {
      success: true,
      message: '✅ Semua tabel sudah tersedia! Siap untuk sync data.',
      details,
      needsManualSetup: false,
      allTablesExist: true
    };
  }
  
  return {
    success: false,
    message: '⚠️ Beberapa tabel belum dibuat. Jalankan SQL setup di Supabase.',
    details,
    needsManualSetup: true,
    allTablesExist: false
  };
}

// Get all local data
function getAllLocalData(): Record<string, unknown[]> {
  const keys = ['users', 'regions', 'branches', 'suppliers', 'products', 'transactions', 'stock', 'demand_tests', 'notifications'];
  const data: Record<string, unknown[]> = {};
  
  keys.forEach(key => {
    const val = localStorage.getItem(`smp_${key}`);
    if (val) {
      try {
        data[key] = JSON.parse(val);
      } catch {
        data[key] = [];
      }
    } else {
      data[key] = [];
    }
  });
  
  return data;
}

// Transform local data to Supabase format (snake_case)
function transformToSupabaseFormat(key: string, items: unknown[]): unknown[] {
  const transformMap: Record<string, (item: Record<string, unknown>) => Record<string, unknown>> = {
    users: (item) => ({
      id: item.id,
      username: item.username,
      password: item.password,
      name: item.name,
      role: item.role,
      region_id: item.regionId || null,
      branch_id: item.branchId || null,
      phone: item.phone || null,
    }),
    regions: (item) => ({
      id: item.id,
      name: item.name,
      manager_id: item.managerId || null,
      manager_name: item.managerName || null,
      manager_phone: item.managerPhone || null,
    }),
    branches: (item) => ({
      id: item.id,
      name: item.name,
      address: item.address || null,
      region_id: item.regionId || null,
      status: item.status || 'testing',
      open_date: item.openDate || null,
      pic_name: item.picName || null,
      pic_phone: item.picPhone || null,
    }),
    suppliers: (item) => ({
      id: item.id,
      name: item.name,
      phone: item.phone || null,
      address: item.address || null,
      branch_id: item.branchId || null,
      products: item.products || [],
      rating: item.rating || 5,
      status: item.status || 'active',
    }),
    products: (item) => ({
      id: item.id,
      name: item.name,
      category: item.category || 'makanan',
      supplier_id: item.supplierId || null,
      supplier_name: item.supplierName || null,
      branch_id: item.branchId || null,
      price: item.price || 10000,
      cost_price: item.costPrice || 9000,
      profit: item.profit || 1000,
    }),
    transactions: (item) => ({
      id: item.id,
      branch_id: item.branchId || null,
      date: item.date,
      items: item.items || [],
      payment_method: item.paymentMethod || 'cash',
      total_amount: item.totalAmount || 0,
      total_profit: item.totalProfit || 0,
      input_by: item.inputBy || null,
      created_at: item.createdAt || new Date().toISOString(),
    }),
    stock: (item) => ({
      id: item.id,
      branch_id: item.branchId || null,
      date: item.date,
      supplier_id: item.supplierId || null,
      supplier_name: item.supplierName || null,
      product_id: item.productId || null,
      product_name: item.productName || null,
      qty_received: item.qtyReceived || 0,
      qty_sold: item.qtySold || 0,
      qty_returned: item.qtyReturned || 0,
    }),
    demand_tests: (item) => ({
      id: item.id,
      branch_id: item.branchId || null,
      branch_name: item.branchName || null,
      start_date: item.startDate || null,
      end_date: item.endDate || null,
      total_days: item.totalDays || 0,
      avg_daily_sales: item.avgDailySales || 0,
      avg_daily_revenue: item.avgDailyRevenue || 0,
      avg_daily_profit: item.avgDailyProfit || 0,
      consistency: item.consistency || 0,
      status: item.status || 'testing',
      notes: item.notes || null,
    }),
    notifications: (item) => ({
      id: item.id,
      type: item.type || 'sales_report',
      message: item.message || null,
      branch_id: item.branchId || null,
      phone: item.phone || null,
      sent: item.sent || false,
      created_at: item.createdAt || new Date().toISOString(),
    }),
  };

  const transformer = transformMap[key];
  if (!transformer) return items;
  
  return (items as Record<string, unknown>[]).map(transformer);
}

// Transform Supabase data back to local format (camelCase)
function transformToLocalFormat(key: string, items: unknown[]): unknown[] {
  const transformMap: Record<string, (item: Record<string, unknown>) => Record<string, unknown>> = {
    users: (item) => ({
      id: item.id,
      username: item.username,
      password: item.password,
      name: item.name,
      role: item.role,
      regionId: item.region_id || undefined,
      branchId: item.branch_id || undefined,
      phone: item.phone || undefined,
    }),
    regions: (item) => ({
      id: item.id,
      name: item.name,
      managerId: item.manager_id || '',
      managerName: item.manager_name || '',
      managerPhone: item.manager_phone || '',
    }),
    branches: (item) => ({
      id: item.id,
      name: item.name,
      address: item.address || '',
      regionId: item.region_id || '',
      status: item.status || 'testing',
      openDate: item.open_date || '',
      picName: item.pic_name || '',
      picPhone: item.pic_phone || '',
    }),
    suppliers: (item) => ({
      id: item.id,
      name: item.name,
      phone: item.phone || '',
      address: item.address || '',
      branchId: item.branch_id || '',
      products: item.products || [],
      rating: item.rating || 5,
      status: item.status || 'active',
    }),
    products: (item) => ({
      id: item.id,
      name: item.name,
      category: item.category || 'makanan',
      supplierId: item.supplier_id || '',
      supplierName: item.supplier_name || '',
      branchId: item.branch_id || '',
      price: item.price || 10000,
      costPrice: item.cost_price || 9000,
      profit: item.profit || 1000,
    }),
    transactions: (item) => ({
      id: item.id,
      branchId: item.branch_id || '',
      date: item.date,
      items: item.items || [],
      paymentMethod: item.payment_method || 'cash',
      totalAmount: item.total_amount || 0,
      totalProfit: item.total_profit || 0,
      inputBy: item.input_by || '',
      createdAt: item.created_at || new Date().toISOString(),
    }),
    stock: (item) => ({
      id: item.id,
      branchId: item.branch_id || '',
      date: item.date,
      supplierId: item.supplier_id || '',
      supplierName: item.supplier_name || '',
      productId: item.product_id || '',
      productName: item.product_name || '',
      qtyReceived: item.qty_received || 0,
      qtySold: item.qty_sold || 0,
      qtyReturned: item.qty_returned || 0,
    }),
    demand_tests: (item) => ({
      id: item.id,
      branchId: item.branch_id || '',
      branchName: item.branch_name || '',
      startDate: item.start_date || '',
      endDate: item.end_date || '',
      totalDays: item.total_days || 0,
      avgDailySales: item.avg_daily_sales || 0,
      avgDailyRevenue: item.avg_daily_revenue || 0,
      avgDailyProfit: item.avg_daily_profit || 0,
      consistency: item.consistency || 0,
      status: item.status || 'testing',
      notes: item.notes || '',
    }),
    notifications: (item) => ({
      id: item.id,
      type: item.type || 'sales_report',
      message: item.message || '',
      branchId: item.branch_id || undefined,
      phone: item.phone || undefined,
      sent: item.sent || false,
      createdAt: item.created_at || new Date().toISOString(),
    }),
  };

  const transformer = transformMap[key];
  if (!transformer) return items;
  
  return (items as Record<string, unknown>[]).map(transformer);
}

// Table name mapping
const tableNameMap: Record<string, string> = {
  users: 'smp_users',
  regions: 'smp_regions',
  branches: 'smp_branches',
  suppliers: 'smp_suppliers',
  products: 'smp_products',
  transactions: 'smp_transactions',
  stock: 'smp_stock',
  demand_tests: 'smp_demand_tests',
  notifications: 'smp_notifications',
};

// Push data to Supabase (all tables)
export async function pushToSupabase(config: SupabaseConfig): Promise<{ 
  success: boolean; 
  message: string;
  details: { table: string; status: string; count: number }[];
}> {
  const details: { table: string; status: string; count: number }[] = [];
  const data = getAllLocalData();
  const cleanUrl = cleanSupabaseUrl(config.url);
  
  // Order matters - tables without foreign key dependencies first
  const pushOrder = ['regions', 'branches', 'suppliers', 'products', 'users', 'transactions', 'stock', 'demand_tests', 'notifications'];
  
  for (const key of pushOrder) {
    const tableName = tableNameMap[key];
    const items = data[key] || [];
    
    if (items.length === 0) {
      details.push({ table: tableName, status: '⏭️ Kosong', count: 0 });
      continue;
    }
    
    try {
      // Delete existing data first (upsert alternative)
      await fetch(`${cleanUrl}/rest/v1/${tableName}?id=neq.___never_match___`, {
        method: 'DELETE',
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Transform and insert data
      const transformedData = transformToSupabaseFormat(key, items);
      
      const response = await fetch(`${cleanUrl}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(transformedData),
      });
      
      if (response.ok || response.status === 201) {
        details.push({ table: tableName, status: '✅ OK', count: items.length });
      } else {
        const errorText = await response.text();
        console.error(`Push error for ${tableName}:`, errorText);
        details.push({ table: tableName, status: `❌ ${response.status}`, count: 0 });
      }
    } catch (error) {
      console.error(`Push error for ${tableName}:`, error);
      details.push({ table: tableName, status: `❌ Error`, count: 0 });
    }
  }
  
  const successCount = details.filter(d => d.status.includes('✅') || d.status.includes('⏭️')).length;
  const updatedConfig = { ...config, lastSync: new Date().toISOString() };
  saveSupabaseConfig(updatedConfig);
  
  return {
    success: successCount === pushOrder.length,
    message: successCount === pushOrder.length 
      ? `✅ Push berhasil! ${details.filter(d => d.status.includes('✅')).reduce((s, d) => s + d.count, 0)} data tersinkronisasi.`
      : `⚠️ Push sebagian berhasil: ${successCount}/${pushOrder.length} tabel`,
    details,
  };
}

// Pull data from Supabase
export async function pullFromSupabase(config: SupabaseConfig): Promise<{ 
  success: boolean; 
  message: string;
  details: { table: string; status: string; count: number }[];
}> {
  const details: { table: string; status: string; count: number }[] = [];
  const pullOrder = ['regions', 'branches', 'suppliers', 'products', 'users', 'transactions', 'stock', 'demand_tests', 'notifications'];
  const cleanUrl = cleanSupabaseUrl(config.url);
  
  for (const key of pullOrder) {
    const tableName = tableNameMap[key];
    
    try {
      const response = await fetch(`${cleanUrl}/rest/v1/${tableName}?select=*`, {
        method: 'GET',
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const items = await response.json();
        const transformedData = transformToLocalFormat(key, items);
        localStorage.setItem(`smp_${key}`, JSON.stringify(transformedData));
        details.push({ table: tableName, status: '✅ OK', count: items.length });
      } else {
        const text = await response.text();
        if (text.includes('does not exist')) {
          details.push({ table: tableName, status: '⚠️ Tabel belum ada', count: 0 });
        } else {
          details.push({ table: tableName, status: `❌ ${response.status}`, count: 0 });
        }
      }
    } catch (error) {
      console.error(`Pull error for ${tableName}:`, error);
      details.push({ table: tableName, status: '❌ Error', count: 0 });
    }
  }
  
  const successCount = details.filter(d => d.status.includes('✅')).length;
  const updatedConfig = { ...config, lastSync: new Date().toISOString() };
  saveSupabaseConfig(updatedConfig);
  
  const totalPulled = details.filter(d => d.status.includes('✅')).reduce((s, d) => s + d.count, 0);
  
  return {
    success: successCount > 0,
    message: successCount > 0 
      ? `✅ Pull berhasil! ${totalPulled} data diambil. Refresh halaman untuk melihat data baru.`
      : '❌ Tidak ada data yang bisa di-pull. Pastikan tabel sudah dibuat.',
    details,
  };
}

// Get table info from Supabase
export async function getTableInfo(config: SupabaseConfig): Promise<{ 
  tables: { name: string; exists: boolean; count: number }[] 
}> {
  const tables: { name: string; exists: boolean; count: number }[] = [];
  const cleanUrl = cleanSupabaseUrl(config.url);
  
  for (const [, tableName] of Object.entries(tableNameMap)) {
    try {
      const response = await fetch(`${cleanUrl}/rest/v1/${tableName}?select=id&limit=1`, {
        method: 'HEAD',
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Prefer': 'count=exact',
        },
      });
      
      if (response.ok) {
        const countHeader = response.headers.get('content-range');
        const count = countHeader ? parseInt(countHeader.split('/')[1] || '0') : 0;
        tables.push({ name: tableName, exists: true, count: isNaN(count) ? 0 : count });
      } else {
        tables.push({ name: tableName, exists: false, count: 0 });
      }
    } catch {
      tables.push({ name: tableName, exists: false, count: 0 });
    }
  }
  
  return { tables };
}
