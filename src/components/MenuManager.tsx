import React, { useState } from 'react';
import { Package, Search, Info } from 'lucide-react';
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

interface Props {
  menuItems: MenuItem[];
  consignmentSuppliers: ConsignmentSupplier[];
}

export const MenuManager: React.FC<Props> = ({ menuItems, consignmentSuppliers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');

  const categories = ['all', ...new Set(menuItems.map(m => m.category))];
  
  const filtered = menuItems.filter(m =>
    (filterCategory === 'all' || m.category === filterCategory) &&
    (filterSupplier === 'all' || m.supplierId === filterSupplier) &&
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="animate-fade-in space-y-6">
      {/* Info Banner */}
      <div className="glass-card rounded-2xl p-4 border border-orange-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <Info size={18} className="text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-orange-400">Sistem Konsinyasi</h3>
            <p className="text-xs text-slate-400 mt-1">
              Semua menu berasal dari <strong>supplier masyarakat sekitar</strong> yang menitipkan makanan.
              Menu dikelola melalui halaman <strong>Konsinyasi</strong>.
            </p>
            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(SMP_PRICE.SELL)}</p>
                <p className="text-[10px] text-slate-500">Harga Jual</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-400">{formatCurrency(SMP_PRICE.BUY)}</p>
                <p className="text-[10px] text-slate-500">Bayar Supplier</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-400">{formatCurrency(SMP_PRICE.PROFIT)}</p>
                <p className="text-[10px] text-slate-500">Profit SMP</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400">Total Menu</p>
          <p className="text-2xl font-bold text-white">{menuItems.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400">Total Supplier</p>
          <p className="text-2xl font-bold text-orange-400">{consignmentSuppliers.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400">Kategori</p>
          <p className="text-2xl font-bold text-white">{categories.length - 1}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400">Harga Seragam</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(SMP_PRICE.SELL)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-sm text-white w-full focus:outline-none"
            style={{ border: 'none', boxShadow: 'none' }}
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">Semua Kategori</option>
          {categories.filter(c => c !== 'all').map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterSupplier}
          onChange={e => setFilterSupplier(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">Semua Supplier</option>
          {consignmentSuppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="glass-card rounded-2xl p-4 hover:border-orange-500/20 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center text-2xl">
                {getCategoryEmoji(item.category)}
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                Tersedia
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white">{item.name}</h4>
            <p className="text-xs text-slate-400 mt-0.5">{item.category}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
              <div>
                <p className="text-lg font-bold text-orange-400">{formatCurrency(item.price)}</p>
                <p className="text-[10px] text-slate-500">Profit: {formatCurrency(SMP_PRICE.PROFIT)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">Supplier</p>
                <p className="text-xs text-slate-300">{item.supplierName}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>Tidak ada menu ditemukan</p>
        </div>
      )}

      {/* Supplier Summary */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">👥 Menu per Supplier</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {consignmentSuppliers.map(supplier => (
            <div key={supplier.id} className="bg-slate-800/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center text-white text-xs font-bold">
                  {supplier.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{supplier.name}</p>
                  <p className="text-[10px] text-slate-500">{supplier.phone}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {supplier.products.map(p => (
                  <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
