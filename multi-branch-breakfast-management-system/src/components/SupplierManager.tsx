import React, { useState } from 'react';
import { Plus, Trash2, X, Check, Truck, Phone, MapPin } from 'lucide-react';
import type { Supplier } from '../types';

interface Props {
  suppliers: Supplier[];
  addSupplier: (s: Omit<Supplier, 'id'>) => void;
  deleteSupplier: (id: string) => void;
}

export const SupplierManager: React.FC<Props> = ({ suppliers, addSupplier, deleteSupplier }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', items: '' });

  const handleSubmit = () => {
    if (!form.name) return;
    addSupplier({ name: form.name, phone: form.phone, address: form.address, items: form.items.split(',').map(i => i.trim()).filter(Boolean) });
    setShowForm(false);
    setForm({ name: '', phone: '', address: '', items: '' });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{suppliers.length} supplier terdaftar</p>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium shadow-lg shadow-orange-500/20 hover:opacity-90">
          <Plus size={16} /> Tambah Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(sup => (
          <div key={sup.id} className="glass-card rounded-2xl p-5 hover:border-orange-500/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
                  <Truck size={18} className="text-blue-400" />
                </div>
                <h4 className="text-sm font-bold text-white">{sup.name}</h4>
              </div>
              <button onClick={() => deleteSupplier(sup.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400"><Phone size={12} /><span>{sup.phone}</span></div>
              <div className="flex items-center gap-2 text-xs text-slate-400"><MapPin size={12} /><span>{sup.address}</span></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {sup.items.map((item, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Tambah Supplier</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <input placeholder="Nama supplier" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            <input placeholder="No. telepon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            <input placeholder="Alamat" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            <input placeholder="Produk (pisahkan koma: Beras, Ayam, dll)" value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            <button onClick={handleSubmit} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
              <Check size={16} /> Tambah Supplier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
