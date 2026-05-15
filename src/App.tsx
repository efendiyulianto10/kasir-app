import { useState, useCallback, useEffect } from 'react';
import { Page, DailyTransaction } from './types';
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

export default function App() {
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

  // Auto-save to localStorage on changes
  useEffect(() => { saveRegions(regions); }, [regions]);
  useEffect(() => { saveBranches(branches); }, [branches]);
  useEffect(() => { saveSuppliers(suppliers); }, [suppliers]);
  useEffect(() => { saveProducts(products); }, [products]);
  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveStock(stock); }, [stock]);
  useEffect(() => { saveDemandTests(demandTests); }, [demandTests]);
  useEffect(() => { saveNotifications(notifications); }, [notifications]);

  const handleSubmitTransaction = useCallback((tx: DailyTransaction) => {
    setTransactions(prev => [tx, ...prev]);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard branches={branches} transactions={transactions} suppliers={suppliers} demandTests={demandTests} />;
      case 'kasir':
        return <Kasir products={products} branches={branches} onSubmitTransaction={handleSubmitTransaction} />;
      case 'branches':
        return <Branches branches={branches} regions={regions} onSave={setBranches} />;
      case 'suppliers':
        return <Suppliers suppliers={suppliers} branches={branches} onSave={setSuppliers} />;
      case 'products':
        return <Products products={products} suppliers={suppliers} branches={branches} onSave={setProducts} />;
      case 'stock':
        return <StockRetur stock={stock} branches={branches} products={products} suppliers={suppliers} onSave={setStockData} />;
      case 'transactions':
        return <Transactions transactions={transactions} branches={branches} />;
      case 'demand':
        return <DemandTesting demandTests={demandTests} branches={branches} onSave={setDemandTests} />;
      case 'regions':
        return <Regions regions={regions} branches={branches} transactions={transactions} onSave={setRegions} />;
      case 'reports':
        return <Reports transactions={transactions} branches={branches} suppliers={suppliers} />;
      case 'notifications':
        return <Notifications notifications={notifications} branches={branches} transactions={transactions} onSave={setNotifications} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard branches={branches} transactions={transactions} suppliers={suppliers} demandTests={demandTests} />;
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
      />
      
      <MobileHeader 
        onMenuOpen={() => setMobileMenuOpen(true)} 
        title={pageTitles[currentPage]} 
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
