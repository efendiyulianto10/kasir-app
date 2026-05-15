import { useState, useMemo } from 'react';
import { Plus, Minus, ShoppingCart, Trash2, Check, CreditCard, Smartphone, Truck, Banknote, Search } from 'lucide-react';
import { Product, DailyTransaction, TransactionItem, Branch } from '../types';
import { formatCurrency, generateId } from '../store';

interface KasirProps {
  products: Product[];
  branches: Branch[];
  onSubmitTransaction: (tx: DailyTransaction) => void;
}

export default function Kasir({ products, branches, onSubmitTransaction }: KasirProps) {
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || '');
  const [cart, setCart] = useState<Map<string, { product: Product; qty: number }>>(new Map());
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'shopeefood' | 'gofood'>('cash');
  const [search, setSearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  // batch items managed via cart state

  const branchProducts = useMemo(() => {
    let filtered = products.filter(p => p.branchId === selectedBranch || selectedBranch === '');
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [products, selectedBranch, search]);

  const cartItems = useMemo(() => Array.from(cart.values()), [cart]);
  const totalAmount = useMemo(() => cartItems.reduce((s, i) => s + (i.product.price * i.qty), 0), [cartItems]);
  const totalItems = useMemo(() => cartItems.reduce((s, i) => s + i.qty, 0), [cartItems]);

  const addToCart = (product: Product) => {
    const newCart = new Map(cart);
    const existing = newCart.get(product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      newCart.set(product.id, { product, qty: 1 });
    }
    setCart(newCart);
  };

  const updateQty = (productId: string, delta: number) => {
    const newCart = new Map(cart);
    const item = newCart.get(productId);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) newCart.delete(productId);
    }
    setCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const newCart = new Map(cart);
    newCart.delete(productId);
    setCart(newCart);
  };

  const submitTransaction = () => {
    if (cartItems.length === 0) return;
    
    const items: TransactionItem[] = cartItems.map(ci => ({
      productId: ci.product.id,
      productName: ci.product.name,
      supplierId: ci.product.supplierId,
      supplierName: ci.product.supplierName,
      qty: ci.qty,
      price: ci.product.price,
      subtotal: ci.product.price * ci.qty,
    }));

    const tx: DailyTransaction = {
      id: generateId(),
      branchId: selectedBranch,
      date: new Date().toISOString().split('T')[0],
      items,
      paymentMethod,
      totalAmount,
      totalProfit: totalAmount * 0.1,
      createdAt: new Date().toISOString(),
      inputBy: 'Kasir',
    };

    onSubmitTransaction(tx);
    setCart(new Map());
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const categoryIcons: Record<string, string> = {
    makanan: '🍱',
    minuman: '🥤',
    snack: '🍡',
  };

  const paymentOptions = [
    { value: 'cash', label: 'Tunai', icon: Banknote, color: 'bg-green-50 border-green-300 text-green-700' },
    { value: 'qris', label: 'QRIS', icon: CreditCard, color: 'bg-blue-50 border-blue-300 text-blue-700' },
    { value: 'shopeefood', label: 'ShopeeFood', icon: Smartphone, color: 'bg-orange-50 border-orange-300 text-orange-700' },
    { value: 'gofood', label: 'GoFood', icon: Truck, color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚡ Kasir Express</h1>
          <p className="text-gray-500 text-sm">Input cepat — cocok untuk waktu luang setelah jam sibuk</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setBatchMode(false)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !batchMode ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Mode Cepat
          </button>
          <button
            onClick={() => setBatchMode(true)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              batchMode ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Mode Batch
          </button>
        </div>
      </div>

      {/* Branch selector */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Pilih Cabang</label>
        <select
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
        >
          {branches.filter(b => b.status === 'active').map(b => (
            <option key={b.id} value={b.id}>{b.name} - {b.address}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari produk atau supplier..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {branchProducts.map(product => {
              const inCart = cart.get(product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`relative bg-white rounded-2xl p-4 border-2 text-left transition-all hover:shadow-md active:scale-[0.98] ${
                    inCart ? 'border-orange-400 bg-orange-50' : 'border-gray-100'
                  }`}
                >
                  <div className="text-2xl mb-2">{categoryIcons[product.category]}</div>
                  <div className="font-medium text-gray-900 text-sm leading-tight">{product.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{product.supplierName}</div>
                  <div className="font-bold text-orange-600 mt-2 text-sm">Rp 10.000</div>
                  
                  {inCart && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                      {inCart.qty}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {branchProducts.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center text-gray-500">
              <p className="text-lg mb-1">🔍</p>
              <p>Tidak ada produk ditemukan</p>
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col max-h-[calc(100vh-200px)] sticky top-4">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-orange-600" />
              <h3 className="font-semibold text-gray-900">Keranjang</h3>
              {totalItems > 0 && (
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {totalItems} item
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tap produk untuk menambahkan</p>
              </div>
            ) : (
              cartItems.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{qty}</span>
                    <button
                      onClick={() => updateQty(product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 hover:bg-orange-200"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment method */}
          <div className="p-4 border-t border-gray-100">
            <label className="text-xs font-medium text-gray-500 mb-2 block">Metode Bayar</label>
            <div className="grid grid-cols-2 gap-2">
              {paymentOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentMethod(opt.value as typeof paymentMethod)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      paymentMethod === opt.value ? opt.color + ' border-2' : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <Icon size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Total & Submit */}
          <div className="p-4 border-t border-gray-100 bg-orange-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-xl font-bold text-orange-700">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
              <span>Profit SMP (10%)</span>
              <span className="text-green-600 font-medium">{formatCurrency(totalAmount * 0.1)}</span>
            </div>
            <button
              onClick={submitTransaction}
              disabled={cartItems.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                cartItems.length > 0
                  ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200 active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Check size={18} />
              Simpan Transaksi
            </button>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce z-50">
          <Check size={20} />
          <span className="font-medium">Transaksi berhasil disimpan! ✅</span>
        </div>
      )}
    </div>
  );
}
