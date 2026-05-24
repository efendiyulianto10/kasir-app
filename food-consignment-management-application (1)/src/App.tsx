import { useState, useCallback, useEffect, useMemo } from 'react';
import { AppView, SmpPage, DailyTransaction } from './types';
import {
  getRegions, saveRegions, getBranches, saveBranches,
  getSuppliers, saveSuppliers, getProducts, saveProducts,
  getTransactions, saveTransactions, getStock, saveStock,
  getDemandTests, saveDemandTests, getNotifications, saveNotifications,
} from './store';
import { User, getCurrentUser, setCurrentUser, logout, getUsers, saveUsers } from './auth';
import { logAuth, logTx } from './logger';
import Login from './components/Login';
import SabiqunaHoldings from './components/SabiqunaHoldings';
import SmpApp from './components/SmpApp';

export default function App() {
  const [user, setUser] = useState<User | null>(getCurrentUser);
  const [view, setView] = useState<AppView>('sabiquna');
  const [smpPage, setSmpPage] = useState<SmpPage>('dashboard');

  // Data
  const [regions, setRegions] = useState(getRegions);
  const [branches, setBranches] = useState(getBranches);
  const [suppliers, setSuppliers] = useState(getSuppliers);
  const [products, setProducts] = useState(getProducts);
  const [transactions, setTransactions] = useState(getTransactions);
  const [stock, setStockData] = useState(getStock);
  const [demandTests, setDemandTests] = useState(getDemandTests);
  const [notifications, setNotifications] = useState(getNotifications);
  const [users, setUsersState] = useState(getUsers);

  // Auto-save
  useEffect(() => { saveRegions(regions); }, [regions]);
  useEffect(() => { saveBranches(branches); }, [branches]);
  useEffect(() => { saveSuppliers(suppliers); }, [suppliers]);
  useEffect(() => { saveProducts(products); }, [products]);
  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveStock(stock); }, [stock]);
  useEffect(() => { saveDemandTests(demandTests); }, [demandTests]);
  useEffect(() => { saveNotifications(notifications); }, [notifications]);
  useEffect(() => { saveUsers(users); }, [users]);

  // Filter data by role
  const filteredData = useMemo(() => {
    if (!user) return { branches: [], suppliers: [], products: [], transactions: [], stock: [], regions: [] };
    let fb = branches, fr = regions;
    if (user.role === 'manager_wilayah' && user.regionId) {
      fb = branches.filter(b => b.regionId === user.regionId);
      fr = regions.filter(r => r.id === user.regionId);
    }
    if ((user.role === 'pic_cabang' || user.role === 'kasir') && user.branchId) {
      fb = branches.filter(b => b.id === user.branchId);
      const br = branches.find(b => b.id === user.branchId);
      if (br) fr = regions.filter(r => r.id === br.regionId);
    }
    const ids = fb.map(b => b.id);
    return {
      branches: fb, regions: fr,
      suppliers: suppliers.filter(s => user.role === 'owner' || ids.includes(s.branchId)),
      products: products.filter(p => user.role === 'owner' || ids.includes(p.branchId)),
      transactions: transactions.filter(t => user.role === 'owner' || ids.includes(t.branchId)),
      stock: stock.filter(s => user.role === 'owner' || ids.includes(s.branchId)),
    };
  }, [user, branches, regions, suppliers, products, transactions, stock]);

  const handleLogin = useCallback((u: User) => {
    setCurrentUser(u); setUser(u);
    logAuth(u, 'login');
    if (u.role === 'owner') { setView('sabiquna'); }
    else { setView('smp'); setSmpPage(u.role === 'kasir' ? 'kasir' : u.role === 'auditor' ? 'audit' : 'dashboard'); }
  }, []);

  const handleLogout = useCallback(() => {
    if (user) logAuth(user, 'logout');
    logout(); setUser(null);
  }, [user]);

  const handleAddTx = useCallback((tx: DailyTransaction) => {
    setTransactions(prev => [tx, ...prev]);
    if (user) {
      const br = branches.find(b => b.id === tx.branchId);
      logTx(user, `${tx.items.length} item, ${tx.paymentMethod}`, tx.branchId, br?.name || '', tx.totalAmount);
    }
  }, [user, branches]);

  if (!user) return <Login onLogin={handleLogin} />;

  // Owner: Sabiquna → drill into SMP
  // Others: SMP directly
  if (view === 'sabiquna' && user.role === 'owner') {
    return (
      <SabiqunaHoldings
        user={user}
        transactions={transactions}
        branches={branches}
        suppliers={suppliers}
        products={products}
        demandTests={demandTests}
        onEnterSmp={() => { setView('smp'); setSmpPage('dashboard'); }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <SmpApp
      user={user}
      page={smpPage}
      setPage={setSmpPage}
      data={filteredData}
      allData={{ branches, regions, suppliers, products, transactions, stock, demandTests, notifications, users }}
      onAddTx={handleAddTx}
      onSaveBranches={setBranches}
      onSaveRegions={setRegions}
      onSaveSuppliers={setSuppliers}
      onSaveProducts={setProducts}
      onSaveStock={setStockData}
      onSaveDemandTests={setDemandTests}
      onSaveNotifications={setNotifications}
      onSaveUsers={setUsersState}
      onLogout={handleLogout}
      onBackToSabiquna={user.role === 'owner' ? () => setView('sabiquna') : undefined}
    />
  );
}
