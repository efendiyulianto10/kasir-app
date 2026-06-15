import React from 'react';
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, Building2, Users,
  Receipt, Wallet, BarChart3, Bot, Send, Settings,
  Database, ChevronLeft, ChevronRight, Coffee, ClipboardList
} from 'lucide-react';
import type { PageType } from '../types';

interface SidebarProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const menuItems: { icon: React.ReactNode; label: string; page: PageType; group: string }[] = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard', page: 'dashboard', group: 'Utama' },
  { icon: <ShoppingCart size={20} />, label: 'Kasir (POS)', page: 'pos', group: 'Utama' },
  { icon: <ClipboardList size={20} />, label: 'Konsinyasi', page: 'consignment', group: 'Utama' },
  { icon: <UtensilsCrossed size={20} />, label: 'Menu', page: 'menu', group: 'Manajemen' },
  { icon: <Building2 size={20} />, label: 'Cabang', page: 'branches', group: 'Manajemen' },
  { icon: <Users size={20} />, label: 'Karyawan', page: 'employees', group: 'Manajemen' },
  { icon: <Receipt size={20} />, label: 'Transaksi', page: 'transactions', group: 'Keuangan' },
  { icon: <Wallet size={20} />, label: 'Pengeluaran', page: 'expenses', group: 'Keuangan' },
  { icon: <BarChart3 size={20} />, label: 'Laporan', page: 'reports', group: 'Keuangan' },
  { icon: <Bot size={20} />, label: 'AI Assistant', page: 'ai-assistant', group: 'Integrasi' },
  { icon: <Send size={20} />, label: 'Telegram', page: 'telegram', group: 'Integrasi' },
  { icon: <Database size={20} />, label: 'Backup', page: 'backup', group: 'Sistem' },
  { icon: <Settings size={20} />, label: 'Pengaturan', page: 'settings', group: 'Sistem' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, collapsed, setCollapsed }) => {
  const groups = [...new Set(menuItems.map(m => m.group))];

  return (
    <aside className={`fixed left-0 top-0 h-screen z-50 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-orange-500/10 flex flex-col`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-orange-500/10">
        <div className="w-9 h-9 rounded-xl gradient-orange flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
          <Coffee size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-sm text-white leading-tight">SMP</h1>
            <p className="text-[10px] text-orange-400">Sarapan Murah Pagi</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {groups.map(group => (
          <div key={group} className="mb-3">
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-3 mb-1">{group}</p>
            )}
            {menuItems.filter(m => m.group === group).map(item => (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-all duration-200 text-sm ${
                  currentPage === item.page
                    ? 'bg-orange-500/20 text-orange-400 shadow-lg shadow-orange-500/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="animate-fade-in truncate">{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-orange-500/10 text-slate-500 hover:text-orange-400 transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
};
