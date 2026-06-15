import { useState } from 'react';
import type { PageType } from './types';
import { useStore } from './store/useStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { MenuManager } from './components/MenuManager';
import { BranchManager } from './components/BranchManager';
import { EmployeeManager } from './components/EmployeeManager';

import { TransactionHistory } from './components/TransactionHistory';
import { ExpenseManager } from './components/ExpenseManager';
import { Reports } from './components/Reports';
import { AIAssistant } from './components/AIAssistant';
import { TelegramIntegration } from './components/TelegramIntegration';
import { BackupManager } from './components/BackupManager';
import { SettingsPage } from './components/SettingsPage';
import { ConsignmentManager } from './components/ConsignmentManager';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const store = useStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            branches={store.branches}
            transactions={store.transactions}
            employees={store.employees}
            expenses={store.expenses}
            inventory={store.inventory}
          />
        );
      case 'pos':
        return (
          <POS
            menuItems={store.menuItems}
            branches={store.branches}
            consignmentSuppliers={store.consignmentSuppliers}
            addTransaction={store.addTransaction}
          />
        );
      case 'menu':
        return (
          <MenuManager
            menuItems={store.menuItems}
            consignmentSuppliers={store.consignmentSuppliers}
          />
        );
      case 'branches':
        return (
          <BranchManager
            branches={store.branches}
            addBranch={store.addBranch}
            updateBranch={store.updateBranch}
            deleteBranch={store.deleteBranch}
          />
        );
      case 'employees':
        return (
          <EmployeeManager
            employees={store.employees}
            branches={store.branches}
            addEmployee={store.addEmployee}
            updateEmployee={store.updateEmployee}
            deleteEmployee={store.deleteEmployee}
          />
        );
      case 'transactions':
        return (
          <TransactionHistory
            transactions={store.transactions}
            branches={store.branches}
          />
        );
      case 'expenses':
        return (
          <ExpenseManager
            expenses={store.expenses}
            branches={store.branches}
            addExpense={store.addExpense}
            deleteExpense={store.deleteExpense}
          />
        );
      case 'reports':
        return (
          <Reports
            transactions={store.transactions}
            expenses={store.expenses}
            branches={store.branches}
          />
        );
      case 'ai-assistant':
        return (
          <AIAssistant
            settings={store.settings}
            chatMessages={store.chatMessages}
            addChatMessage={store.addChatMessage}
            clearChat={store.clearChat}
            transactions={store.transactions}
            branches={store.branches}
            expenses={store.expenses}
          />
        );
      case 'telegram':
        return (
          <TelegramIntegration
            settings={store.settings}
            setSettings={store.setSettings}
            transactions={store.transactions}
            branches={store.branches}
          />
        );
      case 'backup':
        return (
          <BackupManager
            settings={store.settings}
            setSettings={store.setSettings}
            branches={store.branches}
            menuItems={store.menuItems}
            transactions={store.transactions}
            employees={store.employees}
            expenses={store.expenses}
            inventory={store.inventory}
            suppliers={store.suppliers}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            settings={store.settings}
            setSettings={store.setSettings}
          />
        );
      case 'consignment':
        return (
          <ConsignmentManager
            branches={store.branches}
            settings={store.settings}
            consignmentSuppliers={store.consignmentSuppliers}
            addConsignmentSupplier={store.addConsignmentSupplier}
            updateConsignmentSupplier={store.updateConsignmentSupplier}
            deleteConsignmentSupplier={store.deleteConsignmentSupplier}
          />
        );
      default:
        return <Dashboard branches={store.branches} transactions={store.transactions} employees={store.employees} expenses={store.expenses} inventory={store.inventory} />;
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <Header
        currentPage={currentPage}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} p-6`}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
