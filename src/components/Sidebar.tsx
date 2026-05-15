import { 
  LayoutDashboard, Store, Users, Package, ShoppingCart, 
  BarChart3, TrendingUp, Map, FileText, Bell, Settings,
  ChevronLeft, ChevronRight, Warehouse, Menu, X, LogOut, User as UserIcon
} from 'lucide-react';
import { Page } from '../types';
import { User, UserRole, roleLabels, roleColors } from '../auth';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  page: Page;
  badge?: string;
  roles: UserRole[]; // which roles can see this menu
}

const allMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard', roles: ['owner', 'manager_wilayah', 'pic_cabang'] },
  { icon: ShoppingCart, label: 'Kasir Express', page: 'kasir', badge: '⚡', roles: ['owner', 'manager_wilayah', 'pic_cabang', 'kasir'] },
  { icon: Store, label: 'Cabang', page: 'branches', roles: ['owner', 'manager_wilayah'] },
  { icon: Map, label: 'Wilayah', page: 'regions', roles: ['owner'] },
  { icon: Users, label: 'Supplier', page: 'suppliers', roles: ['owner', 'manager_wilayah', 'pic_cabang'] },
  { icon: Package, label: 'Produk', page: 'products', roles: ['owner', 'manager_wilayah', 'pic_cabang'] },
  { icon: Warehouse, label: 'Stok & Retur', page: 'stock', roles: ['owner', 'manager_wilayah', 'pic_cabang'] },
  { icon: FileText, label: 'Transaksi', page: 'transactions', roles: ['owner', 'manager_wilayah', 'pic_cabang'] },
  { icon: TrendingUp, label: 'Demand Testing', page: 'demand', roles: ['owner'] },
  { icon: BarChart3, label: 'Laporan', page: 'reports', roles: ['owner', 'manager_wilayah'] },
  { icon: Bell, label: 'Notifikasi', page: 'notifications', roles: ['owner', 'manager_wilayah'] },
  { icon: Settings, label: 'Pengaturan', page: 'settings', roles: ['owner'] },
];

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  user: User;
  onLogout: () => void;
  branchCount: number;
}

export default function Sidebar({ 
  currentPage, onPageChange, collapsed, onToggle, 
  mobileOpen, onMobileClose, user, onLogout, branchCount 
}: SidebarProps) {
  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => item.roles.includes(user.role));

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />
      )}
      
      <aside className={`
        fixed top-0 left-0 h-full bg-gradient-to-b from-orange-600 via-orange-700 to-red-700 text-white z-50
        transition-all duration-300 flex flex-col
        ${collapsed ? 'w-20' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-orange-500/30">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-2xl">🍳</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg leading-tight">SMP</h1>
              <p className="text-orange-200 text-[10px] leading-tight">Sarapan Murah Pagi</p>
            </div>
          )}
          <button onClick={onMobileClose} className="ml-auto lg:hidden p-1 hover:bg-orange-500/30 rounded">
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className={`p-3 border-b border-orange-500/30 ${collapsed ? 'px-2' : ''}`}>
          {collapsed ? (
            <div className="w-10 h-10 bg-orange-500/30 rounded-xl flex items-center justify-center mx-auto">
              <UserIcon size={18} />
            </div>
          ) : (
            <div className="bg-orange-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <UserIcon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  <p className="text-orange-200 text-[10px]">{roleLabels[user.role]}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => { onPageChange(item.page); onMobileClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm
                  ${isActive 
                    ? 'bg-white text-orange-700 shadow-lg font-semibold' 
                    : 'text-orange-100 hover:bg-orange-500/30'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && <span className="text-xs">{item.badge}</span>}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-2 border-t border-orange-500/30">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-orange-200 hover:bg-red-500/30 hover:text-white transition-all text-sm ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>

        {/* Collapse button (desktop only) */}
        <div className="hidden lg:block p-3 border-t border-orange-500/30">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl hover:bg-orange-500/30 text-orange-200 text-sm transition-all"
          >
            {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Tutup Menu</span></>}
          </button>
        </div>

        {/* Target counter - Owner only */}
        {!collapsed && user.role === 'owner' && (
          <div className="p-3 mx-2 mb-3 bg-orange-500/20 rounded-xl border border-orange-400/20">
            <div className="text-xs text-orange-200">Target Cabang</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold">{branchCount}</span>
              <span className="text-orange-300 text-sm">/ 100</span>
            </div>
            <div className="w-full bg-orange-900/30 rounded-full h-2 mt-2">
              <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${Math.min(branchCount, 100)}%` }}></div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export function MobileHeader({ onMenuOpen, title, user }: { onMenuOpen: () => void; title: string; user: User }) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center px-4 gap-3">
      <button onClick={onMenuOpen} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
        <Menu size={22} />
      </button>
      <div className="flex items-center gap-2 flex-1">
        <span className="text-xl">🍳</span>
        <span className="font-bold text-gray-800">{title}</span>
      </div>
      <span className={`text-[10px] px-2 py-1 rounded-lg border ${roleColors[user.role]}`}>
        {user.role === 'owner' ? '👑' : user.role === 'manager_wilayah' ? '📍' : user.role === 'pic_cabang' ? '🏪' : '🧑‍💼'}
      </span>
    </div>
  );
}
