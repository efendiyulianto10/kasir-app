import { useState } from 'react';
import { Plus, Phone, MapPin, Star, Edit2, X, Check, Trash2, MessageCircle } from 'lucide-react';
import { Supplier, Branch } from '../types';
import { generateId, sendWhatsAppNotification } from '../store';

interface Props {
  suppliers: Supplier[];
  branches: Branch[];
  onSave: (suppliers: Supplier[]) => void;
}

export default function Suppliers({ suppliers, branches, onSave }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState<Partial<Supplier>>({
    name: '', phone: '', address: '', branchId: branches[0]?.id || '', products: [], rating: 5, status: 'active'
  });
  const [productInput, setProductInput] = useState('');

  const filtered = suppliers.filter(s => {
    if (filter && s.branchId !== filter) return false;
    return true;
  });

  const handleSubmit = () => {
    if (!form.name) return;
    const products = productInput.split(',').map(p => p.trim()).filter(Boolean);
    
    if (editing) {
      const updated = suppliers.map(s => s.id === editing.id ? { ...s, ...form, products } as Supplier : s);
      onSave(updated);
    } else {
      const newSupplier: Supplier = {
        id: generateId(),
        name: form.name || '',
        phone: form.phone || '',
        address: form.address || '',
        branchId: form.branchId || '',
        products,
        rating: form.rating || 5,
        status: 'active',
      };
      onSave([...suppliers, newSupplier]);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', phone: '', address: '', branchId: branches[0]?.id || '', products: [], rating: 5, status: 'active' });
    setProductInput('');
  };

  const startEdit = (s: Supplier) => {
    setForm(s);
    setProductInput(s.products.join(', '));
    setEditing(s);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 Manajemen Supplier</h1>
          <p className="text-gray-500 text-sm">Supplier masyarakat sekitar — konsinyasi, retur yang tidak terjual</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 shadow-lg shadow-orange-200">
          <Plus size={18} /> Tambah Supplier
        </button>
      </div>

      {/* Filter by branch */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!filter ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border'}`}>
          Semua ({suppliers.length})
        </button>
        {branches.map(b => (
          <button key={b.id} onClick={() => setFilter(b.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === b.id ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border'}`}>
            {b.name} ({suppliers.filter(s => s.branchId === b.id).length})
          </button>
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
        <h3 className="font-semibold text-blue-900 text-sm mb-1">💡 Sistem Konsinyasi SMP</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Supplier titip makanan/minuman di lapak SMP</li>
          <li>• Semua harga jual Rp 10.000 per porsi</li>
          <li>• SMP dapat komisi 10% = Rp 1.000/porsi</li>
          <li>• Sisa yang tidak terjual dikembalikan (closing)</li>
        </ul>
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const branch = branches.find(b => b.id === s.branchId);
          return (
            <div key={s.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{s.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < s.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{s.rating}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <a href={sendWhatsAppNotification(s.phone, `Halo ${s.name}, dari SMP 🍳`)} target="_blank" rel="noreferrer"
                    className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
                    <MessageCircle size={14} />
                  </a>
                  <button onClick={() => startEdit(s)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => { if(confirm('Hapus?')) onSave(suppliers.filter(x => x.id !== s.id)); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" />{s.phone}</div>
                <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" />{s.address}</div>
                {branch && <div className="text-xs text-orange-600">📍 {branch.name}</div>}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {s.products.map((p, i) => (
                  <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{p}</span>
                ))}
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
              <h2 className="text-lg font-bold">{editing ? 'Edit Supplier' : 'Tambah Supplier'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nama Supplier</label>
                <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="Bu Sari (Nasi Uduk)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">No. HP</label>
                  <input type="text" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="6281..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Alamat</label>
                  <input type="text" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="Tebet" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Cabang</label>
                <select value={form.branchId || ''} onChange={e => setForm({ ...form, branchId: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Produk (pisahkan koma)</label>
                <input type="text" value={productInput} onChange={e => setProductInput(e.target.value)}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="Nasi Uduk, Lontong Sayur" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Rating</label>
                <input type="number" min={1} max={5} step={0.1} value={form.rating || 5} onChange={e => setForm({ ...form, rating: parseFloat(e.target.value) })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" />
              </div>
              <button onClick={handleSubmit}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 flex items-center justify-center gap-2">
                <Check size={18} />
                {editing ? 'Simpan' : 'Tambah Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
