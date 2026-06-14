import { useState, useCallback } from 'react';
import type { Branch, Transaction, Employee, Expense, Supplier, Inventory, Settings, ChatMessage } from '../types';
import type { ConsignmentSupplier, ConsignmentForm } from '../types/consignment';
import { v4 as uuidv4 } from 'uuid';

// Harga tetap SMP
export const SMP_PRICE = {
  SELL: 10000,  // Harga jual ke pelanggan
  BUY: 9000,    // Bayar ke supplier
  PROFIT: 1000, // Keuntungan SMP per item
};

const DEFAULT_SETTINGS: Settings = {
  googleSheetUrl: '',
  googleAppsScriptUrl: '',
  groqApiKey: '',
  telegramBotToken: '',
  telegramChatId: '',
  telegramGroupLink: '',
  autoBackupEnabled: false,
  backupInterval: 60,
  businessName: 'SMP - Sarapan Murah Pagi',
};

const SAMPLE_BRANCHES: Branch[] = [
  { id: 'b1', name: 'SMP Pusat - Jakarta', address: 'Jl. Sudirman No. 1, Jakarta', phone: '08123456789', manager: 'Ahmad Rizki', type: 'macro', isActive: true, createdAt: '2024-01-01' },
  { id: 'b2', name: 'SMP Cabang Bandung', address: 'Jl. Braga No. 10, Bandung', phone: '08234567890', manager: 'Siti Nurhaliza', type: 'meso', isActive: true, createdAt: '2024-03-15' },
  { id: 'b3', name: 'SMP Cabang Surabaya', address: 'Jl. Tunjungan No. 5, Surabaya', phone: '08345678901', manager: 'Budi Santoso', type: 'micro', isActive: true, createdAt: '2024-06-01' },
];

// Supplier = Masyarakat sekitar yang titip makanan
const SAMPLE_CONSIGNMENT_SUPPLIERS: ConsignmentSupplier[] = [
  {
    id: 'cs1',
    name: 'Bu Warni',
    phone: '08123456789',
    products: [
      { id: 'p1', name: 'Nasi Uduk Komplit', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
      { id: 'p2', name: 'Nasi Kuning Ayam', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
      { id: 'p3', name: 'Lontong Sayur', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
    ]
  },
  {
    id: 'cs2',
    name: 'Pak Joko',
    phone: '08234567890',
    products: [
      { id: 'p4', name: 'Nasi Goreng Spesial', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
      { id: 'p5', name: 'Mie Goreng Komplit', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
      { id: 'p6', name: 'Kwetiau Goreng', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
    ]
  },
  {
    id: 'cs3',
    name: 'Ibu Sari',
    phone: '08345678901',
    products: [
      { id: 'p7', name: 'Bubur Ayam Jakarta', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
      { id: 'p8', name: 'Bubur Kacang Ijo', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
    ]
  },
  {
    id: 'cs4',
    name: 'Mas Dedi',
    phone: '08456789012',
    products: [
      { id: 'p9', name: 'Soto Ayam', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
      { id: 'p10', name: 'Soto Betawi', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
      { id: 'p11', name: 'Rawon', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
    ]
  },
  {
    id: 'cs5',
    name: 'Bu Ningsih',
    phone: '08567890123',
    products: [
      { id: 'p12', name: 'Pecel Lele', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
      { id: 'p13', name: 'Ayam Geprek', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
      { id: 'p14', name: 'Ayam Penyet', pricePerUnit: SMP_PRICE.SELL, costPerUnit: SMP_PRICE.BUY, unit: 'porsi' },
    ]
  },
];

const SAMPLE_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Ahmad Rizki', role: 'owner', phone: '08123456789', branchId: 'b1', salary: 0, isActive: true, joinDate: '2024-01-01' },
  { id: 'e2', name: 'Dewi Sartika', role: 'cashier', phone: '08567890123', branchId: 'b1', salary: 2500000, isActive: true, joinDate: '2024-01-15' },
  { id: 'e3', name: 'Siti Nurhaliza', role: 'manager', phone: '08234567890', branchId: 'b2', salary: 3500000, isActive: true, joinDate: '2024-03-15' },
  { id: 'e4', name: 'Budi Santoso', role: 'manager', phone: '08345678901', branchId: 'b3', salary: 3500000, isActive: true, joinDate: '2024-06-01' },
];

const SAMPLE_EXPENSES: Expense[] = [
  { id: 'ex1', category: 'Operasional', description: 'Plastik & Kemasan', amount: 200000, date: new Date().toISOString(), branchId: 'b1' },
  { id: 'ex2', category: 'Sewa', description: 'Sewa tempat bulan ini', amount: 1500000, date: new Date().toISOString(), branchId: 'b1' },
  { id: 'ex3', category: 'Listrik', description: 'Tagihan listrik', amount: 300000, date: new Date().toISOString(), branchId: 'b1' },
];

// Generate sample transactions from supplier products
const generateSampleTransactions = (suppliers: ConsignmentSupplier[]): Transaction[] => {
  const allProducts = suppliers.flatMap(s => s.products.map(p => ({ ...p, supplierName: s.name, supplierId: s.id })));
  const transactions: Transaction[] = [];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let total = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = allProducts[Math.floor(Math.random() * allProducts.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      const subtotal = SMP_PRICE.SELL * qty;
      total += subtotal;
      items.push({
        menuItemId: product.id,
        menuItemName: product.name,
        quantity: qty,
        price: SMP_PRICE.SELL,
        subtotal
      });
    }
    
    transactions.push({
      id: `t${i + 1}`,
      items,
      total,
      paymentMethod: (['cash', 'qris', 'transfer'] as const)[Math.floor(Math.random() * 3)],
      customerName: Math.random() > 0.5 ? `Pelanggan ${i + 1}` : undefined,
      branchId: SAMPLE_BRANCHES[Math.floor(Math.random() * 3)].id,
      cashierName: 'Dewi Sartika',
      date: date.toISOString(),
      status: 'completed',
    });
  }
  return transactions;
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(`smp_${key}`);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`smp_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

export function useStore() {
  // Core data
  const [branches, setBranches] = useState<Branch[]>(() => loadFromStorage('branches', SAMPLE_BRANCHES));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage('transactions', generateSampleTransactions(SAMPLE_CONSIGNMENT_SUPPLIERS)));
  const [employees, setEmployees] = useState<Employee[]>(() => loadFromStorage('employees', SAMPLE_EMPLOYEES));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadFromStorage('expenses', SAMPLE_EXPENSES));
  const [inventory, setInventory] = useState<Inventory[]>(() => loadFromStorage('inventory', []));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage('suppliers', []));
  const [settings, setSettingsState] = useState<Settings>(() => loadFromStorage('settings', DEFAULT_SETTINGS));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => loadFromStorage('chatMessages', []));

  // Consignment data (main source of menu)
  const [consignmentSuppliers, setConsignmentSuppliers] = useState<ConsignmentSupplier[]>(() => 
    loadFromStorage('consignment_suppliers', SAMPLE_CONSIGNMENT_SUPPLIERS)
  );
  const [consignmentForms, setConsignmentForms] = useState<ConsignmentForm[]>(() => 
    loadFromStorage('consignment_forms', [])
  );

  const save = useCallback((key: string, value: unknown) => saveToStorage(key, value), []);

  // Branch operations
  const addBranch = useCallback((branch: Omit<Branch, 'id' | 'createdAt'>) => {
    const newBranch = { ...branch, id: uuidv4(), createdAt: new Date().toISOString() };
    setBranches(prev => { const next = [...prev, newBranch]; save('branches', next); return next; });
  }, [save]);

  const updateBranch = useCallback((id: string, data: Partial<Branch>) => {
    setBranches(prev => { const next = prev.map(b => b.id === id ? { ...b, ...data } : b); save('branches', next); return next; });
  }, [save]);

  const deleteBranch = useCallback((id: string) => {
    setBranches(prev => { const next = prev.filter(b => b.id !== id); save('branches', next); return next; });
  }, [save]);

  // Consignment Supplier operations (main menu source)
  const addConsignmentSupplier = useCallback((supplier: Omit<ConsignmentSupplier, 'id'>) => {
    const newSupplier = { ...supplier, id: uuidv4() };
    setConsignmentSuppliers(prev => { const next = [...prev, newSupplier]; save('consignment_suppliers', next); return next; });
  }, [save]);

  const updateConsignmentSupplier = useCallback((id: string, data: Partial<ConsignmentSupplier>) => {
    setConsignmentSuppliers(prev => { const next = prev.map(s => s.id === id ? { ...s, ...data } : s); save('consignment_suppliers', next); return next; });
  }, [save]);

  const deleteConsignmentSupplier = useCallback((id: string) => {
    setConsignmentSuppliers(prev => { const next = prev.filter(s => s.id !== id); save('consignment_suppliers', next); return next; });
  }, [save]);

  // Consignment Form operations
  const addConsignmentForm = useCallback((form: Omit<ConsignmentForm, 'id' | 'createdAt'>) => {
    const newForm = { ...form, id: uuidv4(), createdAt: new Date().toISOString() };
    setConsignmentForms(prev => { const next = [...prev, newForm]; save('consignment_forms', next); return next; });
    return newForm;
  }, [save]);

  const updateConsignmentForm = useCallback((id: string, data: Partial<ConsignmentForm>) => {
    setConsignmentForms(prev => { const next = prev.map(f => f.id === id ? { ...f, ...data } : f); save('consignment_forms', next); return next; });
  }, [save]);

  // Transaction operations
  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'date'>) => {
    const newTx = { ...tx, id: uuidv4(), date: new Date().toISOString() };
    setTransactions(prev => { const next = [...prev, newTx]; save('transactions', next); return next; });
    return newTx;
  }, [save]);

  // Employee operations
  const addEmployee = useCallback((emp: Omit<Employee, 'id'>) => {
    const newEmp = { ...emp, id: uuidv4() };
    setEmployees(prev => { const next = [...prev, newEmp]; save('employees', next); return next; });
  }, [save]);

  const updateEmployee = useCallback((id: string, data: Partial<Employee>) => {
    setEmployees(prev => { const next = prev.map(e => e.id === id ? { ...e, ...data } : e); save('employees', next); return next; });
  }, [save]);

  const deleteEmployee = useCallback((id: string) => {
    setEmployees(prev => { const next = prev.filter(e => e.id !== id); save('employees', next); return next; });
  }, [save]);

  // Expense operations
  const addExpense = useCallback((exp: Omit<Expense, 'id'>) => {
    const newExp = { ...exp, id: uuidv4() };
    setExpenses(prev => { const next = [...prev, newExp]; save('expenses', next); return next; });
  }, [save]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => { const next = prev.filter(e => e.id !== id); save('expenses', next); return next; });
  }, [save]);

  // Inventory operations
  const addInventory = useCallback((inv: Omit<Inventory, 'id'>) => {
    const newInv = { ...inv, id: uuidv4() };
    setInventory(prev => { const next = [...prev, newInv]; save('inventory', next); return next; });
  }, [save]);

  const updateInventory = useCallback((id: string, data: Partial<Inventory>) => {
    setInventory(prev => { const next = prev.map(i => i.id === id ? { ...i, ...data } : i); save('inventory', next); return next; });
  }, [save]);

  const deleteInventory = useCallback((id: string) => {
    setInventory(prev => { const next = prev.filter(i => i.id !== id); save('inventory', next); return next; });
  }, [save]);

  // Old supplier operations (keeping for compatibility)
  const addSupplier = useCallback((sup: Omit<Supplier, 'id'>) => {
    const newSup = { ...sup, id: uuidv4() };
    setSuppliers(prev => { const next = [...prev, newSup]; save('suppliers', next); return next; });
  }, [save]);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers(prev => { const next = prev.filter(s => s.id !== id); save('suppliers', next); return next; });
  }, [save]);

  // Settings
  const setSettings = useCallback((data: Partial<Settings>) => {
    setSettingsState(prev => { const next = { ...prev, ...data }; save('settings', next); return next; });
  }, [save]);

  // Chat
  const addChatMessage = useCallback((msg: ChatMessage) => {
    setChatMessages(prev => { const next = [...prev, msg]; save('chatMessages', next); return next; });
  }, [save]);

  const clearChat = useCallback(() => {
    setChatMessages([]); save('chatMessages', []);
  }, [save]);

  // Derived: Get all menu items from consignment suppliers
  const menuItems = consignmentSuppliers.flatMap(supplier => 
    supplier.products.map(product => ({
      id: product.id,
      name: product.name,
      category: getCategoryFromName(product.name),
      price: SMP_PRICE.SELL,
      cost: SMP_PRICE.BUY,
      stock: 50, // Default stock
      description: `Dari ${supplier.name}`,
      isAvailable: true,
      branchId: 'all', // Available at all branches
      supplierId: supplier.id,
      supplierName: supplier.name,
    }))
  );

  return {
    // Data
    branches,
    menuItems, // Derived from consignment suppliers
    transactions,
    employees,
    expenses,
    suppliers,
    inventory,
    settings,
    chatMessages,
    consignmentSuppliers,
    consignmentForms,

    // Branch operations
    addBranch, updateBranch, deleteBranch,

    // Consignment operations
    addConsignmentSupplier, updateConsignmentSupplier, deleteConsignmentSupplier,
    addConsignmentForm, updateConsignmentForm,

    // Transaction
    addTransaction,

    // Employee
    addEmployee, updateEmployee, deleteEmployee,

    // Expense
    addExpense, deleteExpense,

    // Supplier (old)
    addSupplier, deleteSupplier,

    // Inventory
    addInventory, updateInventory, deleteInventory,

    // Settings & Chat
    setSettings, addChatMessage, clearChat,
  };
}

// Helper function to categorize menu items
function getCategoryFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('nasi')) return 'Nasi';
  if (lower.includes('mie') || lower.includes('kwetiau')) return 'Mie';
  if (lower.includes('bubur')) return 'Bubur';
  if (lower.includes('soto') || lower.includes('rawon')) return 'Soto';
  if (lower.includes('lontong')) return 'Lontong';
  if (lower.includes('ayam') || lower.includes('lele')) return 'Lauk';
  return 'Lainnya';
}
