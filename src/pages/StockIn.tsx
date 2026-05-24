import React, { useState } from 'react';
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
  Clock,
  User,
  Search,
  AlertTriangle
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { Avatar } from '../components/ui/Avatar';
import { mockSuppliers, mockProducts, mockDailyStocks } from '../data/mockData';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Supplier } from '../types';

interface StockEntry {
  product_id: string;
  product_name: string;
  quantity: number;
}

export const StockIn: React.FC = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const today = new Date();
  const approvedSuppliers = mockSuppliers.filter(s => s.status === 'approved');
  
  const filteredSuppliers = approvedSuppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery)
  );

  const supplierProducts = selectedSupplier 
    ? mockProducts.filter(p => p.supplier_id === selectedSupplier.id)
    : [];

  // Check if supplier already checked in today
  const isCheckedIn = (supplierId: string) => {
    return mockDailyStocks.some(s => 
      s.supplier_id === supplierId && 
      s.date === format(today, 'yyyy-MM-dd')
    );
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    // Initialize stock entries with supplier's products
    const entries = mockProducts
      .filter(p => p.supplier_id === supplier.id)
      .map(p => ({
        product_id: p.id,
        product_name: p.name,
        quantity: Math.floor(p.avg_daily_stock),
      }));
    setStockEntries(entries);
  };

  const handleQuantityChange = (productId: string, qty: number) => {
    setStockEntries(prev => 
      prev.map(entry => 
        entry.product_id === productId 
          ? { ...entry, quantity: Math.max(0, qty) }
          : entry
      )
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setShowConfirmModal(false);
    setShowSuccessModal(true);
  };

  const totalItems = stockEntries.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Input Stok Pagi</h1>
          <p className="text-gray-500">
            {format(today, "EEEE, dd MMMM yyyy", { locale: id })} • 
            <span className="ml-1 text-orange-500 font-medium">
              {approvedSuppliers.length} supplier aktif
            </span>
          </p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<QrCode size={18} />}
          onClick={() => setShowQRScanner(true)}
        >
          Scan QR Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <h3 className="font-semibold">Daftar Supplier</h3>
              <Input
                placeholder="Cari supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={16} />}
                className="mt-3"
              />
            </CardHeader>
            <CardBody className="p-0 max-h-[500px] overflow-y-auto">
              <div className="divide-y divide-gray-100">
                {filteredSuppliers.map(supplier => {
                  const checkedIn = isCheckedIn(supplier.id);
                  const isSelected = selectedSupplier?.id === supplier.id;
                  
                  return (
                    <div 
                      key={supplier.id}
                      onClick={() => !checkedIn && handleSelectSupplier(supplier)}
                      className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-orange-50 border-l-4 border-orange-500' : 
                        checkedIn ? 'bg-green-50 cursor-default' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Avatar name={supplier.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{supplier.name}</p>
                        <p className="text-sm text-gray-500">{supplier.phone}</p>
                      </div>
                      {checkedIn ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle size={12} className="mr-1" /> Sudah
                        </Badge>
                      ) : (
                        <Badge variant="outline" size="sm">
                          <Clock size={12} className="mr-1" /> Menunggu
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Stock Entry Form */}
        <div className="lg:col-span-2">
          {selectedSupplier ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={selectedSupplier.name} size="lg" />
                    <div>
                      <h3 className="font-semibold text-lg">{selectedSupplier.name}</h3>
                      <p className="text-sm text-gray-500">{selectedSupplier.phone}</p>
                    </div>
                  </div>
                  <Badge variant="info">
                    {supplierProducts.length} Produk
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell header>Produk</TableCell>
                      <TableCell header className="text-center">Rata-rata</TableCell>
                      <TableCell header className="text-center w-40">Jumlah Hari Ini</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockEntries.map(entry => {
                      const product = supplierProducts.find(p => p.id === entry.product_id);
                      return (
                        <TableRow key={entry.product_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product && (
                                <img 
                                  src={product.photo_url} 
                                  alt={product.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium">{entry.product_name}</p>
                                <p className="text-sm text-gray-500">{product?.category}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-gray-500">
                              {Math.floor(product?.avg_daily_stock || 0)} pcs
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(entry.product_id, entry.quantity - 1)}
                                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={entry.quantity}
                                onChange={(e) => handleQuantityChange(entry.product_id, parseInt(e.target.value) || 0)}
                                className="w-16 h-10 text-center border border-gray-200 rounded-lg font-semibold"
                              />
                              <button
                                onClick={() => handleQuantityChange(entry.product_id, entry.quantity + 1)}
                                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                              >
                                +
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="mt-6 flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Total Item</p>
                    <p className="text-2xl font-bold text-orange-500">{totalItems} pcs</p>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={totalItems === 0}
                    leftIcon={<CheckCircle size={18} />}
                  >
                    Konfirmasi Stok Masuk
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center text-gray-400">
                <User size={64} className="mx-auto mb-4" />
                <h3 className="text-lg font-medium">Pilih Supplier</h3>
                <p className="text-sm">Pilih supplier dari daftar atau scan QR code</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <Modal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        title="Scan QR Code Supplier"
        size="md"
      >
        <div className="space-y-4">
          <div className="aspect-square bg-gray-900 rounded-xl flex items-center justify-center">
            <div className="text-center text-white">
              <Camera size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-gray-400">Kamera akan aktif di sini</p>
              <p className="text-sm text-gray-500">Arahkan ke QR Code supplier</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">Atau masukkan kode manual:</p>
            <Input placeholder="Masukkan kode supplier..." />
          </div>
          <Button variant="primary" className="w-full" onClick={() => setShowQRScanner(false)}>
            Konfirmasi
          </Button>
        </div>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Konfirmasi Stok Masuk"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-yellow-800">Periksa kembali data stok</p>
              <p className="text-sm text-yellow-700">
                Data ini tidak dapat diubah setelah dikonfirmasi
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">Supplier</p>
            <p className="font-semibold text-lg">{selectedSupplier?.name}</p>
          </div>

          <div className="space-y-2">
            {stockEntries.filter(e => e.quantity > 0).map(entry => (
              <div key={entry.product_id} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">{entry.product_name}</span>
                <span className="font-semibold">{entry.quantity} pcs</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between py-3 bg-orange-50 rounded-xl px-4">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-orange-500 text-xl">{totalItems} pcs</span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)}>
              Batal
            </Button>
            <Button 
              variant="primary" 
              className="flex-1" 
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setSelectedSupplier(null);
          setStockEntries([]);
        }}
        showCloseButton={false}
        size="sm"
      >
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Stok Tercatat!</h2>
          <p className="text-gray-500 mb-4">
            {selectedSupplier?.name} - {totalItems} item
          </p>
          <p className="text-sm text-gray-400">
            {format(new Date(), 'HH:mm:ss', { locale: id })}
          </p>
          <Button
            variant="primary"
            size="lg"
            className="w-full mt-6"
            onClick={() => {
              setShowSuccessModal(false);
              setSelectedSupplier(null);
              setStockEntries([]);
            }}
          >
            Input Supplier Lain
          </Button>
        </div>
      </Modal>
    </div>
  );
};
