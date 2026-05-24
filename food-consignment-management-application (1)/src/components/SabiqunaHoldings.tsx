import { useState, useMemo, useEffect } from 'react';
import {
  Building2, TrendingUp, TrendingDown, ArrowRight, Plus, X, Check, Edit2, Trash2,
  Globe, Layers, AlertTriangle, LogOut, DollarSign, Activity
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, Line
} from 'recharts';
import { Branch, Supplier, Product, DailyTransaction, DemandTest, BusinessLine, FinanceSnapshot } from '../types';
import { User } from '../auth';
import { formatCurrency, generateId } from '../store';

interface Props {
  user: User;
  transactions: DailyTransaction[];
  branches: Branch[];
  suppliers: Supplier[];
  products: Product[];
  demandTests: DemandTest[];
  onEnterSmp: () => void;
  onLogout: () => void;
}

function loadBiz(): BusinessLine[] { try { return JSON.parse(localStorage.getItem('sbq_biz')!) || defBiz(); } catch { return defBiz(); } }
function saveBizData(d: BusinessLine[]) { localStorage.setItem('sbq_biz', JSON.stringify(d)); }
function loadFin(): FinanceSnapshot[] { try { return JSON.parse(localStorage.getItem('sbq_fin')!) || []; } catch { return []; } }
function saveFinData(d: FinanceSnapshot[]) { localStorage.setItem('sbq_fin', JSON.stringify(d)); }

function defBiz(): BusinessLine[] {
  return [{ id: 'smp', name: 'SMP - Sarapan Murah Pagi', code: 'SMP', icon: '🍳', description: 'Sarapan serba Rp 10.000', status: 'active', targetRevenue: 100000000, currentRevenue: 0, branches: 0, employees: 0, startDate: '2024-01-15', color: '#f97316', notes: 'Target 100 cabang' }];
}

const fc = (n: number) => formatCurrency(n);
const pct = (a: number, b: number) => b > 0 ? ((a - b) / b * 100) : 0;
const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899', '#14b8a6'];
const ttStyle = { background: '#111827', border: '1px solid #374151', borderRadius: 12, color: '#e5e7eb', fontSize: 12 };

export default function SabiqunaHoldings({ user, transactions, branches, suppliers, demandTests, onEnterSmp, onLogout }: Props) {
  const [bizList, setBizList] = useState(loadBiz);
  const [finance, setFinance] = useState(loadFin);
  const [tab, setTab] = useState<'bisnis' | 'finance'>('bisnis');
  const [showBizForm, setShowBizForm] = useState(false);
  const [editBiz, setEditBiz] = useState<BusinessLine | null>(null);
  const [showFinForm, setShowFinForm] = useState(false);
  const [fN, setFN] = useState(''); const [fC, setFC] = useState(''); const [fI, setFI] = useState('🏪');
  const [fD, setFD] = useState(''); const [fS, setFS] = useState<'active' | 'planning' | 'paused'>('planning');
  const [fT, setFT] = useState(0); const [fCol, setFCol] = useState('#3b82f6'); const [fNo, setFNo] = useState('');
  const [ffU, setFfU] = useState(16300); const [ffG, setFfG] = useState(1720000);
  const [ffInf, setFfInf] = useState(2.8); const [ffBi, setFfBi] = useState(5.75);

  // ══════════════════════════════════════════════
  // REAL DATA: Build daily P&L from actual transactions
  // ══════════════════════════════════════════════
  const realFinance = useMemo(() => {
    // Group transactions by date
    const dailyMap = new Map<string, { rev: number; profit: number; hpp: number; items: number; tx: number }>();
    transactions.forEach(t => {
      const d = dailyMap.get(t.date) || { rev: 0, profit: 0, hpp: 0, items: 0, tx: 0 };
      d.rev += t.totalAmount;
      d.profit += t.totalProfit;
      d.hpp += t.totalAmount - t.totalProfit;
      d.items += t.items.reduce((s, i) => s + i.qty, 0);
      d.tx += 1;
      dailyMap.set(t.date, d);
    });

    // Sort by date and build cumulative
    const sorted = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let cumRev = 0, cumProfit = 0;
    const daily = sorted.map(([date, d]) => {
      cumRev += d.rev;
      cumProfit += d.profit;
      return { date, ...d, cumRev, cumProfit, margin: d.rev > 0 ? (d.profit / d.rev * 100) : 0 };
    });

    // Today, yesterday, this week, this month, last month
    const today = new Date().toISOString().split('T')[0];
    const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();
    const thisMonthStart = new Date(); thisMonthStart.setDate(1);
    const lastMonthStart = new Date(); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1); lastMonthStart.setDate(1);
    const lastMonthEnd = new Date(); lastMonthEnd.setDate(0);

    const todayD = dailyMap.get(today) || { rev: 0, profit: 0, hpp: 0, items: 0, tx: 0 };
    const yesterdayD = dailyMap.get(yesterday) || { rev: 0, profit: 0, hpp: 0, items: 0, tx: 0 };

    const thisMonth = sorted.filter(([d]) => d >= thisMonthStart.toISOString().split('T')[0]);
    const lastMonth = sorted.filter(([d]) => d >= lastMonthStart.toISOString().split('T')[0] && d <= lastMonthEnd.toISOString().split('T')[0]);

    const mRev = thisMonth.reduce((s, [, d]) => s + d.rev, 0);
    const mProfit = thisMonth.reduce((s, [, d]) => s + d.profit, 0);
    const lmRev = lastMonth.reduce((s, [, d]) => s + d.rev, 0);
    const lmProfit = lastMonth.reduce((s, [, d]) => s + d.profit, 0);

    // Per-branch revenue
    const branchRev = new Map<string, number>();
    transactions.filter(t => t.date >= thisMonthStart.toISOString().split('T')[0]).forEach(t => {
      branchRev.set(t.branchId, (branchRev.get(t.branchId) || 0) + t.totalAmount);
    });

    // Per-supplier settlement
    const supSettle = new Map<string, { name: string; rev: number; pay: number; items: number }>();
    transactions.filter(t => t.date >= thisMonthStart.toISOString().split('T')[0]).forEach(t => {
      t.items.forEach(item => {
        const s = supSettle.get(item.supplierId) || { name: item.supplierName, rev: 0, pay: 0, items: 0 };
        s.rev += item.subtotal; s.pay += item.subtotal * 0.9; s.items += item.qty;
        supSettle.set(item.supplierId, s);
      });
    });

    // Payment method breakdown
    const payMethod: Record<string, number> = {};
    transactions.filter(t => t.date >= thisMonthStart.toISOString().split('T')[0]).forEach(t => {
      payMethod[t.paymentMethod] = (payMethod[t.paymentMethod] || 0) + t.totalAmount;
    });

    return {
      daily: daily.slice(-30), // last 30 days
      today: todayD, yesterday: yesterdayD,
      mRev, mProfit, mHpp: mRev - mProfit,
      lmRev, lmProfit,
      mGrowth: pct(mRev, lmRev),
      dailyGrowth: pct(todayD.rev, yesterdayD.rev),
      totalRev: cumRev, totalProfit: cumProfit,
      branchRev: Array.from(branchRev.entries()).map(([id, rev]) => ({
        name: branches.find(b => b.id === id)?.name || id, rev, profit: rev * 0.1,
      })).sort((a, b) => b.rev - a.rev),
      supSettle: Array.from(supSettle.values()).sort((a, b) => b.rev - a.rev),
      payMethod: Object.entries(payMethod).map(([k, v]) => ({
        name: { cash: 'Tunai', qris: 'QRIS', shopeefood: 'ShopeeFood', gofood: 'GoFood' }[k] || k, value: v,
      })),
    };
  }, [transactions, branches]);

  // Sync SMP biz card
  useEffect(() => {
    const smp = bizList.find(b => b.id === 'smp');
    if (!smp) return;
    const rev = realFinance.mRev;
    if (rev !== smp.currentRevenue || branches.length !== smp.branches) {
      const u = bizList.map(b => b.id === 'smp' ? { ...b, currentRevenue: rev, branches: branches.length, employees: suppliers.filter(s => s.status === 'active').length } : b);
      setBizList(u); saveBizData(u);
    }
  }, [realFinance.mRev, branches.length, suppliers]);

  // holdingTotal computed inline where needed

  const latestFin = finance.length > 0 ? finance[finance.length - 1] : null;
  const prevFin = finance.length > 1 ? finance[finance.length - 2] : null;

  // Merged chart: revenue + macro
  const mergedChart = useMemo(() => {
    const finMap = new Map<string, FinanceSnapshot>();
    finance.forEach(f => finMap.set(f.date, f));
    return realFinance.daily.map(d => {
      const f = finMap.get(d.date);
      return { ...d, dateLabel: d.date.slice(5), usd: f?.usdToIdr || null, gold: f?.goldPerGram || null, inflation: f?.inflationRate || null };
    });
  }, [realFinance.daily, finance]);

  // Business form handlers
  const saveBizItem = () => {
    if (!fN) return;
    const item: BusinessLine = { id: editBiz?.id || generateId(), name: fN, code: fC, icon: fI, description: fD, status: fS, targetRevenue: fT, currentRevenue: editBiz?.currentRevenue || 0, branches: editBiz?.branches || 0, employees: editBiz?.employees || 0, startDate: editBiz?.startDate || new Date().toISOString().split('T')[0], color: fCol, notes: fNo };
    const u = editBiz ? bizList.map(b => b.id === editBiz.id ? item : b) : [...bizList, item];
    setBizList(u); saveBizData(u); resetBiz();
  };
  const resetBiz = () => { setShowBizForm(false); setEditBiz(null); setFN(''); setFC(''); setFI('🏪'); setFD(''); setFS('planning'); setFT(0); setFCol('#3b82f6'); setFNo(''); };
  const startEdit = (b: BusinessLine) => { setEditBiz(b); setFN(b.name); setFC(b.code); setFI(b.icon); setFD(b.description); setFS(b.status); setFT(b.targetRevenue); setFCol(b.color); setFNo(b.notes); setShowBizForm(true); };
  const delBiz = (id: string) => { if (id === 'smp' || !confirm('Hapus?')) return; const u = bizList.filter(b => b.id !== id); setBizList(u); saveBizData(u); };
  const addFin = () => {
    const s: FinanceSnapshot = { date: new Date().toISOString().split('T')[0], usdToIdr: ffU, goldPerGram: ffG, inflationRate: ffInf, biRate: ffBi, totalRevenue: realFinance.mRev, totalProfit: realFinance.mProfit, totalAssets: 0, notes: '' };
    const u = [...finance, s]; setFinance(u); saveFinData(u); setShowFinForm(false);
  };

  const stLabel: Record<string, string> = { active: '🟢 Aktif', planning: '📋 Planning', paused: '⏸️ Pause' };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 size={22} className="text-indigo-400" />
          <div><h1 className="font-bold text-lg leading-tight">SABIQUNA</h1><p className="text-gray-500 text-[10px]">Holdings Dashboard</p></div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{user.name}</span>
          <button onClick={onLogout} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-800"><LogOut size={16} /></button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-5">
        {/* KPI strip — all real data */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KCard label="Revenue Bulan Ini" value={fc(realFinance.mRev)} change={realFinance.mGrowth} />
          <KCard label="Profit (10%)" value={fc(realFinance.mProfit)} sub={`HPP: ${fc(realFinance.mHpp)}`} />
          <KCard label="Hari Ini" value={fc(realFinance.today.rev)} change={realFinance.dailyGrowth} sub={`${realFinance.today.items} pcs`} />
          <KCard label="Cabang" value={`${branches.filter(b => b.status === 'active').length}`} sub={`${branches.length} total`} />
          <KCard label="USD/IDR" value={latestFin ? `${Math.round(latestFin.usdToIdr).toLocaleString()}` : '—'} change={latestFin && prevFin ? pct(latestFin.usdToIdr, prevFin.usdToIdr) : undefined} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[{ id: 'bisnis', l: '🏛️ Portfolio' }, { id: 'finance', l: '📊 Finance & Macro' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t.id ? 'bg-indigo-600' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{t.l}</button>
          ))}
        </div>

        {/* ═══ PORTFOLIO ═══ */}
        {tab === 'bisnis' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => { resetBiz(); setShowBizForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-sm font-medium"><Plus size={16} /> Tambah Bisnis</button>
            </div>
            {bizList.map(biz => {
              const p = biz.targetRevenue > 0 ? Math.min(Math.round(biz.currentRevenue / biz.targetRevenue * 100), 100) : 0;
              return (
                <div key={biz.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3"><span className="text-3xl">{biz.icon}</span><div><h3 className="font-bold text-lg">{biz.name}</h3><p className="text-gray-500 text-xs">{biz.description}</p></div></div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded-lg">{stLabel[biz.status]}</span>
                      <button onClick={() => startEdit(biz)} className="p-1.5 text-gray-600 hover:text-white rounded"><Edit2 size={14} /></button>
                      {biz.id !== 'smp' && <button onClick={() => delBiz(biz.id)} className="p-1.5 text-gray-600 hover:text-red-400 rounded"><Trash2 size={14} /></button>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center"><div className="text-lg font-bold" style={{ color: biz.color }}>{fc(biz.currentRevenue)}</div><div className="text-[10px] text-gray-500">Revenue</div></div>
                    <div className="text-center"><div className="text-lg font-bold">{biz.branches}</div><div className="text-[10px] text-gray-500">Cabang</div></div>
                    <div className="text-center"><div className="text-lg font-bold">{biz.employees}</div><div className="text-[10px] text-gray-500">{biz.id === 'smp' ? 'Supplier' : 'Tim'}</div></div>
                  </div>
                  {biz.targetRevenue > 0 && <div className="mb-3"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Target: {fc(biz.targetRevenue)}</span><span style={{ color: biz.color }}>{p}%</span></div><div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${p}%`, backgroundColor: biz.color }} /></div></div>}
                  {biz.id === 'smp' && <button onClick={onEnterSmp} className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2"><span>Masuk Dashboard SMP</span><ArrowRight size={16} /></button>}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ FINANCE & MACRO — ALL REAL DATA ═══ */}
        {tab === 'finance' && (
          <div className="space-y-5">
            {/* P&L Statement */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><DollarSign size={18} className="text-green-400" /> Profit & Loss — Bulan Ini vs Bulan Lalu</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><div className="text-gray-500 text-xs mb-1">Revenue</div><div className="text-2xl font-bold text-orange-400">{fc(realFinance.mRev)}</div><div className="text-xs text-gray-600">lalu: {fc(realFinance.lmRev)}</div></div>
                <div><div className="text-gray-500 text-xs mb-1">HPP (Supplier 90%)</div><div className="text-2xl font-bold text-red-400">-{fc(realFinance.mHpp)}</div><div className="text-xs text-gray-600">lalu: -{fc(realFinance.lmRev - realFinance.lmProfit)}</div></div>
                <div><div className="text-gray-500 text-xs mb-1">Gross Profit</div><div className="text-2xl font-bold text-green-400">{fc(realFinance.mProfit)}</div><div className="text-xs text-gray-600">lalu: {fc(realFinance.lmProfit)}</div></div>
              </div>
              {realFinance.mGrowth !== 0 && <div className={`text-center mt-3 text-sm font-medium ${realFinance.mGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>{realFinance.mGrowth > 0 ? '📈' : '📉'} {realFinance.mGrowth > 0 ? '+' : ''}{realFinance.mGrowth.toFixed(1)}% vs bulan lalu</div>}
            </div>

            {/* Revenue + Profit trend — REAL */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Activity size={16} className="text-orange-400" /> Revenue & Profit Harian (Real)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={mergedChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: '#6b7280' }} />
                  <YAxis tickFormatter={v => `${(v / 1000)}K`} tick={{ fontSize: 9, fill: '#6b7280' }} />
                  <Tooltip contentStyle={ttStyle} formatter={(v: unknown, n: unknown) => [fc(Number(v)), String(n)]} />
                  <Area dataKey="rev" name="Revenue" fill="#f9731620" stroke="#f97316" strokeWidth={2} />
                  <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={8} />
                  <Line dataKey="cumProfit" name="Kumulatif Profit" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="5 3" yAxisId={0} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by branch + Payment method */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h3 className="font-semibold mb-3">🏪 Revenue per Cabang (Bulan Ini)</h3>
                {realFinance.branchRev.length === 0 ? <p className="text-gray-600 text-sm py-4 text-center">Belum ada data</p> : (
                  <ResponsiveContainer width="100%" height={realFinance.branchRev.length * 36 + 20}>
                    <BarChart layout="vertical" data={realFinance.branchRev.slice(0, 8)}>
                      <XAxis type="number" tickFormatter={v => `${(v / 1000)}K`} tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#d1d5db' }} width={100} />
                      <Tooltip contentStyle={ttStyle} formatter={(v: unknown) => fc(Number(v))} />
                      <Bar dataKey="rev" fill="#f97316" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h3 className="font-semibold mb-3">💳 Metode Pembayaran</h3>
                {realFinance.payMethod.length === 0 ? <p className="text-gray-600 text-sm py-4 text-center">Belum ada data</p> : (
                  <div className="flex items-center gap-4">
                    <div className="w-36 h-36"><ResponsiveContainer><PieChart><Pie data={realFinance.payMethod} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={3}>
                      {realFinance.payMethod.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie><Tooltip contentStyle={ttStyle} formatter={(v: unknown) => fc(Number(v))} /></PieChart></ResponsiveContainer></div>
                    <div className="flex-1 space-y-2">
                      {realFinance.payMethod.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /><span className="text-gray-400">{p.name}</span></div>
                          <span className="font-medium">{fc(p.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Supplier settlement */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h3 className="font-semibold mb-3">👥 Settlement Supplier (Bulan Ini)</h3>
              {realFinance.supSettle.length === 0 ? <p className="text-gray-600 text-sm py-4 text-center">Belum ada</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-gray-500 border-b border-gray-800"><th className="pb-2 text-left">Supplier</th><th className="pb-2 text-right">Revenue</th><th className="pb-2 text-right">Bayar (90%)</th><th className="pb-2 text-right">SMP (10%)</th><th className="pb-2 text-right">Porsi</th></tr></thead>
                    <tbody>
                      {realFinance.supSettle.slice(0, 10).map((s, i) => (
                        <tr key={i} className="border-b border-gray-800/50"><td className="py-2">{s.name}</td><td className="py-2 text-right">{fc(s.rev)}</td><td className="py-2 text-right text-blue-400 font-medium">{fc(s.pay)}</td><td className="py-2 text-right text-green-400">{fc(s.rev * 0.1)}</td><td className="py-2 text-right text-gray-400">{s.items}</td></tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="font-bold"><td className="pt-2">Total</td><td className="pt-2 text-right">{fc(realFinance.supSettle.reduce((s, x) => s + x.rev, 0))}</td><td className="pt-2 text-right text-blue-400">{fc(realFinance.supSettle.reduce((s, x) => s + x.pay, 0))}</td><td className="pt-2 text-right text-green-400">{fc(realFinance.supSettle.reduce((s, x) => s + x.rev * 0.1, 0))}</td><td className="pt-2 text-right">{realFinance.supSettle.reduce((s, x) => s + x.items, 0)}</td></tr></tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Macro overlay on revenue */}
            {finance.length > 0 && (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2"><Globe size={16} className="text-indigo-400" /> Revenue vs Makro Ekonomi</h3>
                  <button onClick={() => setShowFinForm(true)} className="text-xs bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-700 flex items-center gap-1"><Plus size={12} /> Update Makro</button>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={mergedChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: '#6b7280' }} />
                    <YAxis yAxisId="rev" tickFormatter={v => `${(v / 1000)}K`} tick={{ fontSize: 9, fill: '#6b7280' }} />
                    <YAxis yAxisId="usd" orientation="right" tickFormatter={v => `${(v / 1000).toFixed(1)}K`} tick={{ fontSize: 9, fill: '#6b7280' }} />
                    <Tooltip contentStyle={ttStyle} />
                    <Bar yAxisId="rev" dataKey="rev" name="Revenue" fill="#f97316" radius={[3, 3, 0, 0]} barSize={6} opacity={0.6} />
                    <Line yAxisId="usd" dataKey="usd" name="USD/IDR" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
                    <Line yAxisId="usd" dataKey="gold" name="Emas/g" stroke="#eab308" strokeWidth={2} dot={false} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2 text-[10px] text-gray-500 justify-center">
                  <span className="flex items-center gap-1"><span className="w-3 h-1 bg-orange-500 rounded inline-block" /> Revenue</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 rounded inline-block" /> USD/IDR</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-500 rounded inline-block" /> Emas</span>
                </div>
              </div>
            )}

            {/* Demand-Supply + Risk */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Layers size={16} className="text-purple-400" /> Demand & Supply</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-800 rounded-xl p-3 text-center"><div className="text-lg font-bold text-green-400">{fc(realFinance.mRev)}</div><div className="text-[10px] text-gray-500">Demand</div></div>
                  <div className="bg-gray-800 rounded-xl p-3 text-center"><div className="text-lg font-bold text-blue-400">{suppliers.filter(s => s.status === 'active').length}</div><div className="text-[10px] text-gray-500">Supplier</div></div>
                  <div className="bg-gray-800 rounded-xl p-3 text-center"><div className="text-lg font-bold text-purple-400">{demandTests.filter(d => d.status === 'graduated').length}/{demandTests.length}</div><div className="text-[10px] text-gray-500">Konsisten</div></div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-400" /> Risk</h3>
                <div className="space-y-2">
                  <RR l="Inflasi > 5%" lv={latestFin && latestFin.inflationRate > 5 ? 'high' : latestFin && latestFin.inflationRate > 3.5 ? 'med' : 'low'} />
                  <RR l="Rupiah > 16.500" lv={latestFin && latestFin.usdToIdr > 16500 ? 'high' : latestFin && latestFin.usdToIdr > 16000 ? 'med' : 'low'} />
                  <RR l="Revenue Turun" lv={realFinance.mGrowth < -20 ? 'high' : realFinance.mGrowth < -5 ? 'med' : 'low'} />
                  <RR l="Cabang Inkonsisten" lv={demandTests.filter(d => d.status === 'inconsistent').length > 2 ? 'high' : demandTests.filter(d => d.status === 'inconsistent').length > 0 ? 'med' : 'low'} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showBizForm && (
        <Mdl title={editBiz ? 'Edit Bisnis' : 'Tambah Bisnis'} onClose={resetBiz}>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3"><div className="col-span-2"><label className="text-xs text-gray-400">Nama</label><input value={fN} onChange={e => setFN(e.target.value)} className="w-full mt-1 p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white" /></div><div><label className="text-xs text-gray-400">Kode</label><input value={fC} onChange={e => setFC(e.target.value)} className="w-full mt-1 p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white" /></div></div>
            <div className="grid grid-cols-3 gap-3"><div><label className="text-xs text-gray-400">Icon</label><input value={fI} onChange={e => setFI(e.target.value)} className="w-full mt-1 p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-2xl text-center" /></div><div><label className="text-xs text-gray-400">Warna</label><input type="color" value={fCol} onChange={e => setFCol(e.target.value)} className="w-full mt-1 h-10 rounded-xl cursor-pointer bg-gray-800 border border-gray-700" /></div><div><label className="text-xs text-gray-400">Status</label><select value={fS} onChange={e => setFS(e.target.value as typeof fS)} className="w-full mt-1 p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white"><option value="active">Aktif</option><option value="planning">Planning</option><option value="paused">Pause</option></select></div></div>
            <div><label className="text-xs text-gray-400">Deskripsi</label><input value={fD} onChange={e => setFD(e.target.value)} className="w-full mt-1 p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white" /></div>
            <div><label className="text-xs text-gray-400">Target Revenue/bulan</label><input type="number" value={fT || ''} onChange={e => setFT(+e.target.value || 0)} className="w-full mt-1 p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white" /></div>
            <div><label className="text-xs text-gray-400">Catatan</label><textarea value={fNo} onChange={e => setFNo(e.target.value)} className="w-full mt-1 p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white" rows={2} /></div>
            <button onClick={saveBizItem} className="w-full py-2.5 bg-indigo-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1"><Check size={14} /> Simpan</button>
          </div>
        </Mdl>
      )}
      {showFinForm && (
        <Mdl title="Update Data Makro Ekonomi" onClose={() => setShowFinForm(false)}>
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Input data terbaru dari berita/market. Revenue & Profit otomatis dari data transaksi.</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400">USD/IDR</label><input type="number" value={ffU} onChange={e => setFfU(+e.target.value || 0)} className="w-full mt-1 p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white" /></div>
              <div><label className="text-xs text-gray-400">Emas/g (Rp)</label><input type="number" value={ffG} onChange={e => setFfG(+e.target.value || 0)} className="w-full mt-1 p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white" /></div>
              <div><label className="text-xs text-gray-400">Inflasi (%)</label><input type="number" step="0.1" value={ffInf} onChange={e => setFfInf(+e.target.value || 0)} className="w-full mt-1 p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white" /></div>
              <div><label className="text-xs text-gray-400">BI Rate (%)</label><input type="number" step="0.25" value={ffBi} onChange={e => setFfBi(+e.target.value || 0)} className="w-full mt-1 p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white" /></div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-400">
              <p>Revenue & Profit otomatis dari transaksi SMP:</p>
              <p className="text-white font-medium mt-1">Revenue: {fc(realFinance.mRev)} | Profit: {fc(realFinance.mProfit)}</p>
            </div>
            <button onClick={addFin} className="w-full py-2.5 bg-indigo-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1"><Check size={14} /> Simpan</button>
          </div>
        </Mdl>
      )}
    </div>
  );
}

// Sub-components
function Mdl({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-800"><h2 className="font-bold text-white">{title}</h2><button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button></div>
      <div className="p-4">{children}</div>
    </div>
  </div>);
}

function KCard({ label, value, change, sub }: { label: string; value: string; change?: number; sub?: string }) {
  return (<div className="bg-gray-900 rounded-xl p-3.5 border border-gray-800">
    <div className="text-gray-500 text-[10px] mb-1">{label}</div>
    <div className="text-xl font-bold">{value}</div>
    <div className="flex items-center gap-2 mt-0.5">
      {change !== undefined && change !== 0 && <span className={`text-[10px] flex items-center gap-0.5 font-medium ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>{change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>}
      {sub && <span className="text-[10px] text-gray-600">{sub}</span>}
    </div>
  </div>);
}

function RR({ l, lv }: { l: string; lv: 'high' | 'med' | 'low' }) {
  const c = { high: 'bg-red-500/20 text-red-400', med: 'bg-yellow-500/20 text-yellow-400', low: 'bg-green-500/20 text-green-400' };
  const t = { high: 'Tinggi', med: 'Sedang', low: 'Rendah' };
  return (<div className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0"><span className="text-sm text-gray-300">{l}</span><span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${c[lv]}`}>{t[lv]}</span></div>);
}
