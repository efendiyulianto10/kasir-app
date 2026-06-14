import React, { useState, useRef } from 'react';
import {
  Plus, Printer, Camera, Check, X, Trash2, Edit3,
  Send, AlertCircle, Clock, Image
} from 'lucide-react';
import type { Branch, Settings } from '../types';
import type { ConsignmentSupplier, ConsignmentProduct } from '../types/consignment';
import { SMP_PRICE } from '../store/useStore';
import { v4 as uuidv4 } from 'uuid';

interface PhotoRecord {
  id: string;
  date: string;
  photoData: string;
  sentToTelegram: boolean;
  sentAt?: string;
}

interface Props {
  branches: Branch[];
  settings: Settings;
  consignmentSuppliers: ConsignmentSupplier[];
  addConsignmentSupplier: (supplier: Omit<ConsignmentSupplier, 'id'>) => void;
  updateConsignmentSupplier: (id: string, data: Partial<ConsignmentSupplier>) => void;
  deleteConsignmentSupplier: (id: string) => void;
}

export const ConsignmentManager: React.FC<Props> = ({
  branches,
  settings,
  consignmentSuppliers,
  addConsignmentSupplier,
  updateConsignmentSupplier,
  deleteConsignmentSupplier,
}) => {
  const [photoRecords, setPhotoRecords] = useState<PhotoRecord[]>(() => {
    const saved = localStorage.getItem('smp_consignment_photos');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<'print' | 'photo' | 'suppliers' | 'history'>('print');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ConsignmentSupplier | null>(null);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', products: '' });
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || '');
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const savePhotoRecords = (data: PhotoRecord[]) => {
    localStorage.setItem('smp_consignment_photos', JSON.stringify(data));
    setPhotoRecords(data);
  };

  // Add/Edit supplier
  const handleSaveSupplier = () => {
    if (!newSupplier.name) return;
    
    const products: ConsignmentProduct[] = newSupplier.products
      .split('\n')
      .filter(Boolean)
      .map(line => ({
        id: uuidv4(),
        name: line.trim(),
        pricePerUnit: SMP_PRICE.SELL,
        costPerUnit: SMP_PRICE.BUY,
        unit: 'porsi'
      }));

    if (editingSupplier) {
      updateConsignmentSupplier(editingSupplier.id, {
        name: newSupplier.name,
        phone: newSupplier.phone,
        products: products.length > 0 ? products : editingSupplier.products
      });
    } else {
      addConsignmentSupplier({
        name: newSupplier.name,
        phone: newSupplier.phone,
        products
      });
    }

    setNewSupplier({ name: '', phone: '', products: '' });
    setShowSupplierForm(false);
    setEditingSupplier(null);
  };

  // Print form
  const printForm = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const branchName = branches.find(b => b.id === selectedBranch)?.name || 'SMP';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Form Konsinyasi - ${today}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 15px; font-size: 11px; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header h1 { font-size: 16px; margin-bottom: 3px; }
          .header p { font-size: 10px; color: #666; }
          .info { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 10px; }
          .price-info { background: #fff3cd; padding: 8px; border-radius: 5px; margin-bottom: 10px; text-align: center; font-size: 10px; }
          .price-info strong { font-size: 12px; }
          .supplier-section { margin-bottom: 15px; page-break-inside: avoid; }
          .supplier-header { background: #f97316; color: white; padding: 6px 10px; font-weight: bold; font-size: 12px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 6px; text-align: center; }
          th { background: #fee2e2; font-size: 10px; }
          td { height: 28px; }
          .product-name { text-align: left !important; font-weight: 500; }
          .write-col { background: #fffbeb; min-width: 60px; }
          .footer { margin-top: 15px; font-size: 9px; color: #666; }
          .signature { display: flex; justify-content: space-between; margin-top: 20px; }
          .signature div { text-align: center; width: 45%; }
          .signature-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; font-size: 10px; }
          .instructions { background: #e8f5e9; padding: 8px; margin-bottom: 10px; font-size: 9px; border-radius: 5px; }
          .instructions ol { margin-left: 15px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍳 SMP - SARAPAN MURAH PAGI</h1>
          <p>FORM KONSINYASI HARIAN</p>
        </div>
        
        <div class="info">
          <div><strong>Cabang:</strong> ${branchName}</div>
          <div><strong>Tanggal:</strong> ${today}</div>
        </div>

        <div class="price-info">
          💰 Harga Jual: <strong>${formatCurrency(SMP_PRICE.SELL)}</strong> | 
          Bayar Supplier: <strong>${formatCurrency(SMP_PRICE.BUY)}</strong> | 
          Profit: <strong>${formatCurrency(SMP_PRICE.PROFIT)}</strong>/porsi
        </div>

        <div class="instructions">
          <strong>📝 Cara Isi:</strong>
          <ol>
            <li><strong>SUPPLIER (Pagi)</strong> → Tulis jumlah yang DIBAWA</li>
            <li><strong>KASIR (Sore)</strong> → Tulis jumlah yang SISA</li>
            <li>Foto form ini → Kirim ke grup Telegram</li>
          </ol>
        </div>

        ${consignmentSuppliers.map(supplier => `
          <div class="supplier-section">
            <div class="supplier-header">
              <span>👤 ${supplier.name}</span>
              <span>📞 ${supplier.phone}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 50%">Menu</th>
                  <th class="write-col" style="width: 25%">📦 BAWA</th>
                  <th class="write-col" style="width: 25%">📋 SISA</th>
                </tr>
              </thead>
              <tbody>
                ${supplier.products.map(product => `
                  <tr>
                    <td class="product-name">${product.name}</td>
                    <td class="write-col"></td>
                    <td class="write-col"></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

        <div class="signature">
          <div>
            <strong>Supplier:</strong>
            <div class="signature-line">( Tanda Tangan )</div>
          </div>
          <div>
            <strong>Kasir:</strong>
            <div class="signature-line">( Tanda Tangan )</div>
          </div>
        </div>

        <div class="footer">
          <p>📱 Foto form yang sudah diisi dan kirim ke grup Telegram untuk pencatatan.</p>
          <p>💵 Terjual = Bawa - Sisa | Bayar Supplier = Terjual × ${formatCurrency(SMP_PRICE.BUY)}</p>
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Handle photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
      setSendStatus('idle');
    };
    reader.readAsDataURL(file);
  };

  // Send to Telegram
  const sendPhotoToTelegram = async () => {
    if (!photoPreview || !settings.telegramBotToken || !settings.telegramChatId) {
      alert('⚠️ Konfigurasi Telegram belum lengkap!');
      return;
    }

    setIsSending(true);
    try {
      const base64Data = photoPreview.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('chat_id', settings.telegramChatId);
      formData.append('photo', blob, `konsinyasi_${new Date().toISOString().split('T')[0]}.jpg`);
      formData.append('caption', `📋 *FORM KONSINYASI SMP*\n📅 ${today}\n📍 ${branches.find(b => b.id === selectedBranch)?.name || 'SMP'}\n\n💰 Harga: ${formatCurrency(SMP_PRICE.SELL)} | Bayar Supplier: ${formatCurrency(SMP_PRICE.BUY)}\n\n_Dikirim dari SMP App_`);
      formData.append('parse_mode', 'Markdown');

      const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.ok) {
        setSendStatus('success');
        savePhotoRecords([{ id: uuidv4(), date: new Date().toISOString(), photoData: photoPreview, sentToTelegram: true, sentAt: new Date().toISOString() }, ...photoRecords]);
        setTimeout(() => { setPhotoPreview(null); setSendStatus('idle'); }, 3000);
      } else {
        throw new Error(data.description);
      }
    } catch {
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const todayRecords = photoRecords.filter(r => r.date.split('T')[0] === new Date().toISOString().split('T')[0]);
  const totalProducts = consignmentSuppliers.reduce((a, s) => a + s.products.length, 0);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400">Supplier</p>
          <p className="text-2xl font-bold text-orange-400">{consignmentSuppliers.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400">Total Menu</p>
          <p className="text-2xl font-bold text-white">{totalProducts}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400">Harga Jual</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(SMP_PRICE.SELL)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400">Bayar Supplier</p>
          <p className="text-xl font-bold text-red-400">{formatCurrency(SMP_PRICE.BUY)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] text-slate-400">Profit/Porsi</p>
          <p className="text-xl font-bold text-blue-400">{formatCurrency(SMP_PRICE.PROFIT)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'print' as const, icon: '🖨️', label: 'Cetak Form' },
          { key: 'photo' as const, icon: '📷', label: 'Foto & Kirim' },
          { key: 'suppliers' as const, icon: '👥', label: 'Kelola Supplier' },
          { key: 'history' as const, icon: '📋', label: `Riwayat (${todayRecords.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === tab.key ? 'gradient-orange text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Print Tab */}
      {activeTab === 'print' && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl gradient-orange flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Printer size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Cetak Form Konsinyasi</h3>
              <p className="text-xs text-slate-400">Form untuk ditulis manual supplier & kasir</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-2 block">Pilih Cabang</label>
            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="w-full max-w-xs rounded-xl px-4 py-2.5 text-sm">
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <p className="text-xs text-slate-400 mb-2">📄 Form berisi:</p>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>• <strong>{consignmentSuppliers.length}</strong> supplier dengan <strong>{totalProducts}</strong> menu</li>
              <li>• Kolom <span className="text-amber-400">BAWA</span> untuk supplier tulis</li>
              <li>• Kolom <span className="text-amber-400">SISA</span> untuk kasir tulis sore hari</li>
            </ul>
          </div>

          <button onClick={printForm} className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-orange text-white font-semibold text-sm shadow-lg shadow-orange-500/20 hover:opacity-90">
            <Printer size={18} /> Cetak Form
          </button>
        </div>
      )}

      {/* Photo Tab */}
      {activeTab === 'photo' && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Camera size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Foto & Kirim ke Telegram</h3>
              <p className="text-xs text-slate-400">Foto form yang sudah diisi, kirim otomatis ke grup</p>
            </div>
          </div>

          {!settings.telegramBotToken || !settings.telegramChatId ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-400">Atur Bot Token & Chat ID di <strong>Pengaturan</strong> untuk mengaktifkan fitur ini.</p>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4">
              <p className="text-xs text-emerald-400">✅ Telegram terhubung</p>
            </div>
          )}

          <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${photoPreview ? 'border-orange-500/50 bg-orange-500/5' : 'border-slate-600'}`}>
            {photoPreview ? (
              <div>
                <img src={photoPreview} alt="Preview" className="max-h-64 mx-auto rounded-xl shadow-lg mb-4" />
                {sendStatus === 'success' ? (
                  <div className="bg-emerald-500/20 rounded-xl p-4 mb-4">
                    <Check size={32} className="mx-auto text-emerald-400 mb-2" />
                    <p className="text-emerald-400 font-semibold">Berhasil dikirim! ✅</p>
                  </div>
                ) : sendStatus === 'error' ? (
                  <div className="bg-red-500/20 rounded-xl p-4 mb-4">
                    <AlertCircle size={32} className="mx-auto text-red-400 mb-2" />
                    <p className="text-red-400">Gagal mengirim</p>
                  </div>
                ) : (
                  <div className="flex gap-3 justify-center">
                    <button onClick={sendPhotoToTelegram} disabled={isSending || !settings.telegramBotToken}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-orange text-white font-semibold text-sm shadow-lg shadow-orange-500/20 hover:opacity-90 disabled:opacity-50">
                      {isSending ? '⏳ Mengirim...' : <><Send size={18} /> Kirim ke Telegram</>}
                    </button>
                    <button onClick={() => { setPhotoPreview(null); setSendStatus('idle'); }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-600">
                      <X size={18} /> Batal
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Camera size={48} className="mx-auto mb-4 text-slate-500" />
                <p className="text-slate-400 mb-4">Foto form konsinyasi yang sudah diisi</p>
                <div className="flex gap-3 justify-center">
                  <label className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-orange text-white font-semibold text-sm cursor-pointer shadow-lg shadow-orange-500/20 hover:opacity-90">
                    <Camera size={18} /> Ambil Foto
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" ref={fileInputRef} />
                  </label>
                  <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-700 text-slate-300 font-medium text-sm cursor-pointer hover:bg-slate-600">
                    <Image size={18} /> Dari Galeri
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">{consignmentSuppliers.length} supplier terdaftar</p>
            <button onClick={() => { setEditingSupplier(null); setNewSupplier({ name: '', phone: '', products: '' }); setShowSupplierForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium shadow-lg shadow-orange-500/20 hover:opacity-90">
              <Plus size={16} /> Tambah Supplier
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {consignmentSuppliers.map(supplier => (
              <div key={supplier.id} className="glass-card rounded-2xl p-5 hover:border-orange-500/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center text-white font-bold">
                      {supplier.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{supplier.name}</h4>
                      <p className="text-xs text-slate-400">{supplier.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => {
                      setEditingSupplier(supplier);
                      setNewSupplier({ name: supplier.name, phone: supplier.phone, products: supplier.products.map(p => p.name).join('\n') });
                      setShowSupplierForm(true);
                    }} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-blue-400">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => deleteConsignmentSupplier(supplier.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 uppercase mb-2">{supplier.products.length} Menu</p>
                <div className="flex flex-wrap gap-1">
                  {supplier.products.map(p => (
                    <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">{p.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {photoRecords.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <Clock size={48} className="mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400">Belum ada riwayat foto</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photoRecords.map(record => (
                <div key={record.id} className="glass-card rounded-2xl overflow-hidden">
                  <img src={record.photoData} alt="Form" className="w-full h-32 object-cover" />
                  <div className="p-3">
                    <p className="text-xs text-white font-medium">{new Date(record.date).toLocaleDateString('id-ID')}</p>
                    <p className="text-[10px] text-slate-400">{new Date(record.date).toLocaleTimeString('id-ID')}</p>
                    {record.sentToTelegram && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 inline-block mt-1">✓ Terkirim</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowSupplierForm(false)}>
          <div className="glass-card rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">{editingSupplier ? '✏️ Edit Supplier' : '➕ Tambah Supplier'}</h3>
              <button onClick={() => setShowSupplierForm(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Nama Supplier</label>
              <input type="text" placeholder="cth: Bu Warni" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">No. Telepon</label>
              <input type="text" placeholder="08xxxxxxxxxx" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Daftar Menu (satu per baris)</label>
              <p className="text-[10px] text-slate-500 mb-2">Harga otomatis: Jual {formatCurrency(SMP_PRICE.SELL)}, Bayar Supplier {formatCurrency(SMP_PRICE.BUY)}</p>
              <textarea placeholder="Nasi Uduk Komplit&#10;Lontong Sayur&#10;Bubur Ayam" value={newSupplier.products} onChange={e => setNewSupplier({ ...newSupplier, products: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm h-32 resize-none" />
            </div>

            <button onClick={handleSaveSupplier} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
              <Check size={16} /> {editingSupplier ? 'Simpan' : 'Tambah Supplier'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
