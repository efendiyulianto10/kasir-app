import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { StockIn } from './pages/StockIn';
import { Suppliers } from './pages/Suppliers';
import { Products } from './pages/Products';
import { Transactions } from './pages/Transactions';
import { Reports } from './pages/Reports';
import { Branches } from './pages/Branches';
import { Login } from './pages/Login';
import { SupplierPortal } from './pages/SupplierPortal';
import { useAuthStore, useSyncStore } from './store';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Layout wrapper for authenticated pages
const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
};

function App() {
  const { isAuthenticated } = useAuthStore();
  const { setOnline } = useSyncStore();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
        />

        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/pos" 
          element={
            <AuthenticatedLayout>
              <POS />
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/stock-in" 
          element={
            <AuthenticatedLayout>
              <StockIn />
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/suppliers" 
          element={
            <AuthenticatedLayout>
              <Suppliers />
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/products" 
          element={
            <AuthenticatedLayout>
              <Products />
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/transactions" 
          element={
            <AuthenticatedLayout>
              <Transactions />
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <AuthenticatedLayout>
              <Reports />
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/branches" 
          element={
            <AuthenticatedLayout>
              <Branches />
            </AuthenticatedLayout>
          } 
        />

        {/* Supplier Portal - standalone without sidebar */}
        <Route 
          path="/supplier-portal" 
          element={
            <ProtectedRoute>
              <SupplierPortal />
            </ProtectedRoute>
          } 
        />

        {/* Placeholder routes */}
        <Route 
          path="/users" 
          element={
            <AuthenticatedLayout>
              <PlaceholderPage title="Manajemen Pengguna" icon="👥" />
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <AuthenticatedLayout>
              <PlaceholderPage title="Notifikasi" icon="🔔" />
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <AuthenticatedLayout>
              <PlaceholderPage title="Pengaturan" icon="⚙️" />
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/security" 
          element={
            <AuthenticatedLayout>
              <PlaceholderPage title="Keamanan" icon="🔒" />
            </AuthenticatedLayout>
          } 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Placeholder component for pages not yet implemented
const PlaceholderPage: React.FC<{ title: string; icon: string }> = ({ title, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
      <span className="text-6xl mb-4">{icon}</span>
      <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
      <p className="mt-2">Halaman ini sedang dalam pengembangan</p>
    </div>
  );
};

export default App;
