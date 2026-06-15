import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { Download, Calendar, TrendingUp } from 'lucide-react';
import type { Transaction, Expense, Branch } from '../types';

interface Props {
  transactions: Transaction[];
  expenses: Expense[];
  branches: Branch[];
}

export const Reports: React.FC<Props> = ({ transactions, expenses, branches }) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Hitung semua data dengan useMemo agar konsisten
  const reportData = useMemo(() => {
    // Set tanggal hari ini ke awal hari (00:00:00)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Hitung start date berdasarkan periode
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 6); // 7 hari termasuk hari ini
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 29); // 30 hari termasuk hari ini
    } else {
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setDate(startDate.getDate() + 1); // 1 tahun termasuk hari ini
    }

    // Filter transaksi berdasarkan periode dan cabang
    const filteredTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      const inPeriod = txDate >= startDate && txDate <= today;
      const inBranch = selectedBranch === 'all' || t.branchId === selectedBranch;
      return t.status === 'completed' && inPeriod && inBranch;
    });

    // Filter pengeluaran berdasarkan periode dan cabang
    const filteredExpenses = expenses.filter(e => {
      const expDate = new Date(e.date);
      const inPeriod = expDate >= startDate && expDate <= today;
      const inBranch = selectedBranch === 'all' || e.branchId === selectedBranch;
      return inPeriod && inBranch;
    });

    // Hitung total penjualan
    const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    
    // Hitung total pengeluaran
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Hitung laba bersih
    const netProfit = totalSales - totalExpenses;
    
    // Hitung rata-rata transaksi
    const avgTransaction = filteredTransactions.length > 0 
      ? Math.round(totalSales / filteredTransactions.length) 
      : 0;

    // Generate chart data
    let chartData: Array<{ date: string; sales: number; expenses: number; profit: number }> = [];
    
    if (period === 'year') {
      // Data bulanan untuk 1 tahun (12 bulan)
      const monthlyMap: Record<string, { sales: number; expenses: number }> = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      
      // Buat slot untuk 12 bulan terakhir
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[key] = { sales: 0, expenses: 0 };
      }
      
      // Isi data transaksi
      filteredTransactions.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key]) {
          monthlyMap[key].sales += t.total;
        }
      });
      
      // Isi data pengeluaran
      filteredExpenses.forEach(e => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key]) {
          monthlyMap[key].expenses += e.amount;
        }
      });
      
      // Convert ke array untuk chart
      chartData = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, data]) => {
          const [year, month] = key.split('-');
          return {
            date: `${monthNames[parseInt(month) - 1]} '${year.slice(2)}`,
            sales: data.sales,
            expenses: data.expenses,
            profit: data.sales - data.expenses,
          };
        });
    } else {
      // Data harian untuk 7 atau 30 hari
      const days = period === 'week' ? 7 : 30;
      const dailyMap: Record<string, { sales: number; expenses: number }> = {};
      
      // Buat slot untuk setiap hari
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dailyMap[key] = { sales: 0, expenses: 0 };
      }
      
      // Isi data transaksi
      filteredTransactions.forEach(t => {
        const key = t.date.split('T')[0];
        if (dailyMap[key]) {
          dailyMap[key].sales += t.total;
        }
      });
      
      // Isi data pengeluaran
      filteredExpenses.forEach(e => {
        const key = e.date.split('T')[0];
        if (dailyMap[key]) {
          dailyMap[key].expenses += e.amount;
        }
      });
      
      // Convert ke array untuk chart
      chartData = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateKey, data]) => {
          const d = new Date(dateKey);
          return {
            date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
            sales: data.sales,
            expenses: data.expenses,
            profit: data.sales - data.expenses,
          };
        });
    }

    // Verifikasi: Total dari chart harus sama dengan total keseluruhan
    const chartTotalSales = chartData.reduce((sum, d) => sum + d.sales, 0);
    const chartTotalExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);

    // Kategori penjualan menu
    const menuSalesMap: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      t.items.forEach(item => {
        menuSalesMap[item.menuItemName] = (menuSalesMap[item.menuItemName] || 0) + item.subtotal;
      });
    });
    
    const menuSalesData = Object.entries(menuSalesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name: name.length > 12 ? name.slice(0, 12) + '...' : name,
        fullName: name,
        value,
        color: ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4'][i],
      }));

    // Performa per cabang (dengan filter periode yang sama)
    const branchPerformance = branches.map(branch => {
      const branchTx = filteredTransactions.filter(t => t.branchId === branch.id);
      const branchExp = filteredExpenses.filter(e => e.branchId === branch.id);
      
      const sales = branchTx.reduce((sum, t) => sum + t.total, 0);
      const exp = branchExp.reduce((sum, e) => sum + e.amount, 0);
      
      return {
        name: branch.name.replace('SMP ', '').replace('Cabang ', '').substring(0, 10),
        fullName: branch.name,
        sales,
        expenses: exp,
        profit: sales - exp,
        transactions: branchTx.length,
      };
    });

    return {
      startDate,
      endDate: today,
      filteredTransactions,
      filteredExpenses,
      totalSales,
      totalExpenses,
      netProfit,
      avgTransaction,
      chartData,
      chartTotalSales,
      chartTotalExpenses,
      menuSalesData,
      branchPerformance,
    };
  }, [transactions, expenses, branches, period, selectedBranch]);

  const formatCurrency = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
  
  const getPeriodLabel = () => {
    if (period === 'week') return '7 Hari Terakhir';
    if (period === 'month') return '30 Hari Terakhir';
    return '12 Bulan Terakhir';
  };

  const exportReport = () => {
    const { startDate, endDate, totalSales, totalExpenses, netProfit, avgTransaction, filteredTransactions, chartData, menuSalesData, branchPerformance } = reportData;
    
    const report = `LAPORAN BISNIS SMP - SARAPAN MURAH PAGI
=========================================
Periode: ${getPeriodLabel()}
Tanggal Export: ${new Date().toLocaleString('id-ID')}
Rentang: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}
Cabang: ${selectedBranch === 'all' ? 'Semua Cabang' : branches.find(b => b.id === selectedBranch)?.name || '-'}

RINGKASAN KEUANGAN
==================
Total Penjualan    : ${formatCurrency(totalSales)}
Total Pengeluaran  : ${formatCurrency(totalExpenses)}
Laba Bersih        : ${formatCurrency(netProfit)}
Rata-rata Transaksi: ${formatCurrency(avgTransaction)}
Jumlah Transaksi   : ${filteredTransactions.length}

PERFORMA CABANG
===============
${branchPerformance.map(b => `${b.fullName}:
  - Penjualan: ${formatCurrency(b.sales)}
  - Pengeluaran: ${formatCurrency(b.expenses)}
  - Profit: ${formatCurrency(b.profit)}
  - Transaksi: ${b.transactions}`).join('\n\n')}

MENU TERLARIS
=============
${menuSalesData.map((m, i) => `${i + 1}. ${m.fullName}: ${formatCurrency(m.value)}`).join('\n')}

DATA ${period === 'year' ? 'BULANAN' : 'HARIAN'}
${'='.repeat(period === 'year' ? 12 : 11)}
${chartData.map(d => `${d.date}: Penjualan ${formatCurrency(d.sales)}, Pengeluaran ${formatCurrency(d.expenses)}, Profit ${formatCurrency(d.profit)}`).join('\n')}

---
Digenerate oleh SMP Business Management System
`;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_smp_${period}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { 
    startDate, endDate, totalSales, totalExpenses, netProfit, avgTransaction, 
    filteredTransactions, chartData, chartTotalSales, chartTotalExpenses,
    menuSalesData, branchPerformance 
  } = reportData;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${period === p ? 'gradient-orange text-white shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              <Calendar size={12} className="inline mr-1" />
              {p === 'week' ? '7 Hari' : p === 'month' ? '30 Hari' : '1 Tahun'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="rounded-xl px-3 py-2 text-sm">
            <option value="all">Semua Cabang</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm hover:bg-emerald-500/20">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Period Info */}
      <div className="glass-card rounded-xl px-4 py-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-orange-400" />
          <span className="text-xs text-slate-400">
            Periode: <span className="text-white font-semibold">{getPeriodLabel()}</span>
          </span>
        </div>
        <div className="text-xs text-slate-500">
          ({startDate.toLocaleDateString('id-ID')} - {endDate.toLocaleDateString('id-ID')})
        </div>
        <div className="text-xs text-slate-500">
          • {filteredTransactions.length} transaksi ditemukan
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400 mb-1">Total Penjualan</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalSales)}</p>
          <p className="text-[10px] text-emerald-400/70 mt-1">
            <TrendingUp size={10} className="inline mr-1" />
            {filteredTransactions.length} transaksi
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400 mb-1">Total Pengeluaran</p>
          <p className="text-xl font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
          <p className="text-[10px] text-red-400/70 mt-1">
            {reportData.filteredExpenses.length} pengeluaran
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400 mb-1">Laba Bersih</p>
          <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {formatCurrency(netProfit)}
          </p>
          <p className={`text-[10px] mt-1 ${netProfit >= 0 ? 'text-blue-400/70' : 'text-red-400/70'}`}>
            {netProfit >= 0 ? '📈 Profit' : '📉 Rugi'}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400 mb-1">Rata-rata/Transaksi</p>
          <p className="text-xl font-bold text-orange-400">{formatCurrency(avgTransaction)}</p>
          <p className="text-[10px] text-orange-400/70 mt-1">per transaksi</p>
        </div>
      </div>

      {/* Verification Note - untuk debugging, bisa dihapus nanti */}
      {(chartTotalSales !== totalSales || chartTotalExpenses !== totalExpenses) && (
        <div className="glass-card rounded-xl px-4 py-2 border border-amber-500/30 text-xs text-amber-400">
          ⚠️ Debug: Chart Total Sales: {formatCurrency(chartTotalSales)} | Summary: {formatCurrency(totalSales)}
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Expenses Chart */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">📊 Penjualan vs Pengeluaran</h3>
              <p className="text-[10px] text-slate-500">
                {period === 'year' ? 'Per bulan' : 'Per hari'} • {chartData.length} data points
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: period === 'month' ? 40 : 10 }}>
              <defs>
                <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={9} 
                angle={period === 'month' ? -45 : 0} 
                textAnchor={period === 'month' ? 'end' : 'middle'}
                interval={period === 'month' ? 2 : 0}
              />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '12px', color: '#e2e8f0' }} 
                formatter={(value: unknown, name: unknown) => [formatCurrency(Number(value)), name === 'sales' ? 'Penjualan' : 'Pengeluaran']}
              />
              <Legend formatter={(value) => value === 'sales' ? 'Penjualan' : 'Pengeluaran'} />
              <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gradSales)" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#gradExp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Performance Chart */}
        <div className="glass-card rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">🏢 Performa Cabang</h3>
            <p className="text-[10px] text-slate-500">{getPeriodLabel()}</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={branchPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(value: unknown, name: unknown) => [formatCurrency(Number(value)), name === 'sales' ? 'Penjualan' : 'Pengeluaran']}
              />
              <Legend formatter={(value) => value === 'sales' ? 'Penjualan' : 'Pengeluaran'} />
              <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Menu Sales Pie Chart */}
        <div className="glass-card rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">🍽️ Pendapatan per Menu</h3>
            <p className="text-[10px] text-slate-500">{getPeriodLabel()} • Top 6 menu</p>
          </div>
          {menuSalesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={menuSalesData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={55} 
                  outerRadius={90} 
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                >
                  {menuSalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '12px', color: '#e2e8f0' }}
                  formatter={(value: unknown) => [formatCurrency(Number(value)), 'Pendapatan']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm">
              Tidak ada data transaksi pada periode ini
            </div>
          )}
        </div>

        {/* Profit Chart */}
        <div className="glass-card rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">📈 Margin Profit {period === 'year' ? 'Bulanan' : 'Harian'}</h3>
            <p className="text-[10px] text-slate-500">{getPeriodLabel()}</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: period === 'month' ? 40 : 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={9}
                angle={period === 'month' ? -45 : 0} 
                textAnchor={period === 'month' ? 'end' : 'middle'}
                interval={period === 'month' ? 2 : 0}
              />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(value: unknown) => [formatCurrency(Number(value)), 'Profit']}
              />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Table for Year View */}
      {period === 'year' && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">📅 Ringkasan Bulanan</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left p-3 text-xs text-slate-400 font-medium">Bulan</th>
                  <th className="text-right p-3 text-xs text-slate-400 font-medium">Penjualan</th>
                  <th className="text-right p-3 text-xs text-slate-400 font-medium">Pengeluaran</th>
                  <th className="text-right p-3 text-xs text-slate-400 font-medium">Profit</th>
                  <th className="text-center p-3 text-xs text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                    <td className="p-3 text-xs text-white font-medium">{row.date}</td>
                    <td className="p-3 text-xs text-emerald-400 text-right font-mono">{formatCurrency(row.sales)}</td>
                    <td className="p-3 text-xs text-red-400 text-right font-mono">{formatCurrency(row.expenses)}</td>
                    <td className={`p-3 text-xs text-right font-mono font-semibold ${row.profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="p-3 text-center">
                      {row.sales === 0 && row.expenses === 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400">- Kosong -</span>
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${row.profit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {row.profit >= 0 ? '✓ Untung' : '✗ Rugi'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-orange-500/30 bg-orange-500/5">
                  <td className="p-3 text-xs text-orange-400 font-bold">TOTAL</td>
                  <td className="p-3 text-xs text-emerald-400 text-right font-mono font-bold">{formatCurrency(totalSales)}</td>
                  <td className="p-3 text-xs text-red-400 text-right font-mono font-bold">{formatCurrency(totalExpenses)}</td>
                  <td className={`p-3 text-xs text-right font-mono font-bold ${netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {formatCurrency(netProfit)}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {netProfit >= 0 ? '📈 Total Untung' : '📉 Total Rugi'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Branch Performance Table */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">🏢 Detail Performa Cabang ({getPeriodLabel()})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left p-3 text-xs text-slate-400 font-medium">Cabang</th>
                <th className="text-center p-3 text-xs text-slate-400 font-medium">Transaksi</th>
                <th className="text-right p-3 text-xs text-slate-400 font-medium">Penjualan</th>
                <th className="text-right p-3 text-xs text-slate-400 font-medium">Pengeluaran</th>
                <th className="text-right p-3 text-xs text-slate-400 font-medium">Profit</th>
                <th className="text-center p-3 text-xs text-slate-400 font-medium">Kontribusi</th>
              </tr>
            </thead>
            <tbody>
              {branchPerformance.map((branch, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                  <td className="p-3 text-xs text-white font-medium">{branch.fullName}</td>
                  <td className="p-3 text-xs text-slate-300 text-center">{branch.transactions}</td>
                  <td className="p-3 text-xs text-emerald-400 text-right font-mono">{formatCurrency(branch.sales)}</td>
                  <td className="p-3 text-xs text-red-400 text-right font-mono">{formatCurrency(branch.expenses)}</td>
                  <td className={`p-3 text-xs text-right font-mono font-semibold ${branch.profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {formatCurrency(branch.profit)}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5">
                        <div 
                          className="gradient-orange rounded-full h-1.5" 
                          style={{ width: `${totalSales > 0 ? (branch.sales / totalSales) * 100 : 0}%` }} 
                        />
                      </div>
                      <span className="text-[10px] text-orange-400">
                        {totalSales > 0 ? ((branch.sales / totalSales) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
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
