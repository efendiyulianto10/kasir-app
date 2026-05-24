import React, { useState } from 'react';
import { 
  Map, 
  TrendingUp, 
  TrendingDown,
  Building2,
  DollarSign,
  Users,
  ShoppingBag,
  Target,
  AlertTriangle,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatsCard, ProgressBar } from '../components/ui/Stats';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { 
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts';
import { mockBranchPerformances, mockNationalKPI, mockAlerts } from '../data/mockData';

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatShortRupiah = (value: number) => {
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)}jt`;
  }
  return formatRupiah(value);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'bg-green-500';
    case 'good': return 'bg-blue-500';
    case 'warning': return 'bg-yellow-500';
    case 'critical': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'excellent': return <Badge variant="success">Excellent</Badge>;
    case 'good': return <Badge variant="info">Good</Badge>;
    case 'warning': return <Badge variant="warning">Warning</Badge>;
    case 'critical': return <Badge variant="danger">Critical</Badge>;
    default: return <Badge>{status}</Badge>;
  }
};

export const Branches: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');

  const { total_branches, active_branches, total_revenue, avg_revenue_per_branch, 
          total_transactions, total_suppliers, total_items_sold, best_branch, worst_branch } = mockNationalKPI;

  const sortedBranches = [...mockBranchPerformances].sort((a, b) => 
    b.achievement_rate - a.achievement_rate
  );

  const criticalAlerts = mockAlerts.filter(a => a.type === 'critical' && !a.is_resolved);

  // Chart data
  const branchChartData = mockBranchPerformances.map(b => ({
    name: b.branch_code,
    revenue: b.today_revenue,
    target: b.today_target,
    achievement: b.achievement_rate,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🗺️ HQ Dashboard - Multi Cabang</h1>
          <p className="text-gray-500">
            Monitoring performa {active_branches} cabang aktif secara real-time
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button 
            variant={viewMode === 'map' ? 'primary' : 'outline'}
            onClick={() => setViewMode('map')}
          >
            Map View
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div className="flex-1">
              <p className="font-semibold text-red-800">
                {criticalAlerts.length} Peringatan Kritis
              </p>
              <p className="text-sm text-red-700">
                {criticalAlerts[0]?.message}
              </p>
            </div>
            <Button variant="danger" size="sm">Lihat Semua</Button>
          </div>
        </div>
      )}

      {/* National KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Total Omset Nasional"
          value={formatShortRupiah(total_revenue)}
          icon={<DollarSign size={24} />}
          variant="primary"
        />
        <StatsCard
          title="Rata-rata/Cabang"
          value={formatShortRupiah(avg_revenue_per_branch)}
          icon={<Building2 size={24} />}
        />
        <StatsCard
          title="Total Transaksi"
          value={total_transactions.toLocaleString()}
          icon={<ShoppingBag size={24} />}
        />
        <StatsCard
          title="Item Terjual"
          value={total_items_sold.toLocaleString()}
          icon={<Target size={24} />}
        />
        <StatsCard
          title="Cabang Aktif"
          value={`${active_branches}/${total_branches}`}
          icon={<Building2 size={24} />}
          variant="success"
        />
        <StatsCard
          title="Total Supplier"
          value={total_suppliers.toLocaleString()}
          icon={<Users size={24} />}
        />
      </div>

      {/* Best & Worst Branch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">🏆 Cabang Terbaik</p>
                <h3 className="text-xl font-bold text-green-800">{best_branch.branch_name}</h3>
                <p className="text-sm text-green-700">{best_branch.city}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">{best_branch.achievement_rate}%</p>
                <p className="text-sm text-green-700">{formatRupiah(best_branch.today_revenue)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-2 border-red-200 bg-red-50">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">⚠️ Perlu Perhatian</p>
                <h3 className="text-xl font-bold text-red-800">{worst_branch.branch_name}</h3>
                <p className="text-sm text-red-700">{worst_branch.city}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-red-600">{worst_branch.achievement_rate}%</p>
                <p className="text-sm text-red-700">{formatRupiah(worst_branch.today_revenue)}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Branch Performance Chart */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">Perbandingan Performa Cabang</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={branchChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v/1000000}jt`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} unit="%" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'revenue' || name === 'target') {
                    return [formatRupiah(Number(value)), name === 'revenue' ? 'Omset' : 'Target'];
                  }
                  return [value + '%', 'Achievement'];
                }}
              />
              <Bar yAxisId="left" dataKey="target" fill="#e5e7eb" name="target" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="revenue" fill="#f97316" name="revenue" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="achievement" stroke="#22c55e" strokeWidth={3} dot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {viewMode === 'map' ? (
        /* Map View Placeholder */
        <Card>
          <CardBody className="p-0">
            <div className="h-[500px] bg-gradient-to-br from-blue-100 to-green-100 rounded-xl relative overflow-hidden">
              {/* Map placeholder with branch markers */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Map size={64} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Peta Indonesia Interaktif</p>
                  <p className="text-sm">Integrasi dengan Mapbox GL</p>
                </div>
              </div>
              
              {/* Branch markers overlay */}
              {mockBranchPerformances.map((branch, i) => (
                <div 
                  key={branch.branch_id}
                  className="absolute cursor-pointer group"
                  style={{ 
                    left: `${20 + (i * 15)}%`, 
                    top: `${30 + (i % 3) * 20}%` 
                  }}
                >
                  <div className={`w-6 h-6 rounded-full ${getStatusColor(branch.status)} shadow-lg animate-pulse`} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                      <p className="font-semibold">{branch.branch_name}</p>
                      <p>{formatRupiah(branch.today_revenue)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Ranking Cabang Hari Ini</h3>
              <Button variant="outline" size="sm" leftIcon={<Filter size={16} />}>
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header className="w-12">#</TableCell>
                  <TableCell header>Cabang</TableCell>
                  <TableCell header>Kota</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header className="text-right">Omset</TableCell>
                  <TableCell header className="text-right">Target</TableCell>
                  <TableCell header className="text-center">Progress</TableCell>
                  <TableCell header className="text-center">Transaksi</TableCell>
                  <TableCell header>{''}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedBranches.map((branch, index) => (
                  <TableRow 
                    key={branch.branch_id}
                    onClick={() => setSelectedBranch(branch.branch_id)}
                    className={selectedBranch === branch.branch_id ? 'bg-orange-50' : ''}
                  >
                    <TableCell>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-amber-600' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{branch.branch_name}</p>
                        <p className="text-xs text-gray-500">{branch.branch_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{branch.city}</TableCell>
                    <TableCell>{getStatusBadge(branch.status)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatRupiah(branch.today_revenue)}
                    </TableCell>
                    <TableCell className="text-right text-gray-500">
                      {formatRupiah(branch.today_target)}
                    </TableCell>
                    <TableCell>
                      <div className="w-32">
                        <ProgressBar 
                          value={branch.achievement_rate} 
                          max={100}
                          variant={branch.status === 'excellent' ? 'success' : 
                                   branch.status === 'good' ? 'default' : 
                                   branch.status === 'warning' ? 'warning' : 'danger'}
                          size="sm"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {branch.achievement_rate > 80 ? (
                          <TrendingUp size={14} className="text-green-500" />
                        ) : (
                          <TrendingDown size={14} className="text-red-500" />
                        )}
                        {branch.transactions_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <ChevronRight size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
