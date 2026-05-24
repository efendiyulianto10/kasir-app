import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { StatsCard } from '../components/ui/Stats';
import { mockTransactions } from '../data/mockData';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Transaction, PaymentMethod } from '../types';

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const getPaymentIcon = (method: PaymentMethod) => {
  switch (method) {
    case 'cash': return <Banknote size={16} className="text-green-500" />;
    case 'qris': return <QrCode size={16} className="text-blue-500" />;
    case 'transfer': return <CreditCard size={16} className="text-purple-500" />;
  }
};

const getPaymentBadge = (method: PaymentMethod) => {
  const variants: Record<PaymentMethod, 'success' | 'info' | 'default'> = {
    cash: 'success',
    qris: 'info',
    transfer: 'default',
  };
  return (
    <Badge variant={variants[method]} size="sm">
      {getPaymentIcon(method)}
      <span className="ml-1 uppercase">{method}</span>
    </Badge>
  );
};

export const Transactions: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredTransactions = mockTransactions.filter(t => {
    const matchesSearch = t.transaction_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = t.date === dateFilter;
    const matchesPayment = paymentFilter === 'all' || t.payment_method === paymentFilter;
    return matchesSearch && matchesDate && matchesPayment;
  });

  // Stats
  const todayStats = {
    total: filteredTransactions.length,
    revenue: filteredTransactions.reduce((sum, t) => sum + t.total_amount, 0),
    cash: filteredTransactions.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + t.total_amount, 0),
    qris: filteredTransactions.filter(t => t.payment_method === 'qris').reduce((sum, t) => sum + t.total_amount, 0),
    transfer: filteredTransactions.filter(t => t.payment_method === 'transfer').reduce((sum, t) => sum + t.total_amount, 0),
    items: filteredTransactions.reduce((sum, t) => sum + t.total_items, 0),
  };

  const handleViewDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Riwayat Transaksi</h1>
          <p className="text-gray-500">
            {format(new Date(dateFilter), "EEEE, dd MMMM yyyy", { locale: id })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<Download size={18} />}>
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Transaksi"
          value={todayStats.total.toString()}
          icon={<FileText size={24} />}
        />
        <StatsCard
          title="Total Omset"
          value={formatRupiah(todayStats.revenue)}
          icon={<Banknote size={24} />}
          variant="primary"
        />
        <StatsCard
          title="Tunai"
          value={formatRupiah(todayStats.cash)}
          icon={<Banknote size={24} />}
          variant="success"
        />
        <StatsCard
          title="QRIS"
          value={formatRupiah(todayStats.qris)}
          icon={<QrCode size={24} />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cari nomor transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              leftIcon={<Calendar size={18} />}
              className="w-48"
            />
            <div className="flex gap-2">
              {['all', 'cash', 'qris', 'transfer'].map(method => (
                <Button
                  key={method}
                  variant={paymentFilter === method ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentFilter(method)}
                >
                  {method === 'all' ? 'Semua' : method.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell header>No. Transaksi</TableCell>
                <TableCell header>Waktu</TableCell>
                <TableCell header className="text-center">Item</TableCell>
                <TableCell header>Pembayaran</TableCell>
                <TableCell header className="text-right">Total</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header className="text-center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.map(transaction => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <span className="font-mono font-medium text-orange-600">
                      {transaction.transaction_number}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={14} />
                      {transaction.time.slice(0, 5)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-sm font-medium">
                      {transaction.total_items}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getPaymentBadge(transaction.payment_method)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatRupiah(transaction.total_amount)}
                  </TableCell>
                  <TableCell>
                    {transaction.status === 'completed' ? (
                      <Badge variant="success" size="sm">
                        <CheckCircle size={12} className="mr-1" /> Selesai
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        <XCircle size={12} className="mr-1" /> Void
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDetail(transaction)}
                    >
                      <Eye size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText size={48} className="mb-2" />
              <p>Tidak ada transaksi ditemukan</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detail Transaksi"
        size="md"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-gray-100">
              <h3 className="font-mono text-xl font-bold text-orange-500">
                {selectedTransaction.transaction_number}
              </h3>
              <p className="text-gray-500 flex items-center justify-center gap-2 mt-1">
                <Calendar size={14} />
                {format(new Date(selectedTransaction.date), 'dd MMM yyyy', { locale: id })}
                <Clock size={14} className="ml-2" />
                {selectedTransaction.time.slice(0, 5)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Jumlah Item</p>
                <p className="text-2xl font-bold">{selectedTransaction.total_items}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Metode Pembayaran</p>
                <p className="text-lg font-semibold uppercase">{selectedTransaction.payment_method}</p>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-sm text-orange-600">Total Pembayaran</p>
              <p className="text-3xl font-bold text-orange-500">
                {formatRupiah(selectedTransaction.total_amount)}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Kasir</span>
                <span className="font-medium">Budi Kasir</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Status Sync</span>
                <span className="font-medium">
                  {selectedTransaction.synced_at ? (
                    <Badge variant="success" size="sm">Synced</Badge>
                  ) : (
                    <Badge variant="warning" size="sm">Pending</Badge>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Share Supplier (90%)</span>
                <span className="font-medium text-green-600">
                  {formatRupiah(selectedTransaction.total_amount * 0.9)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Share SMP (10%)</span>
                <span className="font-medium text-orange-600">
                  {formatRupiah(selectedTransaction.total_amount * 0.1)}
                </span>
              </div>
            </div>

            <Button variant="outline" className="w-full" leftIcon={<Download size={18} />}>
              Print Struk
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
