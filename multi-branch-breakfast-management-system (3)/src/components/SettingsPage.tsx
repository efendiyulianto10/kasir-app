import React, { useState } from 'react';
import { Settings, Save, Key, Globe, Bot, Send, Database, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import type { Settings as SettingsType } from '../types';

interface Props {
  settings: SettingsType;
  setSettings: (data: Partial<SettingsType>) => void;
}

export const SettingsPage: React.FC<Props> = ({ settings, setSettings }) => {
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const resetAllData = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('smp_'));
    keys.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
            <Settings size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Pengaturan Sistem</h3>
            <p className="text-xs text-slate-400">Konfigurasi integrasi & preferensi aplikasi</p>
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe size={16} className="text-orange-400" /> Informasi Bisnis
        </h3>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Nama Bisnis</label>
          <input
            type="text"
            value={settings.businessName}
            onChange={e => setSettings({ businessName: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Groq AI */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bot size={16} className="text-purple-400" /> Groq AI Configuration
        </h3>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Groq API Key</label>
          <input
            type="password"
            placeholder="gsk_xxxxxxxxxxxxxxx"
            value={settings.groqApiKey}
            onChange={e => setSettings({ groqApiKey: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Dapatkan API Key gratis di{' '}
            <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">console.groq.com</a>
          </p>
        </div>
        <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${settings.groqApiKey ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
          {settings.groqApiKey ? <><CheckCircle size={14} /> API Key tersimpan</> : <><Key size={14} /> API Key belum diatur</>}
        </div>
      </div>

      {/* Telegram */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Send size={16} className="text-blue-400" /> Telegram Integration
        </h3>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Bot Token</label>
          <input
            type="password"
            placeholder="1234567890:ABCdefGHIjklMNOpqrstUVwxyz"
            value={settings.telegramBotToken}
            onChange={e => setSettings({ telegramBotToken: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Chat ID / Group ID</label>
          <input
            type="text"
            placeholder="-100xxxxxxxxxx"
            value={settings.telegramChatId}
            onChange={e => setSettings({ telegramChatId: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Link Grup Telegram</label>
          <input
            type="text"
            placeholder="https://t.me/grupanda"
            value={settings.telegramGroupLink}
            onChange={e => setSettings({ telegramGroupLink: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Google Sheets */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database size={16} className="text-emerald-400" /> Google Spreadsheet Backup
        </h3>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Spreadsheet URL</label>
          <input
            type="text"
            placeholder="https://docs.google.com/spreadsheets/d/xxx"
            value={settings.googleSheetUrl}
            onChange={e => setSettings({ googleSheetUrl: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Apps Script Web App URL</label>
          <input
            type="text"
            placeholder="https://script.google.com/macros/s/xxx/exec"
            value={settings.googleAppsScriptUrl}
            onChange={e => setSettings({ googleAppsScriptUrl: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-300">Auto Backup</p>
            <p className="text-[10px] text-slate-500">Setiap {settings.backupInterval} menit</p>
          </div>
          <button
            onClick={() => setSettings({ autoBackupEnabled: !settings.autoBackupEnabled })}
            className={`w-12 h-6 rounded-full transition-all ${settings.autoBackupEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.autoBackupEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {settings.autoBackupEnabled && (
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Interval (menit)</label>
            <input
              type="number"
              value={settings.backupInterval}
              onChange={e => setSettings({ backupInterval: Number(e.target.value) })}
              className="w-32 rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      <button onClick={handleSave}
        className="w-full py-3 rounded-xl gradient-orange text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
        {saved ? <><CheckCircle size={16} /> Tersimpan!</> : <><Save size={16} /> Simpan Pengaturan</>}
      </button>

      {/* Danger Zone */}
      <div className="glass-card rounded-2xl p-6 border border-red-500/20">
        <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-3">
          <AlertTriangle size={16} /> Zona Berbahaya
        </h3>
        <p className="text-xs text-slate-400 mb-3">Reset seluruh data aplikasi. Tindakan ini tidak dapat dibatalkan!</p>
        {!showReset ? (
          <button onClick={() => setShowReset(true)}
            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 flex items-center gap-2">
            <Trash2 size={14} /> Reset Data
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={resetAllData}
              className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600 flex items-center gap-2">
              <Trash2 size={14} /> Ya, Reset Semua!
            </button>
            <button onClick={() => setShowReset(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-sm hover:text-white">
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
