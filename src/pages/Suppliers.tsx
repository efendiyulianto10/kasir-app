import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock,
  Star,
  Phone,
  Mail,
  MapPin,
  Eye,
  Download
} from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { StatsCard, ProgressBar } from '../components/ui/Stats';
import { mockSuppliers, mockProducts } from '../data/mockData';
import { QRCodeSVG } from 'qrcode.react';
import type { Supplier } from '../types';

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const getStatusBadge = (status: Supplier['status']) => {
  switch (status) {
    case 'approved':
      return <Badge variant="success"><CheckCircle size={12} className="mr-1" /> Aktif</Badge>;
    case 'pending':
      return <Badge variant="warning"><Clock size={12} className="mr-1" /> Pending</Badge>;
    case 'suspended':
      return <Badge variant="danger"><XCircle size={12} className="mr-1" /> Suspended</Badge>;
    case 'rejected':
      return <Badge variant="danger"><XCircle size={12} className="mr-1" /> Ditolak</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

export const Suppliers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const filteredSuppliers = mockSuppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const supplierStats = {
    total: mockSuppliers.length,
    approved: mockSuppliers.filter(s => s.status === 'approved').length,
    pending: mockSuppliers.filter(s => s.status === 'pending').length,
    avgRating: (mockSuppliers.reduce((sum, s) => sum + s.rating, 0) / mockSuppliers.length).toFixed(1),
  };

  const supplierProducts = selectedSupplier 
    ? mockProducts.filter(p => p.supplier_id === selectedSupplier.id)
    : [];

  const handleViewDetail = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
  };

  const handleShowQR = (productId: string) => {
    setSelectedProduct(productId);
    setShowQRModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 Manajemen Supplier</h1>
          <p className="text-gray-500">{supplierStats.total} supplier terdaftar</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />}>
          Tambah Supplier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Supplier"
          value={supplierStats.total}
          icon={<Users size={24} />}
        />
        <StatsCard
          title="Supplier Aktif"
          value={supplierStats.approved}
          icon={<CheckCircle size={24} />}
          variant="success"
        />
        <StatsCard
          title="Menunggu Approval"
          value={supplierStats.pending}
          icon={<Clock size={24} />}
          variant="warning"
        />
        <StatsCard
          title="Rating Rata-rata"
          value={`${supplierStats.avgRating} ⭐`}
          icon={<Star size={24} />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cari supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'approved', 'pending', 'suspended'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Supplier Table */}
      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell header>Supplier</TableCell>
                <TableCell header>Kontak</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header className="text-center">Produk</TableCell>
                <TableCell header className="text-center">Rating</TableCell>
                <TableCell header className="text-right">Total Penghasilan</TableCell>
                <TableCell header className="text-center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={supplier.name} size="md" />
                      <div>
                        <p className="font-medium text-gray-900">{supplier.name}</p>
                        <p className="text-xs text-gray-500">{supplier.address}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm flex items-center gap-1">
                        <Phone size={12} /> {supplier.phone}
                      </p>
                      {supplier.email && (
                        <p className="text-sm flex items-center gap-1 text-gray-500">
                          <Mail size={12} /> {supplier.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold">{supplier.total_products}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{supplier.rating.toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatRupiah(supplier.total_earnings)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetail(supplier)}
                      >
                        <Eye size={16} />
                      </Button>
                      {supplier.status === 'pending' && (
                        <>
                          <Button variant="success" size="sm">
                            <CheckCircle size={16} />
                          </Button>
                          <Button variant="danger" size="sm">
                            <XCircle size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detail Supplier"
        size="xl"
      >
        {selectedSupplier && (
          <div className="space-y-6">
            {/* Supplier Info */}
            <div className="flex items-start gap-4">
              <Avatar name={selectedSupplier.name} size="xl" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold">{selectedSupplier.name}</h2>
                  {getStatusBadge(selectedSupplier.status)}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} /> {selectedSupplier.phone}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} /> {selectedSupplier.email || '-'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 col-span-2">
                    <MapPin size={14} /> {selectedSupplier.address}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-500">{selectedSupplier.total_products}</p>
                <p className="text-sm text-gray-500">Produk</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-500">{selectedSupplier.avg_sell_through_rate}%</p>
                <p className="text-sm text-gray-500">Sell-through Rate</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{formatRupiah(selectedSupplier.total_earnings)}</p>
                <p className="text-sm text-gray-500">Total Penghasilan</p>
              </div>
            </div>

            {/* Sell-through Progress */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Sell-through Rate</span>
                <span className="text-sm text-gray-500">{selectedSupplier.avg_sell_through_rate}%</span>
              </div>
              <ProgressBar 
                value={selectedSupplier.avg_sell_through_rate} 
                max={100}
                variant={selectedSupplier.avg_sell_through_rate >= 80 ? 'success' : 
                         selectedSupplier.avg_sell_through_rate >= 60 ? 'warning' : 'danger'}
              />
            </div>

            {/* Products */}
            <div>
              <h3 className="font-semibold mb-3">Daftar Produk</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {supplierProducts.map(product => (
                  <div key={product.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <img 
                      src={product.photo_url} 
                      alt={product.name}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleShowQR(product.qr_code)}
                    >
                      QR
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Info */}
            {selectedSupplier.bank_name && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Informasi Rekening</h4>
                <p className="text-blue-700">{selectedSupplier.bank_name}</p>
                <p className="text-blue-700 font-mono">{selectedSupplier.bank_account_number}</p>
                <p className="text-blue-600">{selectedSupplier.bank_account_name}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="QR Code Produk"
        size="sm"
      >
        {selectedProduct && (
          <div className="text-center space-y-4">
            <div className="bg-white p-4 rounded-xl inline-block">
              <QRCodeSVG 
                value={selectedProduct} 
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <p className="font-mono text-sm text-gray-500">{selectedProduct}</p>
            <Button variant="primary" className="w-full" leftIcon={<Download size={18} />}>
              Download QR Code
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
