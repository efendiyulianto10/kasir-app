import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp,
  Users,
  DollarSign,
  Package,
  FileSpreadsheet,
  Send
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatsCard, ProgressBar } from '../components/ui/Stats';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { mockSupplierRankings } from '../data/mockData';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};



export const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('today');
  const [reportType, setReportType] = useState('sales');

  // Mock weekly data
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, 'dd/MM'),
      day: format(date, 'EEE', { locale: id }),
      revenue: Math.floor(Math.random() * 2000000) + 1500000,
      transactions: Math.floor(Math.random() * 100) + 150,
      items: Math.floor(Math.random() * 300) + 200,
    };
  });

  const paymentDistribution = [
    { name: 'Tunai', value: 65, color: '#22c55e' },
    { name: 'QRIS', value: 28, color: '#3b82f6' },
    { name: 'Transfer', value: 7, color: '#a855f7' },
  ];

  const categoryPerformance = [
    { category: 'Nasi', sold: 125, revenue: 1250000 },
    { category: 'Gorengan', sold: 98, revenue: 980000 },
    { category: 'Kue Basah', sold: 76, revenue: 760000 },
    { category: 'Bubur', sold: 54, revenue: 540000 },
    { category: 'Roti', sold: 42, revenue: 420000 },
  ];

  const totalWeeklyRevenue = weeklyData.reduce((sum, d) => sum + d.revenue, 0);
  const avgDailyRevenue = Math.round(totalWeeklyRevenue / 7);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Laporan & Analitik</h1>
          <p className="text-gray-500">Analisis performa bisnis SMP</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {['today', 'week', 'month'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range 
                    ? 'bg-white text-orange-500 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === 'today' ? 'Hari Ini' : range === 'week' ? 'Minggu' : 'Bulan'}
              </button>
            ))}
          </div>
          <Button variant="primary" leftIcon={<Download size={18} />}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Omset (7 Hari)"
          value={formatRupiah(totalWeeklyRevenue)}
          icon={<DollarSign size={24} />}
          variant="primary"
          change={12.5}
          trend="up"
        />
        <StatsCard
          title="Rata-rata Harian"
          value={formatRupiah(avgDailyRevenue)}
          icon={<TrendingUp size={24} />}
        />
        <StatsCard
          title="Total Transaksi"
          value={weeklyData.reduce((sum, d) => sum + d.transactions, 0).toLocaleString()}
          icon={<Package size={24} />}
        />
        <StatsCard
          title="Supplier Aktif"
          value={mockSupplierRankings.length.toString()}
          icon={<Users size={24} />}
        />
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'sales', label: 'Penjualan', icon: BarChart3 },
          { id: 'suppliers', label: 'Supplier', icon: Users },
          { id: 'payments', label: 'Pembayaran', icon: DollarSign },
          { id: 'products', label: 'Produk', icon: Package },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={reportType === tab.id ? 'primary' : 'outline'}
            leftIcon={<tab.icon size={18} />}
            onClick={() => setReportType(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">📈 Tren Omset 7 Hari Terakhir</h3>
              <Badge variant="success">+12.5% vs minggu lalu</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v/1000000}jt`} />
                <Tooltip formatter={(value) => [formatRupiah(Number(value)), 'Omset']} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Payment Distribution */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-lg">💳 Metode Pembayaran</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={paymentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ value }) => `${value}%`}
                >
                  {paymentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">🏷️ Performa per Kategori</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={(value) => [formatRupiah(Number(value)), 'Revenue']} />
              <Bar dataKey="revenue" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Supplier Ranking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">🏆 Top 5 Supplier</h3>
            <Button variant="ghost" size="sm">Lihat Semua</Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {mockSupplierRankings.slice(0, 5).map((supplier, index) => (
            <div key={supplier.supplier_id} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                index === 0 ? 'bg-yellow-500' : 
                index === 1 ? 'bg-gray-400' : 
                index === 2 ? 'bg-amber-600' : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{supplier.supplier_name}</span>
                  <span className="font-semibold text-orange-500">
                    {formatRupiah(supplier.revenue)}
                  </span>
                </div>
                <ProgressBar 
                  value={supplier.sell_through_rate} 
                  max={100}
                  size="sm"
                  variant={supplier.sell_through_rate >= 80 ? 'success' : 'warning'}
                  showValue={false}
                />
              </div>
              <span className="text-sm text-gray-500 w-16 text-right">
                {supplier.sell_through_rate}%
              </span>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Export Options */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">📤 Export & Kirim Laporan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-16" leftIcon={<FileSpreadsheet size={24} />}>
              <div className="text-left">
                <p className="font-semibold">Google Sheets</p>
                <p className="text-xs text-gray-500">Kirim ke spreadsheet</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-16" leftIcon={<Download size={24} />}>
              <div className="text-left">
                <p className="font-semibold">Download PDF</p>
                <p className="text-xs text-gray-500">Laporan lengkap</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-16" leftIcon={<Send size={24} />}>
              <div className="text-left">
                <p className="font-semibold">Kirim Telegram</p>
                <p className="text-xs text-gray-500">Ke grup owner</p>
              </div>
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
