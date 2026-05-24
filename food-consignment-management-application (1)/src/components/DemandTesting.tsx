import { useState, useMemo } from 'react';
import { 
  TrendingUp, AlertTriangle, CheckCircle, FlaskConical, Plus, X, Check, 
  Target, Trash2, Edit2, BarChart3, Calendar, Zap, Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { DemandTest, Branch, DailyTransaction } from '../types';
import { generateId, formatCurrency } from '../store';

interface Props {
  demandTests: DemandTest[];
  branches: Branch[];
  transactions: DailyTransaction[];
  onSave: (tests: DemandTest[]) => void;
}

export default function DemandTesting({ demandTests, branches, transactions, onSave }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<DemandTest | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [detailId, setDetailId] = useState<string | null>(null);

  // Form state
  const [formBranchId, setFormBranchId] = useState('');
  const [formStart, setFormStart] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [formEnd, setFormEnd] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');

  // Auto-compute stats for selected branch & period
  const formPreview = useMemo(() => {
    if (!formBranchId || !formStart || !formEnd) return null;

    const branchTx = transactions.filter(
      t => t.branchId === formBranchId && t.date >= formStart && t.date <= formEnd
    );

    // Group by date
    const dailyMap = new Map<string, { revenue: number; items: number; count: number }>();
    branchTx.forEach(t => {
      const d = dailyMap.get(t.date) || { revenue: 0, items: 0, count: 0 };
      d.revenue += t.totalAmount;
      d.items += t.items.reduce((s, i) => s + i.qty, 0);
      d.count += 1;
      dailyMap.set(t.date, d);
    });

    // Total calendar days in range
    const start = new Date(formStart);
    const end = new Date(formEnd);
    const calendarDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const activeDays = dailyMap.size;

    // Daily data array
    const dailyData: { date: string; revenue: number; items: number }[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ds = d.toISOString().split('T')[0];
      const entry = dailyMap.get(ds);
      dailyData.push({ date: ds, revenue: entry?.revenue || 0, items: entry?.items || 0 });
    }

    const totalRevenue = Array.from(dailyMap.values()).reduce((s, d) => s + d.revenue, 0);
    const totalItems = Array.from(dailyMap.values()).reduce((s, d) => s + d.items, 0);
    const avgDailySales = activeDays > 0 ? Math.round(totalItems / activeDays) : 0;
    const avgDailyRevenue = activeDays > 0 ? Math.round(totalRevenue / activeDays) : 0;
    const avgDailyProfit = Math.round(avgDailyRevenue * 0.1);

    // Consistency = % hari yang ada penjualan dari total calendar days
    const consistency = Math.round((activeDays / calendarDays) * 100);

    // Variance: seberapa stabil sales per hari aktif
    const salesArr = Array.from(dailyMap.values()).map(d => d.items);
    const mean = salesArr.reduce((s, v) => s + v, 0) / (salesArr.length || 1);
    const variance = salesArr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (salesArr.length || 1);
    const stability = mean > 0 ? Math.max(0, Math.round(100 - (Math.sqrt(variance) / mean) * 100)) : 0;

    // Overall score: weighted average of consistency & stability
    const score = Math.round(consistency * 0.6 + stability * 0.4);

    return {
      calendarDays, activeDays, totalRevenue, totalItems,
      avgDailySales, avgDailyRevenue, avgDailyProfit,
      consistency, stability, score, dailyData,
    };
  }, [formBranchId, formStart, formEnd, transactions]);

  // Compute live stats for existing tests
  const testsWithLiveData = useMemo(() => {
    return demandTests.map(dt => {
      const branchTx = transactions.filter(
        t => t.branchId === dt.branchId && t.date >= dt.startDate && (!dt.endDate || t.date <= dt.endDate)
      );
      const dailyMap = new Map<string, { revenue: number; items: number }>();
      branchTx.forEach(t => {
        const d = dailyMap.get(t.date) || { revenue: 0, items: 0 };
        d.revenue += t.totalAmount;
        d.items += t.items.reduce((s, i) => s + i.qty, 0);
        dailyMap.set(t.date, d);
      });

      const start = new Date(dt.startDate);
      const end = dt.endDate ? new Date(dt.endDate) : new Date();
      const calendarDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
      const activeDays = dailyMap.size;

      const totalItems = Array.from(dailyMap.values()).reduce((s, d) => s + d.items, 0);
      const totalRevenue = Array.from(dailyMap.values()).reduce((s, d) => s + d.revenue, 0);
      const liveSales = activeDays > 0 ? Math.round(totalItems / activeDays) : dt.avgDailySales;
      const liveRevenue = activeDays > 0 ? Math.round(totalRevenue / activeDays) : dt.avgDailyRevenue;
      const liveConsistency = activeDays > 0 ? Math.round((activeDays / calendarDays) * 100) : dt.consistency;

      // Chart data
      const chartData: { date: string; items: number; revenue: number }[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const ds = d.toISOString().split('T')[0];
        const entry = dailyMap.get(ds);
        chartData.push({ date: ds.slice(5), items: entry?.items || 0, revenue: entry?.revenue || 0 });
      }

      return { ...dt, liveSales, liveRevenue, liveConsistency, liveProfit: Math.round(liveRevenue * 0.1), activeDays, calendarDays, chartData, totalItems, totalRevenue };
    });
  }, [demandTests, transactions]);

  const filtered = filter === 'all' ? testsWithLiveData : testsWithLiveData.filter(d => d.status === filter);

  const stats = {
    total: demandTests.length,
    testing: demandTests.filter(d => d.status === 'testing').length,
    consistent: demandTests.filter(d => d.status === 'consistent').length,
    graduated: demandTests.filter(d => d.status === 'graduated').length,
    inconsistent: demandTests.filter(d => d.status === 'inconsistent').length,
  };

  const handleSubmit = () => {
    if (!formBranchId || !formPreview) return;
    const branch = branches.find(b => b.id === formBranchId);

    const autoStatus: DemandTest['status'] = 
      formPreview.score >= 75 ? 'consistent' :
      formPreview.score >= 50 ? 'testing' : 'inconsistent';

    const test: DemandTest = {
      id: editingTest?.id || generateId(),
      branchId: formBranchId,
      branchName: branch?.name || '',
      startDate: formStart,
      endDate: formEnd,
      totalDays: formPreview.calendarDays,
      avgDailySales: formPreview.avgDailySales,
      avgDailyRevenue: formPreview.avgDailyRevenue,
      avgDailyProfit: formPreview.avgDailyProfit,
      consistency: formPreview.consistency,
      status: editingTest?.status || autoStatus,
      notes: formNotes,
    };

    if (editingTest) {
      onSave(demandTests.map(d => d.id === editingTest.id ? test : d));
    } else {
      onSave([...demandTests, test]);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTest(null);
    setFormBranchId('');
    setFormStart(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
    setFormEnd(new Date().toISOString().split('T')[0]);
    setFormNotes('');
  };

  const editTest = (dt: DemandTest) => {
    setEditingTest(dt);
    setFormBranchId(dt.branchId);
    setFormStart(dt.startDate);
    setFormEnd(dt.endDate || new Date().toISOString().split('T')[0]);
    setFormNotes(dt.notes);
    setShowForm(true);
  };

  const deleteTest = (id: string) => {
    if (confirm('Hapus demand test ini?')) onSave(demandTests.filter(d => d.id !== id));
  };

  const updateStatus = (id: string, status: DemandTest['status']) => {
    onSave(demandTests.map(d => d.id === id ? { ...d, status, endDate: status === 'graduated' || status === 'inconsistent' ? new Date().toISOString().split('T')[0] : d.endDate } : d));
  };

  const statusCfg: Record<string, { color: string; bg: string; label: string }> = {
    testing:      { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', label: '🧪 Testing' },
    consistent:   { color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     label: '📊 Konsisten' },
    graduated:    { color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   label: '✅ Graduated' },
    inconsistent: { color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       label: '⚠️ Inkonsisten' },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧪 Demand Testing</h1>
          <p className="text-gray-500 text-sm">Evaluasi konsistensi & profitabilitas setiap lapak</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 shadow-lg shadow-orange-200">
          <Plus size={18} /> Demand Test Baru
        </button>
      </div>

      {/* Strategy */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Target size={24} />
          <h3 className="font-bold text-lg">Strategi Demand Testing SMP</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-bold mb-1">1. Buka Lapak 🏪</div>
            <p className="text-indigo-100 text-xs">Buka cabang baru di lokasi potensial</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-bold mb-1">2. Testing 🧪</div>
            <p className="text-indigo-100 text-xs">Jalan 14-30 hari, catat semua transaksi</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-bold mb-1">3. Evaluasi 📊</div>
            <p className="text-indigo-100 text-xs">Score ≥75% = konsisten, &lt;50% = pindah</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-bold mb-1">4. Graduate ✅</div>
            <p className="text-indigo-100 text-xs">Autopilot, buka cabang baru lagi</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Testing', value: stats.testing, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Konsisten', value: stats.consistent, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Graduated', value: stats.graduated, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Inkonsisten', value: stats.inconsistent, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-gray-100 text-center`}>
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { v: 'all', l: `Semua (${stats.total})` },
          { v: 'testing', l: `🧪 Testing (${stats.testing})` },
          { v: 'consistent', l: `📊 Konsisten (${stats.consistent})` },
          { v: 'graduated', l: `✅ Graduated (${stats.graduated})` },
          { v: 'inconsistent', l: `⚠️ Inkonsisten (${stats.inconsistent})` },
        ].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.v ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Test Cards */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border text-center text-gray-400">
          <FlaskConical size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Belum ada demand test</p>
          <p className="text-sm mt-1">Klik "Demand Test Baru" untuk mulai evaluasi cabang</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(dt => {
          const cfg = statusCfg[dt.status];
          const scoreColor = dt.liveConsistency >= 75 ? 'text-green-600' : dt.liveConsistency >= 50 ? 'text-yellow-600' : 'text-red-600';
          return (
            <div key={dt.id} className={`rounded-2xl border-2 ${cfg.bg} transition-all hover:shadow-lg`}>
              {/* Header */}
              <div className="p-4 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{dt.branchName}</h3>
                  <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setDetailId(detailId === dt.id ? null : dt.id)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Detail"><Eye size={14} /></button>
                  <button onClick={() => editTest(dt)}
                    className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg" title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => deleteTest(dt.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={14} /></button>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="px-4 grid grid-cols-4 gap-2 mb-3">
                <div className="text-center bg-white/60 rounded-lg p-2">
                  <div className={`text-xl font-bold ${scoreColor}`}>{dt.liveConsistency}%</div>
                  <div className="text-[10px] text-gray-500">Konsistensi</div>
                </div>
                <div className="text-center bg-white/60 rounded-lg p-2">
                  <div className="text-xl font-bold text-gray-900">{dt.liveSales}</div>
                  <div className="text-[10px] text-gray-500">Avg/hari</div>
                </div>
                <div className="text-center bg-white/60 rounded-lg p-2">
                  <div className="text-lg font-bold text-orange-600">{formatCurrency(dt.liveRevenue)}</div>
                  <div className="text-[10px] text-gray-500">Revenue/hari</div>
                </div>
                <div className="text-center bg-white/60 rounded-lg p-2">
                  <div className="text-lg font-bold text-green-600">{formatCurrency(dt.liveProfit)}</div>
                  <div className="text-[10px] text-gray-500">Profit/hari</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-4 mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all ${dt.liveConsistency >= 75 ? 'bg-green-500' : dt.liveConsistency >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(dt.liveConsistency, 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>{dt.activeDays} hari aktif / {dt.calendarDays} hari</span>
                  <span>Total: {dt.totalItems} pcs • {formatCurrency(dt.totalRevenue)}</span>
                </div>
              </div>

              {/* Chart (collapsible) */}
              {detailId === dt.id && dt.chartData.length > 0 && (
                <div className="px-4 mb-3">
                  <div className="bg-white rounded-xl p-3 border">
                    <div className="text-xs font-medium text-gray-700 mb-2">📈 Tren Penjualan Harian</div>
                    <ResponsiveContainer width="100%" height={150}>
                      <ComposedChart data={dt.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.max(0, Math.floor(dt.chartData.length / 8))} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip formatter={(v: unknown) => [Number(v), '']} labelFormatter={(l) => `Tanggal: ${l}`} />
                        <Bar dataKey="items" name="Porsi" fill="#f97316" radius={[2,2,0,0]} />
                        <Line dataKey="items" name="Tren" stroke="#6366f1" strokeWidth={2} dot={false} type="monotone" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 pb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {dt.startDate} — {dt.endDate || 'ongoing'}</span>
                </div>
                {dt.notes && <p className="text-xs text-gray-600 bg-white/50 rounded-lg p-2 mb-2">💬 {dt.notes}</p>}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {dt.status === 'testing' && (
                    <>
                      <button onClick={() => updateStatus(dt.id, 'consistent')}
                        className="flex-1 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-1">
                        <TrendingUp size={12} /> Konsisten
                      </button>
                      <button onClick={() => updateStatus(dt.id, 'inconsistent')}
                        className="flex-1 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-1">
                        <AlertTriangle size={12} /> Stop
                      </button>
                    </>
                  )}
                  {dt.status === 'consistent' && (
                    <button onClick={() => updateStatus(dt.id, 'graduated')}
                      className="flex-1 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-1">
                      <CheckCircle size={12} /> Graduate!
                    </button>
                  )}
                  {dt.status === 'inconsistent' && (
                    <button onClick={() => updateStatus(dt.id, 'testing')}
                      className="flex-1 py-2 text-xs bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium flex items-center justify-center gap-1">
                      <FlaskConical size={12} /> Coba Lagi
                    </button>
                  )}
                  {dt.status === 'graduated' && (
                    <div className="flex-1 py-2 text-xs text-green-700 bg-green-100 rounded-lg font-medium text-center flex items-center justify-center gap-1">
                      <Zap size={12} /> Autopilot Mode
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) resetForm(); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">{editingTest ? '✏️ Edit Demand Test' : '🧪 Demand Test Baru'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Branch */}
              <div>
                <label className="text-sm font-medium text-gray-700">Pilih Cabang</label>
                <select value={formBranchId} onChange={e => setFormBranchId(e.target.value)}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                  <option value="">— Pilih cabang —</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.status})</option>)}
                </select>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Mulai Dari</label>
                  <input type="date" value={formStart} onChange={e => setFormStart(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Sampai</label>
                  <input type="date" value={formEnd} onChange={e => setFormEnd(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>

              {/* Auto-computed preview */}
              {formBranchId && formPreview && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <BarChart3 size={16} className="text-indigo-600" />
                    Hasil Analisis Otomatis
                  </div>

                  {formPreview.activeDays === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      <p>📊 Tidak ada transaksi di periode ini</p>
                      <p className="text-xs mt-1">Pilih periode yang ada datanya, atau input transaksi dulu</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-white rounded-lg p-2">
                          <div className="text-xs text-gray-500">Konsistensi</div>
                          <div className={`text-xl font-bold ${formPreview.consistency >= 75 ? 'text-green-600' : formPreview.consistency >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{formPreview.consistency}%</div>
                          <div className="text-[10px] text-gray-400">{formPreview.activeDays}/{formPreview.calendarDays} hari aktif</div>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <div className="text-xs text-gray-500">Stabilitas</div>
                          <div className={`text-xl font-bold ${formPreview.stability >= 70 ? 'text-green-600' : formPreview.stability >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>{formPreview.stability}%</div>
                          <div className="text-[10px] text-gray-400">variasi penjualan</div>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <div className="text-xs text-gray-500">Avg Sales/hari</div>
                          <div className="text-lg font-bold text-gray-900">{formPreview.avgDailySales} pcs</div>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <div className="text-xs text-gray-500">Avg Revenue/hari</div>
                          <div className="text-lg font-bold text-orange-600">{formatCurrency(formPreview.avgDailyRevenue)}</div>
                        </div>
                      </div>

                      {/* Mini chart */}
                      {formPreview.dailyData.length > 0 && formPreview.dailyData.length <= 90 && (
                        <div className="bg-white rounded-xl p-2">
                          <ResponsiveContainer width="100%" height={100}>
                            <BarChart data={formPreview.dailyData}>
                              <Bar dataKey="items" fill="#f97316" radius={[2,2,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Score */}
                      <div className={`text-center p-3 rounded-xl ${formPreview.score >= 75 ? 'bg-green-100 text-green-700' : formPreview.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        <div className="text-2xl font-bold">{formPreview.score}/100</div>
                        <div className="text-xs font-medium">
                          {formPreview.score >= 75 ? '✅ Layak lanjut / konsisten' : formPreview.score >= 50 ? '🧪 Masih perlu testing' : '⚠️ Kurang konsisten, pertimbangkan pindah'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700">Catatan</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" rows={2}
                  placeholder="Observasi lokasi, kondisi sekitar, dll..." />
              </div>

              {/* Submit */}
              <button onClick={handleSubmit} disabled={!formBranchId || !formPreview}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <Check size={18} /> {editingTest ? 'Simpan Perubahan' : 'Simpan Demand Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
