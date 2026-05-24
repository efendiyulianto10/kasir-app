import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Grid,
  List,
  Eye,
  Edit,
  QrCode
} from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { mockProducts, mockSuppliers, mockDailyStocks } from '../data/mockData';
import { PRODUCT_CATEGORIES, FIXED_PRICE } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import type { Product } from '../types';

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export const Products: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const filteredProducts = mockProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getSupplierName = (supplierId: string) => {
    return mockSuppliers.find(s => s.id === supplierId)?.name || 'Unknown';
  };

  const getTodayStock = (productId: string) => {
    return mockDailyStocks.find(s => s.product_id === productId)?.current_stock || 0;
  };

  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleShowQR = (product: Product) => {
    setSelectedProduct(product);
    setShowQRModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🍱 Daftar Produk</h1>
          <p className="text-gray-500">{mockProducts.length} produk terdaftar</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />}>
          Tambah Produk
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
              <Button
                variant={categoryFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('all')}
              >
                Semua
              </Button>
              {PRODUCT_CATEGORIES.slice(0, 6).map(category => (
                <Button
                  key={category}
                  variant={categoryFilter === category ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Products */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map(product => {
            const stock = getTodayStock(product.id);
            return (
              <Card key={product.id} hover>
                <div className="relative">
                  <img 
                    src={product.photo_url} 
                    alt={product.name}
                    className="w-full h-36 object-cover rounded-t-2xl"
                  />
                  <Badge 
                    variant={product.is_active ? 'success' : 'danger'}
                    className="absolute top-2 left-2"
                    size="sm"
                  >
                    {product.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                  <Badge 
                    variant={stock > 5 ? 'info' : stock > 0 ? 'warning' : 'danger'}
                    className="absolute top-2 right-2"
                    size="sm"
                  >
                    Stok: {stock}
                  </Badge>
                </div>
                <CardBody className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 h-12 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                  <p className="text-xs text-gray-400 truncate mb-2">
                    {getSupplierName(product.supplier_id)}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-500">
                      {formatRupiah(FIXED_PRICE)}
                    </span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetail(product)}
                      >
                        <Eye size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleShowQR(product)}
                      >
                        <QrCode size={16} />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header>Produk</TableCell>
                  <TableCell header>Supplier</TableCell>
                  <TableCell header>Kategori</TableCell>
                  <TableCell header className="text-center">Stok</TableCell>
                  <TableCell header className="text-right">Harga</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header className="text-center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map(product => {
                  const stock = getTodayStock(product.id);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.photo_url} 
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{product.qr_code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {getSupplierName(product.supplier_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" size="sm">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={stock > 5 ? 'success' : stock > 0 ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-orange-500">
                        {formatRupiah(FIXED_PRICE)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? 'success' : 'danger'} size="sm">
                          {product.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(product)}>
                            <Eye size={16} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleShowQR(product)}>
                            <QrCode size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {filteredProducts.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center text-gray-400">
            <Package size={48} className="mx-auto mb-4" />
            <p>Tidak ada produk ditemukan</p>
          </CardBody>
        </Card>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detail Produk"
        size="md"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <img 
              src={selectedProduct.photo_url} 
              alt={selectedProduct.name}
              className="w-full h-48 object-cover rounded-xl"
            />
            <div>
              <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
              <p className="text-gray-500">{selectedProduct.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Kategori</p>
                <p className="font-semibold">{selectedProduct.category}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Supplier</p>
                <p className="font-semibold">{getSupplierName(selectedProduct.supplier_id)}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-sm text-orange-600">Harga</p>
                <p className="font-bold text-orange-500 text-xl">{formatRupiah(FIXED_PRICE)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Stok Hari Ini</p>
                <p className="font-semibold text-xl">{getTodayStock(selectedProduct.id)}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-600">Bagi Hasil</p>
              <div className="flex justify-between mt-2">
                <span>Supplier (90%)</span>
                <span className="font-semibold text-green-600">{formatRupiah(9000)}</span>
              </div>
              <div className="flex justify-between">
                <span>SMP (10%)</span>
                <span className="font-semibold text-orange-600">{formatRupiah(1000)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => handleShowQR(selectedProduct)}>
                <QrCode size={18} className="mr-2" /> Lihat QR
              </Button>
              <Button variant="primary" className="flex-1">
                <Edit size={18} className="mr-2" /> Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* QR Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="QR Code Produk"
        size="sm"
      >
        {selectedProduct && (
          <div className="text-center space-y-4">
            <div className="bg-white p-6 rounded-xl inline-block shadow-inner">
              <QRCodeSVG 
                value={selectedProduct.qr_code} 
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <div>
              <p className="font-semibold">{selectedProduct.name}</p>
              <p className="font-mono text-sm text-gray-500">{selectedProduct.qr_code}</p>
            </div>
            <Button variant="primary" className="w-full">
              Download QR Code
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
