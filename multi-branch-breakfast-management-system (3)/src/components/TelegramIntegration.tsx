import React, { useState } from 'react';
import { Send, MessageCircle, Users, Link, CheckCircle, AlertCircle, RefreshCw, Bell, Zap } from 'lucide-react';
import type { Settings, Transaction, Branch } from '../types';

interface Props {
  settings: Settings;
  setSettings: (data: Partial<Settings>) => void;
  transactions: Transaction[];
  branches: Branch[];
}

export const TelegramIntegration: React.FC<Props> = ({ settings, setSettings, transactions, branches }) => {
  const [testMessage, setTestMessage] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [customMessage, setCustomMessage] = useState('');
  const [notifType, setNotifType] = useState<'daily' | 'transaction' | 'custom'>('daily');

  const formatCurrency = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

  const todayTx = transactions.filter(t => {
    const today = new Date().toISOString().split('T')[0];
    return t.date.split('T')[0] === today && t.status === 'completed';
  });
  const todaySales = todayTx.reduce((a, t) => a + t.total, 0);

  const generateMessage = () => {
    if (notifType === 'custom') return customMessage;
    if (notifType === 'transaction') {
      const lastTx = transactions[transactions.length - 1];
      if (!lastTx) return '📊 Belum ada transaksi';
      return `🧾 *Transaksi Baru*\n━━━━━━━━━━━━━━\n📋 ID: #${lastTx.id.slice(0, 8)}\n👤 ${lastTx.customerName || 'Walk-in'}\n💰 Total: ${formatCurrency(lastTx.total)}\n💳 ${lastTx.paymentMethod.toUpperCase()}\n📍 ${branches.find(b => b.id === lastTx.branchId)?.name || '-'}\n⏰ ${new Date(lastTx.date).toLocaleString('id-ID')}\n━━━━━━━━━━━━━━\n✅ Status: Selesai`;
    }
    return `📊 *LAPORAN HARIAN SMP*\n🗓️ ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n━━━━━━━━━━━━━━\n💰 Penjualan: ${formatCurrency(todaySales)}\n📦 Transaksi: ${todayTx.length}\n📍 Cabang Aktif: ${branches.filter(b => b.isActive).length}\n━━━━━━━━━━━━━━\n\n📈 Detail per Cabang:\n${branches.filter(b => b.isActive).map(b => {
      const branchTx = todayTx.filter(t => t.branchId === b.id);
      const branchSales = branchTx.reduce((a, t) => a + t.total, 0);
      return `• ${b.name}: ${formatCurrency(branchSales)} (${branchTx.length} tx)`;
    }).join('\n')}\n\n🤖 _Dikirim otomatis oleh SMP System_`;
  };

  const sendTelegramMessage = async (message: string) => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      setSendStatus('error');
      setTestMessage('Bot Token dan Chat ID harus diisi terlebih dahulu!');
      return;
    }

    setSendStatus('sending');
    try {
      const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
      const data = await response.json();
      if (data.ok) {
        setSendStatus('success');
        setTestMessage('Pesan berhasil dikirim ke Telegram! ✅');
      } else {
        setSendStatus('error');
        setTestMessage(`Error: ${data.description}`);
      }
    } catch (error) {
      setSendStatus('error');
      setTestMessage('Gagal mengirim pesan. Periksa koneksi internet dan konfigurasi bot.');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Send size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Telegram Bot Integration</h3>
            <p className="text-xs text-slate-400">Kirim notifikasi otomatis ke bot & grup Telegram</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap size={16} className="text-orange-400" /> Konfigurasi Bot
          </h3>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Bot Token</label>
            <input
              type="password"
              placeholder="Masukkan Bot Token dari @BotFather"
              value={settings.telegramBotToken}
              onChange={e => setSettings({ telegramBotToken: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1">Dapatkan dari @BotFather di Telegram</p>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Chat ID / Group ID</label>
            <input
              type="text"
              placeholder="Masukkan Chat ID atau Group ID"
              value={settings.telegramChatId}
              onChange={e => setSettings({ telegramChatId: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1">Chat ID personal atau Group ID (biasanya dimulai -100xxxx)</p>
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

          {settings.telegramGroupLink && (
            <a href={settings.telegramGroupLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-sm hover:bg-blue-500/20 transition-colors">
              <Link size={14} /> Buka Grup Telegram
            </a>
          )}

          {/* Status */}
          <div className={`p-3 rounded-xl flex items-center gap-2 ${
            settings.telegramBotToken && settings.telegramChatId
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-amber-500/10 border border-amber-500/20'
          }`}>
            {settings.telegramBotToken && settings.telegramChatId ? (
              <><CheckCircle size={16} className="text-emerald-400" /><span className="text-xs text-emerald-400">Bot terkonfigurasi ✅</span></>
            ) : (
              <><AlertCircle size={16} className="text-amber-400" /><span className="text-xs text-amber-400">Lengkapi konfigurasi bot</span></>
            )}
          </div>
        </div>

        {/* Send Messages */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageCircle size={16} className="text-orange-400" /> Kirim Pesan
          </h3>

          {/* Message Type */}
          <div className="flex gap-2">
            {[
              { key: 'daily' as const, icon: <Bell size={12} />, label: 'Laporan Harian' },
              { key: 'transaction' as const, icon: <RefreshCw size={12} />, label: 'Transaksi Terakhir' },
              { key: 'custom' as const, icon: <MessageCircle size={12} />, label: 'Custom' },
            ].map(t => (
              <button key={t.key} onClick={() => setNotifType(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  notifType === t.key ? 'gradient-orange text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {notifType === 'custom' && (
            <textarea
              placeholder="Tulis pesan custom..."
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm h-24 resize-none"
            />
          )}

          {/* Preview */}
          <div className="bg-slate-900 rounded-xl p-4">
            <p className="text-[10px] text-slate-400 mb-2">Preview Pesan:</p>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans">{generateMessage()}</pre>
          </div>

          <button
            onClick={() => sendTelegramMessage(generateMessage())}
            disabled={sendStatus === 'sending'}
            className="w-full py-3 rounded-xl gradient-orange text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            {sendStatus === 'sending' ? (
              <><RefreshCw size={16} className="animate-spin" /> Mengirim...</>
            ) : (
              <><Send size={16} /> Kirim ke Telegram</>
            )}
          </button>

          {testMessage && (
            <div className={`p-3 rounded-xl text-xs ${sendStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {testMessage}
            </div>
          )}
        </div>
      </div>

      {/* Setup Guide */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Users size={16} className="text-orange-400" /> Panduan Setup Telegram Bot
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Buat Bot', desc: 'Buka @BotFather di Telegram → /newbot → Ikuti instruksi → Copy Bot Token' },
            { step: '2', title: 'Dapatkan Chat ID', desc: 'Kirim pesan ke bot → Buka api.telegram.org/bot<TOKEN>/getUpdates → Copy chat id' },
            { step: '3', title: 'Tambah ke Grup', desc: 'Tambahkan bot ke grup Telegram → Jadikan admin → Gunakan Group ID sebagai Chat ID' },
          ].map(item => (
            <div key={item.step} className="bg-slate-800/50 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center text-white font-bold text-sm mb-3">
                {item.step}
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
