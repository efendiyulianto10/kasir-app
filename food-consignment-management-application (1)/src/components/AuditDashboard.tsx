import { useState, useMemo } from 'react';
import { 
  Shield, AlertTriangle, Store, ChevronDown, ChevronUp, CheckCircle, 
  XCircle, Plus, X, Check, ClipboardList, Eye
} from 'lucide-react';
import { Branch, Region, DemandTest } from '../types';
import { generateId } from '../store';

interface Props {
  branches: Branch[];
  regions: Region[];
  demandTests: DemandTest[];
}

// SOP Checklist — fokus lapangan
const SOP_ITEMS = [
  // Kebersihan
  { id: 'lapak_bersih', label: 'Lapak bersih & tidak kotor', cat: '🧹 Kebersihan' },
  { id: 'meja_rapi', label: 'Meja display makanan bersih & rapi', cat: '🧹 Kebersihan' },
  { id: 'area_sekitar', label: 'Area sekitar lapak tidak jorok', cat: '🧹 Kebersihan' },
  { id: 'tempat_sampah', label: 'Ada tempat sampah & tidak penuh', cat: '🧹 Kebersihan' },
  // Operasional
  { id: 'buka_tepat', label: 'Buka sebelum jam 6 pagi', cat: '⏰ Operasional' },
  { id: 'kasir_hadir', label: 'Kasir/PIC hadir dan standby', cat: '⏰ Operasional' },
  { id: 'banner_terlihat', label: 'Banner/spanduk SMP terlihat jelas', cat: '⏰ Operasional' },
  { id: 'harga_tertulis', label: 'Harga Rp 10.000 tertulis jelas', cat: '⏰ Operasional' },
  // Produk & Kualitas
  { id: 'makanan_segar', label: 'Makanan terlihat segar & layak', cat: '🍱 Produk' },
  { id: 'variasi_menu', label: 'Tersedia minimal 5 jenis menu', cat: '🍱 Produk' },
  { id: 'porsi_standar', label: 'Porsi sesuai standar SMP', cat: '🍱 Produk' },
  { id: 'kemasan_layak', label: 'Kemasan/wadah bersih & layak', cat: '🍱 Produk' },
  { id: 'minuman_ready', label: 'Minuman tersedia & dingin/panas', cat: '🍱 Produk' },
  // Pelayanan
  { id: 'kasir_ramah', label: 'Kasir ramah saat melayani', cat: '🤝 Pelayanan' },
  { id: 'antrian_tertib', label: 'Antrian tertib / tidak kacau', cat: '🤝 Pelayanan' },
  { id: 'proses_cepat', label: 'Proses transaksi cepat (<2 menit)', cat: '🤝 Pelayanan' },
  { id: 'qris_tersedia', label: 'QRIS / pembayaran non-tunai tersedia', cat: '🤝 Pelayanan' },
  // Stok & Supplier
  { id: 'stok_cukup', label: 'Stok tidak habis sebelum jam 9', cat: '📦 Stok' },
  { id: 'supplier_tepat', label: 'Supplier antar tepat waktu', cat: '📦 Stok' },
  { id: 'retur_rapi', label: 'Proses retur rapi & tercatat', cat: '📦 Stok' },
];

const CATEGORIES = ['🧹 Kebersihan', '⏰ Operasional', '🍱 Produk', '🤝 Pelayanan', '📦 Stok'];

interface AuditVisit {
  id: string;
  branchId: string;
  branchName: string;
  date: string;
  time: string;
  type: 'mystery' | 'sidak';
  checklist: Record<string, boolean | null>;
  score: number;
  catScores: Record<string, number>;
  findings: string;
  kondisiLapak: string;
  perilakuKasir: string;
  fotoDesc: string;
  recommendation: string;
  status: 'draft' | 'submitted';
}

function loadVisits(): AuditVisit[] {
  try { return JSON.parse(localStorage.getItem('smp_audit') || '[]'); } catch { return []; }
}
function saveVisitsData(v: AuditVisit[]) { localStorage.setItem('smp_audit', JSON.stringify(v)); }

function calcScore(checklist: Record<string, boolean | null>) {
  const answered = Object.values(checklist).filter(v => v !== null);
  const passed = answered.filter(v => v === true).length;
  const score = answered.length > 0 ? Math.round(passed / answered.length * 100) : 0;

  // Per category
  const catScores: Record<string, number> = {};
  CATEGORIES.forEach(cat => {
    const items = SOP_ITEMS.filter(s => s.cat === cat);
    const catAnswered = items.filter(i => checklist[i.id] !== null);
    const catPassed = items.filter(i => checklist[i.id] === true);
    catScores[cat] = catAnswered.length > 0 ? Math.round(catPassed.length / catAnswered.length * 100) : -1;
  });

  return { score, catScores };
}

export default function AuditDashboard({ branches, regions }: Props) {
  const [visits, setVisits] = useState<AuditVisit[]>(loadVisits);
  const [tab, setTab] = useState<'ringkasan' | 'kunjungan' | 'skor'>('ringkasan');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AuditVisit | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [filterBranch, setFilterBranch] = useState('');

  // Form
  const [fBranch, setFBranch] = useState('');
  const [fType, setFType] = useState<'mystery' | 'sidak'>('mystery');
  const [fChecklist, setFChecklist] = useState<Record<string, boolean | null>>(() => {
    const o: Record<string, boolean | null> = {};
    SOP_ITEMS.forEach(s => o[s.id] = null);
    return o;
  });
  const [fFindings, setFFindings] = useState('');
  const [fKondisi, setFKondisi] = useState('');
  const [fKasir, setFKasir] = useState('');
  const [fFoto, setFFoto] = useState('');
  const [fRec, setFRec] = useState('');

  const submitted = visits.filter(v => v.status === 'submitted');

  // Branch scores
  const branchData = useMemo(() => {
    return branches.filter(b => b.status !== 'closed').map(b => {
      const bVisits = submitted.filter(v => v.branchId === b.id);
      const avgScore = bVisits.length > 0 ? Math.round(bVisits.reduce((s, v) => s + v.score, 0) / bVisits.length) : -1;
      const reg = regions.find(r => r.id === b.regionId);
      const lastVisit = bVisits.length > 0 ? bVisits.sort((a, b) => b.date.localeCompare(a.date))[0].date : null;
      
      // aggregate per-category
      const catAgg: Record<string, number[]> = {};
      CATEGORIES.forEach(c => catAgg[c] = []);
      bVisits.forEach(v => {
        CATEGORIES.forEach(c => { if (v.catScores[c] >= 0) catAgg[c].push(v.catScores[c]); });
      });
      const catAvg: Record<string, number> = {};
      CATEGORIES.forEach(c => {
        catAvg[c] = catAgg[c].length > 0 ? Math.round(catAgg[c].reduce((s,v)=>s+v,0)/catAgg[c].length) : -1;
      });

      return { ...b, regionName: reg?.name || '', avgScore, visitCount: bVisits.length, lastVisit, catAvg, bVisits };
    }).sort((a, b) => {
      if (a.avgScore === -1 && b.avgScore === -1) return 0;
      if (a.avgScore === -1) return 1;
      if (b.avgScore === -1) return -1;
      return b.avgScore - a.avgScore;
    });
  }, [branches, regions, submitted]);

  // Problems summary
  const problems = useMemo(() => {
    const list: { branch: string; item: string; count: number }[] = [];
    const map = new Map<string, Map<string, number>>();
    submitted.forEach(v => {
      SOP_ITEMS.forEach(sop => {
        if (v.checklist[sop.id] === false) {
          const key = v.branchName;
          if (!map.has(key)) map.set(key, new Map());
          const m = map.get(key)!;
          m.set(sop.label, (m.get(sop.label) || 0) + 1);
        }
      });
    });
    map.forEach((items, branch) => {
      items.forEach((count, item) => list.push({ branch, item, count }));
    });
    return list.sort((a, b) => b.count - a.count);
  }, [submitted]);

  // Handlers
  const save = (status: 'draft' | 'submitted') => {
    if (!fBranch) return;
    const branch = branches.find(b => b.id === fBranch);
    const { score, catScores } = calcScore(fChecklist);
    const visit: AuditVisit = {
      id: editing?.id || generateId(),
      branchId: fBranch, branchName: branch?.name || '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      type: fType, checklist: { ...fChecklist }, score, catScores,
      findings: fFindings, kondisiLapak: fKondisi, perilakuKasir: fKasir,
      fotoDesc: fFoto, recommendation: fRec, status,
    };
    const updated = editing ? visits.map(v => v.id === editing.id ? visit : v) : [visit, ...visits];
    setVisits(updated); saveVisitsData(updated); reset();
  };

  const del = (id: string) => {
    if (!confirm('Hapus?')) return;
    const u = visits.filter(v => v.id !== id);
    setVisits(u); saveVisitsData(u);
  };

  const startEdit = (v: AuditVisit) => {
    setEditing(v); setFBranch(v.branchId); setFType(v.type);
    setFChecklist({ ...v.checklist }); setFFindings(v.findings);
    setFKondisi(v.kondisiLapak); setFKasir(v.perilakuKasir);
    setFFoto(v.fotoDesc); setFRec(v.recommendation); setShowForm(true);
  };

  const reset = () => {
    setShowForm(false); setEditing(null); setFBranch(''); setFType('mystery');
    const o: Record<string, boolean | null> = {};
    SOP_ITEMS.forEach(s => o[s.id] = null);
    setFChecklist(o); setFFindings(''); setFKondisi(''); setFKasir(''); setFFoto(''); setFRec('');
  };

  const setAll = (val: boolean) => {
    const o: Record<string, boolean | null> = {};
    SOP_ITEMS.forEach(s => o[s.id] = val);
    setFChecklist(o);
  };

  const scoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg = (s: number) => s >= 80 ? 'bg-green-100 text-green-700' : s >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  const scoreBar = (s: number) => s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  const preview = calcScore(fChecklist);
  const filteredVisits = filterBranch ? visits.filter(v => v.branchId === filterBranch) : visits;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-600/30 rounded-xl flex items-center justify-center"><Shield size={24} className="text-rose-400" /></div>
          <div>
            <h1 className="text-xl font-bold">Audit Lapangan</h1>
            <p className="text-gray-400 text-xs">Evaluasi kondisi cabang — mystery visit & sidak</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'ringkasan', label: '📊 Ringkasan' },
          { id: 'kunjungan', label: '🕵️ Kunjungan', badge: visits.length },
          { id: 'skor', label: '📋 Skor Cabang' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${tab === t.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border'}`}>
            {t.label}
            {t.badge ? <span className="bg-rose-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ═══ RINGKASAN ═══ */}
      {tab === 'ringkasan' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MC label="Kunjungan" value={String(submitted.length)} icon={Eye} color="purple" />
            <MC label="Avg Score" value={submitted.length > 0 ? `${Math.round(submitted.reduce((s,v)=>s+v.score,0)/submitted.length)}%` : '-'} icon={ClipboardList} color="blue" />
            <MC label="Cabang Diaudit" value={`${new Set(submitted.map(v=>v.branchId)).size}/${branches.filter(b=>b.status!=='closed').length}`} icon={Store} color="green" />
            <MC label="Masalah" value={String(problems.length)} icon={AlertTriangle} color="red" />
          </div>

          {/* Cabang belum diaudit */}
          {(() => {
            const auditedIds = new Set(submitted.map(v => v.branchId));
            const notAudited = branches.filter(b => b.status !== 'closed' && !auditedIds.has(b.id));
            if (notAudited.length === 0) return null;
            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <h3 className="font-bold text-yellow-800 text-sm mb-2">⚠️ Cabang Belum Pernah Diaudit:</h3>
                <div className="flex flex-wrap gap-2">
                  {notAudited.map(b => (
                    <span key={b.id} className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-lg">{b.name}</span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Top Problems */}
          {problems.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">🔴 Masalah yang Sering Ditemukan</h3>
              <div className="space-y-2">
                {problems.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-red-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium text-gray-900">{p.item}</span>
                      <span className="text-gray-500 text-xs ml-2">— {p.branch}</span>
                    </div>
                    <span className="text-red-600 font-bold text-xs">{p.count}x gagal</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score per category */}
          {submitted.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">📊 Rata-rata Kepatuhan per Kategori</h3>
              <div className="space-y-3">
                {CATEGORIES.map(cat => {
                  const scores = submitted.map(v => v.catScores[cat]).filter(s => s >= 0);
                  const avg = scores.length > 0 ? Math.round(scores.reduce((s,v)=>s+v,0)/scores.length) : -1;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-sm w-32">{cat}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
                        {avg >= 0 && <div className={`h-4 rounded-full ${scoreBar(avg)}`} style={{ width: `${avg}%` }} />}
                      </div>
                      <span className={`text-sm font-bold w-10 text-right ${avg >= 0 ? scoreColor(avg) : 'text-gray-400'}`}>{avg >= 0 ? `${avg}%` : '-'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ KUNJUNGAN ═══ */}
      {tab === 'kunjungan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
              className="px-3 py-2 border rounded-xl text-sm bg-white">
              <option value="">Semua cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button onClick={() => { reset(); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800">
              <Plus size={16} /> Kunjungan Baru
            </button>
          </div>

          {filteredVisits.length === 0 && (
            <div className="bg-gray-50 rounded-2xl p-10 text-center text-gray-400 border-2 border-dashed">
              <Eye size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada kunjungan</p>
            </div>
          )}

          {filteredVisits.map(v => (
            <div key={v.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${v.type === 'mystery' ? 'bg-gray-800 text-white' : 'bg-red-600 text-white'}`}>
                    {v.type === 'mystery' ? '🕵️ Mystery' : '⚡ Sidak'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{v.branchName}</p>
                    <p className="text-xs text-gray-500">{v.date} {v.time} • {v.status === 'draft' ? '📝 Draft' : '✅ Final'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className={`text-xl font-bold ${scoreColor(v.score)}`}>{v.score}%</div>
                  {expanded === v.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>
              {expanded === v.id && (
                <div className="border-t p-4 bg-gray-50 space-y-3">
                  {/* Category scores */}
                  <div className="grid grid-cols-5 gap-2">
                    {CATEGORIES.map(c => (
                      <div key={c} className={`text-center rounded-lg p-2 text-xs ${v.catScores[c] >= 0 ? scoreBg(v.catScores[c]) : 'bg-gray-100 text-gray-400'}`}>
                        <div className="font-bold text-lg">{v.catScores[c] >= 0 ? `${v.catScores[c]}%` : '-'}</div>
                        <div className="truncate">{c.split(' ')[1]}</div>
                      </div>
                    ))}
                  </div>
                  {/* Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {SOP_ITEMS.map(sop => {
                      const val = v.checklist[sop.id];
                      return (
                        <div key={sop.id} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${val === true ? 'bg-green-50 text-green-700' : val === false ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                          {val === true ? <CheckCircle size={12} /> : val === false ? <XCircle size={12} /> : <span className="w-3 h-3 rounded-full border border-gray-300 inline-block flex-shrink-0" />}
                          <span className="truncate">{sop.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Notes */}
                  {v.kondisiLapak && <NoteBox icon="🏪" title="Kondisi Lapak" text={v.kondisiLapak} />}
                  {v.perilakuKasir && <NoteBox icon="🧑" title="Perilaku Kasir" text={v.perilakuKasir} />}
                  {v.findings && <NoteBox icon="⚠️" title="Temuan" text={v.findings} />}
                  {v.fotoDesc && <NoteBox icon="📸" title="Observasi Visual" text={v.fotoDesc} />}
                  {v.recommendation && <NoteBox icon="💡" title="Rekomendasi" text={v.recommendation} />}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => startEdit(v)} className="px-3 py-1.5 text-xs bg-gray-200 rounded-lg hover:bg-gray-300 font-medium">✏️ Edit</button>
                    <button onClick={() => del(v.id)} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">🗑 Hapus</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ SKOR CABANG ═══ */}
      {tab === 'skor' && (
        <div className="space-y-3">
          {branchData.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <button onClick={() => setExpandedBranch(expandedBranch === b.id ? null : b.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${b.avgScore < 0 ? 'bg-gray-100 text-gray-400' : scoreBg(b.avgScore)}`}>
                    {b.avgScore >= 0 ? `${b.avgScore}%` : '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-500">{b.regionName} • {b.visitCount} audit{b.lastVisit ? ` • terakhir ${b.lastVisit}` : ''}</p>
                  </div>
                </div>
                {expandedBranch === b.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {expandedBranch === b.id && (
                <div className="border-t p-4 bg-gray-50 space-y-3">
                  {b.visitCount === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-4">Belum pernah diaudit</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-5 gap-2">
                        {CATEGORIES.map(c => (
                          <div key={c} className={`text-center rounded-lg p-2 text-xs ${b.catAvg[c] >= 0 ? scoreBg(b.catAvg[c]) : 'bg-gray-100 text-gray-400'}`}>
                            <div className="font-bold text-lg">{b.catAvg[c] >= 0 ? `${b.catAvg[c]}%` : '-'}</div>
                            <div className="truncate">{c.split(' ')[1]}</div>
                          </div>
                        ))}
                      </div>
                      {/* SOP item compliance */}
                      <div className="space-y-1">
                        {SOP_ITEMS.map(sop => {
                          const pass = b.bVisits.filter(v => v.checklist[sop.id] === true).length;
                          const fail = b.bVisits.filter(v => v.checklist[sop.id] === false).length;
                          const total = pass + fail;
                          const rate = total > 0 ? Math.round(pass / total * 100) : -1;
                          return (
                            <div key={sop.id} className="flex items-center gap-2 text-xs">
                              <span className="flex-1 text-gray-700 truncate">{sop.label}</span>
                              {rate >= 0 ? (
                                <>
                                  <div className="w-20 bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${scoreBar(rate)}`} style={{ width: `${rate}%` }} /></div>
                                  <span className={`w-8 text-right font-bold ${scoreColor(rate)}`}>{rate}%</span>
                                </>
                              ) : <span className="text-gray-300 w-8 text-right">—</span>}
                            </div>
                          );
                        })}
                      </div>
                      {/* History */}
                      <h4 className="text-xs font-medium text-gray-500 pt-1">Riwayat:</h4>
                      {b.bVisits.map(v => (
                        <div key={v.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2">
                          <span>{v.date} • {v.type === 'mystery' ? '🕵️' : '⚡'} {v.type}</span>
                          <span className={`font-bold ${scoreColor(v.score)}`}>{v.score}%</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ FORM ═══ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-6 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) reset(); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl mb-8">
            <div className="flex items-center justify-between p-5 border-b bg-gray-900 text-white rounded-t-2xl">
              <h2 className="font-bold flex items-center gap-2"><Eye size={18} /> {editing ? 'Edit' : 'Kunjungan Baru'}</h2>
              <button onClick={reset} className="p-1.5 hover:bg-gray-700 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Cabang</label>
                  <select value={fBranch} onChange={e => setFBranch(e.target.value)} className="w-full mt-1 p-2.5 border rounded-xl text-sm">
                    <option value="">Pilih cabang</option>
                    {branches.filter(b => b.status !== 'closed').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Jenis</label>
                  <select value={fType} onChange={e => setFType(e.target.value as 'mystery'|'sidak')} className="w-full mt-1 p-2.5 border rounded-xl text-sm">
                    <option value="mystery">🕵️ Mystery Visit</option>
                    <option value="sidak">⚡ Sidak Mendadak</option>
                  </select>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600">Checklist SOP ({Object.values(fChecklist).filter(v=>v!==null).length}/{SOP_ITEMS.length} dijawab)</label>
                  <div className="flex gap-1">
                    <button onClick={() => setAll(true)} className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">Semua ✓</button>
                    <button onClick={() => setAll(false)} className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200">Semua ✗</button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 space-y-0.5">
                  {CATEGORIES.map(cat => (
                    <div key={cat}>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-2 first:mt-0 mb-1">{cat}</p>
                      {SOP_ITEMS.filter(s => s.cat === cat).map(sop => (
                        <div key={sop.id} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                          <span className="text-xs text-gray-700 flex-1 pr-2">{sop.label}</span>
                          <div className="flex gap-0.5 flex-shrink-0">
                            <button onClick={() => setFChecklist({ ...fChecklist, [sop.id]: true })}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${fChecklist[sop.id] === true ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500 hover:bg-green-100'}`}>✓</button>
                            <button onClick={() => setFChecklist({ ...fChecklist, [sop.id]: false })}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${fChecklist[sop.id] === false ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500 hover:bg-red-100'}`}>✗</button>
                            <button onClick={() => setFChecklist({ ...fChecklist, [sop.id]: null })}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${fChecklist[sop.id] === null ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-400'}`}>—</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {/* Live score preview */}
                <div className={`mt-2 text-center py-2 rounded-xl text-sm font-bold ${preview.score > 0 ? scoreBg(preview.score) : 'bg-gray-100 text-gray-400'}`}>
                  Skor: {preview.score}%
                </div>
              </div>

              {/* Observasi */}
              <Textarea label="🏪 Kondisi Lapak" value={fKondisi} onChange={setFKondisi} placeholder="Bersih/kotor, rapi/berantakan, banner terlihat..." />
              <Textarea label="🧑 Perilaku Kasir" value={fKasir} onChange={setFKasir} placeholder="Ramah/jutek, cepat/lambat, sopan/tidak..." />
              <Textarea label="⚠️ Temuan Masalah" value={fFindings} onChange={setFFindings} placeholder="Apa yang tidak sesuai SOP..." />
              <Textarea label="📸 Observasi Visual" value={fFoto} onChange={setFFoto} placeholder="Deskripsi foto/kondisi yang dilihat..." />
              <Textarea label="💡 Rekomendasi" value={fRec} onChange={setFRec} placeholder="Saran perbaikan untuk cabang ini..." />

              <div className="flex gap-2 pt-2">
                <button onClick={() => save('draft')} className="flex-1 py-2.5 text-sm bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300">📝 Draft</button>
                <button onClick={() => save('submitted')} disabled={!fBranch}
                  className="flex-1 py-2.5 text-sm bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-1">
                  <Check size={14} /> Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NoteBox({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="bg-white rounded-lg p-3 text-sm">
      <span className="font-medium text-gray-700">{icon} {title}:</span>
      <p className="text-gray-600 mt-0.5">{text}</p>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} className="w-full mt-1 p-2.5 border rounded-xl text-sm" rows={2} placeholder={placeholder} />
    </div>
  );
}

function MC({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  const colors: Record<string, string> = { purple: 'bg-purple-50 text-purple-600', blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600', green: 'bg-green-50 text-green-600' };
  return (
    <div className="bg-white rounded-xl p-4 border shadow-sm">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}><Icon size={16} /></div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}
