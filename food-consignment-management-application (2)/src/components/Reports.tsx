import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DailyTransaction, Branch, Supplier } from '../types';
import { formatCurrency } from '../store';
import { Download, Calendar, TrendingUp } from 'lucide-react';

interface Props {
  transactions: DailyTransaction[];
  branches: Branch[];
  suppliers: Supplier[];
}

export default function Reports({ transactions, branches, suppliers }: Props) {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  const filteredTx = useMemo(() => {
    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, 'all': 9999 };
    const cutoff = new Date(now.getTime() - daysMap[period] * 86400000);
    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, period]);

  const dailyRevenue = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; profit: number; count: number }>();
    filteredTx.forEach(t => {
      const existing = map.get(t.date) || { date: t.date, revenue: 0, profit: 0, count: 0 };
      existing.revenue += t.totalAmount;
      existing.profit += t.totalProfit;
      existing.count += 1;
      map.set(t.date, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTx]);

  const branchRevenue = useMemo(() => {
    const map = new Map<string, number>();
    filteredTx.forEach(t => {
      map.set(t.branchId, (map.get(t.branchId) || 0) + t.totalAmount);
    });
    return Array.from(map.entries())
      .map(([id, revenue]) => ({
        name: branches.find(b => b.id === id)?.name || id,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredTx, branches]);

  const supplierRevenue = useMemo(() => {
    const map = new Map<string, number>();
    filteredTx.forEach(t => {
      t.items.forEach(item => {
        map.set(item.supplierId, (map.get(item.supplierId) || 0) + item.subtotal);
      });
    });
    return Array.from(map.entries())
      .map(([id, revenue]) => ({
        name: suppliers.find(s => s.id === id)?.name || id,
        revenue,
        supplierEarning: revenue * 0.9,
        smpProfit: revenue * 0.1,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredTx, suppliers]);

  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredTx.forEach(t => {
      map.set(t.paymentMethod, (map.get(t.paymentMethod) || 0) + t.totalAmount);
    });
    const labels: Record<string, string> = { cash: 'Tunai', qris: 'QRIS', shopeefood: 'ShopeeFood', gofood: 'GoFood' };
    return Array.from(map.entries()).map(([key, value]) => ({ name: labels[key] || key, value }));
  }, [filteredTx]);

  const totalRevenue = filteredTx.reduce((s, t) => s + t.totalAmount, 0);
  const totalProfit = filteredTx.reduce((s, t) => s + t.totalProfit, 0);
  const totalItems = filteredTx.reduce((s, t) => s + t.items.reduce((ss, i) => ss + i.qty, 0), 0);
  const avgDaily = dailyRevenue.length > 0 ? totalRevenue / dailyRevenue.length : 0;

  const COLORS = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

  const exportReport = () => {
    const lines = [
      `LAPORAN SMP - Sarapan Murah Pagi`,
      `Periode: ${period === '7d' ? '7 Hari' : period === '30d' ? '30 Hari' : 'Semua'}`,
      `Generated: ${new Date().toLocaleString('id-ID')}`,
      '',
      `Total Revenue: ${formatCurrency(totalRevenue)}`,
      `Total Profit SMP (10%): ${formatCurrency(totalProfit)}`,
      `Total Porsi Terjual: ${totalItems}`,
      `Rata-rata Revenue/Hari: ${formatCurrency(avgDaily)}`,
      '',
      'PERFORMA PER CABANG:',
      ...branchRevenue.map((b, i) => `${i + 1}. ${b.name}: ${formatCurrency(b.revenue)}`),
      '',
      'TOP SUPPLIER:',
      ...supplierRevenue.map((s, i) => `${i + 1}. ${s.name}: Revenue ${formatCurrency(s.revenue)}, Profit SMP ${formatCurrency(s.smpProfit)}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-smp-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Laporan Bisnis</h1>
          <p className="text-gray-500 text-sm">Analisis performa dari macro level</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {[{ v: '7d', l: '7 Hari' }, { v: '30d', l: '30 Hari' }, { v: 'all', l: 'Semua' }].map(p => (
              <button key={p.v} onClick={() => setPeriod(p.v as typeof period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p.v ? 'bg-orange-600 text-white shadow' : 'text-gray-600'}`}>
                {p.l}
              </button>
            ))}
          </div>
          <button onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl p-5 shadow-lg">
          <div className="text-orange-100 text-sm">Total Revenue</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</div>
          <div className="text-orange-200 text-xs mt-1">{filteredTx.length} transaksi</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="text-green-100 text-sm">Total Profit (10%)</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(totalProfit)}</div>
          <div className="text-green-200 text-xs mt-1">{totalItems} porsi terjual</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="text-blue-100 text-sm">Avg Revenue/Hari</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(avgDaily)}</div>
          <div className="text-blue-200 text-xs mt-1">{dailyRevenue.length} hari data</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="text-purple-100 text-sm">Bayar ke Supplier</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue * 0.9)}</div>
          <div className="text-purple-200 text-xs mt-1">90% dari revenue</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} /> Tren Revenue & Profit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: unknown) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calendar size={18} /> Metode Pembayaran</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {paymentBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: unknown) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5">
            {paymentBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branch & Supplier Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">🏆 Revenue per Cabang</h3>
          <div className="space-y-2">
            {branchRevenue.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm w-6 text-gray-400">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{b.name}</span>
                    <span className="text-sm font-bold text-orange-600">{formatCurrency(b.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${branchRevenue[0] ? (b.revenue / branchRevenue[0].revenue * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">🧑‍🍳 Settlement Supplier</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Supplier</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                  <th className="pb-2 font-medium text-right">Dapat (90%)</th>
                  <th className="pb-2 font-medium text-right">SMP (10%)</th>
                </tr>
              </thead>
              <tbody>
                {supplierRevenue.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-900">{s.name}</td>
                    <td className="py-2 text-right">{formatCurrency(s.revenue)}</td>
                    <td className="py-2 text-right text-blue-600">{formatCurrency(s.supplierEarning)}</td>
                    <td className="py-2 text-right text-green-600 font-medium">{formatCurrency(s.smpProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
