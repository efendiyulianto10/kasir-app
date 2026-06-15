import { useState, useMemo } from 'react';
import { FileText, Search, Download, Filter } from 'lucide-react';
import { DailyTransaction, Branch } from '../types';
import { formatCurrency } from '../store';

interface Props {
  transactions: DailyTransaction[];
  branches: Branch[];
}

export default function Transactions({ transactions, branches }: Props) {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (selectedBranch) result = result.filter(t => t.branchId === selectedBranch);
    if (selectedDate) result = result.filter(t => t.date === selectedDate);
    if (selectedPayment) result = result.filter(t => t.paymentMethod === selectedPayment);
    if (search) result = result.filter(t => t.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase())));
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);
  }, [transactions, selectedBranch, selectedDate, selectedPayment, search]);

  const totals = useMemo(() => ({
    count: filtered.length,
    revenue: filtered.reduce((s, t) => s + t.totalAmount, 0),
    profit: filtered.reduce((s, t) => s + t.totalProfit, 0),
    items: filtered.reduce((s, t) => s + t.items.reduce((ss, i) => ss + i.qty, 0), 0),
  }), [filtered]);

  const paymentLabels: Record<string, string> = {
    cash: '💵 Tunai',
    qris: '📱 QRIS',
    shopeefood: '🟠 ShopeeFood',
    gofood: '🟢 GoFood',
  };

  const exportCSV = () => {
    const headers = ['Tanggal', 'Cabang', 'Produk', 'Qty', 'Total', 'Profit', 'Pembayaran'];
    const rows = filtered.map(t => {
      const branch = branches.find(b => b.id === t.branchId);
      return [
        t.date,
        branch?.name || '',
        t.items.map(i => i.productName).join('; '),
        t.items.reduce((s, i) => s + i.qty, 0),
        t.totalAmount,
        t.totalProfit,
        t.paymentMethod
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaksi-smp-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Riwayat Transaksi</h1>
          <p className="text-gray-500 text-sm">Semua transaksi dari seluruh cabang</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-gray-500"><Filter size={16} /><span className="text-sm font-medium">Filter</span></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
            className="p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
            <option value="">Semua Cabang</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" />
          <select value={selectedPayment} onChange={e => setSelectedPayment(e.target.value)}
            className="p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
            <option value="">Semua Pembayaran</option>
            <option value="cash">Tunai</option>
            <option value="qris">QRIS</option>
            <option value="shopeefood">ShopeeFood</option>
            <option value="gofood">GoFood</option>
          </select>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="Cari produk..." />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-sm text-gray-500">Transaksi</div>
          <div className="text-2xl font-bold text-gray-900">{totals.count}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-sm text-gray-500">Items</div>
          <div className="text-2xl font-bold text-gray-900">{totals.items}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-sm text-gray-500">Revenue</div>
          <div className="text-xl font-bold text-orange-600">{formatCurrency(totals.revenue)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-sm text-gray-500">Profit (10%)</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(totals.profit)}</div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Cabang</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Pembayaran</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(t => {
                const branch = branches.find(b => b.id === t.branchId);
                return (
                  <tr key={t.id} className="border-t border-gray-50 hover:bg-orange-50/30">
                    <td className="px-4 py-3 text-gray-600">{t.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{branch?.name || t.branchId}</td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        {t.items.map((item, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded mr-1 inline-block mb-0.5">
                            {item.productName} x{item.qty}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{paymentLabels[t.paymentMethod] || t.paymentMethod}</td>
                    <td className="px-4 py-3 text-right font-medium text-orange-600">{formatCurrency(t.totalAmount)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(t.totalProfit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <FileText size={40} className="mx-auto mb-2 opacity-30" />
            <p>Tidak ada transaksi ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}
