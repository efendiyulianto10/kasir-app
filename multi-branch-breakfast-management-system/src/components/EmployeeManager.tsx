import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Check, Users } from 'lucide-react';
import type { Employee, Branch } from '../types';

interface Props {
  employees: Employee[];
  branches: Branch[];
  addEmployee: (e: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
}

type EmployeeRole = 'owner' | 'manager' | 'cashier' | 'cook' | 'staff';

const emptyEmp: { name: string; role: EmployeeRole; phone: string; branchId: string; salary: number; isActive: boolean; joinDate: string } = {
  name: '', role: 'staff', phone: '', branchId: '', salary: 2500000, isActive: true, joinDate: new Date().toISOString().split('T')[0]
};

const roleLabels: Record<string, string> = { owner: 'Pemilik', manager: 'Manager', cashier: 'Kasir', cook: 'Koki', staff: 'Staff' };
const roleColors: Record<string, string> = { owner: 'bg-purple-500/10 text-purple-400', manager: 'bg-blue-500/10 text-blue-400', cashier: 'bg-emerald-500/10 text-emerald-400', cook: 'bg-orange-500/10 text-orange-400', staff: 'bg-slate-500/10 text-slate-400' };

export const EmployeeManager: React.FC<Props> = ({ employees, branches, addEmployee, updateEmployee, deleteEmployee }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyEmp, branchId: '' });

  const handleSubmit = () => {
    if (!form.name || !form.branchId) return;
    if (editId) updateEmployee(editId, form);
    else addEmployee(form);
    setShowForm(false);
    setEditId(null);
    setForm({ ...emptyEmp, branchId: branches[0]?.id || '' });
  };

  const startEdit = (e: Employee) => {
    setForm({ name: e.name, role: e.role, phone: e.phone, branchId: e.branchId, salary: e.salary, isActive: e.isActive, joinDate: e.joinDate });
    setEditId(e.id);
    setShowForm(true);
  };

  const formatCurrency = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
  const totalSalary = employees.filter(e => e.isActive).reduce((a, e) => a + e.salary, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-4">
          <div className="glass-card rounded-xl px-4 py-2">
            <p className="text-[10px] text-slate-400">Total Karyawan</p>
            <p className="text-lg font-bold text-white">{employees.length}</p>
          </div>
          <div className="glass-card rounded-xl px-4 py-2">
            <p className="text-[10px] text-slate-400">Total Gaji/Bulan</p>
            <p className="text-lg font-bold text-orange-400">{formatCurrency(totalSalary)}</p>
          </div>
        </div>
        <button onClick={() => { setForm({ ...emptyEmp, branchId: branches[0]?.id || '' }); setEditId(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium shadow-lg shadow-orange-500/20 hover:opacity-90">
          <Plus size={16} /> Tambah Karyawan
        </button>
      </div>

      <div className="overflow-x-auto glass-card rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Nama</th>
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Jabatan</th>
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Cabang</th>
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Telepon</th>
              <th className="text-right p-4 text-xs text-slate-400 font-medium">Gaji</th>
              <th className="text-center p-4 text-xs text-slate-400 font-medium">Status</th>
              <th className="text-center p-4 text-xs text-slate-400 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full gradient-orange flex items-center justify-center text-white text-xs font-bold">
                      {emp.name.charAt(0)}
                    </div>
                    <span className="text-sm text-white font-medium">{emp.name}</span>
                  </div>
                </td>
                <td className="p-4"><span className={`text-[10px] px-2 py-0.5 rounded-full ${roleColors[emp.role]}`}>{roleLabels[emp.role]}</span></td>
                <td className="p-4 text-xs text-slate-300">{branches.find(b => b.id === emp.branchId)?.name || '-'}</td>
                <td className="p-4 text-xs text-slate-400">{emp.phone}</td>
                <td className="p-4 text-xs text-orange-400 text-right font-semibold">{formatCurrency(emp.salary)}</td>
                <td className="p-4 text-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${emp.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {emp.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => startEdit(emp)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-blue-400"><Edit3 size={14} /></button>
                    <button onClick={() => deleteEmployee(emp.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
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
              <h3 className="font-bold text-white flex items-center gap-2"><Users size={18} className="text-orange-400" /> {editId ? 'Edit Karyawan' : 'Tambah Karyawan'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <input placeholder="Nama karyawan" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as EmployeeRole })} className="rounded-xl px-3 py-2.5 text-sm">
                {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} className="rounded-xl px-3 py-2.5 text-sm">
                <option value="">Pilih cabang</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="No. telepon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl px-4 py-2.5 text-sm" />
              <input type="number" placeholder="Gaji" value={form.salary} onChange={e => setForm({ ...form, salary: Number(e.target.value) })} className="rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              <label className="text-sm text-slate-300">Aktif</label>
            </div>
            <button onClick={handleSubmit} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
              <Check size={16} /> {editId ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
