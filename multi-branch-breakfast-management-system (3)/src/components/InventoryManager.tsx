import React, { useState } from 'react';
import { Plus, Trash2, X, Check, AlertTriangle, Package } from 'lucide-react';
import type { Inventory, Branch, Supplier } from '../types';

interface Props {
  inventory: Inventory[];
  branches: Branch[];
  suppliers: Supplier[];
  addInventory: (i: Omit<Inventory, 'id'>) => void;
  updateInventory: (id: string, data: Partial<Inventory>) => void;
  deleteInventory: (id: string) => void;
}

export const InventoryManager: React.FC<Props> = ({ inventory, branches, suppliers, addInventory, updateInventory, deleteInventory }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ itemName: '', quantity: 0, unit: 'kg', minStock: 10, costPerUnit: 0, supplierId: '', branchId: '', lastRestocked: new Date().toISOString() });

  const handleSubmit = () => {
    if (!form.itemName || !form.branchId) return;
    addInventory(form);
    setShowForm(false);
    setForm({ itemName: '', quantity: 0, unit: 'kg', minStock: 10, costPerUnit: 0, supplierId: '', branchId: '', lastRestocked: new Date().toISOString() });
  };

  const formatCurrency = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="glass-card rounded-xl px-4 py-2">
            <p className="text-[10px] text-slate-400">Total Item</p>
            <p className="text-lg font-bold text-white">{inventory.length}</p>
          </div>
          <div className="glass-card rounded-xl px-4 py-2 border border-amber-500/20">
            <p className="text-[10px] text-amber-400">Stok Rendah</p>
            <p className="text-lg font-bold text-amber-400">{inventory.filter(i => i.quantity <= i.minStock).length}</p>
          </div>
        </div>
        <button onClick={() => { setForm({ ...form, branchId: branches[0]?.id || '', supplierId: suppliers[0]?.id || '' }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium shadow-lg shadow-orange-500/20 hover:opacity-90">
          <Plus size={16} /> Tambah Item
        </button>
      </div>

      <div className="overflow-x-auto glass-card rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Item</th>
              <th className="text-center p-4 text-xs text-slate-400 font-medium">Stok</th>
              <th className="text-center p-4 text-xs text-slate-400 font-medium">Min. Stok</th>
              <th className="text-right p-4 text-xs text-slate-400 font-medium">Harga/Unit</th>
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Supplier</th>
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Cabang</th>
              <th className="text-center p-4 text-xs text-slate-400 font-medium">Status</th>
              <th className="text-center p-4 text-xs text-slate-400 font-medium">Restock</th>
              <th className="text-center p-4 text-xs text-slate-400 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(inv => (
              <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-orange-400" />
                    <span className="text-sm text-white font-medium">{inv.itemName}</span>
                  </div>
                </td>
                <td className="p-4 text-center text-sm text-white font-semibold">{inv.quantity} {inv.unit}</td>
                <td className="p-4 text-center text-xs text-slate-400">{inv.minStock} {inv.unit}</td>
                <td className="p-4 text-right text-xs text-orange-400">{formatCurrency(inv.costPerUnit)}</td>
                <td className="p-4 text-xs text-slate-300">{suppliers.find(s => s.id === inv.supplierId)?.name || '-'}</td>
                <td className="p-4 text-xs text-slate-300">{branches.find(b => b.id === inv.branchId)?.name || '-'}</td>
                <td className="p-4 text-center">
                  {inv.quantity <= inv.minStock ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 flex items-center gap-1 justify-center">
                      <AlertTriangle size={10} /> Rendah
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Aman</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => updateInventory(inv.id, { quantity: inv.quantity + 50, lastRestocked: new Date().toISOString() })}
                    className="text-[10px] px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                  >
                    +50
                  </button>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => deleteInventory(inv.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Tambah Item Inventori</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <input placeholder="Nama item" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            <div className="grid grid-cols-3 gap-3">
              <input type="number" placeholder="Jumlah" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="rounded-xl px-3 py-2.5 text-sm" />
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="rounded-xl px-3 py-2.5 text-sm">
                {['kg', 'liter', 'butir', 'bungkus', 'botol', 'pcs'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <input type="number" placeholder="Min stok" value={form.minStock || ''} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} className="rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <input type="number" placeholder="Harga per unit" value={form.costPerUnit || ''} onChange={e => setForm({ ...form, costPerUnit: Number(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} className="rounded-xl px-3 py-2.5 text-sm">
                <option value="">Pilih supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} className="rounded-xl px-3 py-2.5 text-sm">
                <option value="">Pilih cabang</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button onClick={handleSubmit} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
              <Check size={16} /> Tambah
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
