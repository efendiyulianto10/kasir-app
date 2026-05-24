import { LogEntry, LogAction, LogCategory } from './types';
import { User } from './auth';
import { generateId } from './store';

const LOG_KEY = 'smp_logbook';
const MAX_LOGS = 5000;

export function getLogs(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
}

export function saveLogs(logs: LogEntry[]) {
  // Keep only last MAX_LOGS entries (FIFO)
  const trimmed = logs.slice(-MAX_LOGS);
  localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
}

export function addLog(
  user: User,
  action: LogAction,
  category: LogCategory,
  detail: string,
  branchId?: string,
  branchName?: string,
  amount?: number,
  metadata?: string,
): LogEntry {
  const entry: LogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    branchId: branchId || '',
    branchName: branchName || '',
    action,
    category,
    detail,
    amount,
    metadata,
  };
  const logs = getLogs();
  logs.push(entry);
  saveLogs(logs);
  return entry;
}

// Shortcut helpers
export const logTx = (user: User, detail: string, branchId: string, branchName: string, amount: number) =>
  addLog(user, 'tx_create', 'transaksi', detail, branchId, branchName, amount);

export const logStockIn = (user: User, detail: string, branchId: string, branchName: string) =>
  addLog(user, 'stock_in', 'stok', detail, branchId, branchName);

export const logStockReturn = (user: User, detail: string, branchId: string, branchName: string) =>
  addLog(user, 'stock_return', 'stok', detail, branchId, branchName);

export const logClosing = (user: User, detail: string, branchId: string, branchName: string, amount: number) =>
  addLog(user, 'closing_done', 'keuangan', detail, branchId, branchName, amount);

export const logAuth = (user: User, action: 'login' | 'logout') =>
  addLog(user, action, 'auth', `${user.name} ${action}`);

export const logOps = (user: User, action: LogAction, detail: string, branchId?: string, branchName?: string) =>
  addLog(user, action, 'operasional', detail, branchId, branchName);

export const logSys = (user: User, action: LogAction, detail: string) =>
  addLog(user, action, 'sistem', detail);
