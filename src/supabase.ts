/* =============================================
   SMP Supabase — pure fetch, no external dependency
   ============================================= */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
  lastSync?: string;
}

export const getSupabaseConfig = (): SupabaseConfig | null => {
  try { return JSON.parse(localStorage.getItem('smp_sb') || 'null'); } catch { return null; }
};
export const saveSupabaseConfig = (c: SupabaseConfig) => localStorage.setItem('smp_sb', JSON.stringify(c));
export const clearSupabaseConfig = () => localStorage.removeItem('smp_sb');

// strip all whitespace (copy-paste often includes \n \t etc)
const strip = (s: string) => s.replace(/[\s\r\n\t]+/g, '');

// base fetch helper
async function sb(
  cfg: SupabaseConfig,
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: unknown; text: string }> {
  const url = strip(cfg.url);
  const key = strip(cfg.anonKey);
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: method === 'POST' ? 'return=minimal' : 'return=minimal',
  };
  const resp = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let data: unknown = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: resp.ok, status: resp.status, data, text };
}

/* ─── Test connection ─── */

export async function testConnection(
  rawUrl: string,
  rawKey: string,
): Promise<{ success: boolean; message: string; debug: string }> {
  const url = strip(rawUrl);
  const key = strip(rawKey);
  const log: string[] = [];

  log.push(`URL : ${url}`);
  log.push(`Key : ${key.length} chars, starts ${key.substring(0, 20)}…`);

  if (!url) return r(false, 'URL kosong', log);
  if (!key) return r(false, 'Key kosong', log);
  if (key.length < 40) return r(false, `Key terlalu pendek (${key.length}). Copy ulang LENGKAP dari Supabase.`, log);

  // decode JWT to verify key belongs to this project
  try {
    const payload = JSON.parse(atob(key.split('.')[1]));
    log.push(`JWT ref : ${payload.ref}`);
    log.push(`JWT role: ${payload.role}`);
    log.push(`JWT exp : ${new Date((payload.exp || 0) * 1000).toISOString()}`);
    if (payload.ref && !url.includes(payload.ref)) {
      return r(false, `Key ini untuk project "${payload.ref}" tapi URL beda.\nPastikan URL dan Key dari project yang SAMA.`, log);
    }
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return r(false, 'Key sudah expired! Buat project baru atau generate ulang key.', log);
    }
  } catch { log.push('JWT decode skipped'); }

  // send test query — target table that doesn't exist
  try {
    log.push('Fetching…');
    const resp = await fetch(`${url}/rest/v1/__ping__?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    log.push(`HTTP ${resp.status}`);
    const body = await resp.text();
    log.push(`Body: ${body.substring(0, 200)}`);

    if (resp.status === 200) return r(true, '✅ Koneksi berhasil!', log);
    if (body.includes('does not exist') || body.includes('42P01'))
      return r(true, '✅ Koneksi berhasil!', log);
    if (resp.status === 401)
      return r(false, '❌ API Key ditolak.\nPastikan menggunakan "anon public" key.\nCopy ulang dari Supabase Dashboard → Settings → API.', log);
    if (resp.status === 403)
      return r(true, '✅ Koneksi OK (RLS aktif)', log);

    return r(false, `Error ${resp.status}: ${body.substring(0, 100)}`, log);
  } catch (e) {
    log.push(`Exception: ${e}`);
    return r(false, `Gagal koneksi: ${e instanceof Error ? e.message : e}`, log);
  }
}

function r(success: boolean, message: string, log: string[]) {
  return { success, message, debug: log.join('\n') };
}

/* ─── SQL ─── */

export function generateFullSetupSQL(): string {
  return `-- SMP Database Setup
-- Copy SEMUA, paste di Supabase SQL Editor, klik RUN

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

-- MATIKAN RLS — WAJIB agar anon key bisa akses data
ALTER TABLE smp_regions       DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_branches      DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_suppliers     DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_products      DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_transactions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_stock         DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_demand_tests  DISABLE ROW LEVEL SECURITY;
ALTER TABLE smp_notifications DISABLE ROW LEVEL SECURITY;

-- SELESAI! Kembali ke aplikasi, klik Cek Tabel, lalu Push.
`;
}

/* ─── Field maps ─── */

const C2S: Record<string, string> = {
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
const S2C: Record<string, string> = Object.fromEntries(Object.entries(C2S).map(([a, b]) => [b, a]));

const toSnake = (o: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) out[C2S[k] || k] = v ?? null;
  return out;
};
const toCamel = (o: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) out[S2C[k] || k] = v;
  return out;
};

/* ─── Tables ─── */

const TABLES: Record<string, string> = {
  regions: 'smp_regions', branches: 'smp_branches', users: 'smp_users',
  suppliers: 'smp_suppliers', products: 'smp_products',
  transactions: 'smp_transactions', stock: 'smp_stock',
  demand_tests: 'smp_demand_tests', notifications: 'smp_notifications',
};
const ORDER = Object.keys(TABLES);

/* ─── Check tables ─── */

export async function checkTables(cfg: SupabaseConfig): Promise<{
  tables: { name: string; exists: boolean; count: number; err?: string }[];
  allExist: boolean;
}> {
  const tables: { name: string; exists: boolean; count: number; err?: string }[] = [];
  let allExist = true;
  for (const tbl of Object.values(TABLES)) {
    try {
      const res = await sb(cfg, `${tbl}?select=id`);
      if (res.ok && Array.isArray(res.data)) {
        tables.push({ name: tbl, exists: true, count: (res.data as unknown[]).length });
      } else if (res.text.includes('does not exist')) {
        tables.push({ name: tbl, exists: false, count: 0 }); allExist = false;
      } else {
        tables.push({ name: tbl, exists: false, count: 0, err: `${res.status}` }); allExist = false;
      }
    } catch (e) {
      tables.push({ name: tbl, exists: false, count: 0, err: String(e).substring(0, 50) }); allExist = false;
    }
  }
  return { tables, allExist };
}

export const getTableInfo = checkTables;

export async function autoSetupTables(cfg: SupabaseConfig) {
  const c = await checkTables(cfg);
  return { ...c, success: c.allExist, message: c.allExist ? '✅ OK' : '⚠️ Missing',
    details: c.tables.map(t => ({ table: t.name, status: t.exists ? `✅ ${t.count}` : `❌` })),
    needsManualSetup: !c.allExist, allTablesExist: c.allExist };
}

/* ─── Push ─── */

export async function pushToSupabase(cfg: SupabaseConfig): Promise<{
  success: boolean; message: string;
  results: { table: string; status: string; count: number; error?: string }[];
}> {
  const results: { table: string; status: string; count: number; error?: string }[] = [];
  for (const key of ORDER) {
    const tbl = TABLES[key];
    let items: Record<string, unknown>[] = [];
    try { items = JSON.parse(localStorage.getItem(`smp_${key}`) || '[]'); } catch { /* */ }
    if (!items.length) { results.push({ table: tbl, status: 'empty', count: 0 }); continue; }

    // delete
    await sb(cfg, `${tbl}?id=neq.____`, 'DELETE');
    // insert
    const rows = items.map(toSnake);
    const res = await sb(cfg, tbl, 'POST', rows);
    if (res.ok || res.status === 201) {
      results.push({ table: tbl, status: 'ok', count: items.length });
    } else {
      results.push({ table: tbl, status: 'error', count: 0, error: res.text.substring(0, 120) });
    }
  }
  const ok = results.filter(x => x.status === 'ok' || x.status === 'empty').length;
  const n = results.filter(x => x.status === 'ok').reduce((s, x) => s + x.count, 0);
  saveSupabaseConfig({ ...cfg, lastSync: new Date().toISOString() });
  return { success: ok === ORDER.length, message: ok === ORDER.length ? `✅ ${n} data di-push!` : `⚠️ ${ok}/${ORDER.length}`, results };
}

/* ─── Pull ─── */

export async function pullFromSupabase(cfg: SupabaseConfig): Promise<{
  success: boolean; message: string;
  results: { table: string; status: string; count: number; error?: string }[];
}> {
  const results: { table: string; status: string; count: number; error?: string }[] = [];
  for (const key of ORDER) {
    const tbl = TABLES[key];
    const res = await sb(cfg, `${tbl}?select=*`);
    if (res.ok && Array.isArray(res.data)) {
      const rows = (res.data as Record<string, unknown>[]).map(toCamel);
      localStorage.setItem(`smp_${key}`, JSON.stringify(rows));
      results.push({ table: tbl, status: 'ok', count: (res.data as unknown[]).length });
    } else {
      results.push({ table: tbl, status: 'error', count: 0, error: res.text.substring(0, 80) });
    }
  }
  const ok = results.filter(x => x.status === 'ok').length;
  const n = results.reduce((s, x) => s + x.count, 0);
  saveSupabaseConfig({ ...cfg, lastSync: new Date().toISOString() });
  return { success: ok > 0, message: ok > 0 ? `✅ ${n} data di-pull! Refresh halaman.` : '❌ Gagal pull', results };
}
