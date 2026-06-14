import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import type { PageType } from '../types';

interface HeaderProps {
  currentPage: PageType;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const pageTitles: Record<PageType, string> = {
  dashboard: 'Dashboard',
  pos: 'Kasir (Point of Sale)',
  menu: 'Daftar Menu',
  branches: 'Manajemen Cabang',
  employees: 'Manajemen Karyawan',
  transactions: 'Riwayat Transaksi',
  expenses: 'Pengeluaran',
  reports: 'Laporan & Analitik',
  'ai-assistant': 'AI Business Assistant',
  telegram: 'Telegram Bot & Grup',
  settings: 'Pengaturan',
  backup: 'Backup Database',
  consignment: 'Konsinyasi & Supplier',
};

export const Header: React.FC<HeaderProps> = ({ currentPage, sidebarCollapsed, onToggleSidebar }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
      <div className="glass px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onToggleSidebar} className="lg:hidden text-slate-400 hover:text-orange-400">
            <Menu size={22} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">{pageTitles[currentPage]}</h2>
            <p className="text-xs text-slate-400">{dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Cari..."
              className="bg-transparent border-none text-sm text-slate-300 placeholder-slate-500 w-40 focus:outline-none !border-0 !shadow-none"
              style={{ border: 'none', boxShadow: 'none' }}
            />
          </div>
          <button className="relative p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-orange-400 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-orange flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
