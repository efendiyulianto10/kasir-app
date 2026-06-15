import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';
import type { ChatMessage, Settings, Transaction, Branch, Expense } from '../types';

interface Props {
  settings: Settings;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  transactions: Transaction[];
  branches: Branch[];
  expenses: Expense[];
}

export const AIAssistant: React.FC<Props> = ({ settings, chatMessages, addChatMessage, clearChat, transactions, branches, expenses }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getBusinessContext = () => {
    const totalSales = transactions.filter(t => t.status === 'completed').reduce((a, t) => a + t.total, 0);
    const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
    const totalTx = transactions.filter(t => t.status === 'completed').length;

    return `Kamu adalah AI Assistant untuk bisnis "SMP - Sarapan Murah Pagi" (bisnis sarapan serba Rp 10.000).
Data bisnis saat ini:
- Jumlah cabang: ${branches.length} (${branches.map(b => b.name).join(', ')})
- Total penjualan: Rp ${totalSales.toLocaleString('id-ID')}
- Total pengeluaran: Rp ${totalExpenses.toLocaleString('id-ID')}
- Laba bersih: Rp ${(totalSales - totalExpenses).toLocaleString('id-ID')}
- Jumlah transaksi: ${totalTx}
- Rata-rata transaksi: Rp ${totalTx > 0 ? Math.round(totalSales / totalTx).toLocaleString('id-ID') : 0}

Jawab dalam Bahasa Indonesia. Berikan analisis bisnis, saran strategi, atau bantuan yang diminta pengguna.`;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
    addChatMessage(userMsg);
    setInput('');
    setIsLoading(true);

    if (!settings.groqApiKey) {
      // Offline mode - provide helpful responses
      const offlineResponses = [
        `Terima kasih atas pertanyaan Anda tentang "${input.trim()}". Untuk menggunakan AI Assistant secara penuh, silakan masukkan API Key Groq di halaman Pengaturan.\n\n**Cara mendapatkan API Key Groq:**\n1. Kunjungi https://console.groq.com\n2. Daftar/Login\n3. Buat API Key baru\n4. Copy dan paste ke pengaturan\n\nSementara itu, berikut tips umum untuk bisnis sarapan:\n- Fokus pada konsistensi rasa\n- Jaga kebersihan dan higienitas\n- Layani pelanggan dengan ramah\n- Pantau stok bahan baku setiap hari`,
      ];
      setTimeout(() => {
        addChatMessage({ role: 'assistant', content: offlineResponses[0], timestamp: new Date().toISOString() });
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const messages = [
        { role: 'system', content: getBusinessContext() },
        ...chatMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: input.trim() },
      ];

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      const data = await response.json();
      const assistantMsg = data.choices?.[0]?.message?.content || 'Maaf, terjadi kesalahan. Silakan coba lagi.';
      addChatMessage({ role: 'assistant', content: assistantMsg, timestamp: new Date().toISOString() });
    } catch (error) {
      addChatMessage({ role: 'assistant', content: 'Terjadi kesalahan koneksi. Pastikan API Key Groq Anda valid dan koneksi internet stabil.', timestamp: new Date().toISOString() });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const suggestedPrompts = [
    '📊 Analisis performa bisnis saya',
    '💡 Strategi meningkatkan penjualan',
    '📈 Prediksi pendapatan bulan depan',
    '🎯 Tips efisiensi operasional',
    '🍽️ Ide menu baru serba 10 ribu',
    '📱 Strategi marketing digital',
  ];

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              AI Business Assistant
              <Sparkles size={14} className="text-amber-400" />
            </h3>
            <p className="text-[10px] text-slate-400">
              Powered by Groq AI {settings.groqApiKey ? '• ✅ Connected' : '• ⚠️ API Key belum diatur'}
            </p>
          </div>
        </div>
        <button onClick={clearChat} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20">
          <Trash2 size={12} /> Hapus Chat
        </button>
      </div>

      {!settings.groqApiKey && (
        <div className="glass-card rounded-xl p-3 mb-4 border border-amber-500/20 flex items-center gap-3">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400">Masukkan API Key Groq di halaman Pengaturan untuk mengaktifkan AI Assistant sepenuhnya. AI tetap dapat memberikan respons dasar dalam mode offline.</p>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1">
        {chatMessages.length === 0 && (
          <div className="text-center py-10">
            <Bot size={48} className="mx-auto mb-3 text-slate-600" />
            <p className="text-sm text-slate-400 mb-4">Halo! Saya AI Assistant SMP. Tanyakan apa saja tentang bisnis Anda.</p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {suggestedPrompts.map((prompt, i) => (
                <button key={i} onClick={() => { setInput(prompt.replace(/^[^\s]+\s/, '')); }}
                  className="text-left p-3 rounded-xl bg-slate-800/50 text-xs text-slate-300 hover:bg-slate-800 hover:text-orange-400 transition-all">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl p-4 ${
              msg.role === 'user'
                ? 'gradient-orange text-white'
                : 'glass-card'
            }`}>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] opacity-60">{new Date(msg.timestamp).toLocaleTimeString('id-ID')}</span>
                {msg.role === 'assistant' && (
                  <button onClick={() => copyToClipboard(msg.content, i)} className="text-[10px] opacity-60 hover:opacity-100 flex items-center gap-1">
                    {copiedIdx === i ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                  </button>
                )}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="glass-card rounded-2xl p-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Tanyakan tentang bisnis Anda..."
          className="flex-1 rounded-xl px-4 py-3 text-sm"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="px-6 rounded-xl gradient-orange text-white font-medium text-sm disabled:opacity-30 hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20 flex items-center gap-2"
        >
          <Send size={16} /> Kirim
        </button>
      </div>
    </div>
  );
};
