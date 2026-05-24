import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  BarChart3, 
  Settings,
  Store,
  Map,
  Bell,
  LogOut,
  ChevronLeft,
  Truck,
  FileText,
  Shield
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { label: 'Kasir POS', icon: <ShoppingCart size={20} />, path: '/pos', roles: ['kasir', 'supervisor'] },
  { label: 'Stok Masuk', icon: <Package size={20} />, path: '/stock-in', roles: ['kasir', 'supervisor'] },
  { label: 'Supplier', icon: <Truck size={20} />, path: '/suppliers' },
  { label: 'Produk', icon: <Store size={20} />, path: '/products' },
  { label: 'Transaksi', icon: <FileText size={20} />, path: '/transactions' },
  { label: 'Laporan', icon: <BarChart3 size={20} />, path: '/reports' },
  { label: 'Multi Cabang', icon: <Map size={20} />, path: '/branches', roles: ['ceo', 'hq_admin', 'area_manager', 'investor'] },
  { label: 'Pengguna', icon: <Users size={20} />, path: '/users', roles: ['supervisor', 'owner_cabang', 'hq_admin'] },
  { label: 'Keamanan', icon: <Shield size={20} />, path: '/security', roles: ['hq_admin', 'ceo'] },
  { label: 'Notifikasi', icon: <Bell size={20} />, path: '/notifications' },
  { label: 'Pengaturan', icon: <Settings size={20} />, path: '/settings' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside 
      className={cn(
        'fixed left-0 top-0 h-full bg-gray-900 text-white z-40 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center font-bold text-lg">
            S
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-lg leading-tight">SMP</h1>
              <p className="text-xs text-gray-400">Sarapan Murah Pagi</p>
            </div>
          )}
        </Link>
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft 
            size={20} 
            className={cn('transition-transform', !sidebarOpen && 'rotate-180')} 
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto h-[calc(100vh-8rem)]">
        <ul className="space-y-1 px-3">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    isActive 
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  {item.icon}
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role || 'Guest'}</p>
            </div>
          )}
          <button 
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};
