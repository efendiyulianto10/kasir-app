import { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  Store, Users, ArrowUpRight, Target, Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Branch, DailyTransaction, Supplier, DemandTest } from '../types';
import { formatCurrency } from '../store';

interface DashboardProps {
  branches: Branch[];
  transactions: DailyTransaction[];
  suppliers: Supplier[];
  demandTests: DemandTest[];
}

export default function Dashboard({ branches, transactions, suppliers, demandTests }: DashboardProps) {
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTx = transactions.filter(t => t.date === today);
    const totalRevenue = todayTx.reduce((s, t) => s + t.totalAmount, 0);
    const totalProfit = todayTx.reduce((s, t) => s + t.totalProfit, 0);
    const totalItems = todayTx.reduce((s, t) => s + t.items.reduce((ss, i) => ss + i.qty, 0), 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayTx = transactions.filter(t => t.date === yesterdayStr);
    const yesterdayRevenue = yesterdayTx.reduce((s, t) => s + t.totalAmount, 0);

    const monthTx = transactions.filter(t => {
      const d = new Date(t.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthRevenue = monthTx.reduce((s, t) => s + t.totalAmount, 0);
    const monthProfit = monthTx.reduce((s, t) => s + t.totalProfit, 0);

    const growthPct = yesterdayRevenue > 0 ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;

    return {
      todayRevenue: totalRevenue,
      todayProfit: totalProfit,
      todayItems: totalItems,
      todayTransactions: todayTx.length,
      monthRevenue,
      monthProfit,
      growthPct,
      activeBranches: branches.filter(b => b.status === 'active').length,
      testingBranches: branches.filter(b => b.status === 'testing').length,
      totalSuppliers: suppliers.filter(s => s.status === 'active').length,
      graduatedTests: demandTests.filter(d => d.status === 'graduated').length,
    };
  }, [branches, transactions, suppliers, demandTests]);

  // Charts data
  const dailyData = useMemo(() => {
    const last7Days: { date: string; revenue: number; profit: number; items: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTx = transactions.filter(t => t.date === dateStr);
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      last7Days.push({
        date: dayNames[d.getDay()],
        revenue: dayTx.reduce((s, t) => s + t.totalAmount, 0),
        profit: dayTx.reduce((s, t) => s + t.totalProfit, 0),
        items: dayTx.reduce((s, t) => s + t.items.reduce((ss, i) => ss + i.qty, 0), 0),
      });
    }
    return last7Days;
  }, [transactions]);

  const paymentData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTx = transactions.filter(t => t.date === today);
    const methods: Record<string, number> = {};
    todayTx.forEach(t => {
      methods[t.paymentMethod] = (methods[t.paymentMethod] || 0) + t.totalAmount;
    });
    const labels: Record<string, string> = {
      cash: 'Tunai',
      qris: 'QRIS',
      shopeefood: 'ShopeeFood',
      gofood: 'GoFood',
    };
    return Object.entries(methods).map(([key, value]) => ({
      name: labels[key] || key,
      value,
    }));
  }, [transactions]);

  const branchPerformance = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const branchMap = new Map<string, { name: string; revenue: number; items: number }>();
    branches.forEach(b => branchMap.set(b.id, { name: b.name, revenue: 0, items: 0 }));
    transactions.filter(t => t.date === today).forEach(t => {
      const b = branchMap.get(t.branchId);
      if (b) {
        b.revenue += t.totalAmount;
        b.items += t.items.reduce((s, i) => s + i.qty, 0);
      }
    });
    return Array.from(branchMap.values())
      .filter(b => b.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [branches, transactions]);

  const COLORS = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Utama</h1>
          <p className="text-gray-500 text-sm mt-1">Overview bisnis SMP — Kelola dari macro level 🎯</p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl border border-orange-200">
          <Target size={18} className="text-orange-600" />
          <span className="text-sm font-medium text-orange-800">Target: 100 Cabang</span>
          <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">{branches.length}/100</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          icon={DollarSign} 
          label="Revenue Hari Ini" 
          value={formatCurrency(stats.todayRevenue)}
          change={stats.growthPct}
          color="orange"
        />
        <KPICard 
          icon={TrendingUp} 
          label="Profit Hari Ini (10%)" 
          value={formatCurrency(stats.todayProfit)}
          subtitle={`${stats.todayItems} porsi terjual`}
          color="green"
        />
        <KPICard 
          icon={DollarSign} 
          label="Revenue Bulan Ini" 
          value={formatCurrency(stats.monthRevenue)}
          subtitle={`Profit: ${formatCurrency(stats.monthProfit)}`}
          color="blue"
        />
        <KPICard 
          icon={ShoppingBag} 
          label="Transaksi Hari Ini" 
          value={stats.todayTransactions.toString()}
          subtitle={`${stats.activeBranches} cabang aktif`}
          color="purple"
        />
      </div>

      {/* Second row - Business Health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Store size={18} className="text-orange-500" />
            <span className="text-sm text-gray-600">Cabang</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{stats.activeBranches}</span>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">aktif</span>
          </div>
          <div className="text-xs text-yellow-600 mt-1">{stats.testingBranches} sedang testing</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-blue-500" />
            <span className="text-sm text-gray-600">Supplier</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalSuppliers}</div>
          <div className="text-xs text-gray-500 mt-1">supplier aktif</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-yellow-500" />
            <span className="text-sm text-gray-600">Demand Test</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.graduatedTests}</div>
          <div className="text-xs text-green-600 mt-1">lulus & konsisten</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-green-500" />
            <span className="text-sm text-gray-600">Avg Profit/Cabang</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.activeBranches > 0 ? formatCurrency(stats.todayProfit / stats.activeBranches) : 'Rp0'}
          </div>
          <div className="text-xs text-gray-500 mt-1">per hari ini</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">📈 Revenue & Profit 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${(v/1000)}K`} tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: unknown) => formatCurrency(Number(value))}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">💳 Metode Pembayaran</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {paymentData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: unknown) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {paymentData.map((item, i) => (
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

      {/* Branch Performance */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">🏆 Performa Cabang Hari Ini</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Cabang</th>
                <th className="pb-3 font-medium text-right">Porsi Terjual</th>
                <th className="pb-3 font-medium text-right">Revenue</th>
                <th className="pb-3 font-medium text-right">Profit (10%)</th>
              </tr>
            </thead>
            <tbody>
              {branchPerformance.map((b, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-orange-50/50 transition-colors">
                  <td className="py-3">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-400">{i + 1}</span>}
                  </td>
                  <td className="py-3 font-medium text-gray-900">{b.name}</td>
                  <td className="py-3 text-right">{b.items} pcs</td>
                  <td className="py-3 text-right text-orange-600 font-medium">{formatCurrency(b.revenue)}</td>
                  <td className="py-3 text-right text-green-600 font-medium">{formatCurrency(b.revenue * 0.1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demand Testing Overview */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">🧪 Status Demand Testing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {demandTests.map(dt => (
            <div key={dt.id} className={`p-4 rounded-xl border-2 ${
              dt.status === 'graduated' ? 'border-green-200 bg-green-50' :
              dt.status === 'consistent' ? 'border-blue-200 bg-blue-50' :
              dt.status === 'testing' ? 'border-yellow-200 bg-yellow-50' :
              'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 text-sm">{dt.branchName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  dt.status === 'graduated' ? 'bg-green-200 text-green-800' :
                  dt.status === 'consistent' ? 'bg-blue-200 text-blue-800' :
                  dt.status === 'testing' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {dt.status === 'graduated' ? '✅ Lulus' : 
                   dt.status === 'consistent' ? '📊 Konsisten' :
                   dt.status === 'testing' ? '🧪 Testing' : '⚠️ Inkonsisten'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Konsistensi: <b className="text-gray-900">{dt.consistency}%</b></span>
                <span>Avg: <b className="text-gray-900">{dt.avgDailySales} pcs/hari</b></span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className={`h-1.5 rounded-full ${
                    dt.consistency >= 80 ? 'bg-green-500' :
                    dt.consistency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${dt.consistency}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, change, subtitle, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: number;
  subtitle?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <ArrowUpRight size={14} /> : <TrendingDown size={14} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-lg font-bold text-gray-900 truncate">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{subtitle || label}</div>
    </div>
  );
}
