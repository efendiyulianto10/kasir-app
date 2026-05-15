import { useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, FlaskConical, Plus, X, Check, Target } from 'lucide-react';
import { DemandTest, Branch } from '../types';
import { generateId, formatCurrency } from '../store';

interface Props {
  demandTests: DemandTest[];
  branches: Branch[];
  onSave: (tests: DemandTest[]) => void;
}

export default function DemandTesting({ demandTests, branches, onSave }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [form, setForm] = useState<Partial<DemandTest>>({
    branchId: '', startDate: new Date().toISOString().split('T')[0], totalDays: 0,
    avgDailySales: 0, avgDailyRevenue: 0, avgDailyProfit: 0, consistency: 0,
    status: 'testing', notes: ''
  });

  const filtered = filter === 'all' ? demandTests : demandTests.filter(d => d.status === filter);

  const stats = {
    total: demandTests.length,
    testing: demandTests.filter(d => d.status === 'testing').length,
    consistent: demandTests.filter(d => d.status === 'consistent').length,
    graduated: demandTests.filter(d => d.status === 'graduated').length,
    inconsistent: demandTests.filter(d => d.status === 'inconsistent').length,
  };

  const handleSubmit = () => {
    if (!form.branchId) return;
    const branch = branches.find(b => b.id === form.branchId);
    const avgRevenue = (form.avgDailySales || 0) * 10000;
    
    const newTest: DemandTest = {
      id: generateId(),
      branchId: form.branchId || '',
      branchName: branch?.name || '',
      startDate: form.startDate || '',
      endDate: form.endDate || '',
      totalDays: form.totalDays || 0,
      avgDailySales: form.avgDailySales || 0,
      avgDailyRevenue: avgRevenue,
      avgDailyProfit: avgRevenue * 0.1,
      consistency: form.consistency || 0,
      status: (form.status as DemandTest['status']) || 'testing',
      notes: form.notes || '',
    };
    onSave([...demandTests, newTest]);
    setShowForm(false);
  };

  const updateStatus = (id: string, status: DemandTest['status']) => {
    const updated = demandTests.map(d => d.id === id ? { ...d, status } : d);
    onSave(updated);
  };

  const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    testing: { icon: FlaskConical, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: '🧪 Testing' },
    consistent: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: '📊 Konsisten' },
    graduated: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: '✅ Graduated' },
    inconsistent: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: '⚠️ Inkonsisten' },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧪 Demand Testing</h1>
          <p className="text-gray-500 text-sm">Uji konsistensi lapak — cari yang profitable & konsisten</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 shadow-lg shadow-orange-200">
          <Plus size={18} /> Mulai Testing
        </button>
      </div>

      {/* Strategy Info */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Target size={24} />
          <h3 className="font-bold text-lg">Strategi Demand Testing SMP</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-bold mb-1">Fase 1: Testing 🧪</div>
            <p className="text-indigo-100 text-xs">Buka lapak baru, test 14-30 hari, amati pola penjualan</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-bold mb-1">Fase 2: Evaluasi 📊</div>
            <p className="text-indigo-100 text-xs">Konsistensi &gt;70% = lanjut, &lt;50% = pindah lokasi</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-bold mb-1">Fase 3: Scale ✅</div>
            <p className="text-indigo-100 text-xs">Graduated = autopilot, fokus buka cabang baru</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Testing', value: stats.testing, color: 'text-yellow-600' },
          { label: 'Konsisten', value: stats.consistent, color: 'text-blue-600' },
          { label: 'Graduated', value: stats.graduated, color: 'text-green-600' },
          { label: 'Inkonsisten', value: stats.inconsistent, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[{ v: 'all', l: 'Semua' }, { v: 'testing', l: '🧪 Testing' }, { v: 'consistent', l: '📊 Konsisten' }, { v: 'graduated', l: '✅ Graduated' }, { v: 'inconsistent', l: '⚠️ Inkonsisten' }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f.v ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(dt => {
          const config = statusConfig[dt.status];
          return (
            <div key={dt.id} className={`rounded-2xl p-5 border-2 ${config.bg} transition-all hover:shadow-md`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{dt.branchName}</h3>
                  <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{dt.consistency}%</div>
                  <div className="text-xs text-gray-500">konsistensi</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{dt.avgDailySales}</div>
                  <div className="text-xs text-gray-500">pcs/hari</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{formatCurrency(dt.avgDailyRevenue)}</div>
                  <div className="text-xs text-gray-500">revenue/hari</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{formatCurrency(dt.avgDailyProfit)}</div>
                  <div className="text-xs text-gray-500">profit/hari</div>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div className={`h-3 rounded-full transition-all ${
                  dt.consistency >= 80 ? 'bg-green-500' : dt.consistency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`} style={{ width: `${dt.consistency}%` }} />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>📅 {dt.startDate} — {dt.endDate || 'ongoing'}</span>
                <span>📊 {dt.totalDays} hari</span>
              </div>

              {dt.notes && <p className="text-xs text-gray-600 bg-white/50 rounded-lg p-2 mb-3">💬 {dt.notes}</p>}

              <div className="flex gap-2">
                {dt.status === 'testing' && (
                  <>
                    <button onClick={() => updateStatus(dt.id, 'consistent')}
                      className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">📊 Konsisten</button>
                    <button onClick={() => updateStatus(dt.id, 'inconsistent')}
                      className="flex-1 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">⚠️ Stop</button>
                  </>
                )}
                {dt.status === 'consistent' && (
                  <button onClick={() => updateStatus(dt.id, 'graduated')}
                    className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">✅ Graduate</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Mulai Demand Testing</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Cabang</label>
                <select value={form.branchId || ''} onChange={e => setForm({ ...form, branchId: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                  <option value="">Pilih cabang</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Mulai</label>
                  <input type="date" value={form.startDate || ''} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Durasi (hari)</label>
                  <input type="number" value={form.totalDays || ''} onChange={e => setForm({ ...form, totalDays: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Avg Penjualan/hari</label>
                  <input type="number" value={form.avgDailySales || ''} onChange={e => setForm({ ...form, avgDailySales: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="50" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Konsistensi (%)</label>
                  <input type="number" min={0} max={100} value={form.consistency || ''} onChange={e => setForm({ ...form, consistency: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" placeholder="75" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Catatan</label>
                <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500" rows={2} placeholder="Observasi lokasi..." />
              </div>
              <button onClick={handleSubmit}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 flex items-center justify-center gap-2">
                <Check size={18} /> Mulai Testing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
