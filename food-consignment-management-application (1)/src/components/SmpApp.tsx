import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Store, Users, Warehouse,
  TrendingUp, Shield, Settings, Menu, X, LogOut, ArrowLeft,
  User as UserIcon, ChevronLeft, BookOpen
} from 'lucide-react';
import { SmpPage, Branch, Region, Supplier, Product, DailyTransaction, DailyStock, DemandTest, Notification } from '../types';
import { User, UserRole, roleLabels } from '../auth';
import { getLogs } from '../logger';
import Dashboard from './Dashboard';
import Kasir from './Kasir';
import Branches from './Branches';
import Suppliers from './Suppliers';
import StockRetur from './StockRetur';
import DemandTesting from './DemandTesting';
import AuditDashboard from './AuditDashboard';
import Logbook from './Logbook';
import SettingsPage from './Settings';

interface MenuDef { icon: React.ElementType; label: string; page: SmpPage; roles: UserRole[] }

const MENUS: MenuDef[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard', roles: ['owner', 'manager_wilayah', 'pic_cabang'] },
  { icon: ShoppingCart, label: 'Kasir', page: 'kasir', roles: ['owner', 'manager_wilayah', 'pic_cabang', 'kasir'] },
  { icon: Store, label: 'Cabang', page: 'cabang', roles: ['owner', 'manager_wilayah'] },
  { icon: Users, label: 'Supplier', page: 'supplier', roles: ['owner', 'manager_wilayah', 'pic_cabang'] },
  { icon: Warehouse, label: 'Stok & Retur', page: 'stok', roles: ['owner', 'manager_wilayah', 'pic_cabang'] },
  { icon: TrendingUp, label: 'Demand Test', page: 'demand', roles: ['owner'] },
  { icon: BookOpen, label: 'Logbook', page: 'logbook', roles: ['owner', 'manager_wilayah'] },
  { icon: Shield, label: 'Audit', page: 'audit', roles: ['owner', 'auditor'] },
  { icon: Settings, label: 'Pengaturan', page: 'settings', roles: ['owner'] },
];

interface Props {
  user: User;
  page: SmpPage;
  setPage: (p: SmpPage) => void;
  data: { branches: Branch[]; regions: Region[]; suppliers: Supplier[]; products: Product[]; transactions: DailyTransaction[]; stock: DailyStock[] };
  allData: { branches: Branch[]; regions: Region[]; suppliers: Supplier[]; products: Product[]; transactions: DailyTransaction[]; stock: DailyStock[]; demandTests: DemandTest[]; notifications: Notification[]; users: User[] };
  onAddTx: (tx: DailyTransaction) => void;
  onSaveBranches: (d: Branch[]) => void;
  onSaveRegions: (d: Region[]) => void;
  onSaveSuppliers: (d: Supplier[]) => void;
  onSaveProducts: (d: Product[]) => void;
  onSaveStock: (d: DailyStock[]) => void;
  onSaveDemandTests: (d: DemandTest[]) => void;
  onSaveNotifications: (d: Notification[]) => void;
  onSaveUsers: (d: User[]) => void;
  onLogout: () => void;
  onBackToSabiquna?: () => void;
}

export default function SmpApp({ user, page, setPage, data, allData, onAddTx, onSaveBranches, onSaveSuppliers, onSaveStock, onSaveDemandTests, onLogout, onBackToSabiquna }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menus = MENUS.filter(m => m.roles.includes(user.role));

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard branches={data.branches} transactions={data.transactions} suppliers={data.suppliers} demandTests={allData.demandTests} />;
      case 'kasir':
        return <Kasir products={data.products.length > 0 ? data.products : allData.products} branches={data.branches.length > 0 ? data.branches : allData.branches.filter(b => b.status === 'active')} transactions={data.transactions} onSubmitTransaction={onAddTx} />;
      case 'cabang':
        return <Branches branches={data.branches} regions={data.regions} onSave={onSaveBranches} />;
      case 'supplier':
        return <Suppliers suppliers={data.suppliers} branches={data.branches} onSave={onSaveSuppliers} />;
      case 'stok':
        return <StockRetur stock={data.stock} branches={data.branches} products={data.products} suppliers={data.suppliers} onSave={onSaveStock} />;
      case 'demand':
        return <DemandTesting demandTests={allData.demandTests} branches={allData.branches} transactions={allData.transactions} onSave={onSaveDemandTests} />;
      case 'logbook':
        return <Logbook logs={getLogs()} branches={allData.branches} users={allData.users} currentUser={user} />;
      case 'audit':
        return <AuditDashboard branches={allData.branches} regions={allData.regions} demandTests={allData.demandTests} />;
      case 'settings':
        return <SettingsPage user={user} branches={allData.branches} regions={allData.regions} suppliers={allData.suppliers} products={allData.products} transactions={allData.transactions} users={allData.users} onLogout={onLogout} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-orange-600 via-orange-700 to-red-700 text-white z-50 transition-all duration-300 flex flex-col ${collapsed ? 'w-16' : 'w-56'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-3 flex items-center gap-2 border-b border-orange-500/30">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0"><span className="text-xl">🍳</span></div>
          {!collapsed && <div><h1 className="font-bold text-sm leading-tight">SMP</h1><p className="text-orange-200 text-[9px]">Sarapan Murah Pagi</p></div>}
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden p-1 hover:bg-orange-500/30 rounded"><X size={18} /></button>
        </div>

        {onBackToSabiquna && !collapsed && (
          <button onClick={onBackToSabiquna} className="mx-2 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-orange-200 hover:bg-orange-500/30 text-xs"><ArrowLeft size={14} /> Sabiquna</button>
        )}

        {!collapsed && (
          <div className="p-2 mx-2 mt-1 bg-orange-500/20 rounded-xl">
            <div className="flex items-center gap-2"><UserIcon size={14} /><div className="min-w-0"><p className="text-xs font-medium truncate">{user.name}</p><p className="text-orange-200 text-[9px]">{roleLabels[user.role]}</p></div></div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
          {menus.map(m => {
            const Icon = m.icon;
            const active = page === m.page;
            return (
              <button key={m.page} onClick={() => { setPage(m.page); setMobileOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${active ? 'bg-white text-orange-700 font-semibold shadow' : 'text-orange-100 hover:bg-orange-500/30'} ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? m.label : undefined}>
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{m.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-1.5 border-t border-orange-500/30">
          <button onClick={onLogout} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-orange-200 hover:bg-red-500/30 text-sm ${collapsed ? 'justify-center' : ''}`}><LogOut size={16} />{!collapsed && <span>Keluar</span>}</button>
        </div>
        <div className="hidden lg:block p-1.5 border-t border-orange-500/30">
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-orange-500/30 text-orange-200">
            <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b z-30 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Menu size={20} /></button>
        <span className="text-lg">🍳</span>
        <span className="font-bold text-gray-800 text-sm">{MENUS.find(m => m.page === page)?.label || 'SMP'}</span>
      </div>

      <main className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${collapsed ? 'lg:ml-16' : 'lg:ml-56'}`}>
        <div className="p-4 lg:p-5 max-w-[1300px]">{renderPage()}</div>
      </main>
    </div>
  );
}
