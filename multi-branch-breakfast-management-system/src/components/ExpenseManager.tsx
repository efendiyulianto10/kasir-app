import React, { useState } from 'react';
import { Plus, Trash2, X, Check, Wallet } from 'lucide-react';
import type { Expense, Branch } from '../types';

interface Props {
  expenses: Expense[];
  branches: Branch[];
  addExpense: (e: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
}

const categories = ['Bahan Baku', 'Operasional', 'Sewa', 'Listrik', 'Air', 'Gas', 'Gaji', 'Transportasi', 'Marketing', 'Peralatan', 'Lainnya'];

export const ExpenseManager: React.FC<Props> = ({ expenses, branches, addExpense, deleteExpense }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Bahan Baku', description: '', amount: 0, date: new Date().toISOString(), branchId: '' });

  const handleSubmit = () => {
    if (!form.description || !form.amount || !form.branchId) return;
    addExpense(form);
    setShowForm(false);
    setForm({ category: 'Bahan Baku', description: '', amount: 0, date: new Date().toISOString(), branchId: branches[0]?.id || '' });
  };

  const formatCurrency = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);

  // Group by category
  const byCategory: Record<string, number> = {};
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="glass-card rounded-xl px-4 py-2">
          <p className="text-[10px] text-slate-400">Total Pengeluaran</p>
          <p className="text-lg font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
        </div>
        <button onClick={() => { setForm({ ...form, branchId: branches[0]?.id || '' }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium shadow-lg shadow-orange-500/20 hover:opacity-90">
          <Plus size={16} /> Tambah Pengeluaran
        </button>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([cat, amt]) => (
          <div key={cat} className="glass-card rounded-xl p-3">
            <p className="text-[10px] text-slate-400">{cat}</p>
            <p className="text-sm font-bold text-white">{formatCurrency(amt)}</p>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-2">
              <div className="bg-red-400 rounded-full h-1" style={{ width: `${(amt / totalExpenses) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto glass-card rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Tanggal</th>
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Kategori</th>
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Deskripsi</th>
              <th className="text-right p-4 text-xs text-slate-400 font-medium">Jumlah</th>
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Cabang</th>
              <th className="text-center p-4 text-xs text-slate-400 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
              <tr key={exp.id} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                <td className="p-4 text-xs text-slate-300">{new Date(exp.date).toLocaleDateString('id-ID')}</td>
                <td className="p-4"><span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">{exp.category}</span></td>
                <td className="p-4 text-xs text-white">{exp.description}</td>
                <td className="p-4 text-xs text-red-400 text-right font-semibold">{formatCurrency(exp.amount)}</td>
                <td className="p-4 text-xs text-slate-400">{branches.find(b => b.id === exp.branchId)?.name || '-'}</td>
                <td className="p-4 text-center">
                  <button onClick={() => deleteExpense(exp.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
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
              <h3 className="font-bold text-white flex items-center gap-2"><Wallet size={18} className="text-orange-400" /> Tambah Pengeluaran</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl px-3 py-2.5 text-sm">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Deskripsi" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            <input type="number" placeholder="Jumlah (Rp)" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} className="w-full rounded-xl px-3 py-2.5 text-sm">
              <option value="">Pilih cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button onClick={handleSubmit} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
              <Check size={16} /> Tambah Pengeluaran
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
