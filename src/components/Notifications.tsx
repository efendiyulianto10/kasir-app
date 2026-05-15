import { useState } from 'react';
import { Bell, Send, MessageCircle, Check, X, ExternalLink, Clock } from 'lucide-react';
import { Notification as NotifType, Branch, DailyTransaction } from '../types';
import { generateId, formatCurrency, sendWhatsAppNotification } from '../store';

interface Props {
  notifications: NotifType[];
  branches: Branch[];
  transactions: DailyTransaction[];
  onSave: (notifications: NotifType[]) => void;
}

export default function Notifications({ notifications, branches, transactions, onSave }: Props) {
  const [showCompose, setShowCompose] = useState(false);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const generateDailyReport = (branchId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const branch = branches.find(b => b.id === branchId);
    const todayTx = transactions.filter(t => t.branchId === branchId && t.date === today);
    const revenue = todayTx.reduce((s, t) => s + t.totalAmount, 0);
    const profit = todayTx.reduce((s, t) => s + t.totalProfit, 0);
    const items = todayTx.reduce((s, t) => s + t.items.reduce((ss, i) => ss + i.qty, 0), 0);

    return `📊 *LAPORAN HARIAN SMP*
🏪 ${branch?.name || 'Cabang'}
📅 ${today}

🍱 Porsi Terjual: ${items} pcs
💰 Revenue: ${formatCurrency(revenue)}
✅ Profit SMP (10%): ${formatCurrency(profit)}
📦 Transaksi: ${todayTx.length}

💳 Metode Bayar:
- Tunai: ${todayTx.filter(t => t.paymentMethod === 'cash').length}
- QRIS: ${todayTx.filter(t => t.paymentMethod === 'qris').length}
- ShopeeFood: ${todayTx.filter(t => t.paymentMethod === 'shopeefood').length}
- GoFood: ${todayTx.filter(t => t.paymentMethod === 'gofood').length}

_Dikirim otomatis dari Sistem SMP_ 🍳`;
  };

  const sendToWA = (targetPhone: string, msg: string) => {
    const url = sendWhatsAppNotification(targetPhone, msg);
    window.open(url, '_blank');
    
    const notif: NotifType = {
      id: generateId(),
      type: 'sales_report',
      message: msg.substring(0, 100) + '...',
      createdAt: new Date().toISOString(),
      sent: true,
      phone: targetPhone,
    };
    onSave([notif, ...notifications]);
  };

  const sendDailyReport = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    const report = generateDailyReport(branchId);
    sendToWA(branch?.picPhone || '', report);
  };

  const sendCustomMessage = () => {
    if (!phone || !message) return;
    sendToWA(phone, message);
    setPhone('');
    setMessage('');
    setShowCompose(false);
  };

  const typeIcons: Record<string, string> = {
    sales_report: '📊',
    stock_alert: '⚠️',
    return_alert: '📦',
    milestone: '🎉',
  };

  // Quick templates
  const templates = [
    { label: '📊 Laporan Harian', msg: 'Halo, berikut laporan harian cabang hari ini. Silakan cek dashboard SMP untuk detail.' },
    { label: '⚠️ Stok Alert', msg: '⚠️ Stok menipis! Mohon segera koordinasi dengan supplier untuk besok pagi.' },
    { label: '📦 Info Retur', msg: '📦 Ada retur makanan hari ini. Mohon supplier pickup barang yang tidak terjual.' },
    { label: '🎉 Target Tercapai', msg: '🎉 Selamat! Cabang kita mencapai target penjualan hari ini! Keep up the good work! 💪' },
    { label: '📢 Info Umum', msg: '📢 Pengumuman: Besok ada perubahan jam operasional. Mohon perhatian semua tim.' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔔 Notifikasi WhatsApp</h1>
          <p className="text-gray-500 text-sm">Kirim laporan & notifikasi via WhatsApp (gratis, via wa.me)</p>
        </div>
        <button onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 shadow-lg shadow-green-200">
          <MessageCircle size={18} /> Kirim Pesan
        </button>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
        <h3 className="font-semibold text-green-900 text-sm mb-2">💡 Cara Kerja Notifikasi WA</h3>
        <ul className="text-xs text-green-700 space-y-1">
          <li>• Menggunakan <b>wa.me API</b> (gratis, tanpa registrasi)</li>
          <li>• Klik tombol kirim → otomatis buka WhatsApp dengan pesan siap kirim</li>
          <li>• Cocok untuk laporan harian, alert stok, dan koordinasi tim</li>
          <li>• Riwayat pengiriman tercatat di sistem</li>
        </ul>
      </div>

      {/* Quick Send: Daily Reports */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">⚡ Kirim Laporan Harian per Cabang</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {branches.filter(b => b.status === 'active').map(branch => {
            const today = new Date().toISOString().split('T')[0];
            const todayTx = transactions.filter(t => t.branchId === branch.id && t.date === today);
            const revenue = todayTx.reduce((s, t) => s + t.totalAmount, 0);
            return (
              <div key={branch.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(revenue)} | {todayTx.length} tx</p>
                </div>
                <button onClick={() => sendDailyReport(branch.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                  <Send size={12} /> Kirim
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Templates */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">📝 Template Pesan Cepat</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {templates.map((t, i) => (
            <button key={i} onClick={() => { setMessage(t.msg); setShowCompose(true); }}
              className="text-left p-3 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all">
              <p className="text-sm font-medium text-gray-900">{t.label}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.msg}</p>
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">📜 Riwayat Notifikasi</h3>
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell size={40} className="mx-auto mb-2 opacity-30" />
              <p>Belum ada riwayat notifikasi</p>
            </div>
          ) : (
            notifications.slice(0, 20).map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xl">{typeIcons[n.type] || '📨'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={10} />{new Date(n.createdAt).toLocaleString('id-ID')}</span>
                    {n.phone && <span>📱 {n.phone}</span>}
                    {n.sent && <span className="text-green-600 flex items-center gap-1"><Check size={10} />Terkirim</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">✉️ Kirim Pesan WhatsApp</h2>
              <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">No. WhatsApp Tujuan</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-green-500" placeholder="6281234567890" />
                <p className="text-xs text-gray-400 mt-1">Format: 628xxx (tanpa + atau 0)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Pesan</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-green-500" rows={5} placeholder="Tulis pesan..." />
              </div>
              <button onClick={sendCustomMessage}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 flex items-center justify-center gap-2">
                <ExternalLink size={18} /> Buka WhatsApp & Kirim
              </button>
              <p className="text-xs text-gray-400 text-center">Akan membuka WhatsApp Web/App dengan pesan siap kirim</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
