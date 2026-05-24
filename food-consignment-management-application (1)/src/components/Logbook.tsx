import { useState, useMemo } from 'react';
import {
  BookOpen, Search, Filter, Download, Shield, ShoppingCart, 
  Package, Store, Settings as SettingsIcon, 
  ChevronDown, ChevronUp, AlertTriangle, Clock, User as UserIcon
} from 'lucide-react';
import { LogEntry, LogCategory, Branch } from '../types';
import { User } from '../auth';
import { formatCurrency } from '../store';

interface Props {
  logs: LogEntry[];
  branches: Branch[];
  users: User[];
  currentUser: User;
}

const CATEGORY_CFG: Record<LogCategory, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  auth:        { icon: Shield, label: 'Login/Logout', color: 'text-purple-600', bg: 'bg-purple-50' },
  transaksi:   { icon: ShoppingCart, label: 'Transaksi', color: 'text-orange-600', bg: 'bg-orange-50' },
  stok:        { icon: Package, label: 'Stok & Retur', color: 'text-blue-600', bg: 'bg-blue-50' },
  operasional: { icon: Store, label: 'Operasional', color: 'text-green-600', bg: 'bg-green-50' },
  keuangan:    { icon: ShoppingCart, label: 'Keuangan', color: 'text-red-600', bg: 'bg-red-50' },
  sistem:      { icon: SettingsIcon, label: 'Sistem', color: 'text-gray-600', bg: 'bg-gray-50' },
};

const ACTION_LABELS: Record<string, string> = {
  login: '🔐 Login', logout: '🚪 Logout',
  tx_create: '🧾 Transaksi Baru', tx_void: '❌ Void Transaksi',
  stock_in: '📦 Stok Masuk', stock_return: '↩️ Retur Supplier',
  closing_done: '🔒 Closing Hari',
  supplier_add: '➕ Tambah Supplier', supplier_edit: '✏️ Edit Supplier', supplier_delete: '🗑️ Hapus Supplier',
  branch_add: '➕ Tambah Cabang', branch_edit: '✏️ Edit Cabang', branch_status: '🔄 Ubah Status Cabang',
  product_add: '➕ Tambah Produk', product_edit: '✏️ Edit Produk',
  user_add: '👤 Tambah User', user_edit: '✏️ Edit User', user_delete: '🗑️ Hapus User',
  demand_test: '🧪 Demand Test', demand_status: '📊 Update Demand',
  audit_visit: '🔍 Kunjungan Audit',
  settings_change: '⚙️ Ubah Pengaturan',
  data_export: '📤 Export Data', data_import: '📥 Import Data', data_reset: '🔄 Reset Data',
};

export default function Logbook({ logs, branches, users }: Props) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...logs];
    if (filterCat !== 'all') result = result.filter(l => l.category === filterCat);
    if (filterBranch) result = result.filter(l => l.branchId === filterBranch);
    if (filterUser) result = result.filter(l => l.userId === filterUser);
    if (filterDate) result = result.filter(l => l.timestamp.startsWith(filterDate));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => l.detail.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q) || l.branchName.toLowerCase().includes(q) || (ACTION_LABELS[l.action] || '').toLowerCase().includes(q));
    }
    return result.slice(0, 200);
  }, [logs, filterCat, filterBranch, filterUser, filterDate, search]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.timestamp.startsWith(today));
    const txLogs = todayLogs.filter(l => l.category === 'transaksi');
    const uniqueUsers = new Set(todayLogs.map(l => l.userId)).size;
    const alerts = logs.filter(l => l.action === 'tx_void' || l.action === 'data_reset' || l.action === 'data_import').length;
    return { todayCount: todayLogs.length, txCount: txLogs.length, uniqueUsers, alerts, total: logs.length };
  }, [logs]);

  const exportLog = () => {
    const csv = [
      'Timestamp,User,Role,Cabang,Aksi,Kategori,Detail,Jumlah',
      ...filtered.map(l => `"${l.timestamp}","${l.userName}","${l.userRole}","${l.branchName}","${ACTION_LABELS[l.action] || l.action}","${l.category}","${l.detail.replace(/"/g, '""')}","${l.amount || ''}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `logbook-smp-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BookOpen size={24} className="text-indigo-600" /> Logbook Aktivitas</h1>
          <p className="text-gray-500 text-sm">Semua aktivitas tercatat — anti manipulasi, immutable</p>
        </div>
        <button onClick={exportLog} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Log" value={String(stats.total)} icon={BookOpen} color="indigo" />
        <StatCard label="Hari Ini" value={String(stats.todayCount)} icon={Clock} color="blue" />
        <StatCard label="Transaksi" value={String(stats.txCount)} icon={ShoppingCart} color="orange" />
        <StatCard label="User Aktif" value={String(stats.uniqueUsers)} icon={UserIcon} color="green" />
        <StatCard label="Alert" value={String(stats.alerts)} icon={AlertTriangle} color={stats.alerts > 0 ? 'red' : 'green'} />
      </div>

      {/* Alert: suspicious activity */}
      {stats.alerts > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-red-800 text-sm">⚠️ {stats.alerts} Aktivitas Mencurigakan</h3>
            <p className="text-xs text-red-600 mt-0.5">Terdeteksi: void transaksi, reset data, atau import data. Periksa segera.</p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border shadow-sm space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari aktivitas, user, cabang..."
              className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border ${showFilters ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-600'}`}>
            <Filter size={14} /> Filter
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="p-2 border rounded-xl text-xs">
              <option value="all">Semua Kategori</option>
              {Object.entries(CATEGORY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="p-2 border rounded-xl text-xs">
              <option value="">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="p-2 border rounded-xl text-xs">
              <option value="">Semua User</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="p-2 border rounded-xl text-xs" />
          </div>
        )}

        {/* Category quick filters */}
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterCat('all')} className={`px-3 py-1 rounded-lg text-xs font-medium ${filterCat === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>Semua</button>
          {Object.entries(CATEGORY_CFG).map(([k, v]) => (
            <button key={k} onClick={() => setFilterCat(k)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filterCat === k ? 'bg-gray-900 text-white' : `${v.bg} ${v.color}`}`}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border text-center text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Tidak ada log ditemukan</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(log => {
            const cfg = CATEGORY_CFG[log.category] || CATEGORY_CFG.sistem;
            const Icon = cfg.icon;
            const isExpanded = expanded === log.id;
            const isSuspicious = log.action === 'tx_void' || log.action === 'data_reset' || log.action === 'data_import';
            return (
              <div key={log.id} className={`bg-white rounded-xl border overflow-hidden ${isSuspicious ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                <button onClick={() => setExpanded(isExpanded ? null : log.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon size={14} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-900 truncate">{ACTION_LABELS[log.action] || log.action}</span>
                      {isSuspicious && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span>{log.userName}</span>
                      <span>•</span>
                      <span>{log.branchName || 'Global'}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {log.amount !== undefined && log.amount > 0 && (
                      <span className="text-sm font-bold text-orange-600">{formatCurrency(log.amount)}</span>
                    )}
                    {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-3 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-500">User:</span> <span className="font-medium">{log.userName} ({log.userRole})</span></div>
                      <div><span className="text-gray-500">Cabang:</span> <span className="font-medium">{log.branchName || '-'}</span></div>
                      <div><span className="text-gray-500">Waktu:</span> <span className="font-medium">{new Date(log.timestamp).toLocaleString('id-ID')}</span></div>
                      <div><span className="text-gray-500">Kategori:</span> <span className={`font-medium ${cfg.color}`}>{cfg.label}</span></div>
                    </div>
                    <div className="bg-white rounded-lg p-2"><span className="text-gray-500">Detail:</span> <span className="text-gray-900">{log.detail}</span></div>
                    {log.amount !== undefined && log.amount > 0 && (
                      <div className="bg-white rounded-lg p-2"><span className="text-gray-500">Nominal:</span> <span className="font-bold text-orange-600">{formatCurrency(log.amount)}</span></div>
                    )}
                    <div className="text-[9px] text-gray-400 font-mono">ID: {log.id} | TS: {log.timestamp}</div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length >= 200 && <p className="text-center text-xs text-gray-400 py-2">Menampilkan 200 log terakhir. Gunakan filter untuk mempersempit.</p>}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  const cm: Record<string, string> = { indigo: 'bg-indigo-50 text-indigo-600', blue: 'bg-blue-50 text-blue-600', orange: 'bg-orange-50 text-orange-600', green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600' };
  return (
    <div className="bg-white rounded-xl p-3 border shadow-sm">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${cm[color]}`}><Icon size={14} /></div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}
