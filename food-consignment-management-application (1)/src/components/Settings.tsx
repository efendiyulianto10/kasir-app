import { useState, useMemo } from 'react';
import { 
  Settings as SettingsIcon, RefreshCw, Download, Upload, AlertTriangle, 
  Check, Info, ChevronRight, User as UserIcon, Shield, Store, Users, 
  Package, FileText, HardDrive, LogOut, Lock, Eye, EyeOff, Database
} from 'lucide-react';
import { User, roleLabels, getUsers, saveUsers, setCurrentUser } from '../auth';
import { Branch, Region, Supplier, Product, DailyTransaction } from '../types';
import { formatCurrency } from '../store';

interface Props {
  user: User;
  branches: Branch[];
  regions: Region[];
  suppliers: Supplier[];
  products: Product[];
  transactions: DailyTransaction[];
  users: User[];
  onLogout: () => void;
}

export default function Settings({ user, branches, regions, suppliers, products, transactions, users, onLogout }: Props) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [exported, setExported] = useState(false);
  const [activeTab, setActiveTab] = useState<'profil' | 'bisnis' | 'data' | 'tentang'>('profil');

  // Edit profil state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Change password state
  const [changingPassword, setChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  // Storage info
  const storageInfo = useMemo(() => {
    const keys = ['regions', 'branches', 'suppliers', 'products', 'transactions', 'stock', 'demand_tests', 'notifications', 'users'];
    let totalBytes = 0;
    const items: { key: string; size: number; count: number }[] = [];
    keys.forEach(key => {
      const val = localStorage.getItem(`smp_${key}`);
      const size = val ? new Blob([val]).size : 0;
      let count = 0;
      try { count = val ? JSON.parse(val).length : 0; } catch { /* */ }
      items.push({ key, size, count });
      totalBytes += size;
    });
    // Supabase config
    const sbCfg = localStorage.getItem('smp_sb');
    if (sbCfg) totalBytes += new Blob([sbCfg]).size;

    return { totalBytes, items };
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Summary stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTx = transactions.filter(t => t.date === today);
    return {
      totalBranches: branches.length,
      activeBranches: branches.filter(b => b.status === 'active').length,
      totalRegions: regions.length,
      totalSuppliers: suppliers.filter(s => s.status === 'active').length,
      totalProducts: products.length,
      totalTransactions: transactions.length,
      todayTransactions: todayTx.length,
      todayRevenue: todayTx.reduce((s, t) => s + t.totalAmount, 0),
      totalUsers: users.length,
    };
  }, [branches, regions, suppliers, products, transactions, users]);

  // Handlers
  const saveProfile = () => {
    if (!profileName.trim()) return;
    const allUsers = getUsers();
    const updated = allUsers.map(u => u.id === user.id ? { ...u, name: profileName.trim(), phone: profilePhone.trim() } : u);
    saveUsers(updated);
    // Update current session
    const updatedUser = { ...user, name: profileName.trim(), phone: profilePhone.trim() };
    setCurrentUser(updatedUser);
    setEditingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const changePassword = () => {
    setPwError('');
    setPwSuccess(false);
    if (!oldPassword || !newPassword || !confirmPassword) { setPwError('Semua field harus diisi'); return; }
    if (oldPassword !== user.password) { setPwError('Password lama salah'); return; }
    if (newPassword.length < 4) { setPwError('Password baru minimal 4 karakter'); return; }
    if (newPassword !== confirmPassword) { setPwError('Konfirmasi password tidak cocok'); return; }

    const allUsers = getUsers();
    const updated = allUsers.map(u => u.id === user.id ? { ...u, password: newPassword } : u);
    saveUsers(updated);
    const updatedUser = { ...user, password: newPassword };
    setCurrentUser(updatedUser);
    setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    setChangingPassword(false);
    setPwSuccess(true);
    setTimeout(() => setPwSuccess(false), 3000);
  };

  const exportAllData = () => {
    const keys = ['regions', 'branches', 'suppliers', 'products', 'transactions', 'stock', 'demand_tests', 'notifications', 'users'];
    const data: Record<string, unknown> = {};
    keys.forEach(key => {
      const val = localStorage.getItem(`smp_${key}`);
      if (val) data[key] = JSON.parse(val);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `backup-smp-${new Date().toISOString().split('T')[0]}.json`; a.click();
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        Object.entries(data).forEach(([key, value]) => { localStorage.setItem(`smp_${key}`, JSON.stringify(value)); });
        alert('Data berhasil diimport! Halaman akan di-refresh.');
        window.location.reload();
      } catch { alert('File tidak valid!'); }
    };
    reader.readAsText(file);
  };

  const resetAllData = () => {
    const keys = ['regions', 'branches', 'suppliers', 'products', 'transactions', 'stock', 'demand_tests', 'notifications', 'users', 'current_user', 'smp_sb'];
    keys.forEach(key => localStorage.removeItem(`smp_${key}`));
    localStorage.removeItem('smp_sb');
    window.location.reload();
  };

  const branch = branches.find(b => b.id === user.branchId);
  const region = regions.find(r => r.id === user.regionId);

  const tabs = [
    { id: 'profil', label: '👤 Profil', icon: UserIcon },
    { id: 'bisnis', label: '📊 Info Bisnis', icon: Info },
    { id: 'data', label: '💾 Data', icon: Database },
    { id: 'tentang', label: '🍳 Tentang', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⚙️ Pengaturan</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola profil, data, dan konfigurasi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-orange-600 text-white shadow' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab: Profil ═══ */}
      {activeTab === 'profil' && (
        <div className="space-y-4 max-w-2xl">
          {/* User Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                  {user.role === 'owner' ? '👑' : user.role === 'manager_wilayah' ? '📍' : user.role === 'pic_cabang' ? '🏪' : '🧑‍💼'}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-orange-100 text-sm">@{user.username}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-white/20`}>{roleLabels[user.role]}</span>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500">Username</div>
                  <div className="font-medium text-gray-900">@{user.username}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500">No. HP</div>
                  <div className="font-medium text-gray-900">{user.phone || '-'}</div>
                </div>
                {region && (
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="text-xs text-gray-500">Wilayah</div>
                    <div className="font-medium text-blue-700">📍 {region.name}</div>
                  </div>
                )}
                {branch && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="text-xs text-gray-500">Cabang</div>
                    <div className="font-medium text-green-700">🏪 {branch.name}</div>
                  </div>
                )}
              </div>

              {/* Edit Profile */}
              {!editingProfile ? (
                <button onClick={() => setEditingProfile(true)}
                  className="w-full py-2.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all">
                  ✏️ Edit Profil
                </button>
              ) : (
                <div className="space-y-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Nama</label>
                    <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)}
                      className="w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">No. HP</label>
                    <input type="text" value={profilePhone} onChange={e => setProfilePhone(e.target.value)}
                      className="w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500" placeholder="628..." />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingProfile(false)} className="flex-1 py-2 text-sm border rounded-lg hover:bg-gray-50">Batal</button>
                    <button onClick={saveProfile} className="flex-1 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center justify-center gap-1">
                      <Check size={14} /> Simpan
                    </button>
                  </div>
                </div>
              )}
              {profileSaved && <p className="text-sm text-green-600 text-center">✅ Profil berhasil disimpan!</p>}

              {/* Change Password */}
              {!changingPassword ? (
                <button onClick={() => setChangingPassword(true)}
                  className="w-full py-2.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                  <Lock size={14} /> Ganti Password
                </button>
              ) : (
                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border">
                  <div className="relative">
                    <label className="text-xs font-medium text-gray-600">Password Lama</label>
                    <input type={showOldPw ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                      className="w-full mt-1 p-2.5 border rounded-lg text-sm pr-10" />
                    <button type="button" onClick={() => setShowOldPw(!showOldPw)} className="absolute right-3 top-7 text-gray-400">
                      {showOldPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className="text-xs font-medium text-gray-600">Password Baru</label>
                    <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className="w-full mt-1 p-2.5 border rounded-lg text-sm pr-10" />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-7 text-gray-400">
                      {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Konfirmasi Password Baru</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full mt-1 p-2.5 border rounded-lg text-sm" />
                  </div>
                  {pwError && <p className="text-xs text-red-600">❌ {pwError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setChangingPassword(false); setPwError(''); }} className="flex-1 py-2 text-sm border rounded-lg hover:bg-gray-50">Batal</button>
                    <button onClick={changePassword} className="flex-1 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium flex items-center justify-center gap-1">
                      <Lock size={14} /> Simpan Password
                    </button>
                  </div>
                </div>
              )}
              {pwSuccess && <p className="text-sm text-green-600 text-center">✅ Password berhasil diganti!</p>}

              {/* Logout */}
              <button onClick={() => { if (confirm('Yakin ingin logout?')) onLogout(); }}
                className="w-full py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Tab: Info Bisnis ═══ */}
      {activeTab === 'bisnis' && (
        <div className="space-y-4 max-w-2xl">
          {/* Business Identity */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Info size={18} className="text-orange-600" /> Identitas Bisnis</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-orange-50 rounded-xl p-3"><div className="text-gray-500 text-xs">Nama</div><div className="font-bold text-gray-900">SMP - Sarapan Murah Pagi</div></div>
              <div className="bg-orange-50 rounded-xl p-3"><div className="text-gray-500 text-xs">Model</div><div className="font-bold text-gray-900">Konsinyasi (Titip Jual)</div></div>
              <div className="bg-green-50 rounded-xl p-3"><div className="text-gray-500 text-xs">Harga Jual</div><div className="font-bold text-green-700">Serba Rp 10.000</div></div>
              <div className="bg-green-50 rounded-xl p-3"><div className="text-gray-500 text-xs">Profit Margin</div><div className="font-bold text-green-700">10% = Rp 1.000/pcs</div></div>
              <div className="bg-blue-50 rounded-xl p-3"><div className="text-gray-500 text-xs">Target Cabang</div><div className="font-bold text-blue-700">100 Cabang</div></div>
              <div className="bg-blue-50 rounded-xl p-3"><div className="text-gray-500 text-xs">Style</div><div className="font-bold text-blue-700">Macro Level ☁️</div></div>
            </div>
          </div>

          {/* Live Stats */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield size={18} className="text-purple-600" /> Statistik Sistem</h3>
            <div className="grid grid-cols-3 gap-3">
              <StatBox icon={Store} label="Cabang" value={`${stats.activeBranches}/${stats.totalBranches}`} sub="aktif / total" color="orange" />
              <StatBox icon={Users} label="Supplier" value={String(stats.totalSuppliers)} sub="aktif" color="blue" />
              <StatBox icon={Package} label="Produk" value={String(stats.totalProducts)} sub="terdaftar" color="green" />
              <StatBox icon={FileText} label="Transaksi" value={String(stats.totalTransactions)} sub="total" color="purple" />
              <StatBox icon={UserIcon} label="User" value={String(stats.totalUsers)} sub="terdaftar" color="pink" />
              <StatBox icon={Store} label="Wilayah" value={String(stats.totalRegions)} sub="wilayah" color="indigo" />
            </div>
            {stats.todayTransactions > 0 && (
              <div className="mt-3 bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Hari Ini</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.todayRevenue)}</p>
                <p className="text-xs text-gray-500">{stats.todayTransactions} transaksi</p>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">💳 Metode Pembayaran</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '💵', name: 'Tunai', bg: 'bg-green-50 border-green-200' },
                { icon: '📱', name: 'QRIS', bg: 'bg-blue-50 border-blue-200' },
                { icon: '🟠', name: 'ShopeeFood', bg: 'bg-orange-50 border-orange-200' },
                { icon: '🟢', name: 'GoFood', bg: 'bg-emerald-50 border-emerald-200' },
              ].map(m => (
                <div key={m.name} className={`flex items-center gap-3 p-3 rounded-xl border ${m.bg}`}>
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{m.name}</div>
                    <div className="text-xs text-green-600">✅ Aktif</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Tab: Data ═══ */}
      {activeTab === 'data' && (
        <div className="space-y-4 max-w-2xl">
          {/* Storage Usage */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><HardDrive size={18} className="text-gray-600" /> Penggunaan Storage</h3>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Total Data Lokal</span>
                <span className="font-bold text-gray-900">{formatBytes(storageInfo.totalBytes)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${Math.min((storageInfo.totalBytes / 5242880) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Maks ~5 MB (localStorage)</p>
            </div>
            <div className="space-y-1.5">
              {storageInfo.items.map(item => (
                <div key={item.key} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-gray-700">smp_{item.key}</span>
                  <div className="flex items-center gap-3 text-gray-500">
                    <span>{item.count} rows</span>
                    <span className="font-medium">{formatBytes(item.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><SettingsIcon size={18} /> Backup & Restore</h3>
            <div className="space-y-3">
              <button onClick={exportAllData}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-all text-left">
                <Download size={20} className="text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">Export Backup</div>
                  <div className="text-xs text-gray-500">Download semua data ({formatBytes(storageInfo.totalBytes)})</div>
                </div>
                {exported ? <Check size={18} className="text-green-600" /> : <ChevronRight size={18} className="text-gray-400" />}
              </button>

              <label className="w-full flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-all cursor-pointer text-left">
                <Upload size={20} className="text-green-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">Import Data</div>
                  <div className="text-xs text-gray-500">Restore dari file backup JSON</div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>

              <button onClick={() => setShowConfirmReset(true)}
                className="w-full flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-all text-left">
                <RefreshCw size={20} className="text-red-600" />
                <div className="flex-1">
                  <div className="font-medium text-red-900 text-sm">Reset Semua Data</div>
                  <div className="text-xs text-red-500">Hapus semua & kembali ke demo</div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Tab: Tentang ═══ */}
      {activeTab === 'tentang' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl p-8 text-center">
            <span className="text-6xl">🍳</span>
            <h2 className="text-3xl font-bold mt-4">SMP</h2>
            <p className="text-orange-100 text-lg mt-1">Sarapan Murah Pagi</p>
            <p className="text-orange-200 text-sm mt-1">Serba 10 Ribu — Target 100 Cabang</p>
            <div className="mt-6 inline-block bg-white/10 rounded-full px-4 py-1.5 text-sm">v3.0</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">✨ Fitur Aplikasi</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                '📊 Dashboard & Analytics', '⚡ Kasir Express + Closing',
                '🏪 Multi-Cabang (100)', '🗺️ Manajemen Wilayah',
                '👥 Supplier Konsinyasi', '📦 Stok & Retur',
                '🧪 Demand Testing', '💳 QRIS/ShopeeFood/GoFood',
                '🔐 Multi-user Login', '☁️ Supabase Sync',
                '💬 WhatsApp Notifikasi', '📱 Mobile Responsive',
              ].map(f => (
                <div key={f} className="bg-gray-50 rounded-lg p-2 text-gray-700">{f}</div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">🏗️ Struktur Organisasi</h3>
            <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap justify-center">
              <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-medium">👑 Owner</span>
              <span>→</span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium">📍 Manager Wilayah</span>
              <span>→</span>
              <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium">🏪 PIC Cabang</span>
              <span>→</span>
              <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium">🧑‍💼 Kasir</span>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirm Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center">
              <AlertTriangle size={48} className="text-red-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900">Reset Semua Data?</h2>
              <p className="text-sm text-gray-500 mt-2">Semua data akan dihapus dan dikembalikan ke demo. Anda akan logout. Pastikan sudah export backup!</p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowConfirmReset(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-200">Batal</button>
                <button onClick={resetAllData} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700">Reset & Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon: Icon, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-600', blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600', pink: 'bg-pink-50 text-pink-600', indigo: 'bg-indigo-50 text-indigo-600',
  };
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1 ${colors[color]}`}><Icon size={16} /></div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-500">{sub}</div>
    </div>
  );
}
