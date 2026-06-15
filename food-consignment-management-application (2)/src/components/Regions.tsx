import { useState, useMemo } from 'react';
import { Map, Plus, Edit2, X, Check, Trash2, Users, Phone, MessageCircle } from 'lucide-react';
import { Region, Branch } from '../types';
import { generateId, sendWhatsAppNotification, formatCurrency } from '../store';
import { DailyTransaction } from '../types';

interface Props {
  regions: Region[];
  branches: Branch[];
  transactions: DailyTransaction[];
  onSave: (regions: Region[]) => void;
}

export default function Regions({ regions, branches, transactions, onSave }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [form, setForm] = useState<Partial<Region>>({ name: '', managerName: '', managerPhone: '' });

  const regionData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return regions.map(r => {
      const rBranches = branches.filter(b => b.regionId === r.id);
      const rTx = transactions.filter(t => {
        return rBranches.some(b => b.id === t.branchId) && t.date === today;
      });
      return {
        ...r,
        branchCount: rBranches.length,
        activeBranches: rBranches.filter(b => b.status === 'active').length,
        todayRevenue: rTx.reduce((s, t) => s + t.totalAmount, 0),
        todayProfit: rTx.reduce((s, t) => s + t.totalProfit, 0),
        todayTransactions: rTx.length,
      };
    });
  }, [regions, branches, transactions]);

  const handleSubmit = () => {
    if (!form.name) return;
    if (editing) {
      const updated = regions.map(r => r.id === editing.id ? { ...r, ...form } as Region : r);
      onSave(updated);
    } else {
      const newRegion: Region = {
        id: generateId(),
        name: form.name || '',
        managerId: generateId(),
        managerName: form.managerName || '',
        managerPhone: form.managerPhone || '',
      };
      onSave([...regions, newRegion]);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', managerName: '', managerPhone: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🗺️ Manajemen Wilayah</h1>
          <p className="text-gray-500 text-sm">Divisi per wilayah — setiap wilayah punya manajer regional</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 shadow-lg shadow-orange-200">
          <Plus size={18} /> Tambah Wilayah
        </button>
      </div>

      {/* Region Structure */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
        <h3 className="font-semibold text-blue-900 text-sm mb-2">🏗️ Struktur Organisasi SMP</h3>
        <div className="flex items-center gap-2 text-xs text-blue-700 flex-wrap">
          <span className="bg-blue-200 px-2 py-1 rounded-lg font-medium">👑 Owner (Macro)</span>
          <span>→</span>
          <span className="bg-blue-200 px-2 py-1 rounded-lg font-medium">📍 Manager Wilayah</span>
          <span>→</span>
          <span className="bg-blue-200 px-2 py-1 rounded-lg font-medium">🏪 PIC Cabang</span>
          <span>→</span>
          <span className="bg-blue-200 px-2 py-1 rounded-lg font-medium">🧑‍🍳 Kasir</span>
        </div>
      </div>

      {/* Region Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {regionData.map(r => (
          <div key={r.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Map size={18} className="text-orange-600" />
                  <h3 className="font-bold text-gray-900 text-lg">{r.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={14} className="text-gray-400" />
                  <span>Manager: <b>{r.managerName}</b></span>
                </div>
              </div>
              <div className="flex gap-1">
                <a href={sendWhatsAppNotification(r.managerPhone, `Halo ${r.managerName}, update wilayah ${r.name} 📊`)}
                  target="_blank" rel="noreferrer"
                  className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"><MessageCircle size={14} /></a>
                <button onClick={() => { setForm(r); setEditing(r); setShowForm(true); }}
                  className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => { if(confirm('Hapus?')) onSave(regions.filter(x => x.id !== r.id)); }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-orange-600">{r.branchCount}</div>
                <div className="text-xs text-gray-500">Cabang</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-green-600">{r.activeBranches}</div>
                <div className="text-xs text-gray-500">Aktif</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-blue-600">{r.todayTransactions}</div>
                <div className="text-xs text-gray-500">Tx Hari Ini</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-500">Revenue: </span>
                <span className="font-bold text-orange-600">{formatCurrency(r.todayRevenue)}</span>
              </div>
              <div>
                <span className="text-gray-500">Profit: </span>
                <span className="font-bold text-green-600">{formatCurrency(r.todayProfit)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
              <Phone size={12} /> {r.managerPhone}
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Edit Wilayah' : 'Tambah Wilayah'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nama Wilayah</label>
                <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="Jakarta Barat" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Nama Manager</label>
                <input type="text" value={form.managerName || ''} onChange={e => setForm({ ...form, managerName: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="Nama lengkap" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">No. HP Manager</label>
                <input type="text" value={form.managerPhone || ''} onChange={e => setForm({ ...form, managerPhone: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="6281..." />
              </div>
              <button onClick={handleSubmit}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 flex items-center justify-center gap-2">
                <Check size={18} /> {editing ? 'Simpan' : 'Tambah Wilayah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
