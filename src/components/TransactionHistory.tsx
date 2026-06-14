import React, { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import type { Transaction, Branch } from '../types';

interface Props {
  transactions: Transaction[];
  branches: Branch[];
}

export const TransactionHistory: React.FC<Props> = ({ transactions, branches }) => {
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = transactions.filter(t =>
    (filterBranch === 'all' || t.branchId === filterBranch) &&
    (filterPayment === 'all' || t.paymentMethod === filterPayment) &&
    (filterStatus === 'all' || t.status === filterStatus) &&
    (search === '' || t.customerName?.toLowerCase().includes(search.toLowerCase()) || t.id.includes(search))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
  const totalFiltered = filtered.filter(t => t.status === 'completed').reduce((a, t) => a + t.total, 0);

  const exportCSV = () => {
    const header = 'ID,Tanggal,Pelanggan,Items,Total,Pembayaran,Status,Cabang\n';
    const rows = filtered.map(t =>
      `${t.id},${new Date(t.date).toLocaleString('id-ID')},${t.customerName || '-'},${t.items.length},${t.total},${t.paymentMethod},${t.status},${branches.find(b => b.id === t.branchId)?.name || '-'}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaksi_smp_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-slate-400" />
          <input type="text" placeholder="Cari transaksi..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent border-none text-sm text-white w-full focus:outline-none !border-0 !shadow-none" style={{ border: 'none', boxShadow: 'none' }} />
        </div>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="rounded-xl px-3 py-2 text-sm">
          <option value="all">Semua Cabang</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} className="rounded-xl px-3 py-2 text-sm">
          <option value="all">Semua Metode</option>
          <option value="cash">Cash</option>
          <option value="qris">QRIS</option>
          <option value="transfer">Transfer</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-xl px-3 py-2 text-sm">
          <option value="all">Semua Status</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Batal</option>
          <option value="pending">Pending</option>
        </select>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="glass-card rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-slate-400"><Filter size={12} className="inline mr-1" />{filtered.length} transaksi ditemukan</span>
        <span className="text-sm font-bold text-orange-400">Total: {formatCurrency(totalFiltered)}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto glass-card rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left p-4 text-xs text-slate-400 font-medium">ID</th>
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Tanggal</th>
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Pelanggan</th>
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Items</th>
              <th className="text-right p-4 text-xs text-slate-400 font-medium">Total</th>
              <th className="text-center p-4 text-xs text-slate-400 font-medium">Bayar</th>
              <th className="text-left p-4 text-xs text-slate-400 font-medium">Cabang</th>
              <th className="text-center p-4 text-xs text-slate-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map(tx => (
              <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                <td className="p-4 text-xs text-slate-400 font-mono">#{tx.id.slice(0, 8)}</td>
                <td className="p-4 text-xs text-slate-300">{new Date(tx.date).toLocaleString('id-ID')}</td>
                <td className="p-4 text-xs text-white">{tx.customerName || '-'}</td>
                <td className="p-4 text-xs text-slate-300">
                  {tx.items.map(i => `${i.menuItemName} (x${i.quantity})`).join(', ')}
                </td>
                <td className="p-4 text-xs text-orange-400 text-right font-semibold">{formatCurrency(tx.total)}</td>
                <td className="p-4 text-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    tx.paymentMethod === 'cash' ? 'bg-emerald-500/10 text-emerald-400' :
                    tx.paymentMethod === 'qris' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-purple-500/10 text-purple-400'
                  }`}>{tx.paymentMethod.toUpperCase()}</span>
                </td>
                <td className="p-4 text-xs text-slate-400">{branches.find(b => b.id === tx.branchId)?.name?.replace('SMP ', '') || '-'}</td>
                <td className="p-4 text-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    tx.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>{tx.status === 'completed' ? 'Selesai' : tx.status === 'cancelled' ? 'Batal' : 'Pending'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
