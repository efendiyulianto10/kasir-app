import React, { useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { StatsCard, ProgressBar } from '../components/ui/Stats';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useAuthStore, useDashboardStore, useTransactionStore } from '../store';
import { 
  mockHourlyRevenue, 
  mockSupplierRankings, 
  mockAlerts
} from '../data/mockData';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

export const Dashboard: React.FC = () => {
  const { user, branch } = useAuthStore();
  const { 
    alerts,
    setHourlyRevenue,
    setSupplierRankings,
    setAlerts 
  } = useDashboardStore();
  const { getTodayRevenue, getTodayTransactions } = useTransactionStore();

  useEffect(() => {
    // Load mock data
    setHourlyRevenue(mockHourlyRevenue);
    setSupplierRankings(mockSupplierRankings);
    setAlerts(mockAlerts);
  }, []);

  const todayRevenue = getTodayRevenue() || 2450000;
  const todayTransactions = getTodayTransactions().length || 245;
  const dailyTarget = branch?.daily_target || 3000000;
  const achievementRate = (todayRevenue / dailyTarget) * 100;

  const totalItemsSold = mockHourlyRevenue.reduce((sum, h) => sum + h.transactions, 0);
  const activeSuppliers = mockSupplierRankings.length;
  const unresolvedAlerts = alerts.filter(a => !a.is_resolved);

  // Category distribution data
  const categoryData = [
    { name: 'Nasi', value: 35 },
    { name: 'Gorengan', value: 28 },
    { name: 'Kue Basah', value: 18 },
    { name: 'Bubur', value: 12 },
    { name: 'Lainnya', value: 7 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Selamat Pagi, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-500">
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })} • {branch?.name || 'SMP Cibubur'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={achievementRate >= 100 ? 'success' : achievementRate >= 75 ? 'warning' : 'danger'} size="lg">
            {achievementRate.toFixed(0)}% Target
          </Badge>
          <Button variant="primary" leftIcon={<Target size={18} />}>
            Lihat Detail
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Omset Hari Ini"
          value={formatRupiah(todayRevenue)}
          subtitle={`Target: ${formatRupiah(dailyTarget)}`}
          change={12.5}
          trend="up"
          icon={<DollarSign size={24} />}
          variant="primary"
        />
        <StatsCard
          title="Total Transaksi"
          value={todayTransactions.toString()}
          subtitle="transaksi hari ini"
          change={8.2}
          trend="up"
          icon={<ShoppingBag size={24} />}
        />
        <StatsCard
          title="Item Terjual"
          value={totalItemsSold.toString()}
          subtitle={`${(totalItemsSold / 10).toFixed(0)} rata-rata/jam`}
          icon={<TrendingUp size={24} />}
        />
        <StatsCard
          title="Supplier Aktif"
          value={activeSuppliers.toString()}
          subtitle="supplier hari ini"
          icon={<Users size={24} />}
        />
      </div>

      {/* Progress to Target */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Progress Target Harian</h3>
              <p className="text-sm text-gray-500">
                {formatRupiah(todayRevenue)} dari {formatRupiah(dailyTarget)}
              </p>
            </div>
            <div className={`text-2xl font-bold ${achievementRate >= 100 ? 'text-green-600' : 'text-orange-500'}`}>
              {achievementRate.toFixed(1)}%
            </div>
          </div>
          <ProgressBar 
            value={todayRevenue} 
            max={dailyTarget}
            variant={achievementRate >= 100 ? 'success' : achievementRate >= 75 ? 'warning' : 'danger'}
            size="lg"
            showValue={false}
          />
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </CardBody>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Omset per Jam</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockHourlyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  formatter={(value) => [formatRupiah(Number(value)), 'Omset']}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Kategori Terlaris</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categoryData.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span>{cat.name}</span>
                  </div>
                  <span className="font-medium">{cat.value}%</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">🏆 Top Supplier Hari Ini</h3>
              <Button variant="ghost" size="sm">Lihat Semua</Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {mockSupplierRankings.slice(0, 5).map((supplier, index) => (
                <div key={supplier.supplier_id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{supplier.supplier_name}</p>
                    <p className="text-sm text-gray-500">{supplier.items_sold} item terjual</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatRupiah(supplier.revenue)}</p>
                    <p className="text-xs text-green-600">{supplier.sell_through_rate}% sell-through</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">⚠️ Peringatan & Alert</h3>
              <Badge variant={unresolvedAlerts.length > 0 ? 'danger' : 'success'}>
                {unresolvedAlerts.length} aktif
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {unresolvedAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CheckCircle size={48} className="mb-2 text-green-500" />
                <p>Tidak ada peringatan aktif</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {unresolvedAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50">
                    <div className={`p-2 rounded-lg ${
                      alert.type === 'critical' ? 'bg-red-100 text-red-600' :
                      alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        <Clock size={12} className="inline mr-1" />
                        {format(new Date(alert.created_at), 'HH:mm')}
                      </p>
                    </div>
                    <Badge 
                      variant={alert.type === 'critical' ? 'danger' : alert.type === 'warning' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {alert.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
