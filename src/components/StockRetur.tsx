import { useState, useMemo } from 'react';
import { Package, ArrowLeftRight, AlertTriangle, Check, Plus, X } from 'lucide-react';
import { DailyStock, Branch, Product, Supplier } from '../types';
import { generateId, formatCurrency } from '../store';

interface Props {
  stock: DailyStock[];
  branches: Branch[];
  products: Product[];
  suppliers: Supplier[];
  onSave: (stock: DailyStock[]) => void;
}

export default function StockRetur({ stock, branches, products, suppliers, onSave }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ productId: '', qtyReceived: 0, qtySold: 0 });

  const filteredStock = useMemo(() => {
    return stock.filter(s => s.branchId === selectedBranch && s.date === selectedDate);
  }, [stock, selectedBranch, selectedDate]);

  const totals = useMemo(() => {
    const received = filteredStock.reduce((s, i) => s + i.qtyReceived, 0);
    const sold = filteredStock.reduce((s, i) => s + i.qtySold, 0);
    const returned = filteredStock.reduce((s, i) => s + i.qtyReturned, 0);
    return { received, sold, returned, sellRate: received > 0 ? (sold / received * 100) : 0 };
  }, [filteredStock]);

  const handleSubmit = () => {
    if (!form.productId || form.qtyReceived <= 0) return;
    const product = products.find(p => p.id === form.productId);
    const supplier = suppliers.find(s => s.id === product?.supplierId);
    
    const newStock: DailyStock = {
      id: generateId(),
      branchId: selectedBranch,
      date: selectedDate,
      supplierId: supplier?.id || '',
      supplierName: supplier?.name || '',
      productId: form.productId,
      productName: product?.name || '',
      qtyReceived: form.qtyReceived,
      qtySold: form.qtySold,
      qtyReturned: form.qtyReceived - form.qtySold,
    };
    onSave([...stock, newStock]);
    setForm({ productId: '', qtyReceived: 0, qtySold: 0 });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Stok & Retur Harian</h1>
          <p className="text-gray-500 text-sm">Catat titipan masuk, terjual, dan retur ke supplier</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 shadow-lg shadow-orange-200">
          <Plus size={18} /> Input Stok
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
          className="px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500 bg-white">
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500 bg-white" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2"><Package size={18} /><span className="text-sm font-medium">Diterima</span></div>
          <div className="text-2xl font-bold text-gray-900">{totals.received} <span className="text-sm text-gray-400">pcs</span></div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-2"><Check size={18} /><span className="text-sm font-medium">Terjual</span></div>
          <div className="text-2xl font-bold text-gray-900">{totals.sold} <span className="text-sm text-gray-400">pcs</span></div>
          <div className="text-xs text-green-600 mt-1">Revenue: {formatCurrency(totals.sold * 10000)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-orange-600 mb-2"><ArrowLeftRight size={18} /><span className="text-sm font-medium">Retur</span></div>
          <div className="text-2xl font-bold text-gray-900">{totals.returned} <span className="text-sm text-gray-400">pcs</span></div>
          <div className="text-xs text-gray-500 mt-1">Dikembalikan ke supplier</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 mb-2"><AlertTriangle size={18} /><span className="text-sm font-medium">Sell Rate</span></div>
          <div className={`text-2xl font-bold ${totals.sellRate >= 70 ? 'text-green-600' : totals.sellRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {totals.sellRate.toFixed(0)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className={`h-2 rounded-full ${totals.sellRate >= 70 ? 'bg-green-500' : totals.sellRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(totals.sellRate, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Produk</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium text-center">Diterima</th>
                <th className="px-4 py-3 font-medium text-center">Terjual</th>
                <th className="px-4 py-3 font-medium text-center">Retur</th>
                <th className="px-4 py-3 font-medium text-center">Sell Rate</th>
                <th className="px-4 py-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map(s => {
                const rate = s.qtyReceived > 0 ? (s.qtySold / s.qtyReceived * 100) : 0;
                return (
                  <tr key={s.id} className="border-t border-gray-50 hover:bg-orange-50/30">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.productName}</td>
                    <td className="px-4 py-3 text-gray-600">{s.supplierName}</td>
                    <td className="px-4 py-3 text-center">{s.qtyReceived}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{s.qtySold}</td>
                    <td className="px-4 py-3 text-center text-orange-600 font-medium">{s.qtyReturned}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        rate >= 70 ? 'bg-green-100 text-green-700' : rate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{rate.toFixed(0)}%</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(s.qtySold * 10000)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredStock.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Package size={40} className="mx-auto mb-2 opacity-30" />
            <p>Belum ada data stok untuk tanggal ini</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Input Stok Harian</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Produk</label>
                <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                  <option value="">Pilih produk</option>
                  {products.filter(p => p.branchId === selectedBranch).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Qty Diterima</label>
                  <input type="number" value={form.qtyReceived} onChange={e => setForm({ ...form, qtyReceived: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Qty Terjual</label>
                  <input type="number" value={form.qtySold} onChange={e => setForm({ ...form, qtySold: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-sm text-orange-700">
                Retur: <b>{Math.max(0, form.qtyReceived - form.qtySold)} pcs</b> akan dikembalikan ke supplier
              </div>
              <button onClick={handleSubmit}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 flex items-center justify-center gap-2">
                <Check size={18} /> Simpan Stok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
