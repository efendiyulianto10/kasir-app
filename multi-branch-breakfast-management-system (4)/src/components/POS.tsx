import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, CheckCircle, X } from 'lucide-react';
import type { Branch, TransactionItem, Transaction } from '../types';
import type { ConsignmentSupplier } from '../types/consignment';
import { SMP_PRICE } from '../store/useStore';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  description: string;
  isAvailable: boolean;
  branchId: string;
  supplierId: string;
  supplierName: string;
}

interface POSProps {
  menuItems: MenuItem[];
  branches: Branch[];
  consignmentSuppliers: ConsignmentSupplier[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => Transaction;
}

export const POS: React.FC<POSProps> = ({ menuItems, branches, consignmentSuppliers, addTransaction }) => {
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || '');
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedSupplier, setSelectedSupplier] = useState('Semua');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [cashReceived, setCashReceived] = useState('');

  const categories = ['Semua', ...new Set(menuItems.map(m => m.category))];
  
  const filteredMenus = menuItems.filter(m =>
    (selectedCategory === 'Semua' || m.category === selectedCategory) &&
    (selectedSupplier === 'Semua' || m.supplierId === selectedSupplier) &&
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const total = cart.reduce((a, item) => a + item.subtotal, 0);
  const change = cashReceived ? parseInt(cashReceived) - total : 0;
  const totalProfit = cart.reduce((a, item) => a + (SMP_PRICE.PROFIT * item.quantity), 0);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) {
        return prev.map(c => c.menuItemId === item.id
          ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * SMP_PRICE.SELL }
          : c
        );
      }
      return [...prev, { 
        menuItemId: item.id, 
        menuItemName: item.name, 
        quantity: 1, 
        price: SMP_PRICE.SELL, 
        subtotal: SMP_PRICE.SELL 
      }];
    });
  };

  const updateQty = (menuItemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.menuItemId !== menuItemId) return c;
        const newQty = c.quantity + delta;
        if (newQty <= 0) return null as unknown as TransactionItem;
        return { ...c, quantity: newQty, subtotal: newQty * SMP_PRICE.SELL };
      }).filter(Boolean);
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(c => c.menuItemId !== menuItemId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const tx = addTransaction({
      items: cart,
      total,
      paymentMethod,
      customerName: customerName || undefined,
      branchId: selectedBranch,
      cashierName: 'Kasir',
      status: 'completed',
    });
    setLastTransaction(tx);
    setShowReceipt(true);
    setCart([]);
    setCustomerName('');
    setCashReceived('');
  };

  const formatCurrency = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'Nasi': return '🍚';
      case 'Mie': return '🍜';
      case 'Bubur': return '🥣';
      case 'Soto': return '🍲';
      case 'Lontong': return '🥘';
      case 'Lauk': return '🍗';
      default: return '🍽️';
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-100px)] animate-fade-in">
      {/* Left - Menu Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Filters Row 1 */}
        <div className="flex gap-3 mb-3 flex-wrap">
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="🔍 Cari menu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 rounded-xl px-4 py-2 text-sm min-w-[150px]"
          />
        </div>

        {/* Filters Row 2 - Categories */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'gradient-orange text-white shadow-lg shadow-orange-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat !== 'Semua' && getCategoryEmoji(cat)} {cat}
            </button>
          ))}
        </div>

        {/* Filters Row 3 - Suppliers */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedSupplier('Semua')}
            className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
              selectedSupplier === 'Semua'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800/50 text-slate-500 hover:text-white'
            }`}
          >
            👥 Semua Supplier
          </button>
          {consignmentSuppliers.map(sup => (
            <button
              key={sup.id}
              onClick={() => setSelectedSupplier(sup.id)}
              className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                selectedSupplier === sup.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800/50 text-slate-500 hover:text-white'
              }`}
            >
              {sup.name}
            </button>
          ))}
        </div>

        {/* Price Banner */}
        <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/10 rounded-xl px-4 py-2 mb-3 flex items-center justify-between">
          <span className="text-xs text-orange-400">🏷️ Semua menu harga seragam</span>
          <span className="text-lg font-bold text-orange-400">{formatCurrency(SMP_PRICE.SELL)}</span>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
          {filteredMenus.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="glass-card rounded-xl p-3 text-left hover:border-orange-500/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <div className="w-full h-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center mb-2">
                <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
              </div>
              <p className="text-xs font-semibold text-white truncate">{item.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{item.supplierName}</p>
              <p className="text-sm font-bold text-orange-400 mt-1">{formatCurrency(SMP_PRICE.SELL)}</p>
            </button>
          ))}
          {filteredMenus.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
              <p>Tidak ada menu ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Right - Cart */}
      <div className="w-80 flex-shrink-0 glass-card rounded-2xl flex flex-col">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-orange-400" />
            <h3 className="font-semibold text-white text-sm">Keranjang</h3>
            <span className="ml-auto text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
              {cart.reduce((a, c) => a + c.quantity, 0)} item
            </span>
          </div>
          <input
            type="text"
            placeholder="Nama pelanggan (opsional)"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="w-full mt-3 rounded-lg px-3 py-2 text-xs"
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Keranjang kosong</p>
              <p className="text-[10px] text-slate-600 mt-1">Tap menu untuk menambahkan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.menuItemId} className="bg-slate-800/50 rounded-xl p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.menuItemName}</p>
                    <p className="text-xs text-orange-400 mt-0.5">{formatCurrency(SMP_PRICE.SELL)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.menuItemId)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.menuItemId, -1)} className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center hover:bg-slate-600">
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-semibold text-white w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.menuItemId, 1)} className="w-6 h-6 rounded-md gradient-orange flex items-center justify-center hover:opacity-90">
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-white">{formatCurrency(item.subtotal)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment */}
        <div className="p-4 border-t border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total</span>
            <span className="text-xl font-bold text-orange-400">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Profit SMP</span>
            <span className="text-emerald-400">+{formatCurrency(totalProfit)}</span>
          </div>

          {/* Payment Methods */}
          <div className="flex gap-2">
            {[
              { key: 'cash' as const, icon: <Banknote size={14} />, label: 'Cash' },
              { key: 'qris' as const, icon: <Smartphone size={14} />, label: 'QRIS' },
              { key: 'transfer' as const, icon: <CreditCard size={14} />, label: 'Transfer' },
            ].map(pm => (
              <button
                key={pm.key}
                onClick={() => setPaymentMethod(pm.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  paymentMethod === pm.key
                    ? 'gradient-orange text-white shadow-lg shadow-orange-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {pm.icon} {pm.label}
              </button>
            ))}
          </div>

          {paymentMethod === 'cash' && (
            <div>
              <input
                type="number"
                placeholder="Uang diterima..."
                value={cashReceived}
                onChange={e => setCashReceived(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
              />
              {change > 0 && (
                <p className="text-xs text-emerald-400 mt-1">Kembalian: {formatCurrency(change)}</p>
              )}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 rounded-xl gradient-orange text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            Bayar {formatCurrency(total)}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowReceipt(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-slate-900" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">🧾 Struk Pembayaran</h3>
              <button onClick={() => setShowReceipt(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="text-center mb-4">
              <p className="font-bold text-lg">SMP - Sarapan Murah Pagi</p>
              <p className="text-xs text-slate-500">Serba {formatCurrency(SMP_PRICE.SELL)}</p>
              <p className="text-xs text-slate-400 mt-1">{new Date(lastTransaction.date).toLocaleString('id-ID')}</p>
            </div>
            <div className="border-t border-dashed border-slate-300 py-3 space-y-2">
              {lastTransaction.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.menuItemName} x{item.quantity}</span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-slate-300 pt-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-orange-600">{formatCurrency(lastTransaction.total)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Pembayaran: {lastTransaction.paymentMethod.toUpperCase()}</p>
              <p className="text-xs text-slate-400">ID: #{lastTransaction.id.slice(0, 8)}</p>
            </div>
            <div className="text-center mt-4 pt-3 border-t border-dashed border-slate-300">
              <p className="text-xs text-slate-400">Terima kasih telah berbelanja! 🙏</p>
              <p className="text-[10px] text-slate-300">Selamat menikmati sarapan Anda</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
