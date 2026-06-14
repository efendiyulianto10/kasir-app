import React from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Users, Building2, AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import type { Branch, Transaction, Employee, Expense, Inventory } from '../types';

interface DashboardProps {
  branches: Branch[];
  transactions: Transaction[];
  employees: Employee[];
  expenses: Expense[];
  inventory: Inventory[];
}

export const Dashboard: React.FC<DashboardProps> = ({ branches, transactions, employees, expenses, inventory }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date.split('T')[0] === today && t.status === 'completed');
  const todaySales = todayTransactions.reduce((a, t) => a + t.total, 0);
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
  const totalSales = transactions.filter(t => t.status === 'completed').reduce((a, t) => a + t.total, 0);
  const lowStockItems = inventory.filter(i => i.quantity <= i.minStock);

  // Sales by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySales = transactions
      .filter(t => t.date.split('T')[0] === dateStr && t.status === 'completed')
      .reduce((a, t) => a + t.total, 0);
    return { day: d.toLocaleDateString('id-ID', { weekday: 'short' }), sales: daySales };
  });

  // Sales by branch
  const branchSales = branches.map(b => ({
    name: b.name.replace('SMP ', '').substring(0, 15),
    sales: transactions.filter(t => t.branchId === b.id && t.status === 'completed').reduce((a, t) => a + t.total, 0),
  }));

  // Payment method distribution
  const paymentData = [
    { name: 'Cash', value: transactions.filter(t => t.paymentMethod === 'cash').length, color: '#f97316' },
    { name: 'QRIS', value: transactions.filter(t => t.paymentMethod === 'qris').length, color: '#3b82f6' },
    { name: 'Transfer', value: transactions.filter(t => t.paymentMethod === 'transfer').length, color: '#10b981' },
  ];

  // Top selling items
  const itemSales: Record<string, number> = {};
  transactions.filter(t => t.status === 'completed').forEach(t => {
    t.items.forEach(item => {
      itemSales[item.menuItemName] = (itemSales[item.menuItemName] || 0) + item.quantity;
    });
  });
  const topItems = Object.entries(itemSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const formatCurrency = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

  const cards = [
    { title: 'Penjualan Hari Ini', value: formatCurrency(todaySales), icon: <DollarSign size={22} />, color: 'from-orange-500 to-amber-500', change: '+12%', up: true },
    { title: 'Total Transaksi', value: transactions.length.toString(), icon: <ShoppingCart size={22} />, color: 'from-blue-500 to-cyan-500', change: '+8%', up: true },
    { title: 'Jumlah Cabang', value: branches.filter(b => b.isActive).length.toString(), icon: <Building2 size={22} />, color: 'from-emerald-500 to-green-500', change: `${branches.length} total`, up: true },
    { title: 'Karyawan Aktif', value: employees.filter(e => e.isActive).length.toString(), icon: <Users size={22} />, color: 'from-purple-500 to-pink-500', change: `${employees.length} total`, up: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 hover:scale-[1.02] transition-transform">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {card.up ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                  <span className="text-xs text-emerald-400">{card.change}</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-400 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm font-semibold text-amber-400">Peringatan Stok Rendah!</p>
              <p className="text-xs text-slate-400 mt-1">
                {lowStockItems.map(i => i.itemName).join(', ')} perlu segera di-restock.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">📈 Tren Penjualan 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(value: unknown) => [formatCurrency(Number(value)), 'Penjualan']}
              />
              <Area type="monotone" dataKey="sales" stroke="#f97316" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Sales */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🏢 Penjualan per Cabang</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={branchSales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(value: unknown) => [formatCurrency(Number(value)), 'Penjualan']}
              />
              <Bar dataKey="sales" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Distribution */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">💳 Metode Pembayaran</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '12px', color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Selling Items */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🏆 Menu Terlaris</h3>
          <div className="space-y-3">
            {topItems.map(([name, qty], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-amber-500/20 text-amber-400' :
                  i === 1 ? 'bg-slate-400/20 text-slate-300' :
                  i === 2 ? 'bg-orange-700/20 text-orange-400' :
                  'bg-slate-700/20 text-slate-400'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{name}</p>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                    <div
                      className="gradient-orange rounded-full h-1.5 transition-all"
                      style={{ width: `${(qty / (topItems[0]?.[1] || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-slate-400">{qty} porsi</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">💰 Ringkasan Keuangan</h3>
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <p className="text-xs text-emerald-400">Total Pendapatan</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalSales)}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
              <p className="text-xs text-red-400">Total Pengeluaran</p>
              <p className="text-lg font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className={`p-3 rounded-xl border ${totalSales - totalExpenses >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <p className="text-xs text-blue-400">Laba Bersih</p>
              <p className={`text-lg font-bold ${totalSales - totalExpenses >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{formatCurrency(totalSales - totalExpenses)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">🕐 Transaksi Terakhir</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-2 text-xs text-slate-400 font-medium">ID</th>
                <th className="text-left py-2 text-xs text-slate-400 font-medium">Tanggal</th>
                <th className="text-left py-2 text-xs text-slate-400 font-medium">Pelanggan</th>
                <th className="text-left py-2 text-xs text-slate-400 font-medium">Items</th>
                <th className="text-right py-2 text-xs text-slate-400 font-medium">Total</th>
                <th className="text-center py-2 text-xs text-slate-400 font-medium">Bayar</th>
                <th className="text-center py-2 text-xs text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(-10).reverse().map(tx => (
                <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                  <td className="py-2 text-xs text-slate-400 font-mono">#{tx.id.slice(0, 8)}</td>
                  <td className="py-2 text-xs text-slate-300">{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                  <td className="py-2 text-xs text-white">{tx.customerName || '-'}</td>
                  <td className="py-2 text-xs text-slate-300">{tx.items.length} item</td>
                  <td className="py-2 text-xs text-orange-400 text-right font-semibold">{formatCurrency(tx.total)}</td>
                  <td className="py-2 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      tx.paymentMethod === 'cash' ? 'bg-emerald-500/10 text-emerald-400' :
                      tx.paymentMethod === 'qris' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-purple-500/10 text-purple-400'
                    }`}>{tx.paymentMethod.toUpperCase()}</span>
                  </td>
                  <td className="py-2 text-center">
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
    </div>
  );
};
