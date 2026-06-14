import React, { useState } from 'react';
import { Database, Cloud, CheckCircle, AlertCircle, RefreshCw, Copy, Download, Code2, ExternalLink } from 'lucide-react';
import type { Settings, Branch, MenuItem, Transaction, Employee, Expense, Inventory, Supplier } from '../types';

interface Props {
  settings: Settings;
  setSettings: (data: Partial<Settings>) => void;
  branches: Branch[];
  menuItems: MenuItem[];
  transactions: Transaction[];
  employees: Employee[];
  expenses: Expense[];
  inventory: Inventory[];
  suppliers: Supplier[];
}

const APPS_SCRIPT_CODE = `// ============================================
// SMP - Sarapan Murah Pagi
// Google Apps Script - Auto Backup Database
// ============================================
// CARA PENGGUNAAN:
// 1. Buka Google Apps Script (script.google.com)
// 2. Buat project baru
// 3. Copy-paste seluruh kode ini
// 4. Deploy sebagai Web App (Execute as: Me, Access: Anyone)
// 5. Copy URL deployment dan paste di Pengaturan SMP App
// ============================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!ss) {
      ss = SpreadsheetApp.create('SMP Database Backup');
    }
    
    // Process each data type
    if (data.branches) writeSheet(ss, 'Cabang', data.branches, ['ID', 'Nama', 'Alamat', 'Telepon', 'Manager', 'Tipe', 'Status', 'Tanggal Dibuat']);
    if (data.menuItems) writeSheet(ss, 'Menu', data.menuItems, ['ID', 'Nama', 'Kategori', 'Harga', 'HPP', 'Stok', 'Deskripsi', 'Tersedia', 'Cabang ID']);
    if (data.transactions) writeSheet(ss, 'Transaksi', data.transactions, ['ID', 'Items', 'Total', 'Metode Bayar', 'Pelanggan', 'Cabang ID', 'Kasir', 'Tanggal', 'Status']);
    if (data.employees) writeSheet(ss, 'Karyawan', data.employees, ['ID', 'Nama', 'Jabatan', 'Telepon', 'Cabang ID', 'Gaji', 'Status', 'Tanggal Bergabung']);
    if (data.expenses) writeSheet(ss, 'Pengeluaran', data.expenses, ['ID', 'Kategori', 'Deskripsi', 'Jumlah', 'Tanggal', 'Cabang ID']);
    if (data.inventory) writeSheet(ss, 'Inventori', data.inventory, ['ID', 'Nama Item', 'Jumlah', 'Satuan', 'Min Stok', 'Harga/Unit', 'Supplier ID', 'Cabang ID', 'Terakhir Restock']);
    if (data.suppliers) writeSheet(ss, 'Supplier', data.suppliers, ['ID', 'Nama', 'Telepon', 'Alamat', 'Produk']);
    
    // Log backup
    logBackup(ss, data);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Backup berhasil!',
      timestamp: new Date().toISOString(),
      spreadsheetUrl: ss.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'SMP Backup API aktif',
    spreadsheetUrl: ss ? ss.getUrl() : 'Belum ada spreadsheet',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function writeSheet(ss, sheetName, data, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  // Clear existing data
  sheet.clear();
  
  // Style header
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#f97316');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Write data
  if (data.length > 0) {
    var rows = data.map(function(item) {
      return headers.map(function(_, i) {
        var values = Object.values(item);
        var val = values[i];
        if (Array.isArray(val)) return JSON.stringify(val);
        return val !== undefined ? val : '';
      });
    });
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  }
  
  // Auto-resize columns
  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
  
  // Add border
  if (data.length > 0) {
    sheet.getRange(1, 1, data.length + 1, headers.length).setBorder(true, true, true, true, true, true);
  }
}

function logBackup(ss, data) {
  var logSheet = ss.getSheetByName('Log Backup');
  if (!logSheet) {
    logSheet = ss.insertSheet('Log Backup');
    logSheet.getRange(1, 1, 1, 4).setValues([['Timestamp', 'Data Count', 'Status', 'Details']]);
    logSheet.getRange(1, 1, 1, 4).setBackground('#1e293b').setFontColor('#f97316').setFontWeight('bold');
  }
  
  var details = [];
  if (data.branches) details.push('Cabang: ' + data.branches.length);
  if (data.menuItems) details.push('Menu: ' + data.menuItems.length);
  if (data.transactions) details.push('Transaksi: ' + data.transactions.length);
  if (data.employees) details.push('Karyawan: ' + data.employees.length);
  if (data.expenses) details.push('Pengeluaran: ' + data.expenses.length);
  if (data.inventory) details.push('Inventori: ' + data.inventory.length);
  if (data.suppliers) details.push('Supplier: ' + data.suppliers.length);
  
  logSheet.appendRow([
    new Date().toISOString(),
    details.length + ' tabel',
    'Berhasil ✅',
    details.join(', ')
  ]);
}

// Fungsi untuk membuat spreadsheet baru dengan template
function createTemplate() {
  var ss = SpreadsheetApp.create('SMP - Database Backup');
  var sheets = ['Cabang', 'Menu', 'Transaksi', 'Karyawan', 'Pengeluaran', 'Inventori', 'Supplier', 'Log Backup'];
  
  sheets.forEach(function(name) {
    ss.insertSheet(name);
  });
  
  // Remove default sheet
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) ss.deleteSheet(defaultSheet);
  
  Logger.log('Template dibuat: ' + ss.getUrl());
  return ss.getUrl();
}`;

export const BackupManager: React.FC<Props> = ({
  settings, setSettings, branches, menuItems, transactions, employees, expenses, inventory, suppliers
}) => {
  const [backupStatus, setBackupStatus] = useState<'idle' | 'backing-up' | 'success' | 'error'>('idle');
  const [backupMessage, setBackupMessage] = useState('');
  const [lastBackup, setLastBackup] = useState<string | null>(localStorage.getItem('smp_lastBackup'));
  const [showScript, setShowScript] = useState(false);
  const [copied, setCopied] = useState(false);

  const performBackup = async () => {
    if (!settings.googleAppsScriptUrl) {
      setBackupStatus('error');
      setBackupMessage('URL Google Apps Script belum diatur! Silakan atur di Pengaturan.');
      return;
    }

    setBackupStatus('backing-up');
    setBackupMessage('Sedang melakukan backup...');

    const data = { branches, menuItems, transactions, employees, expenses, inventory, suppliers };

    try {
      await fetch(settings.googleAppsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        mode: 'no-cors',
      });

      // no-cors mode always returns opaque response, so we assume success
      const now = new Date().toISOString();
      setLastBackup(now);
      localStorage.setItem('smp_lastBackup', now);
      setBackupStatus('success');
      setBackupMessage(`Backup berhasil dikirim! Data: ${branches.length} cabang, ${menuItems.length} menu, ${transactions.length} transaksi, ${employees.length} karyawan, ${expenses.length} pengeluaran, ${inventory.length} inventori, ${suppliers.length} supplier`);
    } catch (error) {
      setBackupStatus('error');
      setBackupMessage('Gagal melakukan backup. Periksa URL Apps Script dan koneksi internet.');
    }
  };

  const downloadLocalBackup = () => {
    const data = { branches, menuItems, transactions, employees, expenses, inventory, suppliers, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smp_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Database size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Backup Database</h3>
            <p className="text-xs text-slate-400">Backup otomatis ke Google Spreadsheet & Local</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Sheets Backup */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cloud size={16} className="text-emerald-400" /> Google Spreadsheet Backup
          </h3>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Google Spreadsheet URL</label>
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/xxx"
              value={settings.googleSheetUrl}
              onChange={e => setSettings({ googleSheetUrl: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Google Apps Script URL (Web App)</label>
            <input
              type="text"
              placeholder="https://script.google.com/macros/s/xxx/exec"
              value={settings.googleAppsScriptUrl}
              onChange={e => setSettings({ googleAppsScriptUrl: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>

          {settings.googleSheetUrl && (
            <a href={settings.googleSheetUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm hover:bg-emerald-500/20">
              <ExternalLink size={14} /> Buka Google Spreadsheet
            </a>
          )}

          <button
            onClick={performBackup}
            disabled={backupStatus === 'backing-up'}
            className="w-full py-3 rounded-xl gradient-orange text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            {backupStatus === 'backing-up' ? (
              <><RefreshCw size={16} className="animate-spin" /> Membackup...</>
            ) : (
              <><Cloud size={16} /> Backup ke Google Sheets</>
            )}
          </button>

          {backupMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              backupStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {backupStatus === 'success' ? <CheckCircle size={14} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />}
              <span>{backupMessage}</span>
            </div>
          )}

          {lastBackup && (
            <p className="text-[10px] text-slate-500">Backup terakhir: {new Date(lastBackup).toLocaleString('id-ID')}</p>
          )}
        </div>

        {/* Local Backup */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download size={16} className="text-blue-400" /> Backup Lokal
            </h3>
            <p className="text-xs text-slate-400">Download seluruh database sebagai file JSON</p>

            <div className="grid grid-cols-2 gap-3 text-center">
              {[
                { label: 'Cabang', count: branches.length },
                { label: 'Menu', count: menuItems.length },
                { label: 'Transaksi', count: transactions.length },
                { label: 'Karyawan', count: employees.length },
                { label: 'Pengeluaran', count: expenses.length },
                { label: 'Inventori', count: inventory.length },
              ].map(item => (
                <div key={item.label} className="bg-slate-800/50 rounded-lg p-2">
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="text-lg font-bold text-white">{item.count}</p>
                </div>
              ))}
            </div>

            <button onClick={downloadLocalBackup}
              className="w-full py-3 rounded-xl bg-blue-500/10 text-blue-400 font-semibold text-sm hover:bg-blue-500/20 flex items-center justify-center gap-2 border border-blue-500/20">
              <Download size={16} /> Download Backup JSON
            </button>
          </div>

          {/* Auto Backup Toggle */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Auto Backup</h3>
                <p className="text-[10px] text-slate-400">Backup otomatis setiap {settings.backupInterval} menit</p>
              </div>
              <button
                onClick={() => setSettings({ autoBackupEnabled: !settings.autoBackupEnabled })}
                className={`w-12 h-6 rounded-full transition-all ${settings.autoBackupEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.autoBackupEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Apps Script Code */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Code2 size={16} className="text-orange-400" /> Google Apps Script Code
          </h3>
          <div className="flex gap-2">
            <button onClick={() => setShowScript(!showScript)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
              {showScript ? 'Sembunyikan' : 'Tampilkan'} Kode
            </button>
            <button onClick={copyScript}
              className="text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 flex items-center gap-1">
              {copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy Kode</>}
            </button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 mb-4">
          <h4 className="text-xs font-bold text-white mb-2">📋 Langkah Setup:</h4>
          <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
            <li>Buka <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">script.google.com</a></li>
            <li>Buat Project Baru → Paste kode di bawah</li>
            <li>Klik Deploy → New Deployment → Web App</li>
            <li>Set "Execute as" = Me, "Who has access" = Anyone</li>
            <li>Copy URL deployment → Paste di field "Google Apps Script URL" di atas</li>
            <li>Buat Google Spreadsheet baru → Paste URL-nya di field "Google Spreadsheet URL"</li>
            <li>Di Apps Script, buka Resources → link ke Spreadsheet tersebut</li>
          </ol>
        </div>

        {showScript && (
          <div className="bg-slate-950 rounded-xl p-4 max-h-96 overflow-y-auto">
            <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">{APPS_SCRIPT_CODE}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
