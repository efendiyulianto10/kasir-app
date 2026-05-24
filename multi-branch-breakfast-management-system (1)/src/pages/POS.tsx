import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  QrCode,
  Search,
  CheckCircle
} from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { usePOSStore, useInventoryStore, useTransactionStore, useAuthStore } from '../store';
import { mockProducts, mockDailyStocks } from '../data/mockData';
import { PRODUCT_CATEGORIES, FIXED_PRICE } from '../types';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Product, Transaction, PaymentMethod } from '../types';

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export const POS: React.FC = () => {
  const { branch } = useAuthStore();
  const { 
    cart, 
    paymentMethod, 
    isProcessing,
    addToCart, 
    updateQuantity, 
    clearCart,
    setPaymentMethod,
    setProcessing,
    getTotal,
    getTotalItems
  } = usePOSStore();
  const { products, dailyStocks, setProducts, setDailyStocks, updateStock } = useInventoryStore();
  const { addTransaction } = useTransactionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    setProducts(mockProducts);
    setDailyStocks(mockDailyStocks);
  }, [setProducts, setDailyStocks]);

  // Get available products with stock
  const getAvailableStock = useCallback((productId: string) => {
    const stock = dailyStocks.find(s => s.product_id === productId);
    return stock?.current_stock || 0;
  }, [dailyStocks]);

  const getCartItemQuantity = useCallback((productId: string) => {
    const item = cart.find(c => c.product.id === productId);
    return item?.quantity || 0;
  }, [cart]);

  const availableProducts = products.filter(p => {
    const hasStock = getAvailableStock(p.id) > 0;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return hasStock && matchesSearch && matchesCategory && p.is_active;
  });

  const handleAddToCart = (product: Product) => {
    const availableStock = getAvailableStock(product.id);
    const currentInCart = getCartItemQuantity(product.id);
    
    if (currentInCart < availableStock) {
      addToCart(product);
    }
  };

  const handlePayment = (method: PaymentMethod) => {
    setPaymentMethod(method);
    processTransaction(method);
  };

  const processTransaction = async (method: PaymentMethod) => {
    setProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date();
    const transactionNumber = `${branch?.code || 'SMP'}${format(now, 'yyMMdd')}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    
    const transaction: Transaction = {
      id: uuidv4(),
      branch_id: branch?.id || 'branch-001',
      transaction_number: transactionNumber,
      date: format(now, 'yyyy-MM-dd'),
      time: format(now, 'HH:mm:ss'),
      cashier_id: 'user-002',
      total_items: getTotalItems(),
      total_amount: getTotal(),
      payment_method: method,
      status: 'completed',
      synced_at: navigator.onLine ? now.toISOString() : undefined,
      created_at: now.toISOString(),
    };

    // Update stock
    cart.forEach(item => {
      updateStock(item.product.id, item.quantity);
    });

    // Add transaction
    addTransaction(transaction);
    
    setLastTransaction(transaction);
    setShowPaymentModal(false);
    setShowSuccessModal(true);
    clearCart();
    setProcessing(false);

    // Auto close success modal
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 3000);
  };

  const total = getTotal();
  const totalItems = getTotalItems();

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-6">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col">
        {/* Search & Filter */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} />}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              Semua
            </Button>
            {PRODUCT_CATEGORIES.slice(0, 5).map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {availableProducts.map(product => {
              const stock = getAvailableStock(product.id);
              const inCart = getCartItemQuantity(product.id);
              const canAdd = inCart < stock;

              return (
                <Card 
                  key={product.id}
                  hover
                  onClick={() => canAdd && handleAddToCart(product)}
                  className={!canAdd ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <div className="relative">
                    <img 
                      src={product.photo_url} 
                      alt={product.name}
                      className="w-full h-28 object-cover rounded-t-2xl"
                    />
                    {inCart > 0 && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
                        {inCart}
                      </div>
                    )}
                    <Badge 
                      variant={stock <= 3 ? 'danger' : stock <= 5 ? 'warning' : 'success'}
                      className="absolute bottom-2 left-2"
                      size="sm"
                    >
                      Stok: {stock}
                    </Badge>
                  </div>
                  <CardBody className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 h-10">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold text-orange-500">
                        {formatRupiah(FIXED_PRICE)}
                      </span>
                      <Button 
                        size="sm" 
                        variant="primary"
                        disabled={!canAdd}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
          
          {availableProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ShoppingCart size={48} className="mb-2" />
              <p>Tidak ada produk ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-80 lg:w-96 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <ShoppingCart size={20} className="text-orange-500" />
              Keranjang
            </h2>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <Trash2 size={16} className="text-red-500" />
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-500">{totalItems} item</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart size={48} className="mb-2" />
              <p>Keranjang kosong</p>
              <p className="text-sm">Tap produk untuk menambahkan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <img 
                  src={item.product.photo_url} 
                  alt={item.product.name}
                  className="w-14 h-14 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-sm text-orange-500 font-semibold">
                    {formatRupiah(item.product.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => {
                      const stock = getAvailableStock(item.product.id);
                      if (item.quantity < stock) {
                        updateQuantity(item.product.id, item.quantity + 1);
                      }
                    }}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                    disabled={item.quantity >= getAvailableStock(item.product.id)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t border-gray-100 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal ({totalItems} item)</span>
              <span className="font-medium">{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-orange-500">{formatRupiah(total)}</span>
            </div>
          </div>
          
          <Button
            variant="primary"
            size="xl"
            className="w-full"
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
          >
            Bayar {formatRupiah(total)}
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Pilih Metode Pembayaran"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center mb-6">
            <p className="text-3xl font-bold text-orange-500">{formatRupiah(total)}</p>
            <p className="text-gray-500">{totalItems} item</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              size="xl"
              className="justify-start gap-4 h-20"
              onClick={() => handlePayment('cash')}
              isLoading={isProcessing && paymentMethod === 'cash'}
              leftIcon={<Banknote size={32} className="text-green-500" />}
            >
              <div className="text-left">
                <p className="font-semibold">Tunai / Cash</p>
                <p className="text-sm text-gray-500">Pembayaran dengan uang tunai</p>
              </div>
            </Button>

            <Button
              variant="outline"
              size="xl"
              className="justify-start gap-4 h-20"
              onClick={() => handlePayment('qris')}
              isLoading={isProcessing && paymentMethod === 'qris'}
              leftIcon={<QrCode size={32} className="text-blue-500" />}
            >
              <div className="text-left">
                <p className="font-semibold">QRIS</p>
                <p className="text-sm text-gray-500">Scan QR dengan e-wallet</p>
              </div>
            </Button>

            <Button
              variant="outline"
              size="xl"
              className="justify-start gap-4 h-20"
              onClick={() => handlePayment('transfer')}
              isLoading={isProcessing && paymentMethod === 'transfer'}
              leftIcon={<CreditCard size={32} className="text-purple-500" />}
            >
              <div className="text-left">
                <p className="font-semibold">Transfer Bank</p>
                <p className="text-sm text-gray-500">Transfer ke rekening SMP</p>
              </div>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        showCloseButton={false}
        size="sm"
      >
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
          <p className="text-gray-500 mb-4">
            Transaksi #{lastTransaction?.transaction_number}
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-3xl font-bold text-orange-500">
              {formatRupiah(lastTransaction?.total_amount || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {lastTransaction?.total_items} item • {lastTransaction?.payment_method?.toUpperCase()}
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => setShowSuccessModal(false)}
          >
            Transaksi Baru
          </Button>
        </div>
      </Modal>
    </div>
  );
};
