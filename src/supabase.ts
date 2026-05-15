// Supabase Database Integration for SMP

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
  lastSync?: string;
}

// Local storage helpers
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

// Clean URL
function cleanUrl(url: string): string {
  let u = url.trim();
  while (u.endsWith('/')) u = u.slice(0, -1);
  if (!u.startsWith('http')) u = 'https://' + u;
  return u;
}

// Supabase REST API helper
async function supabaseRequest(
  config: SupabaseConfig,
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH' = 'GET',
  body?: unknown
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  try {
    const url = `${cleanUrl(config.url)}/rest/v1/${endpoint}`;
    const headers: Record<string, string> = {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
    };

    const options: RequestInit = { method, headers };
    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const text = await response.text();
    
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? undefined : (typeof data === 'object' && data?.message) || text
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : 'Network error'
    };
  }
}

// Test connection - try to access the API
export async function testConnection(url: string, apiKey: string): Promise<{ 
  success: boolean; 
  message: string;
  hint?: string;
}> {
  // Validate inputs
  if (!url || !apiKey) {
    return { success: false, message: 'URL dan API Key harus diisi' };
  }

  const cleanedUrl = cleanUrl(url);
  
  if (!cleanedUrl.includes('supabase')) {
    return { 
      success: false, 
      message: 'URL tidak valid',
      hint: 'Format: https://[project-ref].supabase.co'
    };
  }

  if (!apiKey.startsWith('eyJ')) {
    return { 
      success: false, 
      message: 'Format API Key tidak valid',
      hint: 'API Key harus dimulai dengan "eyJ..."'
    };
  }

  try {
    // Try to query - even if table doesn't exist, we can verify auth
    const response = await fetch(`${cleanedUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { success: true, message: '✅ Koneksi berhasil!' };
    }

    if (response.status === 401) {
      return { 
        success: false, 
        message: '❌ API Key tidak valid atau expired',
        hint: 'Pastikan menggunakan anon/public key dari Supabase Dashboard > Settings > API'
      };
    }

    if (response.status === 403) {
      // 403 bisa berarti RLS blocking, tapi koneksi OK
      return { success: true, message: '✅ Koneksi berhasil! (RLS aktif)' };
    }

    return { success: false, message: `Error: ${response.status}` };
  } catch (err) {
    return { 
      success: false, 
      message: '❌ Gagal terhubung ke server',
      hint: 'Periksa URL dan koneksi internet'
    };
  }
}

// Generate SQL untuk setup semua tabel
export function generateSetupSQL(): string {
  return `
-- ============================================
-- SMP (Sarapan Murah Pagi) - Database Setup
-- Jalankan SEMUA SQL ini di Supabase SQL Editor
-- ============================================

-- 1. BUAT TABEL-TABEL

CREATE TABLE IF NOT EXISTS smp_regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  manager_id TEXT,
  manager_name TEXT,
  manager_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smp_branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  region_id TEXT,
  status TEXT DEFAULT 'testing',
  open_date TEXT,
  pic_name TEXT,
  pic_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smp_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  region_id TEXT,
  branch_id TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smp_suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  branch_id TEXT,
  products JSONB DEFAULT '[]',
  rating NUMERIC DEFAULT 5,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smp_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  supplier_id TEXT,
  supplier_name TEXT,
  branch_id TEXT,
  price INTEGER DEFAULT 10000,
  cost_price INTEGER DEFAULT 9000,
  profit INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smp_transactions (
  id TEXT PRIMARY KEY,
  branch_id TEXT,
  date TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  payment_method TEXT,
  total_amount INTEGER DEFAULT 0,
  total_profit INTEGER DEFAULT 0,
  input_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
);

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
  status TEXT DEFAULT 'testing',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smp_notifications (
  id TEXT PRIMARY KEY,
  type TEXT,
  message TEXT,
  branch_id TEXT,
  phone TEXT,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY & BUAT POLICY UNTUK AKSES PUBLIK
-- PENTING: Tanpa ini, API tidak bisa akses data!

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['smp_regions', 'smp_branches', 'smp_users', 'smp_suppliers', 'smp_products', 'smp_transactions', 'smp_stock', 'smp_demand_tests', 'smp_notifications']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "allow_all_%s" ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- 3. GRANT PERMISSIONS
GRANT ALL ON smp_regions TO anon, authenticated;
GRANT ALL ON smp_branches TO anon, authenticated;
GRANT ALL ON smp_users TO anon, authenticated;
GRANT ALL ON smp_suppliers TO anon, authenticated;
GRANT ALL ON smp_products TO anon, authenticated;
GRANT ALL ON smp_transactions TO anon, authenticated;
GRANT ALL ON smp_stock TO anon, authenticated;
GRANT ALL ON smp_demand_tests TO anon, authenticated;
GRANT ALL ON smp_notifications TO anon, authenticated;

-- ============================================
-- SELESAI! Klik RUN untuk menjalankan semua SQL
-- ============================================
`.trim();
}

// Table mapping
const TABLE_MAP: Record<string, string> = {
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

// Check table status
export async function checkTables(config: SupabaseConfig): Promise<{
  tables: { name: string; exists: boolean; count: number }[];
  allExist: boolean;
}> {
  const tables: { name: string; exists: boolean; count: number }[] = [];
  let allExist = true;

  for (const [, tableName] of Object.entries(TABLE_MAP)) {
    const result = await supabaseRequest(config, `${tableName}?select=id&limit=1`);
    
    if (result.ok) {
      // Try to get count
      const countResult = await supabaseRequest(config, `${tableName}?select=count`);
      const count = Array.isArray(countResult.data) ? countResult.data.length : 0;
      tables.push({ name: tableName, exists: true, count });
    } else if (result.error?.includes('does not exist') || result.status === 404) {
      tables.push({ name: tableName, exists: false, count: 0 });
      allExist = false;
    } else if (result.status === 403 || result.error?.includes('denied')) {
      // RLS blocking - table exists but no access
      tables.push({ name: tableName, exists: true, count: -1 }); // -1 = no access
    } else {
      tables.push({ name: tableName, exists: false, count: 0 });
      allExist = false;
    }
  }

  return { tables, allExist };
}

// Transform to Supabase format (snake_case)
function toSupabase(key: string, item: Record<string, unknown>): Record<string, unknown> {
  const maps: Record<string, Record<string, string>> = {
    users: { regionId: 'region_id', branchId: 'branch_id' },
    regions: { managerId: 'manager_id', managerName: 'manager_name', managerPhone: 'manager_phone' },
    branches: { regionId: 'region_id', openDate: 'open_date', picName: 'pic_name', picPhone: 'pic_phone' },
    suppliers: { branchId: 'branch_id' },
    products: { supplierId: 'supplier_id', supplierName: 'supplier_name', branchId: 'branch_id', costPrice: 'cost_price' },
    transactions: { branchId: 'branch_id', paymentMethod: 'payment_method', totalAmount: 'total_amount', totalProfit: 'total_profit', inputBy: 'input_by', createdAt: 'created_at' },
    stock: { branchId: 'branch_id', supplierId: 'supplier_id', supplierName: 'supplier_name', productId: 'product_id', productName: 'product_name', qtyReceived: 'qty_received', qtySold: 'qty_sold', qtyReturned: 'qty_returned' },
    demand_tests: { branchId: 'branch_id', branchName: 'branch_name', startDate: 'start_date', endDate: 'end_date', totalDays: 'total_days', avgDailySales: 'avg_daily_sales', avgDailyRevenue: 'avg_daily_revenue', avgDailyProfit: 'avg_daily_profit' },
    notifications: { branchId: 'branch_id', createdAt: 'created_at' },
  };

  const map = maps[key] || {};
  const result: Record<string, unknown> = {};
  
  for (const [k, v] of Object.entries(item)) {
    const newKey = map[k] || k;
    result[newKey] = v === undefined ? null : v;
  }
  
  return result;
}

// Transform from Supabase format (camelCase)
function fromSupabase(key: string, item: Record<string, unknown>): Record<string, unknown> {
  const maps: Record<string, Record<string, string>> = {
    users: { region_id: 'regionId', branch_id: 'branchId' },
    regions: { manager_id: 'managerId', manager_name: 'managerName', manager_phone: 'managerPhone' },
    branches: { region_id: 'regionId', open_date: 'openDate', pic_name: 'picName', pic_phone: 'picPhone' },
    suppliers: { branch_id: 'branchId' },
    products: { supplier_id: 'supplierId', supplier_name: 'supplierName', branch_id: 'branchId', cost_price: 'costPrice' },
    transactions: { branch_id: 'branchId', payment_method: 'paymentMethod', total_amount: 'totalAmount', total_profit: 'totalProfit', input_by: 'inputBy', created_at: 'createdAt' },
    stock: { branch_id: 'branchId', supplier_id: 'supplierId', supplier_name: 'supplierName', product_id: 'productId', product_name: 'productName', qty_received: 'qtyReceived', qty_sold: 'qtySold', qty_returned: 'qtyReturned' },
    demand_tests: { branch_id: 'branchId', branch_name: 'branchName', start_date: 'startDate', end_date: 'endDate', total_days: 'totalDays', avg_daily_sales: 'avgDailySales', avg_daily_revenue: 'avgDailyRevenue', avg_daily_profit: 'avgDailyProfit' },
    notifications: { branch_id: 'branchId', created_at: 'createdAt' },
  };

  const map = maps[key] || {};
  const result: Record<string, unknown> = {};
  
  for (const [k, v] of Object.entries(item)) {
    const newKey = map[k] || k;
    result[newKey] = v;
  }
  
  return result;
}

// Get all local data
function getLocalData(): Record<string, unknown[]> {
  const data: Record<string, unknown[]> = {};
  
  for (const key of Object.keys(TABLE_MAP)) {
    try {
      const stored = localStorage.getItem(`smp_${key}`);
      data[key] = stored ? JSON.parse(stored) : [];
    } catch {
      data[key] = [];
    }
  }
  
  return data;
}

// PUSH: Upload all data to Supabase
export async function pushToSupabase(config: SupabaseConfig): Promise<{
  success: boolean;
  message: string;
  results: { table: string; status: string; count: number }[];
}> {
  const results: { table: string; status: string; count: number }[] = [];
  const localData = getLocalData();
  
  // Order for push (avoid FK issues)
  const order = ['regions', 'branches', 'users', 'suppliers', 'products', 'transactions', 'stock', 'demand_tests', 'notifications'];
  
  for (const key of order) {
    const tableName = TABLE_MAP[key];
    const items = localData[key] || [];
    
    if (items.length === 0) {
      results.push({ table: tableName, status: 'empty', count: 0 });
      continue;
    }

    try {
      // Delete existing data
      await supabaseRequest(config, `${tableName}?id=neq.____`, 'DELETE');
      
      // Transform and insert
      const transformed = (items as Record<string, unknown>[]).map(item => toSupabase(key, item));
      
      const insertResult = await supabaseRequest(config, tableName, 'POST', transformed);
      
      if (insertResult.ok) {
        results.push({ table: tableName, status: 'success', count: items.length });
      } else {
        console.error(`Push ${tableName} error:`, insertResult.error);
        results.push({ table: tableName, status: 'error', count: 0 });
      }
    } catch (err) {
      console.error(`Push ${tableName} exception:`, err);
      results.push({ table: tableName, status: 'error', count: 0 });
    }
  }

  const successCount = results.filter(r => r.status === 'success' || r.status === 'empty').length;
  const totalData = results.filter(r => r.status === 'success').reduce((s, r) => s + r.count, 0);
  
  // Update last sync
  saveSupabaseConfig({ ...config, lastSync: new Date().toISOString() });
  
  return {
    success: successCount === order.length,
    message: successCount === order.length 
      ? `✅ Berhasil! ${totalData} data di-push ke Supabase`
      : `⚠️ Sebagian gagal: ${successCount}/${order.length} tabel`,
    results
  };
}

// PULL: Download all data from Supabase
export async function pullFromSupabase(config: SupabaseConfig): Promise<{
  success: boolean;
  message: string;
  results: { table: string; status: string; count: number }[];
}> {
  const results: { table: string; status: string; count: number }[] = [];
  
  const order = ['regions', 'branches', 'users', 'suppliers', 'products', 'transactions', 'stock', 'demand_tests', 'notifications'];
  
  for (const key of order) {
    const tableName = TABLE_MAP[key];
    
    try {
      const result = await supabaseRequest(config, `${tableName}?select=*`);
      
      if (result.ok && Array.isArray(result.data)) {
        const transformed = result.data.map(item => fromSupabase(key, item as Record<string, unknown>));
        localStorage.setItem(`smp_${key}`, JSON.stringify(transformed));
        results.push({ table: tableName, status: 'success', count: result.data.length });
      } else if (result.error?.includes('does not exist')) {
        results.push({ table: tableName, status: 'no_table', count: 0 });
      } else {
        console.error(`Pull ${tableName} error:`, result.error);
        results.push({ table: tableName, status: 'error', count: 0 });
      }
    } catch (err) {
      console.error(`Pull ${tableName} exception:`, err);
      results.push({ table: tableName, status: 'error', count: 0 });
    }
  }

  const successCount = results.filter(r => r.status === 'success').length;
  const totalData = results.reduce((s, r) => s + r.count, 0);
  
  // Update last sync
  saveSupabaseConfig({ ...config, lastSync: new Date().toISOString() });
  
  return {
    success: successCount > 0,
    message: successCount > 0
      ? `✅ Berhasil! ${totalData} data di-pull. Refresh halaman.`
      : '❌ Gagal pull data. Pastikan tabel sudah dibuat.',
    results
  };
}

// Auto-check tables
export async function autoSetupTables(config: SupabaseConfig): Promise<{
  success: boolean;
  message: string;
  details: { table: string; status: string }[];
  needsManualSetup: boolean;
  allTablesExist: boolean;
}> {
  const tableCheck = await checkTables(config);
  
  const details = tableCheck.tables.map(t => ({
    table: t.name,
    status: t.exists 
      ? (t.count >= 0 ? `✅ OK (${t.count})` : '⚠️ No access')
      : '❌ Tidak ada'
  }));

  return {
    success: tableCheck.allExist,
    message: tableCheck.allExist 
      ? '✅ Semua tabel sudah ada!'
      : '⚠️ Beberapa tabel belum dibuat',
    details,
    needsManualSetup: !tableCheck.allExist,
    allTablesExist: tableCheck.allExist
  };
}

// Alias for compatibility
export function generateFullSetupSQL(): string {
  return generateSetupSQL();
}

export async function getTableInfo(config: SupabaseConfig): Promise<{
  tables: { name: string; exists: boolean; count: number }[];
}> {
  const result = await checkTables(config);
  return { tables: result.tables };
}
