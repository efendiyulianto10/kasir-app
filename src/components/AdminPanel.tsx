import { useState } from 'react';
import { 
  Users, Store, Map, Package, Settings, Plus, Edit2, Trash2, X, Check, 
  Eye, EyeOff, Shield, ChevronRight, RefreshCw, Download, Upload,
  UserPlus, Building, MapPin, AlertTriangle, Cloud, CloudOff, Loader2,
  Database, Copy, CheckCircle, XCircle, ArrowUpCircle, ArrowDownCircle, Zap
} from 'lucide-react';
import { User, saveUsers, roleLabels, roleColors, UserRole, demoUsers } from '../auth';
import { Branch, Region, Supplier, Product } from '../types';
import { generateId } from '../store';
import { 
  SupabaseConfig, getSupabaseConfig, clearSupabaseConfig,
  pushToSupabase, pullFromSupabase, generateFullSetupSQL, getTableInfo,
  connectAndSetup
} from '../supabase';

interface AdminPanelProps {
  users: User[];
  branches: Branch[];
  regions: Region[];
  suppliers: Supplier[];
  products: Product[];
  onUpdateUsers: (users: User[]) => void;
  onUpdateBranches: (branches: Branch[]) => void;
  onUpdateRegions: (regions: Region[]) => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type AdminTab = 'users' | 'branches' | 'regions' | 'overview' | 'settings' | 'supabase';

export default function AdminPanel({
  users, branches, regions, suppliers, products,
  onUpdateUsers, onUpdateBranches, onUpdateRegions,
  onResetData, onExportData, onImportData
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showRegionForm, setShowRegionForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Supabase state
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig | null>(getSupabaseConfig());
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig?.url || '');
  const [supabaseKey, setSupabaseKey] = useState(supabaseConfig?.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isCheckingTables, setIsCheckingTables] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [tableStatus, setTableStatus] = useState<{ name: string; exists: boolean; count: number }[]>([]);
  const [setupSQL, setSetupSQL] = useState('');
  const [debugLog, setDebugLog] = useState('');

  // Forms
  const [userForm, setUserForm] = useState<Partial<User>>({
    username: '', password: '', name: '', role: 'kasir', regionId: '', branchId: '', phone: ''
  });
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({
    name: '', address: '', regionId: '', status: 'testing', picName: '', picPhone: '', openDate: new Date().toISOString().split('T')[0]
  });
  const [regionForm, setRegionForm] = useState<Partial<Region>>({
    name: '', managerName: '', managerPhone: ''
  });

  // Stats
  const stats = {
    totalUsers: users.length,
    owners: users.filter(u => u.role === 'owner').length,
    managers: users.filter(u => u.role === 'manager_wilayah').length,
    pics: users.filter(u => u.role === 'pic_cabang').length,
    kasirs: users.filter(u => u.role === 'kasir').length,
    totalBranches: branches.length,
    activeBranches: branches.filter(b => b.status === 'active').length,
    testingBranches: branches.filter(b => b.status === 'testing').length,
    totalRegions: regions.length,
    totalSuppliers: suppliers.length,
    totalProducts: products.length,
  };

  // Supabase functions — 1 tombol: connect + auto create tables + auto push
  const handleTestConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setSyncMessage({ type: 'error', text: 'URL dan API Key harus diisi!' });
      return;
    }

    setIsTesting(true);
    setDebugLog('');
    setTableStatus([]);
    setSyncMessage({ type: 'info', text: '⏳ Step 1/4: Menghubungkan ke Supabase...' });

    const result = await connectAndSetup(supabaseUrl, supabaseKey);
    setDebugLog(result.debug || '');
    setTableStatus(result.tables);

    if (result.needsManualSQL) {
      setSetupSQL(generateFullSetupSQL());
      setSupabaseConfig(getSupabaseConfig());
      setSyncMessage({ type: 'error', text: result.message });
      setIsTesting(false);
      return;
    }

    if (!result.success) {
      setSyncMessage({ type: 'error', text: result.message });
      setIsTesting(false);
      return;
    }

    // Tables ready — auto push data!
    const cfg = getSupabaseConfig();
    setSupabaseConfig(cfg);

    if (cfg) {
      setSyncMessage({ type: 'info', text: '⏳ Step 3/4: Push data ke Supabase...' });
      const pushResult = await pushToSupabase(cfg);
      const details = pushResult.results
        .map(pr => `${pr.status === 'ok' ? '✅' : pr.status === 'empty' ? '⏭️' : '❌'} ${pr.table}: ${pr.count}${pr.error ? ' — '+pr.error : ''}`)
        .join('\n');

      // Refresh table counts
      setSyncMessage({ type: 'info', text: '⏳ Step 4/4: Verifikasi...' });
      const finalInfo = await getTableInfo(cfg);
      setTableStatus(finalInfo.tables);

      if (pushResult.success) {
        setSyncMessage({ type: 'success', text: `✅ Selesai! Terhubung & data tersinkronisasi!\n\n${details}` });
      } else {
        setSyncMessage({ type: 'error', text: `⚠️ Terhubung, tapi ada error saat push:\n\n${details}` });
      }
    } else {
      setSyncMessage({ type: 'success', text: result.message });
    }

    setIsTesting(false);
  };

  const handlePush = async () => {
    if (!supabaseConfig) {
      setSyncMessage({ type: 'error', text: 'Konfigurasi Supabase belum ada!' });
      return;
    }

    setIsPushing(true);
    setSyncMessage({ type: 'info', text: 'Mengirim data ke Supabase...' });

    const result = await pushToSupabase(supabaseConfig);
    
    // Show detailed results
    const details = result.results
      .map(r => `${r.status === 'ok' ? '✅' : r.status === 'empty' ? '⏭️' : '❌'} ${r.table}: ${r.count}${r.error ? ' — '+r.error : ''}`)
      .join('\n');
    
    setSyncMessage({ 
      type: result.success ? 'success' : 'error', 
      text: `${result.message}\n\n${details}` 
    });
    
    if (result.success) {
      setSupabaseConfig(getSupabaseConfig());
      // Refresh table status
      const info = await getTableInfo(supabaseConfig);
      setTableStatus(info.tables);
    }

    setIsPushing(false);
  };

  const handlePull = async () => {
    if (!supabaseConfig) {
      setSyncMessage({ type: 'error', text: 'Konfigurasi Supabase belum ada!' });
      return;
    }

    if (!confirm('Ini akan menimpa data lokal dengan data dari Supabase. Lanjutkan?')) {
      return;
    }

    setIsPulling(true);
    setSyncMessage({ type: 'info', text: 'Mengambil data dari Supabase...' });

    const result = await pullFromSupabase(supabaseConfig);
    
    // Show detailed results
    const details = result.results
      .map(r => `${r.status === 'ok' ? '✅' : r.status === 'no_table' ? '⚠️' : '❌'} ${r.table}: ${r.count}${r.error ? ' — '+r.error : ''}`)
      .join('\n');
    
    setSyncMessage({ 
      type: result.success ? 'success' : 'error', 
      text: `${result.message}\n\n${details}` 
    });
    
    if (result.success) {
      setTimeout(() => window.location.reload(), 2000);
    }

    setIsPulling(false);
  };

  const handleDisconnect = () => {
    if (confirm('Putuskan koneksi Supabase?')) {
      clearSupabaseConfig();
      setSupabaseConfig(null);
      setSupabaseUrl('');
      setSupabaseKey('');
      setSyncMessage({ type: 'info', text: 'Koneksi Supabase diputus.' });
    }
  };

  const copySql = () => {
    const sql = generateFullSetupSQL();
    navigator.clipboard.writeText(sql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const handleCheckTables = async () => {
    if (!supabaseConfig) return;
    
    setIsCheckingTables(true);
    setSyncMessage({ type: 'info', text: '⏳ Mengecek tabel...' });
    
    const info = await getTableInfo(supabaseConfig);
    setTableStatus(info.tables);
    
    if (info.allExist) {
      setSyncMessage({ type: 'success', text: '✅ Semua tabel siap!' });
    } else {
      setSetupSQL(generateFullSetupSQL());
      setSyncMessage({ type: 'error', text: '⚠️ Tabel belum lengkap. Jalankan SQL Setup.' });
    }
    
    setIsCheckingTables(false);
  };

  const handleAutoSetup = () => {
    const sql = generateFullSetupSQL();
    setSetupSQL(sql);
    setShowSqlModal(true);
  };

  // User CRUD
  const handleSaveUser = () => {
    if (!userForm.username || !userForm.password || !userForm.name) {
      alert('Username, password, dan nama harus diisi!');
      return;
    }
    
    if (!editingUser && users.some(u => u.username === userForm.username)) {
      alert('Username sudah digunakan!');
      return;
    }

    let updated: User[];
    if (editingUser) {
      updated = users.map(u => u.id === editingUser.id ? { ...u, ...userForm } as User : u);
    } else {
      const newUser: User = {
        id: generateId(),
        username: userForm.username!,
        password: userForm.password!,
        name: userForm.name!,
        role: userForm.role as UserRole || 'kasir',
        regionId: userForm.regionId,
        branchId: userForm.branchId,
        phone: userForm.phone,
      };
      updated = [...users, newUser];
    }
    
    saveUsers(updated);
    onUpdateUsers(updated);
    resetUserForm();
  };

  const resetUserForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
    setUserForm({ username: '', password: '', name: '', role: 'kasir', regionId: '', branchId: '', phone: '' });
  };

  const editUser = (user: User) => {
    setUserForm(user);
    setEditingUser(user);
    setShowUserForm(true);
  };

  const deleteUser = (userId: string) => {
    if (users.find(u => u.id === userId)?.role === 'owner' && users.filter(u => u.role === 'owner').length <= 1) {
      alert('Tidak bisa menghapus owner terakhir!');
      return;
    }
    if (confirm('Hapus user ini?')) {
      const updated = users.filter(u => u.id !== userId);
      saveUsers(updated);
      onUpdateUsers(updated);
    }
  };

  // Branch CRUD
  const handleSaveBranch = () => {
    if (!branchForm.name || !branchForm.address) {
      alert('Nama dan alamat harus diisi!');
      return;
    }

    let updated: Branch[];
    if (editingBranch) {
      updated = branches.map(b => b.id === editingBranch.id ? { ...b, ...branchForm } as Branch : b);
    } else {
      const newBranch: Branch = {
        id: generateId(),
        name: branchForm.name || '',
        address: branchForm.address || '',
        regionId: branchForm.regionId || regions[0]?.id || '',
        status: branchForm.status as Branch['status'] || 'testing',
        openDate: branchForm.openDate || new Date().toISOString().split('T')[0],
        picName: branchForm.picName || '',
        picPhone: branchForm.picPhone || '',
      };
      updated = [...branches, newBranch];
    }
    
    onUpdateBranches(updated);
    resetBranchForm();
  };

  const resetBranchForm = () => {
    setShowBranchForm(false);
    setEditingBranch(null);
    setBranchForm({ name: '', address: '', regionId: regions[0]?.id || '', status: 'testing', picName: '', picPhone: '', openDate: new Date().toISOString().split('T')[0] });
  };

  // Region CRUD
  const handleSaveRegion = () => {
    if (!regionForm.name) {
      alert('Nama wilayah harus diisi!');
      return;
    }

    let updated: Region[];
    if (editingRegion) {
      updated = regions.map(r => r.id === editingRegion.id ? { ...r, ...regionForm } as Region : r);
    } else {
      const newRegion: Region = {
        id: generateId(),
        name: regionForm.name || '',
        managerId: generateId(),
        managerName: regionForm.managerName || '',
        managerPhone: regionForm.managerPhone || '',
      };
      updated = [...regions, newRegion];
    }
    
    onUpdateRegions(updated);
    resetRegionForm();
  };

  const resetRegionForm = () => {
    setShowRegionForm(false);
    setEditingRegion(null);
    setRegionForm({ name: '', managerName: '', managerPhone: '' });
  };

  const resetUsersToDemo = () => {
    if (confirm('Reset semua user ke data demo? Anda akan tetap login.')) {
      saveUsers(demoUsers);
      onUpdateUsers(demoUsers);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'users', label: 'User & Akun', icon: Users },
    { id: 'branches', label: 'Cabang', icon: Store },
    { id: 'regions', label: 'Wilayah', icon: Map },
    { id: 'supabase', label: 'Supabase Sync', icon: Cloud },
    { id: 'settings', label: 'Data & Backup', icon: Package },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Panel Admin</h2>
            <p className="text-purple-200 text-sm">Kelola aplikasi, user, cabang, dan wilayah</p>
          </div>
          {supabaseConfig?.enabled && (
            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-lg">
              <Cloud size={16} className="text-green-300" />
              <span className="text-xs text-green-200">Supabase Connected</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'text-purple-600 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.id === 'supabase' && supabaseConfig?.enabled && (
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total User" value={stats.totalUsers} color="purple" />
              <StatCard icon={Store} label="Total Cabang" value={stats.totalBranches} color="orange" />
              <StatCard icon={Map} label="Total Wilayah" value={stats.totalRegions} color="blue" />
              <StatCard icon={Package} label="Total Produk" value={stats.totalProducts} color="green" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users size={16} /> Breakdown User
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">👑 Owner</span>
                    <span className="font-bold text-purple-600">{stats.owners}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">📍 Manager Wilayah</span>
                    <span className="font-bold text-blue-600">{stats.managers}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">🏪 PIC Cabang</span>
                    <span className="font-bold text-green-600">{stats.pics}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">🧑‍💼 Kasir</span>
                    <span className="font-bold text-orange-600">{stats.kasirs}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Store size={16} /> Status Cabang
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">✅ Aktif</span>
                    <span className="font-bold text-green-600">{stats.activeBranches}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">🧪 Testing</span>
                    <span className="font-bold text-yellow-600">{stats.testingBranches}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">❌ Tutup</span>
                    <span className="font-bold text-red-600">{branches.filter(b => b.status === 'closed').length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-gray-600">📊 Total Supplier</span>
                    <span className="font-bold text-gray-900">{stats.totalSuppliers}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
              <h4 className="font-semibold text-gray-900 mb-3">⚡ Aksi Cepat</h4>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setActiveTab('users'); setShowUserForm(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                  <UserPlus size={16} /> Tambah User
                </button>
                <button onClick={() => { setActiveTab('branches'); setShowBranchForm(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                  <Building size={16} /> Tambah Cabang
                </button>
                <button onClick={() => { setActiveTab('regions'); setShowRegionForm(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  <MapPin size={16} /> Tambah Wilayah
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Supabase Tab */}
        {activeTab === 'supabase' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">☁️ Sinkronisasi Supabase</h3>
              <p className="text-sm text-gray-500 mt-1">Hubungkan dengan Supabase untuk backup & sync data ke cloud</p>
            </div>

            {/* Connection Status */}
            <div className={`rounded-xl p-4 border-2 ${supabaseConfig?.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                {supabaseConfig?.enabled ? (
                  <>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Cloud size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-900">Terhubung ke Supabase</p>
                      <p className="text-xs text-green-600 truncate">{supabaseConfig.url}</p>
                      {supabaseConfig.lastSync && (
                        <p className="text-xs text-gray-500 mt-1">Terakhir sync: {new Date(supabaseConfig.lastSync).toLocaleString('id-ID')}</p>
                      )}
                    </div>
                    <button onClick={handleDisconnect} className="text-xs text-red-600 hover:underline">Putuskan</button>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CloudOff size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Belum Terhubung</p>
                      <p className="text-xs text-gray-500">Masukkan URL dan API Key Supabase</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sync Message */}
            {syncMessage && (
              <div className={`rounded-xl p-4 ${
                syncMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                syncMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  {syncMessage.type === 'success' ? <CheckCircle size={18} className="mt-0.5 flex-shrink-0" /> :
                   syncMessage.type === 'error' ? <XCircle size={18} className="mt-0.5 flex-shrink-0" /> :
                   <Loader2 size={18} className="animate-spin mt-0.5 flex-shrink-0" />}
                  <span className="text-sm whitespace-pre-line">{syncMessage.text}</span>
                </div>
              </div>
            )}

            {/* Debug Log */}
            {debugLog && (
              <details className="bg-gray-900 rounded-xl overflow-hidden">
                <summary className="px-4 py-2 text-xs text-gray-400 cursor-pointer hover:text-gray-200">🔍 Debug Info (klik untuk buka)</summary>
                <pre className="px-4 pb-3 text-xs text-green-400 whitespace-pre-wrap overflow-x-auto">{debugLog}</pre>
              </details>
            )}

            {/* Configuration Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Database size={16} /> Konfigurasi Supabase
              </h4>

              {/* Help Box */}
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                <p className="font-medium mb-1">📍 Cara mendapatkan URL & API Key:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline">Supabase Dashboard</a></li>
                  <li>Pilih project Anda (atau buat baru)</li>
                  <li>Klik <b>Settings</b> (ikon gear) → <b>API</b></li>
                  <li>Copy <b>Project URL</b> dan <b>anon public</b> key</li>
                </ol>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Supabase Project URL</label>
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500 font-mono"
                  placeholder="https://abcdefghij.supabase.co"
                />
                <p className="text-xs text-gray-400 mt-1">Format: https://[project-id].supabase.co</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">API Key (anon public)</label>
                <textarea
                  value={supabaseKey}
                  onChange={e => setSupabaseKey(e.target.value.trim())}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500 font-mono text-xs h-20"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
                <p className="text-xs text-gray-400 mt-1">⚠️ Gunakan <b>anon public</b> key (yang panjang), BUKAN service_role</p>
              </div>

              <button
                onClick={handleTestConnection}
                disabled={isTesting || !supabaseUrl || !supabaseKey}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {isTesting ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                {isTesting ? 'Menyiapkan...' : '🚀 Connect, Setup Tabel & Sync Data'}
              </button>
              <p className="text-xs text-gray-400 text-center">1 klik: test koneksi → buat tabel otomatis → push semua data</p>
            </div>

            {/* Table Status */}
            {supabaseConfig?.enabled && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Database size={16} /> Status Tabel Database
                  </h4>
                  <button
                    onClick={handleCheckTables}
                    disabled={isCheckingTables}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    {isCheckingTables ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Cek Ulang
                  </button>
                </div>

                {tableStatus.length > 0 && (
                  <div className="grid grid-cols-1 gap-1">
                    {tableStatus.map(t => (
                      <div key={t.name} className={`flex items-center justify-between p-2 rounded-lg text-xs ${t.exists ? 'bg-green-50' : 'bg-red-50'}`}>
                        <span className={`font-mono ${t.exists ? 'text-green-700' : 'text-red-700'}`}>{t.name}</span>
                        <span className={`font-medium ${t.exists ? 'text-green-600' : 'text-red-600'}`}>
                          {t.exists ? `✅ ${t.count} rows` : `❌ ${'err' in t && (t as Record<string,unknown>).err ? (t as Record<string,unknown>).err : 'Missing'}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {tableStatus.some(t => !t.exists) && (
                  <button
                    onClick={handleAutoSetup}
                    className="w-full py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center justify-center gap-2"
                  >
                    <Database size={16} /> Setup Tabel Otomatis (Lihat SQL)
                  </button>
                )}
              </div>
            )}

            {/* Sync Actions */}
            {supabaseConfig?.enabled && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">🔄 Sinkronisasi Data</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handlePush}
                    disabled={isPushing || isPulling}
                    className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl border-2 border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-all"
                  >
                    {isPushing ? <Loader2 size={24} className="text-blue-600 animate-spin" /> : <ArrowUpCircle size={24} className="text-blue-600" />}
                    <span className="font-medium text-blue-900">Push ke Cloud</span>
                    <span className="text-xs text-blue-600">Upload semua data lokal ke Supabase</span>
                  </button>

                  <button
                    onClick={handlePull}
                    disabled={isPushing || isPulling}
                    className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl border-2 border-green-200 hover:bg-green-100 disabled:opacity-50 transition-all"
                  >
                    {isPulling ? <Loader2 size={24} className="text-green-600 animate-spin" /> : <ArrowDownCircle size={24} className="text-green-600" />}
                    <span className="font-medium text-green-900">Pull dari Cloud</span>
                    <span className="text-xs text-green-600">Download semua data dari Supabase</span>
                  </button>
                </div>
              </div>
            )}

            {/* SQL Instructions */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <h4 className="font-medium text-indigo-900 flex items-center gap-2 mb-2">
                <Database size={16} /> Setup Database Supabase
              </h4>
              <p className="text-sm text-indigo-700 mb-3">
                Buat semua tabel yang diperlukan dengan menjalankan SQL di Supabase SQL Editor:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleAutoSetup}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  <Copy size={14} /> Lihat & Copy SQL Setup
                </button>
                {supabaseConfig?.enabled && (
                  <button
                    onClick={handleCheckTables}
                    disabled={isCheckingTables}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {isCheckingTables ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Cek Status Tabel
                  </button>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <h4 className="font-medium text-gray-900 mb-2">📋 Langkah Setup:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Buat project di <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">supabase.com</a></li>
                <li>Copy URL dan API Key dari Settings → API</li>
                <li>Masukkan di form di atas, lalu Test Koneksi</li>
                <li>Klik "Lihat & Copy SQL Setup" dan jalankan di SQL Editor Supabase</li>
                <li>Klik "Cek Status Tabel" untuk verifikasi</li>
                <li>Push data lokal ke Supabase</li>
              </ol>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Manajemen User & Akun</h3>
                <p className="text-sm text-gray-500">Kelola akses login untuk setiap divisi</p>
              </div>
              <div className="flex gap-2">
                <button onClick={resetUsersToDemo}
                  className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border">
                  Reset Demo
                </button>
                <button onClick={() => setShowUserForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                  <Plus size={16} /> Tambah User
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                <span className="font-bold text-purple-700">👑 Owner</span>
                <p className="text-purple-600 mt-0.5">Full akses semua fitur</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                <span className="font-bold text-blue-700">📍 Manager</span>
                <p className="text-blue-600 mt-0.5">Kelola wilayahnya</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                <span className="font-bold text-green-700">🏪 PIC</span>
                <p className="text-green-600 mt-0.5">Kelola cabangnya</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
                <span className="font-bold text-orange-700">🧑‍💼 Kasir</span>
                <p className="text-orange-600 mt-0.5">Hanya input transaksi</p>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Assign</th>
                    <th className="px-4 py-3 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const region = regions.find(r => r.id === u.regionId);
                    const branch = branches.find(b => b.id === u.branchId);
                    return (
                      <tr key={u.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{u.name}</div>
                          {u.phone && <div className="text-xs text-gray-500">{u.phone}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.username}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-lg border ${roleColors[u.role]}`}>
                            {roleLabels[u.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {region && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded mr-1">📍 {region.name}</span>}
                          {branch && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">🏪 {branch.name}</span>}
                          {u.role === 'owner' && <span className="text-purple-600 font-medium">Semua Akses</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => editUser(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => deleteUser(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Branches Tab */}
        {activeTab === 'branches' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Manajemen Cabang</h3>
                <p className="text-sm text-gray-500">Target: 100 cabang — Saat ini: {branches.length}</p>
              </div>
              <button onClick={() => setShowBranchForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                <Plus size={16} /> Tambah Cabang
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {branches.map(b => {
                const region = regions.find(r => r.id === b.regionId);
                return (
                  <div key={b.id} className="border rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{b.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          b.status === 'active' ? 'bg-green-100 text-green-700' :
                          b.status === 'testing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {b.status === 'active' ? '✅ Aktif' : b.status === 'testing' ? '🧪 Testing' : '❌ Tutup'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setBranchForm(b); setEditingBranch(b); setShowBranchForm(true); }}
                          className="p-1 text-gray-400 hover:text-orange-600 rounded"><Edit2 size={14} /></button>
                        <button onClick={() => { if(confirm('Hapus?')) onUpdateBranches(branches.filter(x => x.id !== b.id)); }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{b.address}</p>
                    <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                      <p>👤 PIC: {b.picName || '-'}</p>
                      {region && <p>📍 {region.name}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Regions Tab */}
        {activeTab === 'regions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Manajemen Wilayah</h3>
                <p className="text-sm text-gray-500">Kelola divisi per wilayah</p>
              </div>
              <button onClick={() => setShowRegionForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Plus size={16} /> Tambah Wilayah
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regions.map(r => {
                const rBranches = branches.filter(b => b.regionId === r.id);
                const rManagers = users.filter(u => u.role === 'manager_wilayah' && u.regionId === r.id);
                return (
                  <div key={r.id} className="border rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Map size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{r.name}</h4>
                          <p className="text-xs text-gray-500">Manager: {r.managerName || '-'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setRegionForm(r); setEditingRegion(r); setShowRegionForm(true); }}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"><Edit2 size={14} /></button>
                        <button onClick={() => { if(confirm('Hapus?')) onUpdateRegions(regions.filter(x => x.id !== r.id)); }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-orange-50 rounded-lg p-2 text-center">
                        <div className="font-bold text-orange-700">{rBranches.length}</div>
                        <div className="text-orange-600">Cabang</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <div className="font-bold text-blue-700">{rManagers.length}</div>
                        <div className="text-blue-600">Manager</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4 max-w-xl">
            <h3 className="font-semibold text-gray-900">Data & Backup</h3>
            
            <button onClick={onExportData}
              className="w-full flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-all text-left">
              <Download size={20} className="text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Export Backup</div>
                <div className="text-xs text-gray-500">Download semua data sebagai JSON</div>
              </div>
              <ChevronRight size={18} className="ml-auto text-gray-400" />
            </button>

            <label className="w-full flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-all cursor-pointer text-left">
              <Upload size={20} className="text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Import Data</div>
                <div className="text-xs text-gray-500">Restore dari file backup</div>
              </div>
              <ChevronRight size={18} className="ml-auto text-gray-400" />
              <input type="file" accept=".json" onChange={onImportData} className="hidden" />
            </label>

            <button onClick={() => setShowConfirmReset(true)}
              className="w-full flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-all text-left">
              <RefreshCw size={20} className="text-red-600" />
              <div>
                <div className="font-medium text-red-900">Reset Semua Data</div>
                <div className="text-xs text-red-500">Kembali ke data demo + logout</div>
              </div>
              <ChevronRight size={18} className="ml-auto text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <Modal title={editingUser ? 'Edit User' : 'Tambah User Baru'} onClose={resetUserForm}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Lengkap *</label>
              <input type="text" value={userForm.name || ''} onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500" placeholder="Nama lengkap" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Username *</label>
                <input type="text" value={userForm.username || ''} onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500" placeholder="username" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={userForm.password || ''} 
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500 pr-10" placeholder="password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 translate-y-[-25%] text-gray-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role / Divisi</label>
              <select value={userForm.role || 'kasir'} 
                onChange={e => setUserForm({ ...userForm, role: e.target.value as UserRole, regionId: '', branchId: '' })}
                className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500">
                <option value="owner">👑 Owner (Full Access)</option>
                <option value="manager_wilayah">📍 Manager Wilayah</option>
                <option value="pic_cabang">🏪 PIC Cabang</option>
                <option value="kasir">🧑‍💼 Kasir</option>
              </select>
            </div>
            
            {userForm.role === 'manager_wilayah' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Assign ke Wilayah</label>
                <select value={userForm.regionId || ''} onChange={e => setUserForm({ ...userForm, regionId: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500">
                  <option value="">Pilih wilayah</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )}

            {(userForm.role === 'pic_cabang' || userForm.role === 'kasir') && (
              <div>
                <label className="text-sm font-medium text-gray-700">Assign ke Cabang</label>
                <select value={userForm.branchId || ''} onChange={e => setUserForm({ ...userForm, branchId: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500">
                  <option value="">Pilih cabang</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">No. HP (opsional)</label>
              <input type="text" value={userForm.phone || ''} onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500" placeholder="628..." />
            </div>

            <button onClick={handleSaveUser}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 flex items-center justify-center gap-2">
              <Check size={18} /> {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
            </button>
          </div>
        </Modal>
      )}

      {/* Branch Form Modal */}
      {showBranchForm && (
        <Modal title={editingBranch ? 'Edit Cabang' : 'Tambah Cabang Baru'} onClose={resetBranchForm}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Cabang *</label>
              <input type="text" value={branchForm.name || ''} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                className="w-full mt-1 p-3 border rounded-xl text-sm" placeholder="SMP Tebet 3" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Alamat *</label>
              <input type="text" value={branchForm.address || ''} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                className="w-full mt-1 p-3 border rounded-xl text-sm" placeholder="Jl. ..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Wilayah</label>
                <select value={branchForm.regionId || ''} onChange={e => setBranchForm({ ...branchForm, regionId: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm">
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select value={branchForm.status || 'testing'} onChange={e => setBranchForm({ ...branchForm, status: e.target.value as Branch['status'] })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm">
                  <option value="testing">🧪 Testing</option>
                  <option value="active">✅ Aktif</option>
                  <option value="closed">❌ Tutup</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nama PIC</label>
                <input type="text" value={branchForm.picName || ''} onChange={e => setBranchForm({ ...branchForm, picName: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm" placeholder="Nama PIC" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">HP PIC</label>
                <input type="text" value={branchForm.picPhone || ''} onChange={e => setBranchForm({ ...branchForm, picPhone: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm" placeholder="628..." />
              </div>
            </div>
            <button onClick={handleSaveBranch}
              className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 flex items-center justify-center gap-2">
              <Check size={18} /> {editingBranch ? 'Simpan' : 'Tambah Cabang'}
            </button>
          </div>
        </Modal>
      )}

      {/* Region Form Modal */}
      {showRegionForm && (
        <Modal title={editingRegion ? 'Edit Wilayah' : 'Tambah Wilayah Baru'} onClose={resetRegionForm}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Wilayah *</label>
              <input type="text" value={regionForm.name || ''} onChange={e => setRegionForm({ ...regionForm, name: e.target.value })}
                className="w-full mt-1 p-3 border rounded-xl text-sm" placeholder="Jakarta Barat" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Manager</label>
              <input type="text" value={regionForm.managerName || ''} onChange={e => setRegionForm({ ...regionForm, managerName: e.target.value })}
                className="w-full mt-1 p-3 border rounded-xl text-sm" placeholder="Nama manager" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">HP Manager</label>
              <input type="text" value={regionForm.managerPhone || ''} onChange={e => setRegionForm({ ...regionForm, managerPhone: e.target.value })}
                className="w-full mt-1 p-3 border rounded-xl text-sm" placeholder="628..." />
            </div>
            <button onClick={handleSaveRegion}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
              <Check size={18} /> {editingRegion ? 'Simpan' : 'Tambah Wilayah'}
            </button>
          </div>
        </Modal>
      )}

      {/* SQL Modal */}
      {showSqlModal && (
        <Modal title="🛠️ SQL Setup Database SMP" onClose={() => setShowSqlModal(false)}>
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-xl p-3 text-sm text-indigo-700">
              <p className="font-medium">SQL ini akan membuat:</p>
              <ul className="text-xs mt-1 space-y-0.5">
                <li>✅ 10 tabel (users, regions, branches, suppliers, products, dll)</li>
                <li>✅ Indexes untuk performa</li>
                <li>✅ Row Level Security policies</li>
              </ul>
            </div>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-x-auto max-h-72 whitespace-pre-wrap">
                {setupSQL || generateFullSetupSQL()}
              </pre>
              <button
                onClick={copySql}
                className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
              >
                {sqlCopied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            {sqlCopied && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check size={14} /> SQL berhasil di-copy ke clipboard!
              </p>
            )}
            <div className="bg-yellow-50 rounded-xl p-3 text-sm text-yellow-700">
              <p className="font-medium mb-1">📝 Cara menjalankan:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Buka <b>Supabase Dashboard</b> → project Anda</li>
                <li>Klik <b>SQL Editor</b> di sidebar kiri</li>
                <li>Klik <b>New Query</b></li>
                <li>Paste SQL yang sudah di-copy</li>
                <li>Klik <b>Run</b> (Ctrl+Enter)</li>
                <li>Tutup modal ini, lalu klik <b>"Cek Status Tabel"</b></li>
              </ol>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Confirm Modal */}
      {showConfirmReset && (
        <Modal title="" onClose={() => setShowConfirmReset(false)}>
          <div className="text-center py-4">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900">Reset Semua Data?</h2>
            <p className="text-sm text-gray-500 mt-2">Semua data akan kembali ke demo dan Anda akan logout.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200">Batal</button>
              <button onClick={onResetData}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">Reset</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
  };
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
