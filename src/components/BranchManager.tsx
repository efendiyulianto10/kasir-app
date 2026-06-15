import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Check, Building2, MapPin, Phone, User, Zap } from 'lucide-react';
import type { Branch } from '../types';

interface Props {
  branches: Branch[];
  addBranch: (b: Omit<Branch, 'id' | 'createdAt'>) => void;
  updateBranch: (id: string, data: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
}

const emptyBranch: { name: string; address: string; phone: string; manager: string; type: 'macro' | 'meso' | 'micro'; isActive: boolean } = { name: '', address: '', phone: '', manager: '', type: 'micro', isActive: true };

export const BranchManager: React.FC<Props> = ({ branches, addBranch, updateBranch, deleteBranch }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyBranch);

  const handleSubmit = () => {
    if (!form.name) return;
    if (editId) updateBranch(editId, form);
    else addBranch(form);
    setShowForm(false);
    setEditId(null);
    setForm(emptyBranch);
  };

  const startEdit = (b: Branch) => {
    setForm({ name: b.name, address: b.address, phone: b.phone, manager: b.manager, type: b.type, isActive: b.isActive });
    setEditId(b.id);
    setShowForm(true);
  };

  const typeConfig = {
    macro: { label: 'Macro', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', desc: 'Cabang besar, 20+ karyawan', icon: '🏢' },
    meso: { label: 'Meso', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', desc: 'Cabang menengah, 5-20 karyawan', icon: '🏬' },
    micro: { label: 'Micro', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', desc: 'Cabang kecil, 1-5 karyawan', icon: '🏪' },
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">{branches.length} cabang terdaftar</p>
        </div>
        <button onClick={() => { setForm(emptyBranch); setEditId(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium shadow-lg shadow-orange-500/20 hover:opacity-90">
          <Plus size={16} /> Tambah Cabang
        </button>
      </div>

      {/* Branch Type Overview */}
      <div className="grid grid-cols-3 gap-4">
        {(['macro', 'meso', 'micro'] as const).map(type => {
          const config = typeConfig[type];
          const count = branches.filter(b => b.type === type).length;
          return (
            <div key={type} className={`glass-card rounded-2xl p-4 border ${config.color}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white">{config.label}</p>
                  <p className="text-[10px] text-slate-400">{config.desc}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-3">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map(branch => {
          const config = typeConfig[branch.type];
          return (
            <div key={branch.id} className="glass-card rounded-2xl p-5 hover:border-orange-500/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center text-xl">
                    {config.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{branch.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${config.color}`}>{config.label}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(branch)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-blue-400"><Edit3 size={14} /></button>
                  <button onClick={() => deleteBranch(branch.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400"><MapPin size={12} /><span>{branch.address}</span></div>
                <div className="flex items-center gap-2 text-xs text-slate-400"><Phone size={12} /><span>{branch.phone}</span></div>
                <div className="flex items-center gap-2 text-xs text-slate-400"><User size={12} /><span>Manager: {branch.manager}</span></div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${branch.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {branch.isActive ? '● Aktif' : '● Nonaktif'}
                </span>
                <span className="text-[10px] text-slate-500">Sejak {new Date(branch.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2"><Building2 size={18} className="text-orange-400" /> {editId ? 'Edit Cabang' : 'Tambah Cabang Baru'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <input placeholder="Nama cabang" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            <input placeholder="Alamat lengkap" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="No. telepon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl px-4 py-2.5 text-sm" />
              <input placeholder="Nama manager" value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} className="rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Zap size={12} /> Tipe Cabang</label>
              <div className="grid grid-cols-3 gap-2">
                {(['macro', 'meso', 'micro'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setForm({ ...form, type })}
                    className={`p-3 rounded-xl text-center transition-all ${form.type === type ? 'gradient-orange text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    <span className="text-lg">{typeConfig[type].icon}</span>
                    <p className="text-xs font-semibold mt-1">{typeConfig[type].label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              <label className="text-sm text-slate-300">Cabang aktif</label>
            </div>
            <button onClick={handleSubmit} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
              <Check size={16} /> {editId ? 'Simpan' : 'Tambah Cabang'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
