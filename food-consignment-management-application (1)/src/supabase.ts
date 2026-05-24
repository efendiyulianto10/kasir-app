/* =============================================
   SMP Supabase — auto setup, sync, pure fetch
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

const strip = (s: string) => s.replace(/[\s\r\n\t]+/g, '');

function cleanUrl(raw: string): string {
  let u = strip(raw);
  u = u.replace(/\/+$/, '');
  u = u.replace(/\/rest\/v1\/?$/, '');
  u = u.replace(/\/rest\/?$/, '');
  return u;
}

/* ─── REST helper ─── */

async function sb(
  cfg: SupabaseConfig, path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET', body?: unknown,
): Promise<{ ok: boolean; status: number; data: unknown; text: string }> {
  const url = cleanUrl(cfg.url);
  const key = strip(cfg.anonKey);
  const resp = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=minimal' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let data: unknown = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: resp.ok, status: resp.status, data, text };
}

/* ─── SQL execution via Supabase REST SQL endpoint ─── */

async function execSQL(cfg: SupabaseConfig, sql: string): Promise<{ ok: boolean; error?: string }> {
  const url = cleanUrl(cfg.url);
  const key = strip(cfg.anonKey);

  // Supabase exposes a SQL endpoint at /rest/v1/rpc
  // But we need the service_role key for DDL.
  // ALTERNATIVE: Use the pg_net extension or the /sql endpoint.
  // BEST APPROACH: Use Supabase Management API or the /pg endpoint.
  // SIMPLEST: Use the /rest/v1/rpc endpoint with a custom function.
  
  // Since we only have anon key, we'll try multiple approaches:
  
  // Approach 1: Try Supabase's built-in SQL endpoint (available in newer versions)
  try {
    const resp = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        apikey: key, Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    if (resp.ok) return { ok: true };
    // If function doesn't exist, fall through
  } catch { /* ignore */ }

  // Approach 2: Use the Supabase SQL HTTP API (/pg/query)
  // This is available when using the service role key but let's try with anon
  try {
    const resp = await fetch(`${url}/pg/query`, {
      method: 'POST',
      headers: {
        apikey: key, Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    if (resp.ok) return { ok: true };
  } catch { /* ignore */ }

  return { ok: false, error: 'Cannot execute SQL with anon key. Need manual setup.' };
}

/* ─── Test connection ─── */

export async function testConnection(
  rawUrl: string, rawKey: string,
): Promise<{ success: boolean; message: string; debug: string }> {
  const url = cleanUrl(rawUrl);
  const key = strip(rawKey);
  const log: string[] = [];

  log.push(`URL : ${url}`);
  log.push(`Key : ${key.length} chars`);

  if (!url) return r(false, 'URL kosong', log);
  if (!key) return r(false, 'Key kosong', log);
  if (key.length < 40) return r(false, `Key terlalu pendek (${key.length}).`, log);

  try {
    const payload = JSON.parse(atob(key.split('.')[1]));
    log.push(`JWT ref  : ${payload.ref}`);
    log.push(`JWT role : ${payload.role}`);
    if (payload.ref && !url.includes(payload.ref))
      return r(false, `❌ Key untuk project "${payload.ref}" tapi URL beda!`, log);
    if (payload.exp && payload.exp * 1000 < Date.now())
      return r(false, '❌ Key sudah expired!', log);
  } catch { log.push('JWT decode skipped'); }

  try {
    const resp = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    log.push(`HTTP: ${resp.status}`);
    if (resp.status === 200 || resp.status === 403) return r(true, '✅ Koneksi berhasil!', log);
    if (resp.status === 401) return r(false, '❌ API Key ditolak.', log);
    const body = await resp.text();
    return r(false, `❌ Error ${resp.status}: ${body.substring(0, 80)}`, log);
  } catch (e) {
    log.push(`Error: ${e}`);
    return r(false, `❌ Gagal koneksi`, log);
  }
}

function r(ok: boolean, msg: string, log: string[]) {
  return { success: ok, message: msg, debug: log.join('\n') };
}

/* ─── Table definitions ─── */

const TABLE_SQLS: Record<string, string> = {
  smp_regions: `CREATE TABLE IF NOT EXISTS smp_regions (
    id text PRIMARY KEY, name text, manager_id text, manager_name text, manager_phone text, created_at timestamptz DEFAULT now()
  )`,
  smp_branches: `CREATE TABLE IF NOT EXISTS smp_branches (
    id text PRIMARY KEY, name text, address text, region_id text, status text DEFAULT 'testing',
    open_date text, pic_name text, pic_phone text, created_at timestamptz DEFAULT now()
  )`,
  smp_users: `CREATE TABLE IF NOT EXISTS smp_users (
    id text PRIMARY KEY, username text, password text, name text, role text,
    region_id text, branch_id text, phone text, created_at timestamptz DEFAULT now()
  )`,
  smp_suppliers: `CREATE TABLE IF NOT EXISTS smp_suppliers (
    id text PRIMARY KEY, name text, phone text, address text, branch_id text,
    products jsonb DEFAULT '[]', rating numeric DEFAULT 5, status text DEFAULT 'active', created_at timestamptz DEFAULT now()
  )`,
  smp_products: `CREATE TABLE IF NOT EXISTS smp_products (
    id text PRIMARY KEY, name text, category text, supplier_id text, supplier_name text,
    branch_id text, price int DEFAULT 10000, cost_price int DEFAULT 9000, profit int DEFAULT 1000, created_at timestamptz DEFAULT now()
  )`,
  smp_transactions: `CREATE TABLE IF NOT EXISTS smp_transactions (
    id text PRIMARY KEY, branch_id text, date text, items jsonb DEFAULT '[]',
    payment_method text, total_amount int DEFAULT 0, total_profit int DEFAULT 0, input_by text, created_at timestamptz DEFAULT now()
  )`,
  smp_stock: `CREATE TABLE IF NOT EXISTS smp_stock (
    id text PRIMARY KEY, branch_id text, date text, supplier_id text, supplier_name text,
    product_id text, product_name text, qty_received int DEFAULT 0, qty_sold int DEFAULT 0, qty_returned int DEFAULT 0, created_at timestamptz DEFAULT now()
  )`,
  smp_demand_tests: `CREATE TABLE IF NOT EXISTS smp_demand_tests (
    id text PRIMARY KEY, branch_id text, branch_name text, start_date text, end_date text,
    total_days int DEFAULT 0, avg_daily_sales int DEFAULT 0, avg_daily_revenue int DEFAULT 0, avg_daily_profit int DEFAULT 0,
    consistency int DEFAULT 0, status text DEFAULT 'testing', notes text, created_at timestamptz DEFAULT now()
  )`,
  smp_notifications: `CREATE TABLE IF NOT EXISTS smp_notifications (
    id text PRIMARY KEY, type text, message text, branch_id text, phone text, sent boolean DEFAULT false, created_at timestamptz DEFAULT now()
  )`,
};

const TABLES: Record<string, string> = {
  regions: 'smp_regions', branches: 'smp_branches', users: 'smp_users',
  suppliers: 'smp_suppliers', products: 'smp_products',
  transactions: 'smp_transactions', stock: 'smp_stock',
  demand_tests: 'smp_demand_tests', notifications: 'smp_notifications',
};
const ORDER = ['regions','branches','users','suppliers','products','transactions','stock','demand_tests','notifications'];

/* ─── Generate full SQL ─── */

export function generateFullSetupSQL(): string {
  let sql = '-- SMP Database Auto Setup\n-- Copy SEMUA, paste di SQL Editor, klik RUN\n\n';
  for (const [, ddl] of Object.entries(TABLE_SQLS)) {
    sql += ddl + ';\n\n';
  }
  sql += '-- Matikan RLS agar anon key bisa akses\n';
  for (const tblName of Object.keys(TABLE_SQLS)) {
    sql += `ALTER TABLE ${tblName} DISABLE ROW LEVEL SECURITY;\n`;
  }
  sql += '\n-- SELESAI!\n';
  return sql;
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
const S2C = Object.fromEntries(Object.entries(C2S).map(([a,b])=>[b,a]));

const toSnake = (o: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const [k,v] of Object.entries(o)) out[C2S[k]||k] = v ?? null;
  return out;
};
const toCamel = (o: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const [k,v] of Object.entries(o)) out[S2C[k]||k] = v;
  return out;
};

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
        tables.push({ name: tbl, exists: false, count: 0, err: `${res.status}: ${res.text.substring(0,60)}` }); allExist = false;
      }
    } catch (e) {
      tables.push({ name: tbl, exists: false, count: 0, err: String(e).substring(0, 50) }); allExist = false;
    }
  }
  return { tables, allExist };
}

export const getTableInfo = checkTables;

/* ─── Auto create missing tables ─── */

export async function autoCreateTables(cfg: SupabaseConfig): Promise<{
  success: boolean;
  message: string;
  log: string[];
  needsManualSQL: boolean;
}> {
  const log: string[] = [];
  const check = await checkTables(cfg);
  
  const missing = check.tables.filter(t => !t.exists).map(t => t.name);
  if (missing.length === 0) {
    return { success: true, message: '✅ Semua tabel sudah ada!', log: ['All tables exist'], needsManualSQL: false };
  }

  log.push(`Missing tables: ${missing.join(', ')}`);

  // Build SQL for all missing tables + disable RLS
  const sqlParts: string[] = [];
  for (const tbl of missing) {
    if (TABLE_SQLS[tbl]) {
      sqlParts.push(TABLE_SQLS[tbl] + ';');
      sqlParts.push(`ALTER TABLE ${tbl} DISABLE ROW LEVEL SECURITY;`);
    }
  }
  const fullSQL = sqlParts.join('\n');
  log.push(`SQL to execute:\n${fullSQL}`);

  // Try to auto-execute
  const result = await execSQL(cfg, fullSQL);
  if (result.ok) {
    log.push('Auto-create SUCCESS');
    // Verify
    const recheck = await checkTables(cfg);
    if (recheck.allExist) {
      return { success: true, message: '✅ Tabel berhasil dibuat otomatis!', log, needsManualSQL: false };
    } else {
      return { success: false, message: '⚠️ Beberapa tabel gagal dibuat', log, needsManualSQL: true };
    }
  }

  log.push(`Auto-create failed: ${result.error}`);
  return { success: false, message: '⚠️ Tidak bisa buat tabel otomatis.\nJalankan SQL setup secara manual di Supabase SQL Editor.', log, needsManualSQL: true };
}

/* ─── Full connect + auto setup + auto push ─── */

export async function connectAndSetup(rawUrl: string, rawKey: string): Promise<{
  success: boolean;
  message: string;
  step: string;
  debug: string;
  needsManualSQL: boolean;
  tables: { name: string; exists: boolean; count: number; err?: string }[];
}> {
  const log: string[] = [];
  const emptyResult = (msg: string, step: string) => ({
    success: false, message: msg, step, debug: log.join('\n'), needsManualSQL: false, tables: [],
  });

  // Step 1: Test connection
  log.push('── Step 1: Test koneksi ──');
  const conn = await testConnection(rawUrl, rawKey);
  log.push(conn.debug);
  if (!conn.success) return { ...emptyResult(conn.message, 'connection'), needsManualSQL: false };

  const cfg: SupabaseConfig = {
    url: cleanUrl(rawUrl), anonKey: strip(rawKey), enabled: true,
  };
  saveSupabaseConfig(cfg);

  // Step 2: Check tables
  log.push('\n── Step 2: Cek tabel ──');
  const check1 = await checkTables(cfg);
  check1.tables.forEach(t => log.push(`  ${t.exists ? '✅' : '❌'} ${t.name} ${t.exists ? `(${t.count})` : t.err || ''}`));

  if (check1.allExist) {
    log.push('All tables exist!');
    return { success: true, message: '✅ Terhubung & semua tabel siap!', step: 'ready', debug: log.join('\n'), needsManualSQL: false, tables: check1.tables };
  }

  // Step 3: Try auto-create tables
  log.push('\n── Step 3: Auto-create tabel ──');
  const autoResult = await autoCreateTables(cfg);
  log.push(...autoResult.log);

  if (autoResult.success) {
    const check2 = await checkTables(cfg);
    return { success: true, message: '✅ Terhubung & tabel berhasil dibuat otomatis!', step: 'ready', debug: log.join('\n'), needsManualSQL: false, tables: check2.tables };
  }

  // Step 4: Need manual SQL
  log.push('\n── Step 4: Perlu manual SQL ──');
  const check3 = await checkTables(cfg);
  return { success: false, message: '✅ Terhubung!\n\n⚠️ Tabel belum bisa dibuat otomatis.\nKlik "Copy SQL & Buat Manual" lalu jalankan di Supabase SQL Editor.', step: 'need_sql', debug: log.join('\n'), needsManualSQL: true, tables: check3.tables };
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

    // delete all existing
    await sb(cfg, `${tbl}?id=neq.____`, 'DELETE');
    // insert new
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
  return { success: ok === ORDER.length, message: ok === ORDER.length ? `✅ ${n} data berhasil di-push!` : `⚠️ ${ok}/${ORDER.length} tabel OK`, results };
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
  return { success: ok > 0, message: ok > 0 ? `✅ ${n} data di-pull! Refresh halaman.` : '❌ Gagal pull.', results };
}
