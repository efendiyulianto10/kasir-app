import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Clock,
  Download,
  QrCode,
  Calendar,
  CheckCircle,
  AlertCircle,
  History,
  Bell
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatsCard } from '../components/ui/Stats';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { mockProducts, mockSuppliers } from '../data/mockData';
import { QRCodeSVG } from 'qrcode.react';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export const SupplierPortal: React.FC = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedProductQR, setSelectedProductQR] = useState<string | null>(null);

  // Mock data - in real app, this would come from auth context
  const supplier = mockSuppliers[0];
  const products = mockProducts.filter(p => p.supplier_id === supplier.id);

  // Mock daily earnings data
  const earningsHistory = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return {
      date: format(date, 'dd/MM'),
      earnings: Math.floor(Math.random() * 200000) + 100000,
      items: Math.floor(Math.random() * 30) + 10,
    };
  });

  // Today's stats
  const todayStats = {
    stockIn: 52,
    sold: 42,
    remaining: 10,
    earnings: 378000,
    sellThrough: 80.8,
  };

  // Payment history
  const paymentHistory = [
    { date: '2025-01-15', items: 45, amount: 405000, status: 'paid' },
    { date: '2025-01-14', items: 38, amount: 342000, status: 'paid' },
    { date: '2025-01-13', items: 52, amount: 468000, status: 'paid' },
    { date: '2025-01-12', items: 41, amount: 369000, status: 'paid' },
    { date: '2025-01-11', items: 35, amount: 315000, status: 'paid' },
  ];

  const totalEarnings30Days = earningsHistory.reduce((sum, d) => sum + d.earnings, 0);

  const handleShowQR = (qrCode: string) => {
    setSelectedProductQR(qrCode);
    setShowQRModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-2xl">
                🍳
              </div>
              <div>
                <h1 className="text-2xl font-bold">Portal Supplier</h1>
                <p className="text-orange-100">SMP - Sarapan Murah Pagi</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-100">Selamat datang,</p>
              <p className="font-semibold text-lg">{supplier.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Today's Summary */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-orange-100">Hari Ini</h2>
              <p className="text-sm text-orange-200">{format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}</p>
            </div>
            <Badge variant="success" className="bg-white/20 text-white border-none">
              <Clock size={14} className="mr-1" /> Live
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-orange-100 text-sm">Stok Masuk</p>
              <p className="text-3xl font-bold">{todayStats.stockIn}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-orange-100 text-sm">Terjual</p>
              <p className="text-3xl font-bold text-green-300">{todayStats.sold}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-orange-100 text-sm">Sisa</p>
              <p className="text-3xl font-bold text-yellow-300">{todayStats.remaining}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-orange-100 text-sm">Estimasi Penghasilan</p>
              <p className="text-2xl font-bold">{formatRupiah(todayStats.earnings)}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-orange-100">Sell-through Rate</span>
              <span className="font-semibold">{todayStats.sellThrough}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div 
                className="bg-white rounded-full h-3 transition-all"
                style={{ width: `${todayStats.sellThrough}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total 30 Hari"
            value={formatRupiah(totalEarnings30Days)}
            icon={<DollarSign size={24} />}
            change={12.5}
            trend="up"
          />
          <StatsCard
            title="Rata-rata Sell-through"
            value={`${supplier.avg_sell_through_rate}%`}
            icon={<TrendingUp size={24} />}
            variant={supplier.avg_sell_through_rate >= 80 ? 'success' : 'warning'}
          />
          <StatsCard
            title="Rating"
            value={`${supplier.rating.toFixed(1)} ⭐`}
            icon={<CheckCircle size={24} />}
          />
        </div>

        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-lg">📈 Penghasilan 30 Hari Terakhir</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={earningsHistory}>
                <defs>
                  <linearGradient id="colorEarn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip formatter={(value) => [formatRupiah(Number(value)), 'Penghasilan']} />
                <Area 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  fill="url(#colorEarn)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Products with QR */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">🍱 Produk Saya</h3>
              <Button variant="outline" size="sm" leftIcon={<Download size={16} />}>
                Download Semua QR
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {products.map(product => (
                <div key={product.id} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                  <img 
                    src={product.photo_url} 
                    alt={product.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{product.name}</h4>
                    <p className="text-sm text-gray-500">{product.category}</p>
                    <p className="text-sm text-orange-500 font-semibold mt-1">
                      {formatRupiah(9000)}/pcs
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleShowQR(product.qr_code)}
                  >
                    <QrCode size={18} />
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">💰 Riwayat Pembayaran</h3>
              <Button variant="ghost" size="sm" leftIcon={<History size={16} />}>
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header>Tanggal</TableCell>
                  <TableCell header className="text-center">Item Terjual</TableCell>
                  <TableCell header className="text-right">Jumlah</TableCell>
                  <TableCell header className="text-center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentHistory.map((payment, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {format(new Date(payment.date), 'dd MMM yyyy', { locale: id })}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-gray-100 px-2 py-1 rounded-full text-sm">
                        {payment.items} pcs
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatRupiah(payment.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="success" size="sm">
                        <CheckCircle size={12} className="mr-1" /> Dibayar
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Bell size={20} /> Notifikasi
            </h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
              <CheckCircle className="text-green-500 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-green-800">Pembayaran Diterima</p>
                <p className="text-sm text-green-700">
                  Pembayaran Rp 405.000 untuk tanggal 15 Jan telah ditransfer ke rekening Anda.
                </p>
                <p className="text-xs text-green-600 mt-1">2 jam yang lalu</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl">
              <AlertCircle className="text-yellow-500 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-yellow-800">Stok Menipis</p>
                <p className="text-sm text-yellow-700">
                  Produk "Nasi Uduk Komplit" tersisa 3 pcs. Segera restock!
                </p>
                <p className="text-xs text-yellow-600 mt-1">30 menit yang lalu</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </main>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="QR Code Produk"
        size="sm"
      >
        {selectedProductQR && (
          <div className="text-center space-y-4">
            <div className="bg-white p-6 rounded-xl inline-block shadow-inner border-2 border-dashed border-gray-200">
              <QRCodeSVG 
                value={selectedProductQR} 
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <p className="font-mono text-sm text-gray-500">{selectedProductQR}</p>
            <p className="text-sm text-gray-500">
              Cetak dan tempelkan QR Code ini pada kemasan produk Anda
            </p>
            <Button variant="primary" className="w-full" leftIcon={<Download size={18} />}>
              Download QR Code
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
