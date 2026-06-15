import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react';
import { Product, Supplier, Branch } from '../types';
import { generateId, formatCurrency } from '../store';

interface Props {
  products: Product[];
  suppliers: Supplier[];
  branches: Branch[];
  onSave: (products: Product[]) => void;
}

export default function Products({ products, suppliers, branches, onSave }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [form, setForm] = useState<Partial<Product>>({
    name: '', category: 'makanan', supplierId: '', branchId: branches[0]?.id || '',
  });

  const filtered = products.filter(p => {
    if (catFilter !== 'all' && p.category !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.supplierName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSubmit = () => {
    if (!form.name || !form.supplierId) return;
    const supplier = suppliers.find(s => s.id === form.supplierId);

    if (editing) {
      const updated = products.map(p => p.id === editing.id ? {
        ...p, ...form,
        supplierName: supplier?.name || '',
        price: 10000, costPrice: 9000, profit: 1000
      } as Product : p);
      onSave(updated);
    } else {
      const newProduct: Product = {
        id: generateId(),
        name: form.name || '',
        category: (form.category as Product['category']) || 'makanan',
        supplierId: form.supplierId || '',
        supplierName: supplier?.name || '',
        branchId: form.branchId || '',
        price: 10000,
        costPrice: 9000,
        profit: 1000,
      };
      onSave([...products, newProduct]);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', category: 'makanan', supplierId: '', branchId: branches[0]?.id || '' });
  };

  const categoryIcons: Record<string, string> = { makanan: '🍱', minuman: '🥤', snack: '🍡' };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Daftar Produk</h1>
          <p className="text-gray-500 text-sm">Serba Rp 10.000 — Profit SMP 10% = Rp 1.000/pcs</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 shadow-lg shadow-orange-200">
          <Plus size={18} /> Tambah Produk
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="Cari produk..." />
        </div>
        <div className="flex gap-2">
          {[{ v: 'all', l: 'Semua' }, { v: 'makanan', l: '🍱 Makanan' }, { v: 'minuman', l: '🥤 Minuman' }, { v: 'snack', l: '🍡 Snack' }].map(c => (
            <button key={c.v} onClick={() => setCatFilter(c.v)}
              className={`px-3 py-2 rounded-xl text-xs font-medium ${catFilter === c.v ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border'}`}>
              {c.l}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-4 flex items-center gap-4">
        <span className="text-4xl">💰</span>
        <div>
          <h3 className="font-bold text-lg">Serba Rp 10.000</h3>
          <p className="text-orange-100 text-sm">Harga jual tetap | Supplier dapat Rp 9.000 | Profit SMP Rp 1.000 per porsi</p>
        </div>
      </div>

      {/* Product table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Produk</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Cabang</th>
                <th className="px-4 py-3 font-medium text-right">Harga</th>
                <th className="px-4 py-3 font-medium text-right">Profit</th>
                <th className="px-4 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const branch = branches.find(b => b.id === p.branchId);
                return (
                  <tr key={p.id} className="border-t border-gray-50 hover:bg-orange-50/30">
                    <td className="px-4 py-3 font-medium text-gray-900">{categoryIcons[p.category]} {p.name}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{p.category}</td>
                    <td className="px-4 py-3 text-gray-600">{p.supplierName}</td>
                    <td className="px-4 py-3 text-gray-600">{branch?.name || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-orange-600">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(p.profit)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setForm(p); setEditing(p); setShowForm(true); }}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"><Edit2 size={14} /></button>
                        <button onClick={() => { if(confirm('Hapus?')) onSave(products.filter(x => x.id !== p.id)); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nama Produk</label>
                <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="Nasi Uduk Komplit" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Kategori</label>
                <select value={form.category || 'makanan'} onChange={e => setForm({ ...form, category: e.target.value as Product['category'] })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                  <option value="makanan">🍱 Makanan</option>
                  <option value="minuman">🥤 Minuman</option>
                  <option value="snack">🍡 Snack</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Supplier</label>
                <select value={form.supplierId || ''} onChange={e => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                  <option value="">Pilih supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Cabang</label>
                <select value={form.branchId || ''} onChange={e => setForm({ ...form, branchId: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-sm text-orange-700">💰 Harga otomatis: <b>Rp 10.000</b> | Profit: <b>Rp 1.000 (10%)</b></p>
              </div>
              <button onClick={handleSubmit}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 flex items-center justify-center gap-2">
                <Check size={18} /> {editing ? 'Simpan' : 'Tambah Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
