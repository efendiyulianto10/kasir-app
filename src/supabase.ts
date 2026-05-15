import { createClient, SupabaseClient } from '@supabase/supabase-js';

/* =============================================
   SMP Supabase Integration
   Menggunakan @supabase/supabase-js SDK resmi
   ============================================= */

// --- Config ---
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
  lastSync?: string;
}

export const getSupabaseConfig = (): SupabaseConfig | null => {
  try { return JSON.parse(localStorage.getItem('smp_sb_cfg') || 'null'); } catch { return null; }
};
export const saveSupabaseConfig = (c: SupabaseConfig) => localStorage.setItem('smp_sb_cfg', JSON.stringify(c));
export const clearSupabaseConfig = () => { localStorage.removeItem('smp_sb_cfg'); _client = null; };

// --- Client singleton ---
let _client: SupabaseClient | null = null;

function getClient(url?: string, key?: string): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  const u = url || cfg?.url;
  const k = key || cfg?.anonKey;
  if (!u || !k) return null;
  // Always recreate if url/key provided (for testing)
  if (url && key) {
    _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    return _client;
  }
  if (!_client) {
    _client = createClient(u, k, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return _client;
}

// --- Helpers ---
const strip = (s: string) => s.replace(/\s+/g, '');

const TABLES = {
  regions:       'smp_regions',
  branches:      'smp_branches',
  users:         'smp_users',
  suppliers:     'smp_suppliers',
  products:      'smp_products',
  transactions:  'smp_transactions',
  stock:         'smp_stock',
  demand_tests:  'smp_demand_tests',
  notifications: 'smp_notifications',
} as const;

type TKey = keyof typeof TABLES;

// field mapping camelCase <-> snake_case
const C2S: Record<string,string> = {
  regionId:'region_id', branchId:'branch_id', managerId:'manager_id',
  managerName:'manager_name', managerPhone:'manager_phone',
  openDate:'open_date', picName:'pic_name', picPhone:'pic_phone',
  supplierId:'supplier_id', supplierName:'supplier_name', costPrice:'cost_price',
  paymentMethod:'payment_method', totalAmount:'total_amount', totalProfit:'total_profit',
  inputBy:'input_by', createdAt:'created_at',
  productId:'product_id', productName:'product_name',
  qtyReceived:'qty_received', qtySold:'qty_sold', qtyReturned:'qty_returned',
  branchName:'branch_name', startDate:'start_date', endDate:'end_date',
  totalDays:'total_days', avgDailySales:'avg_daily_sales',
  avgDailyRevenue:'avg_daily_revenue', avgDailyProfit:'avg_daily_profit',
};
const S2C: Record<string,string> = Object.fromEntries(Object.entries(C2S).map(([a,b])=>[b,a]));

const toSnake = (o: Record<string,unknown>) => {
  const r: Record<string,unknown> = {};
  for (const [k,v] of Object.entries(o)) r[C2S[k]||k] = v ?? null;
  return r;
};
const toCamel = (o: Record<string,unknown>) => {
  const r: Record<string,unknown> = {};
  for (const [k,v] of Object.entries(o)) r[S2C[k]||k] = v;
  return r;
};

// --- SQL ---
export function generateFullSetupSQL(): string {
  return `-- SMP Database Setup — Copy SEMUA lalu RUN di SQL Editor

CREATE TABLE IF NOT EXISTS smp_regions (
  id text PRIMARY KEY, name text, manager_id text, manager_name text, manager_phone text, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS smp_branches (
  id text PRIMARY KEY, name text, address text, region_id text, status text DEFAULT 'testing',
  open_date text, pic_name text, pic_phone text, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS smp_users (
  id text PRIMARY KEY, username text, password text, name text, role text,
  region_id text, branch_id text, phone text, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS smp_suppliers (
  id text PRIMARY KEY, name text, phone text, address text, branch_id text,
  products jsonb DEFAULT '[]', rating numeric DEFAULT 5, status text DEFAULT 'active', created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS smp_products (
  id text PRIMARY KEY, name text, category text, supplier_id text, supplier_name text,
  branch_id text, price int DEFAULT 10000, cost_price int DEFAULT 9000, profit int DEFAULT 1000, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS smp_transactions (
  id text PRIMARY KEY, branch_id text, date text, items jsonb DEFAULT '[]',
  payment_method text, total_amount int DEFAULT 0, total_profit int DEFAULT 0, input_by text, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS smp_stock (
  id text PRIMARY KEY, branch_id text, date text, supplier_id text, supplier_name text,
  product_id text, product_name text, qty_received int DEFAULT 0, qty_sold int DEFAULT 0, qty_returned int DEFAULT 0, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS smp_demand_tests (
  id text PRIMARY KEY, branch_id text, branch_name text, start_date text, end_date text,
  total_days int DEFAULT 0, avg_daily_sales int DEFAULT 0, avg_daily_revenue int DEFAULT 0, avg_daily_profit int DEFAULT 0,
  consistency int DEFAULT 0, status text DEFAULT 'testing', notes text, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS smp_notifications (
  id text PRIMARY KEY, type text, message text, branch_id text, phone text, sent boolean DEFAULT false, created_at timestamptz DEFAULT now()
);

-- WAJIB: Matikan RLS supaya anon key bisa akses
ALTER TABLE smp_regions       DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_branches      DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_suppliers     DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_products      DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_transactions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_stock         DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_demand_tests  DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_notifications DISABLE ROW LEVEL SECURITY;

-- SELESAI!
`;
}

// --- Test Connection ---
export async function testConnection(rawUrl: string, rawKey: string): Promise<{
  success: boolean; message: string; debug: string;
}> {
  const url = strip(rawUrl);
  const key = strip(rawKey);
  const log: string[] = [];

  log.push(`URL: ${url}`);
  log.push(`Key: ${key.substring(0,25)}... (${key.length} chars)`);

  if (!url || !key) return { success: false, message: 'URL dan Key harus diisi!', debug: log.join('\n') };
  if (key.length < 30) return { success: false, message: `Key terlalu pendek (${key.length}). Copy ulang dari Supabase.`, debug: log.join('\n') };

  try {
    const client = getClient(url, key);
    if (!client) return { success: false, message: 'Gagal buat client', debug: log.join('\n') };

    // Query tabel yang pasti tidak ada — untuk test auth
    const { error } = await client.from('_connection_test_xyz').select('*').limit(1);
    log.push(`Response error: ${JSON.stringify(error)}`);

    if (!error) {
      log.push('No error — connected!');
      return { success: true, message: '✅ Koneksi berhasil!', debug: log.join('\n') };
    }

    const msg = (error.message || '').toLowerCase();
    const code = error.code || '';

    // "relation does not exist" = tabel tidak ada, TAPI AUTH BERHASIL
    if (msg.includes('does not exist') || msg.includes('relation') || code === '42P01') {
      log.push('Auth OK — table not found (expected)');
      return { success: true, message: '✅ Koneksi berhasil!', debug: log.join('\n') };
    }

    // PGRST301 = JWT expired
    if (code === 'PGRST301' || msg.includes('jwt')) {
      // Decode JWT untuk info lebih
      try {
        const payload = JSON.parse(atob(key.split('.')[1]));
        log.push(`JWT ref: ${payload.ref}, exp: ${new Date((payload.exp||0)*1000).toISOString()}`);
        if (payload.ref && !url.includes(payload.ref)) {
          return { success: false, message: `❌ Key ini untuk project "${payload.ref}", bukan URL yang dimasukkan!`, debug: log.join('\n') };
        }
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          return { success: false, message: '❌ Key sudah expired!', debug: log.join('\n') };
        }
      } catch {}
      return { success: false, message: '❌ API Key ditolak. Pastikan menggunakan anon/public key.', debug: log.join('\n') };
    }

    // Auth error
    if (msg.includes('invalid') || msg.includes('apikey') || msg.includes('unauthorized') || code === 'PGRST302') {
      return { success: false, message: '❌ API Key tidak valid. Copy ulang "anon public" key.', debug: log.join('\n') };
    }

    // Unknown error tapi mungkin koneksi OK
    log.push(`Unknown error code: ${code}`);
    return { success: false, message: `❌ Error: ${error.message}`, debug: log.join('\n') };

  } catch (e) {
    log.push(`Exception: ${e}`);
    return { success: false, message: `❌ ${e instanceof Error ? e.message : 'Gagal koneksi'}`, debug: log.join('\n') };
  }
}

// --- Check Tables ---
export async function checkTables(_cfg?: SupabaseConfig | null): Promise<{
  tables: { name: string; exists: boolean; count: number; err?: string }[];
  allExist: boolean;
}> {
  const client = getClient();
  if (!client) return { tables: [], allExist: false };

  const tables: { name: string; exists: boolean; count: number; err?: string }[] = [];
  let allExist = true;

  for (const [, tbl] of Object.entries(TABLES)) {
    const { data, error } = await client.from(tbl).select('id');
    if (error) {
      tables.push({ name: tbl, exists: false, count: 0, err: error.message?.substring(0, 80) });
      allExist = false;
    } else {
      tables.push({ name: tbl, exists: true, count: data?.length ?? 0 });
    }
  }
  return { tables, allExist };
}

// aliases
export const getTableInfo = checkTables;
export async function autoSetupTables(cfg?: SupabaseConfig) {
  const r = await checkTables(cfg || getSupabaseConfig()!);
  return {
    ...r, success: r.allExist,
    message: r.allExist ? '✅ Semua tabel siap!' : '⚠️ Tabel belum lengkap',
    details: r.tables.map(t => ({ table: t.name, status: t.exists ? `✅ ${t.count}` : `❌ ${t.err||''}` })),
    needsManualSetup: !r.allExist, allTablesExist: r.allExist,
  };
}

// --- PUSH ---
export async function pushToSupabase(cfg: SupabaseConfig): Promise<{
  success: boolean; message: string;
  results: { table: string; status: string; count: number; error?: string }[];
}> {
  const client = getClient();
  if (!client) return { success: false, message: '❌ Tidak terhubung', results: [] };

  const results: { table: string; status: string; count: number; error?: string }[] = [];
  const order: TKey[] = ['regions','branches','users','suppliers','products','transactions','stock','demand_tests','notifications'];

  for (const key of order) {
    const tbl = TABLES[key];
    let items: unknown[] = [];
    try { items = JSON.parse(localStorage.getItem(`smp_${key}`) || '[]'); } catch { items = []; }

    if (!items.length) { results.push({ table: tbl, status: 'empty', count: 0 }); continue; }

    // delete all
    const { error: delErr } = await client.from(tbl).delete().neq('id', '____');
    if (delErr) console.warn(`del ${tbl}:`, delErr.message);

    // insert
    const rows = (items as Record<string,unknown>[]).map(toSnake);
    const { error: insErr } = await client.from(tbl).insert(rows);

    if (insErr) {
      console.error(`ins ${tbl}:`, insErr);
      results.push({ table: tbl, status: 'error', count: 0, error: insErr.message?.substring(0, 100) });
    } else {
      results.push({ table: tbl, status: 'ok', count: items.length });
    }
  }

  const ok = results.filter(r => r.status === 'ok' || r.status === 'empty').length;
  const n = results.filter(r => r.status === 'ok').reduce((s,r) => s + r.count, 0);
  saveSupabaseConfig({ ...cfg, lastSync: new Date().toISOString() });
  return { success: ok === order.length, message: ok === order.length ? `✅ ${n} data berhasil di-push!` : `⚠️ ${ok}/${order.length} OK`, results };
}

// --- PULL ---
export async function pullFromSupabase(cfg: SupabaseConfig): Promise<{
  success: boolean; message: string;
  results: { table: string; status: string; count: number; error?: string }[];
}> {
  const client = getClient();
  if (!client) return { success: false, message: '❌ Tidak terhubung', results: [] };

  const results: { table: string; status: string; count: number; error?: string }[] = [];
  const order: TKey[] = ['regions','branches','users','suppliers','products','transactions','stock','demand_tests','notifications'];

  for (const key of order) {
    const tbl = TABLES[key];
    const { data, error } = await client.from(tbl).select('*');
    if (error) {
      results.push({ table: tbl, status: 'error', count: 0, error: error.message?.substring(0, 100) });
    } else if (data) {
      const rows = data.map(d => toCamel(d as Record<string,unknown>));
      localStorage.setItem(`smp_${key}`, JSON.stringify(rows));
      results.push({ table: tbl, status: 'ok', count: data.length });
    }
  }

  const ok = results.filter(r => r.status === 'ok').length;
  const n = results.reduce((s,r) => s + r.count, 0);
  saveSupabaseConfig({ ...cfg, lastSync: new Date().toISOString() });
  return { success: ok > 0, message: ok > 0 ? `✅ ${n} data di-pull! Refresh halaman.` : '❌ Gagal pull', results };
}
