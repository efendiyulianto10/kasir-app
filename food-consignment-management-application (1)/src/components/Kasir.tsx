import { useState, useMemo } from 'react';
import { 
  Plus, Minus, ShoppingCart, Trash2, Check, CreditCard, Smartphone, 
  Truck, Banknote, Search, Users, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { Product, DailyTransaction, TransactionItem, Branch } from '../types';
import { formatCurrency, generateId } from '../store';

interface KasirProps {
  products: Product[];
  branches: Branch[];
  transactions: DailyTransaction[];
  onSubmitTransaction: (tx: DailyTransaction) => void;
}

export default function Kasir({ products, branches, transactions, onSubmitTransaction }: KasirProps) {
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || '');
  const [cart, setCart] = useState<Map<string, { product: Product; qty: number }>>(new Map());
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'shopeefood' | 'gofood'>('cash');
  const [search, setSearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showClosing, setShowClosing] = useState(false);

  const today = new Date().toISOString().split('T')[0];

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

  // ── Ringkasan per supplier di keranjang ──
  const cartSupplierSummary = useMemo(() => {
    const map = new Map<string, { name: string; items: { productName: string; qty: number; subtotal: number }[]; totalQty: number; totalRevenue: number; supplierEarning: number; smpProfit: number }>();
    cartItems.forEach(({ product, qty }) => {
      const key = product.supplierId;
      const existing = map.get(key) || { name: product.supplierName, items: [], totalQty: 0, totalRevenue: 0, supplierEarning: 0, smpProfit: 0 };
      const sub = product.price * qty;
      existing.items.push({ productName: product.name, qty, subtotal: sub });
      existing.totalQty += qty;
      existing.totalRevenue += sub;
      existing.supplierEarning += sub * 0.9;
      existing.smpProfit += sub * 0.1;
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [cartItems]);

  // ── Closing: Rekap HARI INI per supplier ──
  const closingSummary = useMemo(() => {
    const todayTx = transactions.filter(t => t.branchId === selectedBranch && t.date === today);
    const map = new Map<string, { 
      name: string; 
      products: Map<string, { name: string; qty: number; subtotal: number }>;
      totalQty: number; 
      totalRevenue: number; 
      supplierEarning: number; 
      smpProfit: number;
      txCount: number;
    }>();

    todayTx.forEach(tx => {
      tx.items.forEach(item => {
        const key = item.supplierId;
        const existing = map.get(key) || { 
          name: item.supplierName, 
          products: new Map(), 
          totalQty: 0, totalRevenue: 0, supplierEarning: 0, smpProfit: 0, txCount: 0 
        };
        const prod = existing.products.get(item.productId) || { name: item.productName, qty: 0, subtotal: 0 };
        prod.qty += item.qty;
        prod.subtotal += item.subtotal;
        existing.products.set(item.productId, prod);
        existing.totalQty += item.qty;
        existing.totalRevenue += item.subtotal;
        existing.supplierEarning += item.subtotal * 0.9;
        existing.smpProfit += item.subtotal * 0.1;
        existing.txCount += 1;
        map.set(key, existing);
      });
    });

    return {
      suppliers: Array.from(map.values()).map(s => ({
        ...s,
        products: Array.from(s.products.values()),
      })).sort((a, b) => b.totalRevenue - a.totalRevenue),
      totalRevenue: todayTx.reduce((s, t) => s + t.totalAmount, 0),
      totalProfit: todayTx.reduce((s, t) => s + t.totalProfit, 0),
      totalSupplierPay: todayTx.reduce((s, t) => s + t.totalAmount * 0.9, 0),
      txCount: todayTx.length,
    };
  }, [transactions, selectedBranch, today]);

  const addToCart = (product: Product) => {
    const newCart = new Map(cart);
    const existing = newCart.get(product.id);
    if (existing) { existing.qty += 1; } else { newCart.set(product.id, { product, qty: 1 }); }
    setCart(newCart);
  };

  const updateQty = (productId: string, delta: number) => {
    const newCart = new Map(cart);
    const item = newCart.get(productId);
    if (item) { item.qty += delta; if (item.qty <= 0) newCart.delete(productId); }
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
      productId: ci.product.id, productName: ci.product.name,
      supplierId: ci.product.supplierId, supplierName: ci.product.supplierName,
      qty: ci.qty, price: ci.product.price, subtotal: ci.product.price * ci.qty,
    }));
    const tx: DailyTransaction = {
      id: generateId(), branchId: selectedBranch,
      date: today, items, paymentMethod, totalAmount,
      totalProfit: totalAmount * 0.1, createdAt: new Date().toISOString(), inputBy: 'Kasir',
    };
    onSubmitTransaction(tx);
    setCart(new Map());
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const categoryIcons: Record<string, string> = { makanan: '🍱', minuman: '🥤', snack: '🍡' };
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
        <button onClick={() => setShowClosing(!showClosing)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            showClosing ? 'bg-red-600 text-white' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200'
          }`}>
          <Clock size={18} />
          {showClosing ? 'Tutup Rekap Closing' : '📋 Rekap Closing Hari Ini'}
        </button>
      </div>

      {/* ══════════ CLOSING PANEL ══════════ */}
      {showClosing && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 overflow-hidden">
          <div className="p-4 bg-purple-600 text-white">
            <h2 className="font-bold text-lg flex items-center gap-2"><Clock size={20} /> Rekap Closing — {today}</h2>
            <p className="text-purple-200 text-sm mt-1">Total bayar ke setiap supplier saat closing</p>
          </div>

          {/* Totals */}
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs text-gray-500">Transaksi</div>
              <div className="text-xl font-bold text-gray-900">{closingSummary.txCount}</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs text-gray-500">Total Revenue</div>
              <div className="text-xl font-bold text-orange-600">{formatCurrency(closingSummary.totalRevenue)}</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs text-gray-500">Bayar ke Supplier</div>
              <div className="text-xl font-bold text-red-600">{formatCurrency(closingSummary.totalSupplierPay)}</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs text-gray-500">Profit SMP</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(closingSummary.totalProfit)}</div>
            </div>
          </div>

          {/* Per-supplier detail */}
          <div className="p-4 pt-0 space-y-3">
            {closingSummary.suppliers.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada transaksi hari ini</p>
              </div>
            )}
            {closingSummary.suppliers.map((sup, idx) => (
              <ClosingSupplierCard key={idx} supplier={sup} />
            ))}
          </div>
        </div>
      )}

      {/* Branch selector */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Pilih Cabang</label>
        <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 text-sm">
          {branches.filter(b => b.status === 'active').map(b => (
            <option key={b.id} value={b.id}>{b.name} - {b.address}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari produk atau supplier..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {branchProducts.map(product => {
              const inCart = cart.get(product.id);
              return (
                <button key={product.id} onClick={() => addToCart(product)}
                  className={`relative bg-white rounded-2xl p-4 border-2 text-left transition-all hover:shadow-md active:scale-[0.98] ${
                    inCart ? 'border-orange-400 bg-orange-50' : 'border-gray-100'
                  }`}>
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
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">{totalItems} item</span>
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
                    <p className="text-xs text-gray-500">{product.supplierName} • {formatCurrency(product.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm font-bold">{qty}</span>
                    <button onClick={() => updateQty(product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 hover:bg-orange-200"><Plus size={14} /></button>
                    <button onClick={() => removeFromCart(product.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Ringkasan bayar per supplier (di keranjang) ── */}
          {cartSupplierSummary.length > 0 && (
            <div className="border-t border-gray-100 p-3 bg-blue-50 space-y-2 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-1 text-xs font-semibold text-blue-800">
                <Users size={12} /> Bayar ke Supplier (transaksi ini):
              </div>
              {cartSupplierSummary.map((sup, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-2.5 py-1.5">
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900">{sup.name}</span>
                    <span className="text-gray-400 ml-1">({sup.totalQty} pcs)</span>
                  </div>
                  <span className="font-bold text-blue-700 whitespace-nowrap ml-2">{formatCurrency(sup.supplierEarning)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Payment method */}
          <div className="p-4 border-t border-gray-100">
            <label className="text-xs font-medium text-gray-500 mb-2 block">Metode Bayar</label>
            <div className="grid grid-cols-2 gap-2">
              {paymentOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <button key={opt.value} onClick={() => setPaymentMethod(opt.value as typeof paymentMethod)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      paymentMethod === opt.value ? opt.color + ' border-2' : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}>
                    <Icon size={14} /> {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Total & Submit */}
          <div className="p-4 border-t border-gray-100 bg-orange-50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-xl font-bold text-orange-700">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between mb-1 text-xs text-gray-500">
              <span>Ke Supplier (90%)</span>
              <span className="text-blue-600 font-medium">{formatCurrency(totalAmount * 0.9)}</span>
            </div>
            <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
              <span>Profit SMP (10%)</span>
              <span className="text-green-600 font-medium">{formatCurrency(totalAmount * 0.1)}</span>
            </div>
            <button onClick={submitTransaction} disabled={cartItems.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                cartItems.length > 0
                  ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200 active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              <Check size={18} /> Simpan Transaksi
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

/* ── Closing Supplier Card ── */

function ClosingSupplierCard({ supplier }: { 
  supplier: { 
    name: string; 
    products: { name: string; qty: number; subtotal: number }[];
    totalQty: number; totalRevenue: number; supplierEarning: number; smpProfit: number; txCount: number;
  } 
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-purple-100 overflow-hidden">
      {/* Summary row */}
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-purple-50 transition-colors text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{supplier.name}</p>
            <p className="text-xs text-gray-500">{supplier.products.length} produk • {supplier.totalQty} pcs terjual</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold text-red-600">{formatCurrency(supplier.supplierEarning)}</p>
            <p className="text-[10px] text-gray-400">harus dibayar</p>
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Detail */}
      {open && (
        <div className="border-t border-purple-100 p-4 pt-3 bg-purple-50/50 space-y-2">
          {/* Per product */}
          <div className="space-y-1">
            {supplier.products.map((prod, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2">
                <div>
                  <span className="font-medium text-gray-900">{prod.name}</span>
                  <span className="text-gray-400 ml-1">× {prod.qty}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{formatCurrency(prod.subtotal)}</div>
                  <div className="text-[10px] text-gray-400">supplier: {formatCurrency(prod.subtotal * 0.9)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-purple-200 pt-2 space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Total Penjualan</span>
              <span className="font-medium">{formatCurrency(supplier.totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-600 font-medium">💰 Bayar ke {supplier.name}</span>
              <span className="font-bold text-red-600 text-sm">{formatCurrency(supplier.supplierEarning)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">✅ Profit SMP</span>
              <span className="font-bold text-green-600">{formatCurrency(supplier.smpProfit)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
