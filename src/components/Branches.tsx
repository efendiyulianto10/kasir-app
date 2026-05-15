import { useState } from 'react';
import { Plus, MapPin, Phone, User, Calendar, Edit2, X, Check, Trash2 } from 'lucide-react';
import { Branch, Region } from '../types';
import { generateId } from '../store';

interface Props {
  branches: Branch[];
  regions: Region[];
  onSave: (branches: Branch[]) => void;
}

export default function Branches({ branches, regions, onSave }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [form, setForm] = useState<Partial<Branch>>({
    name: '', address: '', regionId: regions[0]?.id || '', status: 'testing', picName: '', picPhone: '', openDate: new Date().toISOString().split('T')[0]
  });

  const filtered = filter === 'all' ? branches : branches.filter(b => b.status === filter);

  const handleSubmit = () => {
    if (!form.name || !form.address) return;
    
    if (editing) {
      const updated = branches.map(b => b.id === editing.id ? { ...b, ...form } as Branch : b);
      onSave(updated);
    } else {
      const newBranch: Branch = {
        id: generateId(),
        name: form.name || '',
        address: form.address || '',
        regionId: form.regionId || '',
        status: (form.status as Branch['status']) || 'testing',
        openDate: form.openDate || new Date().toISOString().split('T')[0],
        picName: form.picName || '',
        picPhone: form.picPhone || '',
      };
      onSave([...branches, newBranch]);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', address: '', regionId: regions[0]?.id || '', status: 'testing', picName: '', picPhone: '', openDate: new Date().toISOString().split('T')[0] });
  };

  const startEdit = (branch: Branch) => {
    setForm(branch);
    setEditing(branch);
    setShowForm(true);
  };

  const deleteBranch = (id: string) => {
    if (confirm('Hapus cabang ini?')) {
      onSave(branches.filter(b => b.id !== id));
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    testing: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    active: '✅ Aktif',
    testing: '🧪 Testing',
    closed: '❌ Tutup',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏪 Manajemen Cabang</h1>
          <p className="text-gray-500 text-sm">Target: 100 cabang — saat ini {branches.length} cabang</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all"
        >
          <Plus size={18} />
          Tambah Cabang
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: 'all', label: 'Semua' }, { value: 'active', label: '✅ Aktif' }, { value: 'testing', label: '🧪 Testing' }, { value: 'closed', label: '❌ Tutup' }].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.value ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label} {f.value === 'all' ? `(${branches.length})` : `(${branches.filter(b => b.status === f.value).length})`}
          </button>
        ))}
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(branch => {
          const region = regions.find(r => r.id === branch.regionId);
          return (
            <div key={branch.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{branch.name}</h3>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${statusColors[branch.status]}`}>
                    {statusLabels[branch.status]}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(branch)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteBranch(branch.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" />{branch.address}</div>
                <div className="flex items-center gap-2"><User size={14} className="text-gray-400" />PIC: {branch.picName}</div>
                <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" />{branch.picPhone}</div>
                <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-400" />Buka: {branch.openDate}</div>
                {region && (
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-orange-400" />Wilayah: {region.name}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Cabang' : 'Tambah Cabang Baru'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nama Cabang</label>
                <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500"
                  placeholder="SMP Tebet 3" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Alamat</label>
                <input type="text" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500"
                  placeholder="Jl. Tebet Raya No. 15" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Wilayah</label>
                <select value={form.regionId || ''} onChange={e => setForm({ ...form, regionId: e.target.value })}
                  className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select value={form.status || 'testing'} onChange={e => setForm({ ...form, status: e.target.value as Branch['status'] })}
                  className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                  <option value="testing">🧪 Testing</option>
                  <option value="active">✅ Aktif</option>
                  <option value="closed">❌ Tutup</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">PIC</label>
                  <input type="text" value={form.picName || ''} onChange={e => setForm({ ...form, picName: e.target.value })}
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500"
                    placeholder="Nama PIC" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">No. HP PIC</label>
                  <input type="text" value={form.picPhone || ''} onChange={e => setForm({ ...form, picPhone: e.target.value })}
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500"
                    placeholder="6281..." />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tanggal Buka</label>
                <input type="date" value={form.openDate || ''} onChange={e => setForm({ ...form, openDate: e.target.value })}
                  className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500" />
              </div>
              <button onClick={handleSubmit}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 flex items-center justify-center gap-2">
                <Check size={18} />
                {editing ? 'Simpan Perubahan' : 'Tambah Cabang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
