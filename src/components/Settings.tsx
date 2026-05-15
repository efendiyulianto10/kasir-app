import { useState } from 'react';
import { Settings as SettingsIcon, RefreshCw, Download, Upload, AlertTriangle, Check, Info } from 'lucide-react';

export default function Settings() {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [exported, setExported] = useState(false);

  const exportAllData = () => {
    const keys = ['regions', 'branches', 'suppliers', 'products', 'transactions', 'stock', 'demand_tests', 'notifications'];
    const data: Record<string, unknown> = {};
    keys.forEach(key => {
      const val = localStorage.getItem(`smp_${key}`);
      if (val) data[key] = JSON.parse(val);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-smp-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
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
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(`smp_${key}`, JSON.stringify(value));
        });
        alert('Data berhasil diimport! Halaman akan di-refresh.');
        window.location.reload();
      } catch {
        alert('File tidak valid!');
      }
    };
    reader.readAsText(file);
  };

  const resetAllData = () => {
    const keys = ['regions', 'branches', 'suppliers', 'products', 'transactions', 'stock', 'demand_tests', 'notifications'];
    keys.forEach(key => localStorage.removeItem(`smp_${key}`));
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⚙️ Pengaturan</h1>
        <p className="text-gray-500 text-sm mt-1">Konfigurasi sistem SMP</p>
      </div>

      {/* Business Info */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info size={18} className="text-orange-600" /> Informasi Bisnis
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-orange-50 rounded-xl p-3">
              <div className="text-gray-500 text-xs">Nama Bisnis</div>
              <div className="font-bold text-gray-900">SMP - Sarapan Murah Pagi</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <div className="text-gray-500 text-xs">Model Bisnis</div>
              <div className="font-bold text-gray-900">Konsinyasi (Titip Jual)</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <div className="text-gray-500 text-xs">Harga Jual</div>
              <div className="font-bold text-green-700">Serba Rp 10.000</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <div className="text-gray-500 text-xs">Margin Profit</div>
              <div className="font-bold text-green-700">10% = Rp 1.000/pcs</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-gray-500 text-xs">Target Cabang</div>
              <div className="font-bold text-blue-700">100 Cabang</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-gray-500 text-xs">Management Style</div>
              <div className="font-bold text-blue-700">Macro Level ☁️</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">💳 Metode Pembayaran</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
            <span className="text-2xl">💵</span>
            <div>
              <div className="font-medium text-gray-900 text-sm">Tunai / Cash</div>
              <div className="text-xs text-green-600">✅ Aktif</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-2xl">📱</span>
            <div>
              <div className="font-medium text-gray-900 text-sm">QRIS</div>
              <div className="text-xs text-blue-600">✅ Aktif</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
            <span className="text-2xl">🟠</span>
            <div>
              <div className="font-medium text-gray-900 text-sm">ShopeeFood</div>
              <div className="text-xs text-orange-600">✅ Aktif</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-2xl">🟢</span>
            <div>
              <div className="font-medium text-gray-900 text-sm">GoFood</div>
              <div className="text-xs text-emerald-600">✅ Aktif</div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <SettingsIcon size={18} /> Manajemen Data
        </h3>
        <div className="space-y-3">
          <button onClick={exportAllData}
            className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-all text-left">
            <Download size={20} className="text-blue-600" />
            <div>
              <div className="font-medium text-gray-900 text-sm">Export Backup Data</div>
              <div className="text-xs text-gray-500">Download semua data sebagai file JSON</div>
            </div>
            {exported && <Check size={18} className="text-green-600 ml-auto" />}
          </button>

          <label className="w-full flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-all cursor-pointer">
            <Upload size={20} className="text-green-600" />
            <div>
              <div className="font-medium text-gray-900 text-sm">Import Data</div>
              <div className="text-xs text-gray-500">Restore dari file backup JSON</div>
            </div>
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>

          <button onClick={() => setShowConfirmReset(true)}
            className="w-full flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-all text-left">
            <RefreshCw size={20} className="text-red-600" />
            <div>
              <div className="font-medium text-red-900 text-sm">Reset Data Demo</div>
              <div className="text-xs text-red-500">Kembalikan ke data awal (demo)</div>
            </div>
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl p-6 text-center">
        <span className="text-5xl">🍳</span>
        <h2 className="text-2xl font-bold mt-3">SMP Management System</h2>
        <p className="text-orange-100 mt-1">Sarapan Murah Pagi — Serba 10 Ribu</p>
        <div className="mt-4 space-y-1 text-sm text-orange-200">
          <p>📊 Dashboard & Analytics</p>
          <p>⚡ Kasir Express untuk jam sibuk</p>
          <p>🧪 Demand Testing & Konsistensi</p>
          <p>📦 Stok & Retur Management</p>
          <p>💬 WhatsApp Notifications</p>
          <p>🎯 Target 100 Cabang</p>
        </div>
        <div className="mt-4 text-xs text-orange-300">v1.0 — Built for scale 🚀</div>
      </div>

      {/* Reset Confirm Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center">
              <AlertTriangle size={48} className="text-red-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900">Reset Semua Data?</h2>
              <p className="text-sm text-gray-500 mt-2">Semua data akan dikembalikan ke data demo awal. Pastikan sudah export backup!</p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowConfirmReset(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-200">Batal</button>
                <button onClick={resetAllData}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700">Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
