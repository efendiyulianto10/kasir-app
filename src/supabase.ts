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

// Headers for Supabase requests
function getHeaders(anonKey: string) {
  return {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };
}

// Test connection to Supabase
export async function testConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: getHeaders(anonKey),
    });
    
    if (response.ok || response.status === 200) {
      return { success: true, message: 'Koneksi berhasil!' };
    } else if (response.status === 401) {
      return { success: false, message: 'API Key tidak valid' };
    } else {
      return { success: false, message: `Error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, message: 'Tidak bisa terhubung ke Supabase. Periksa URL.' };
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'smp_branches',
    sql: `
      CREATE TABLE IF NOT EXISTS smp_branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        region_id TEXT REFERENCES smp_regions(id) ON DELETE SET NULL,
        status TEXT DEFAULT 'testing' CHECK (status IN ('active', 'testing', 'closed')),
        open_date DATE,
        pic_name TEXT,
        pic_phone TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'smp_suppliers',
    sql: `
      CREATE TABLE IF NOT EXISTS smp_suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        branch_id TEXT REFERENCES smp_branches(id) ON DELETE SET NULL,
        products JSONB DEFAULT '[]',
        rating NUMERIC DEFAULT 5,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'smp_products',
    sql: `
      CREATE TABLE IF NOT EXISTS smp_products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT CHECK (category IN ('makanan', 'minuman', 'snack')),
        supplier_id TEXT REFERENCES smp_suppliers(id) ON DELETE SET NULL,
        supplier_name TEXT,
        branch_id TEXT REFERENCES smp_branches(id) ON DELETE SET NULL,
        price INTEGER DEFAULT 10000,
        cost_price INTEGER DEFAULT 9000,
        profit INTEGER DEFAULT 1000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'smp_transactions',
    sql: `
      CREATE TABLE IF NOT EXISTS smp_transactions (
        id TEXT PRIMARY KEY,
        branch_id TEXT REFERENCES smp_branches(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        items JSONB NOT NULL DEFAULT '[]',
        payment_method TEXT CHECK (payment_method IN ('cash', 'qris', 'shopeefood', 'gofood')),
        total_amount INTEGER DEFAULT 0,
        total_profit INTEGER DEFAULT 0,
        input_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'smp_stock',
    sql: `
      CREATE TABLE IF NOT EXISTS smp_stock (
        id TEXT PRIMARY KEY,
        branch_id TEXT REFERENCES smp_branches(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        supplier_id TEXT,
        supplier_name TEXT,
        product_id TEXT,
        product_name TEXT,
        qty_received INTEGER DEFAULT 0,
        qty_sold INTEGER DEFAULT 0,
        qty_returned INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'smp_demand_tests',
    sql: `
      CREATE TABLE IF NOT EXISTS smp_demand_tests (
        id TEXT PRIMARY KEY,
        branch_id TEXT REFERENCES smp_branches(id) ON DELETE SET NULL,
        branch_name TEXT,
        start_date DATE,
        end_date DATE,
        total_days INTEGER DEFAULT 0,
        avg_daily_sales INTEGER DEFAULT 0,
        avg_daily_revenue INTEGER DEFAULT 0,
        avg_daily_profit INTEGER DEFAULT 0,
        consistency INTEGER DEFAULT 0,
        status TEXT DEFAULT 'testing' CHECK (status IN ('testing', 'consistent', 'inconsistent', 'graduated')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'smp_sync_meta',
    sql: `
      CREATE TABLE IF NOT EXISTS smp_sync_meta (
        id TEXT PRIMARY KEY DEFAULT 'main',
        last_sync TIMESTAMP WITH TIME ZONE,
        sync_version INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  }
];

// RLS Policies SQL
const rlsPoliciesSQL = `
-- Enable RLS on all tables
ALTER TABLE smp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE smp_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smp_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE smp_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE smp_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE smp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smp_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE smp_demand_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE smp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE smp_sync_meta ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (using anon key)
DO $$ 
BEGIN
  -- smp_users policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smp_users' AND policyname = 'Allow all access to smp_users') THEN
    CREATE POLICY "Allow all access to smp_users" ON smp_users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- smp_regions policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smp_regions' AND policyname = 'Allow all access to smp_regions') THEN
    CREATE POLICY "Allow all access to smp_regions" ON smp_regions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- smp_branches policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smp_branches' AND policyname = 'Allow all access to smp_branches') THEN
    CREATE POLICY "Allow all access to smp_branches" ON smp_branches FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- smp_suppliers policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smp_suppliers' AND policyname = 'Allow all access to smp_suppliers') THEN
    CREATE POLICY "Allow all access to smp_suppliers" ON smp_suppliers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- smp_products policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smp_products' AND policyname = 'Allow all access to smp_products') THEN
    CREATE POLICY "Allow all access to smp_products" ON smp_products FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- smp_transactions policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smp_transactions' AND policyname = 'Allow all access to smp_transactions') THEN
    CREATE POLICY "Allow all access to smp_transactions" ON smp_transactions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- smp_stock policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smp_stock' AND policyname = 'Allow all access to smp_stock') THEN
    CREATE POLICY "Allow all access to smp_stock" ON smp_stock FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- smp_demand_tests policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smp_demand_tests' AND policyname = 'Allow all access to smp_demand_tests') THEN
    CREATE POLICY "Allow all access to smp_demand_tests" ON smp_demand_tests FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- smp_notifications policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smp_notifications' AND policyname = 'Allow all access to smp_notifications') THEN
    CREATE POLICY "Allow all access to smp_notifications" ON smp_notifications FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- smp_sync_meta policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smp_sync_meta' AND policyname = 'Allow all access to smp_sync_meta') THEN
    CREATE POLICY "Allow all access to smp_sync_meta" ON smp_sync_meta FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

// Check if a table exists
async function tableExists(config: SupabaseConfig, tableName: string): Promise<boolean> {
  try {
    const response = await fetch(`${config.url}/rest/v1/${tableName}?select=id&limit=1`, {
      method: 'GET',
      headers: getHeaders(config.anonKey),
    });
    return response.ok;
  } catch {
    return false;
  }
}



// Auto-setup all tables
export async function autoSetupTables(config: SupabaseConfig): Promise<{ 
  success: boolean; 
  message: string; 
  details: { table: string; status: string }[];
  needsManualSetup: boolean;
  manualSQL: string;
}> {
  const details: { table: string; status: string }[] = [];
  let allExist = true;
  
  // Check which tables exist
  for (const table of tableDefinitions) {
    const exists = await tableExists(config, table.name);
    details.push({
      table: table.name,
      status: exists ? '✅ Sudah ada' : '❌ Belum ada'
    });
    if (!exists) allExist = false;
  }
  
  if (allExist) {
    const updatedConfig = { ...config, tablesCreated: true };
    saveSupabaseConfig(updatedConfig);
    return {
      success: true,
      message: 'Semua tabel sudah tersedia di Supabase!',
      details,
      needsManualSetup: false,
      manualSQL: ''
    };
  }
  
  // Generate SQL for manual setup
  const manualSQL = generateFullSetupSQL();
  
  return {
    success: false,
    message: 'Beberapa tabel belum dibuat. Silakan jalankan SQL setup di Supabase.',
    details,
    needsManualSetup: true,
    manualSQL
  };
}

// Generate full setup SQL
export function generateFullSetupSQL(): string {
  let sql = `-- =============================================
-- SMP (Sarapan Murah Pagi) Database Setup
-- Jalankan SQL ini di Supabase SQL Editor
-- =============================================

`;

  // Add all table definitions
  for (const table of tableDefinitions) {
    sql += `-- Table: ${table.name}\n`;
    sql += table.sql.trim() + '\n\n';
  }

  // Add indexes
  sql += `
-- =============================================
-- INDEXES untuk performa
-- =============================================

CREATE INDEX IF NOT EXISTS idx_branches_region ON smp_branches(region_id);
CREATE INDEX IF NOT EXISTS idx_branches_status ON smp_branches(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_branch ON smp_suppliers(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_branch ON smp_products(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON smp_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_branch ON smp_transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON smp_transactions(date);
CREATE INDEX IF NOT EXISTS idx_stock_branch_date ON smp_stock(branch_id, date);
CREATE INDEX IF NOT EXISTS idx_demand_tests_branch ON smp_demand_tests(branch_id);

`;

  // Add RLS policies
  sql += `
-- =============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =============================================

${rlsPoliciesSQL}

-- =============================================
-- SETUP COMPLETE! 
-- Kembali ke aplikasi dan klik "Cek Ulang Tabel"
-- =============================================
`;

  return sql;
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
  
  // Order matters due to foreign keys
  const pushOrder = ['regions', 'branches', 'suppliers', 'products', 'users', 'transactions', 'stock', 'demand_tests', 'notifications'];
  
  for (const key of pushOrder) {
    const tableName = tableNameMap[key];
    const items = data[key] || [];
    
    if (items.length === 0) {
      details.push({ table: tableName, status: '⏭️ Kosong', count: 0 });
      continue;
    }
    
    try {
      // Delete existing data first
      await fetch(`${config.url}/rest/v1/${tableName}?id=neq.impossible`, {
        method: 'DELETE',
        headers: getHeaders(config.anonKey),
      });
      
      // Transform and insert data
      const transformedData = transformToSupabaseFormat(key, items);
      
      const response = await fetch(`${config.url}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: {
          ...getHeaders(config.anonKey),
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(transformedData),
      });
      
      if (response.ok || response.status === 201) {
        details.push({ table: tableName, status: '✅ Berhasil', count: items.length });
      } else {
        const errorText = await response.text();
        details.push({ table: tableName, status: `❌ ${errorText.substring(0, 50)}`, count: 0 });
      }
    } catch (error) {
      details.push({ table: tableName, status: `❌ ${String(error).substring(0, 50)}`, count: 0 });
    }
  }
  
  // Update sync meta
  try {
    await fetch(`${config.url}/rest/v1/smp_sync_meta?on_conflict=id`, {
      method: 'POST',
      headers: {
        ...getHeaders(config.anonKey),
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: 'main',
        last_sync: new Date().toISOString(),
        sync_version: 1,
      }),
    });
  } catch {
    // Ignore meta errors
  }
  
  const successCount = details.filter(d => d.status.includes('✅')).length;
  const updatedConfig = { ...config, lastSync: new Date().toISOString() };
  saveSupabaseConfig(updatedConfig);
  
  return {
    success: successCount === pushOrder.length,
    message: `Push selesai: ${successCount}/${pushOrder.length} tabel berhasil`,
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
  
  for (const key of pullOrder) {
    const tableName = tableNameMap[key];
    
    try {
      const response = await fetch(`${config.url}/rest/v1/${tableName}?select=*`, {
        method: 'GET',
        headers: getHeaders(config.anonKey),
      });
      
      if (response.ok) {
        const items = await response.json();
        const transformedData = transformToLocalFormat(key, items);
        localStorage.setItem(`smp_${key}`, JSON.stringify(transformedData));
        details.push({ table: tableName, status: '✅ Berhasil', count: items.length });
      } else {
        details.push({ table: tableName, status: '❌ Gagal fetch', count: 0 });
      }
    } catch (error) {
      details.push({ table: tableName, status: `❌ ${String(error).substring(0, 30)}`, count: 0 });
    }
  }
  
  const successCount = details.filter(d => d.status.includes('✅')).length;
  const updatedConfig = { ...config, lastSync: new Date().toISOString() };
  saveSupabaseConfig(updatedConfig);
  
  return {
    success: successCount > 0,
    message: `Pull selesai: ${successCount}/${pullOrder.length} tabel berhasil. Refresh halaman untuk melihat data.`,
    details,
  };
}

// Get table info from Supabase
export async function getTableInfo(config: SupabaseConfig): Promise<{ 
  tables: { name: string; exists: boolean; count: number }[] 
}> {
  const tables: { name: string; exists: boolean; count: number }[] = [];
  
  for (const [, tableName] of Object.entries(tableNameMap)) {
    try {
      const response = await fetch(`${config.url}/rest/v1/${tableName}?select=id`, {
        method: 'GET',
        headers: {
          ...getHeaders(config.anonKey),
          'Prefer': 'count=exact',
        },
      });
      
      if (response.ok) {
        const countHeader = response.headers.get('content-range');
        const count = countHeader ? parseInt(countHeader.split('/')[1] || '0') : 0;
        tables.push({ name: tableName, exists: true, count });
      } else {
        tables.push({ name: tableName, exists: false, count: 0 });
      }
    } catch {
      tables.push({ name: tableName, exists: false, count: 0 });
    }
  }
  
  return { tables };
}
