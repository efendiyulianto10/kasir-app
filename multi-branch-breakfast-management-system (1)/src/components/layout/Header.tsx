import React, { useState, useEffect } from 'react';
import { Bell, Search, Wifi, WifiOff, Clock, Menu } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore, useUIStore, useSyncStore, useDashboardStore } from '../../store';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const Header: React.FC = () => {
  const { branch } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { isOnline, lastSyncAt } = useSyncStore();
  const { alerts } = useDashboardStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  const unresolvedAlerts = alerts.filter(a => !a.is_resolved).length;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getOperatingStatus = () => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const timeInMinutes = hour * 60 + minute;
    
    // Operating hours: 04:30 - 09:00
    const openTime = 4 * 60 + 30; // 04:30
    const closeTime = 9 * 60; // 09:00
    const peakStart = 5 * 60; // 05:00
    const peakEnd = 7 * 60 + 30; // 07:30

    if (timeInMinutes < openTime || timeInMinutes > closeTime) {
      return { status: 'closed', label: 'TUTUP', color: 'bg-gray-500' };
    }
    if (timeInMinutes >= peakStart && timeInMinutes <= peakEnd) {
      return { status: 'peak', label: 'PEAK HOUR 🔥', color: 'bg-red-500' };
    }
    return { status: 'open', label: 'BUKA', color: 'bg-green-500' };
  };

  const opStatus = getOperatingStatus();

  return (
    <header className={cn(
      'fixed top-0 right-0 h-16 bg-white border-b border-gray-100 z-30 transition-all duration-300',
      sidebarOpen ? 'left-64' : 'left-20'
    )}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          
          <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari produk, supplier, transaksi..."
              className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Center - Branch Info */}
        {branch && (
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold text-gray-900">{branch.name}</p>
              <p className="text-xs text-gray-500">{branch.code} • {branch.city}</p>
            </div>
            <div className={cn('px-3 py-1 rounded-full text-white text-xs font-bold', opStatus.color)}>
              {opStatus.label}
            </div>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Current Time */}
          <div className="hidden sm:flex items-center gap-2 text-gray-600">
            <Clock size={16} />
            <span className="font-mono font-medium">
              {format(currentTime, 'HH:mm:ss')}
            </span>
          </div>

          {/* Online Status */}
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
            isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Bell size={20} className="text-gray-600" />
            {unresolvedAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unresolvedAlerts}
              </span>
            )}
          </button>

          {/* Last Sync */}
          {lastSyncAt && (
            <div className="hidden md:block text-xs text-gray-400">
              Sync: {format(new Date(lastSyncAt), 'HH:mm', { locale: id })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
