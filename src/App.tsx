import { useState, useCallback, useEffect, useMemo } from 'react';
import { Page, DailyTransaction, Branch, Supplier, Product, DailyStock, Region } from './types';
import {
  getRegions, saveRegions,
  getBranches, saveBranches,
  getSuppliers, saveSuppliers,
  getProducts, saveProducts,
  getTransactions, saveTransactions,
  getStock, saveStock,
  getDemandTests, saveDemandTests,
  getNotifications, saveNotifications,
} from './store';
import { User, getCurrentUser, setCurrentUser, logout, getUsers, saveUsers } from './auth';
import Login from './components/Login';
import Sidebar, { MobileHeader } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Kasir from './components/Kasir';
import Branches from './components/Branches';
import Suppliers from './components/Suppliers';
import Products from './components/Products';
import StockRetur from './components/StockRetur';
import Transactions from './components/Transactions';
import DemandTesting from './components/DemandTesting';
import Regions from './components/Regions';
import Reports from './components/Reports';
import Notifications from './components/Notifications';
import Settings from './components/Settings';

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  kasir: 'Kasir Express',
  branches: 'Cabang',
  regions: 'Wilayah',
  suppliers: 'Supplier',
  products: 'Produk',
  stock: 'Stok & Retur',
  transactions: 'Transaksi',
  demand: 'Demand Testing',
  reports: 'Laporan',
  notifications: 'Notifikasi',
  settings: 'Pengaturan',
};

// Default page per role
const defaultPages: Record<string, Page> = {
  owner: 'dashboard',
  manager_wilayah: 'dashboard',
  pic_cabang: 'kasir',
  kasir: 'kasir',
};

export default function App() {
  const [user, setUser] = useState<User | null>(getCurrentUser);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data state
  const [regions, setRegions] = useState(getRegions);
  const [branches, setBranches] = useState(getBranches);
  const [suppliers, setSuppliers] = useState(getSuppliers);
  const [products, setProducts] = useState(getProducts);
  const [transactions, setTransactions] = useState(getTransactions);
  const [stock, setStockData] = useState(getStock);
  const [demandTests, setDemandTests] = useState(getDemandTests);
  const [notifications, setNotifications] = useState(getNotifications);
  const [users, setUsersState] = useState(getUsers);

  // Auto-save to localStorage on changes
  useEffect(() => { saveRegions(regions); }, [regions]);
  useEffect(() => { saveBranches(branches); }, [branches]);
  useEffect(() => { saveSuppliers(suppliers); }, [suppliers]);
  useEffect(() => { saveProducts(products); }, [products]);
  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveStock(stock); }, [stock]);
  useEffect(() => { saveDemandTests(demandTests); }, [demandTests]);
  useEffect(() => { saveNotifications(notifications); }, [notifications]);
  useEffect(() => { saveUsers(users); }, [users]);

  // Filter data based on user role
  const filteredData = useMemo(() => {
    if (!user) return { branches: [], suppliers: [], products: [], transactions: [], stock: [], regions: [] };

    let filteredBranches = branches;
    let filteredRegions = regions;

    // Manager Wilayah: only see branches in their region
    if (user.role === 'manager_wilayah' && user.regionId) {
      filteredBranches = branches.filter(b => b.regionId === user.regionId);
      filteredRegions = regions.filter(r => r.id === user.regionId);
    }

    // PIC Cabang & Kasir: only see their branch
    if ((user.role === 'pic_cabang' || user.role === 'kasir') && user.branchId) {
      filteredBranches = branches.filter(b => b.id === user.branchId);
      // Find the region of the branch
      const branch = branches.find(b => b.id === user.branchId);
      if (branch) {
        filteredRegions = regions.filter(r => r.id === branch.regionId);
      }
    }

    const branchIds = filteredBranches.map(b => b.id);

    return {
      branches: filteredBranches,
      regions: filteredRegions,
      suppliers: suppliers.filter(s => user.role === 'owner' || branchIds.includes(s.branchId)),
      products: products.filter(p => user.role === 'owner' || branchIds.includes(p.branchId)),
      transactions: transactions.filter(t => user.role === 'owner' || branchIds.includes(t.branchId)),
      stock: stock.filter(s => user.role === 'owner' || branchIds.includes(s.branchId)),
    };
  }, [user, branches, regions, suppliers, products, transactions, stock]);

  const handleLogin = useCallback((loggedInUser: User) => {
    setCurrentUser(loggedInUser);
    setUser(loggedInUser);
    setCurrentPage(defaultPages[loggedInUser.role] || 'dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
    setCurrentPage('dashboard');
  }, []);

  const handleSubmitTransaction = useCallback((tx: DailyTransaction) => {
    setTransactions(prev => [tx, ...prev]);
  }, []);

  // Handle save functions
  const handleSaveBranches = useCallback((data: Branch[]) => {
    setBranches(data);
  }, []);

  const handleSaveRegions = useCallback((data: Region[]) => {
    setRegions(data);
  }, []);

  const handleSaveSuppliers = useCallback((data: Supplier[]) => {
    setSuppliers(data);
  }, []);

  const handleSaveProducts = useCallback((data: Product[]) => {
    setProducts(data);
  }, []);

  const handleSaveStock = useCallback((data: DailyStock[]) => {
    setStockData(data);
  }, []);

  const handleUpdateUsers = useCallback((data: User[]) => {
    setUsersState(data);
  }, []);

  // Data management functions for admin
  const handleResetData = useCallback(() => {
    const keys = ['regions', 'branches', 'suppliers', 'products', 'transactions', 'stock', 'demand_tests', 'notifications', 'users', 'current_user'];
    keys.forEach(key => localStorage.removeItem(`smp_${key}`));
    window.location.reload();
  }, []);

  const handleExportData = useCallback(() => {
    const keys = ['regions', 'branches', 'suppliers', 'products', 'transactions', 'stock', 'demand_tests', 'notifications', 'users'];
    const data: Record<string, unknown> = {};
    keys.forEach(key => {
      const val = localStorage.getItem(`smp_${key}`);
      if (val) data[key] = JSON.parse(val);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-smp-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }, []);

  const handleImportData = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(`smp_${key}`, JSON.stringify(value));
        });
        alert('Data berhasil diimport! Halaman akan di-refresh.');
        window.location.reload();
      } catch {
        alert('File tidak valid!');
      }
    };
    reader.readAsText(file);
  }, []);

  // If not logged in, show login page
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            branches={filteredData.branches} 
            transactions={filteredData.transactions} 
            suppliers={filteredData.suppliers} 
            demandTests={user.role === 'owner' ? demandTests : demandTests.filter(d => filteredData.branches.some(b => b.id === d.branchId))}
            user={user}
            allBranches={branches}
            allRegions={regions}
            allProducts={products}
            users={users}
            onUpdateUsers={handleUpdateUsers}
            onUpdateBranches={handleSaveBranches}
            onUpdateRegions={handleSaveRegions}
            onResetData={handleResetData}
            onExportData={handleExportData}
            onImportData={handleImportData}
          />
        );
      case 'kasir':
        return (
          <Kasir 
            products={filteredData.products.length > 0 ? filteredData.products : products} 
            branches={filteredData.branches.length > 0 ? filteredData.branches : branches.filter(b => b.status === 'active')} 
            onSubmitTransaction={handleSubmitTransaction} 
          />
        );
      case 'branches':
        return (
          <Branches 
            branches={filteredData.branches} 
            regions={filteredData.regions} 
            onSave={handleSaveBranches} 
          />
        );
      case 'suppliers':
        return (
          <Suppliers 
            suppliers={filteredData.suppliers} 
            branches={filteredData.branches} 
            onSave={handleSaveSuppliers} 
          />
        );
      case 'products':
        return (
          <Products 
            products={filteredData.products} 
            suppliers={filteredData.suppliers} 
            branches={filteredData.branches} 
            onSave={handleSaveProducts} 
          />
        );
      case 'stock':
        return (
          <StockRetur 
            stock={filteredData.stock} 
            branches={filteredData.branches} 
            products={filteredData.products} 
            suppliers={filteredData.suppliers} 
            onSave={handleSaveStock} 
          />
        );
      case 'transactions':
        return (
          <Transactions 
            transactions={filteredData.transactions} 
            branches={filteredData.branches} 
          />
        );
      case 'demand':
        return (
          <DemandTesting 
            demandTests={demandTests} 
            branches={branches}
            transactions={transactions}
            onSave={setDemandTests} 
          />
        );
      case 'regions':
        return (
          <Regions 
            regions={regions} 
            branches={branches} 
            transactions={transactions} 
            onSave={handleSaveRegions} 
          />
        );
      case 'reports':
        return (
          <Reports 
            transactions={filteredData.transactions} 
            branches={filteredData.branches} 
            suppliers={filteredData.suppliers} 
          />
        );
      case 'notifications':
        return (
          <Notifications 
            notifications={notifications} 
            branches={filteredData.branches} 
            transactions={filteredData.transactions} 
            onSave={setNotifications} 
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return (
          <Dashboard 
            branches={filteredData.branches} 
            transactions={filteredData.transactions} 
            suppliers={filteredData.suppliers} 
            demandTests={demandTests}
            user={user}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
        branchCount={branches.length}
      />
      
      <MobileHeader 
        onMenuOpen={() => setMobileMenuOpen(true)} 
        title={pageTitles[currentPage]}
        user={user}
      />

      <main className={`
        transition-all duration-300 min-h-screen
        pt-16 lg:pt-0
        ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
      `}>
        <div className="p-4 lg:p-6 max-w-[1400px]">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
