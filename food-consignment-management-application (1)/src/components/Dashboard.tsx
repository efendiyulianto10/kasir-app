import { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  Store, Users, ArrowUpRight, Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Branch, DailyTransaction, Supplier, DemandTest } from '../types';
import { formatCurrency } from '../store';

interface Props {
  branches: Branch[];
  transactions: DailyTransaction[];
  suppliers: Supplier[];
  demandTests: DemandTest[];
}

export default function Dashboard({ branches, transactions, suppliers, demandTests }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const todayTx = transactions.filter(t => t.date === today);
    const rev = todayTx.reduce((s, t) => s + t.totalAmount, 0);
    const profit = todayTx.reduce((s, t) => s + t.totalProfit, 0);
    const items = todayTx.reduce((s, t) => s + t.items.reduce((ss, i) => ss + i.qty, 0), 0);

    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yRev = transactions.filter(t => t.date === yesterday.toISOString().split('T')[0]).reduce((s, t) => s + t.totalAmount, 0);
    const growth = yRev > 0 ? ((rev - yRev) / yRev * 100) : 0;

    const mTx = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear(); });
    const mRev = mTx.reduce((s, t) => s + t.totalAmount, 0);
    const mProfit = mTx.reduce((s, t) => s + t.totalProfit, 0);

    return { rev, profit, items, txCount: todayTx.length, growth, mRev, mProfit,
      active: branches.filter(b => b.status === 'active').length,
      testing: branches.filter(b => b.status === 'testing').length,
      sups: suppliers.filter(s => s.status === 'active').length,
      graduated: demandTests.filter(d => d.status === 'graduated').length,
    };
  }, [branches, transactions, suppliers, demandTests, today]);

  // 7 day chart
  const weekData = useMemo(() => {
    const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      const tx = transactions.filter(t => t.date === ds);
      return { date: days[d.getDay()], revenue: tx.reduce((s,t) => s+t.totalAmount, 0), profit: tx.reduce((s,t) => s+t.totalProfit, 0) };
    });
  }, [transactions]);

  // Payment pie
  const payData = useMemo(() => {
    const m: Record<string,number> = {};
    transactions.filter(t => t.date === today).forEach(t => { m[t.paymentMethod] = (m[t.paymentMethod]||0) + t.totalAmount; });
    const labels: Record<string,string> = { cash:'Tunai', qris:'QRIS', shopeefood:'ShopeeFood', gofood:'GoFood' };
    return Object.entries(m).map(([k,v]) => ({ name: labels[k]||k, value: v }));
  }, [transactions, today]);

  // Branch ranking
  const branchRank = useMemo(() => {
    const m = new Map<string, { name: string; rev: number; items: number }>();
    branches.forEach(b => m.set(b.id, { name: b.name, rev: 0, items: 0 }));
    transactions.filter(t => t.date === today).forEach(t => {
      const b = m.get(t.branchId);
      if (b) { b.rev += t.totalAmount; b.items += t.items.reduce((s,i) => s+i.qty, 0); }
    });
    return Array.from(m.values()).filter(b => b.rev > 0).sort((a,b) => b.rev - a.rev);
  }, [branches, transactions, today]);

  // Supplier settlement today
  const supplierSettle = useMemo(() => {
    const m = new Map<string, { name: string; rev: number; pay: number; items: number }>();
    transactions.filter(t => t.date === today).forEach(t => {
      t.items.forEach(item => {
        const s = m.get(item.supplierId) || { name: item.supplierName, rev: 0, pay: 0, items: 0 };
        s.rev += item.subtotal; s.pay += item.subtotal * 0.9; s.items += item.qty;
        m.set(item.supplierId, s);
      });
    });
    return Array.from(m.values()).sort((a,b) => b.rev - a.rev);
  }, [transactions, today]);

  const COLORS = ['#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6'];

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={DollarSign} label="Revenue Hari Ini" value={formatCurrency(stats.rev)} change={stats.growth} color="orange" />
        <KPI icon={TrendingUp} label="Profit (10%)" value={formatCurrency(stats.profit)} sub={`${stats.items} porsi`} color="green" />
        <KPI icon={DollarSign} label="Revenue Bulan" value={formatCurrency(stats.mRev)} sub={`Profit: ${formatCurrency(stats.mProfit)}`} color="blue" />
        <KPI icon={ShoppingBag} label="Transaksi" value={String(stats.txCount)} sub={`${stats.active} cabang aktif`} color="purple" />
      </div>

      {/* Health strip */}
      <div className="grid grid-cols-4 gap-3">
        <Stat icon={Store} label="Cabang" value={`${stats.active}`} sub={`${stats.testing} testing`} />
        <Stat icon={Users} label="Supplier" value={`${stats.sups}`} sub="aktif" />
        <Stat icon={Zap} label="Demand" value={`${stats.graduated}`} sub="lulus" />
        <Stat icon={DollarSign} label="Avg/Cabang" value={stats.active > 0 ? formatCurrency(stats.profit / stats.active) : '-'} sub="profit/hari" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">📈 Revenue & Profit 7 Hari</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tickFormatter={v => `${(v/1000)}K`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="revenue" name="Revenue" fill="#f97316" radius={[5,5,0,0]} />
              <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Payment */}
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">💳 Pembayaran Hari Ini</h3>
          {payData.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Belum ada transaksi</p> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart><Pie data={payData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                  {payData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie><Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {payData.map((p,i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i%COLORS.length] }} />{p.name}</div>
                    <span className="font-medium">{formatCurrency(p.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* P&L ringkas + Supplier settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* P&L */}
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">📋 P&L Hari Ini</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Revenue (Omzet)</span><span className="font-bold text-gray-900">{formatCurrency(stats.rev)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">HPP (Bayar Supplier 90%)</span><span className="font-medium text-red-600">-{formatCurrency(stats.rev * 0.9)}</span></div>
            <div className="border-t pt-2 flex justify-between"><span className="font-semibold text-gray-900">Gross Profit (10%)</span><span className="font-bold text-green-600">{formatCurrency(stats.profit)}</span></div>
            <div className="border-t pt-2 mt-2">
              <div className="text-xs text-gray-500 mb-1">Bulan ini</div>
              <div className="flex justify-between"><span className="text-gray-600">Revenue</span><span className="font-medium">{formatCurrency(stats.mRev)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Profit</span><span className="font-bold text-green-600">{formatCurrency(stats.mProfit)}</span></div>
            </div>
          </div>
        </div>

        {/* Supplier settlement */}
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">💰 Settlement Supplier Hari Ini</h3>
          {supplierSettle.length === 0 ? <p className="text-center text-gray-400 py-4 text-sm">Belum ada</p> : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {supplierSettle.map((s,i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <div><span className="font-medium text-gray-900">{s.name}</span><span className="text-gray-400 text-xs ml-1">({s.items} pcs)</span></div>
                  <span className="font-bold text-blue-600">{formatCurrency(s.pay)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 border-t">
                <span>Total bayar</span>
                <span className="text-red-600">{formatCurrency(supplierSettle.reduce((s,x) => s+x.pay, 0))}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Branch ranking */}
      <div className="bg-white rounded-2xl p-5 border shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">🏆 Ranking Cabang Hari Ini</h3>
        {branchRank.length === 0 ? <p className="text-center text-gray-400 py-6 text-sm">Belum ada transaksi</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">#</th><th className="pb-2">Cabang</th><th className="pb-2 text-right">Porsi</th><th className="pb-2 text-right">Revenue</th><th className="pb-2 text-right">Profit</th></tr></thead>
              <tbody>
                {branchRank.map((b,i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-orange-50/50">
                    <td className="py-2">{['🥇','🥈','🥉'][i] || <span className="text-gray-400">{i+1}</span>}</td>
                    <td className="py-2 font-medium">{b.name}</td>
                    <td className="py-2 text-right">{b.items}</td>
                    <td className="py-2 text-right text-orange-600 font-medium">{formatCurrency(b.rev)}</td>
                    <td className="py-2 text-right text-green-600 font-medium">{formatCurrency(b.rev * 0.1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Demand test summary */}
      {demandTests.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">🧪 Demand Testing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {demandTests.slice(0,6).map(dt => (
              <div key={dt.id} className={`p-3 rounded-xl border-2 ${dt.status==='graduated'?'border-green-200 bg-green-50':dt.status==='consistent'?'border-blue-200 bg-blue-50':dt.status==='testing'?'border-yellow-200 bg-yellow-50':'border-red-200 bg-red-50'}`}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-sm">{dt.branchName}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${dt.status==='graduated'?'bg-green-200 text-green-800':dt.status==='consistent'?'bg-blue-200 text-blue-800':dt.status==='testing'?'bg-yellow-200 text-yellow-800':'bg-red-200 text-red-800'}`}>
                    {dt.consistency}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${dt.consistency>=80?'bg-green-500':dt.consistency>=60?'bg-yellow-500':'bg-red-500'}`} style={{ width: `${dt.consistency}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, change, sub, color }: { icon: React.ElementType; label: string; value: string; change?: number; sub?: string; color: string }) {
  const cm: Record<string,string> = { orange:'bg-orange-50 text-orange-600', green:'bg-green-50 text-green-600', blue:'bg-blue-50 text-blue-600', purple:'bg-purple-50 text-purple-600' };
  return (
    <div className="bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cm[color]}`}><Icon size={18} /></div>
        {change !== undefined && <span className={`flex items-center gap-0.5 text-xs font-medium ${change>=0?'text-green-600':'text-red-600'}`}>{change>=0?<ArrowUpRight size={12}/>:<TrendingDown size={12}/>}{Math.abs(change).toFixed(1)}%</span>}
      </div>
      <div className="text-lg font-bold text-gray-900 truncate">{value}</div>
      <div className="text-xs text-gray-500">{sub || label}</div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl p-3 border shadow-sm">
      <div className="flex items-center gap-1.5 mb-1"><Icon size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{label}</span></div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-400">{sub}</div>
    </div>
  );
}
