import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../store';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main className={cn(
        'pt-16 min-h-screen transition-all duration-300',
        sidebarOpen ? 'ml-64' : 'ml-20'
      )}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
