import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const cx = {
  input:  'w-full bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 focus:ring-1 focus:ring-hive-500/30 transition placeholder-dark-600',
  select: 'w-full bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 transition',
  label:  'block text-[10px] font-mono text-dark-400 tracking-widest uppercase mb-1.5',
  th:     'text-left px-4 py-2.5 text-[9px] font-mono text-dark-500 tracking-widest uppercase border-b border-dark-800',
  td:     'px-4 py-3 text-sm text-dark-200 border-b border-dark-800/50',
  btnP:   'inline-flex items-center gap-1.5 px-4 py-2 bg-hive-500 hover:bg-hive-400 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-hive-500/20',
  btnG:   'inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white text-xs font-medium rounded-lg border border-dark-700 transition',
  btnGreen:'inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium rounded-lg border border-green-500/20 transition',
  btnR:   'inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition',
};

const PROCESS_TYPES = ['Extrusion','Injection Moulding','Blow Moulding','Calendering','Other'];
const SHIFTS        = ['Morning','Afternoon','Night'];

const Badge = ({ children, color = 'gray' }) => {
  const c = {
    green:  'bg-green-500/10 text-green-400 border-green-500/20',
    red:    'bg-red-500/10 text-red-400 border-red-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue:   'bg-hive-500/10 text-hive-400 border-hive-500/20',
    gray:   'bg-dark-700/60 text-dark-400 border-dark-600',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }[color];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${c}`}>{children}</span>;
};

const statusColor = (s) => ({ Draft:'blue', 'In Progress':'amber', Completed:'green', Cancelled:'red' }[s] || 'gray');

const Spinner = () => (
  <div className="flex items-center justify-center h-48 gap-3 text-dark-500 text-sm font-mono">
    <div className="w-4 h-4 border-2 border-dark-600 border-t-hive-400 rounded-full animate-spin"/>Loading…
  </div>
);

// ── Wastage Gauge ──────────────────────────────────────────────
const WastageGauge = ({ pct }) => {
  const color = pct <= 5 ? '#22c55e' : pct <= 10 ? '#f59e0b' : '#ef4444';
  const label = pct <= 5 ? 'Excellent' : pct <= 10 ? 'Acceptable' : 'High';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-dark-400">Wastage</span>
        <span style={{ color }}>{pct}% — {label}</span>
      </div>
      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, pct * 5)}%`, backgroundColor: color }}/>
      </div>
    </div>
  );
};

// ── Stats bar ──────────────────────────────────────────────────
const StatsBar = ({ stats }) => {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: 'Total Batches',    value: stats.totalBatches,               color: 'text-white' },
        { label: 'Raw Material Used',value: `${stats.totalRawUsed} MT`,       color: 'text-hive-400' },
        { label: 'Finished Goods',   value: `${stats.totalFinished} MT`,      color: 'text-green-400' },
        { label: 'Avg Yield',        value: `${stats.avgYieldPct}%`,          color: stats.avgYieldPct >= 90 ? 'text-green-400' : 'text-amber-400' },
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-dark-900 border border-dark-800 rounded-xl px-4 py-3">
          <p className="text-[9px] font-mono text-dark-500 uppercase tracking-widest">{label}</p>
          <p className={`text-xl font-extrabold mt-1 ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
const Production = () => {
  const [entries,   setEntries]   = useState([]);
  const [products,  setProducts]  = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [detail,    setDetail]    = useState(null);  // entry detail panel
  const [saving,    setSaving]    = useState(false);

  // Form state
  const blankForm = () => ({
    batchCode:     '',
    productionDate:'',
    shift:         'Morning',
    processType:   'Extrusion',
    machineId:     '',
    operatorName:  '',
    supervisorName:'',
    notes:         '',
    wastageReason: '',
    rawMaterials:  [{ itemId:'', batchNumber:'', quantityUsed:'' }],
    finishedGoods: [{ itemId:'', batchNumber:'', quantityProduced:'' }],
  });
  const [form, setForm] = useState(blankForm());

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [e, p, s] = await Promise.all([
        api.get('/production'),
        api.get('/products'),
        api.get('/production/stats'),
      ]);
      setEntries(e.data);
      setProducts(p.data);
      setStats(s.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // Auto-generate batch code
  const autoBatchCode = () => {
    const d    = new Date();
    const yr   = d.getFullYear();
    const mo   = String(d.getMonth()+1).padStart(2,'0');
    const rnd  = String(Math.floor(Math.random()*900)+100);
    setForm(f => ({ ...f, batchCode: `PROD-${yr}${mo}-${rnd}` }));
  };

  // Raw material lines
  const addRM = () => setForm(f => ({ ...f, rawMaterials: [...f.rawMaterials, { itemId:'', batchNumber:'', quantityUsed:'' }] }));
  const removeRM = (i) => setForm(f => ({ ...f, rawMaterials: f.rawMaterials.filter((_,idx)=>idx!==i) }));
  const updateRM = (i, key, val) => setForm(f => ({
    ...f, rawMaterials: f.rawMaterials.map((r,idx) => idx===i ? { ...r, [key]: val } : r),
  }));

  // Finished goods lines
  const addFG = () => setForm(f => ({ ...f, finishedGoods: [...f.finishedGoods, { itemId:'', batchNumber:'', quantityProduced:'' }] }));
  const removeFG = (i) => setForm(f => ({ ...f, finishedGoods: f.finishedGoods.filter((_,idx)=>idx!==i) }));
  const updateFG = (i, key, val) => setForm(f => ({
    ...f, finishedGoods: f.finishedGoods.map((g,idx) => idx===i ? { ...g, [key]: val } : g),
  }));

  // Live wastage preview
  const totalRaw = form.rawMaterials.reduce((s,r) => s + (parseFloat(r.quantityUsed)||0), 0);
  const totalFG  = form.finishedGoods.reduce((s,g) => s + (parseFloat(g.quantityProduced)||0), 0);
  const wastage  = Math.max(0, totalRaw - totalFG);
  const wastagePct = totalRaw > 0 ? +((wastage/totalRaw)*100).toFixed(1) : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/production', {
        ...form,
        rawMaterials:  form.rawMaterials.map(r  => ({ ...r, quantityUsed:     parseFloat(r.quantityUsed)     })),
        finishedGoods: form.finishedGoods.map(g => ({ ...g, quantityProduced: parseFloat(g.quantityProduced) })),
      });
      setModal(false);
      setForm(blankForm());
      fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Error saving production entry'); }
    finally { setSaving(false); }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Mark as Completed? This will deduct raw material stock and credit finished goods.')) return;
    try {
      await api.post(`/production/${id}/complete`);
      fetchAll();
      if (detail?._id === id) setDetail(null);
    } catch (err) { alert(err.response?.data?.message || 'Error completing entry'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this production entry?')) return;
    try {
      await api.put(`/production/${id}/cancel`);
      fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const openDetail = async (id) => {
    try {
      const r = await api.get(`/production/${id}`);
      setDetail(r.data);
    } catch { }
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Production</h1>
          <p className="text-[10px] font-mono text-dark-500 tracking-widest uppercase mt-0.5">
            Bill of materials · raw material consumption · finished goods output
          </p>
        </div>
        <button className={cx.btnP} onClick={() => { setForm(blankForm()); setModal(true); }}>
          + New Production Entry
        </button>
      </div>

      {/* Stats */}
      <StatsBar stats={stats}/>

      {/* Table + Detail panel */}
      <div className="flex gap-4 items-start">

        {/* Table */}
        <div className="flex-1 bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
          {loading ? <Spinner/> : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-dark-500">
              <span className="text-4xl mb-3">⚙</span>
              <span className="text-sm">No production entries yet</span>
              <p className="text-xs text-dark-600 mt-1">Create your first batch to track raw material consumption</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={cx.th}>Batch Code</th>
                    <th className={cx.th}>Date</th>
                    <th className={cx.th}>Process</th>
                    <th className={cx.th}>Shift</th>
                    <th className={`${cx.th} text-right`}>Raw In (MT)</th>
                    <th className={`${cx.th} text-right`}>FG Out (MT)</th>
                    <th className={`${cx.th} text-right`}>Wastage %</th>
                    <th className={cx.th}>Status</th>
                    <th className={cx.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => {
                    const rawIn  = e.rawMaterials.reduce((s,r) => s + r.quantityUsed, 0);
                    const fgOut  = e.finishedGoods.reduce((s,g) => s + g.quantityProduced, 0);
                    const wPct   = e.wastage?.percentage ?? 0;
                    const wColor = wPct <= 5 ? 'text-green-400' : wPct <= 10 ? 'text-amber-400' : 'text-red-400';
                    return (
                      <tr key={e._id}
                        className={`hover:bg-dark-800/40 transition cursor-pointer ${detail?._id === e._id ? 'bg-dark-800/60 border-l-2 border-hive-500' : ''}`}
                        onClick={() => openDetail(e._id)}
                      >
                        <td className={`${cx.td} font-mono text-hive-400 text-xs`}>{e.batchCode}</td>
                        <td className={`${cx.td} text-dark-400 text-xs`}>
                          {new Date(e.productionDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                        </td>
                        <td className={`${cx.td} text-dark-400 text-xs`}>{e.processType}</td>
                        <td className={`${cx.td} text-dark-400 text-xs`}>{e.shift}</td>
                        <td className={`${cx.td} text-right font-mono text-dark-300`}>{rawIn.toFixed(2)}</td>
                        <td className={`${cx.td} text-right font-mono text-green-400`}>{fgOut.toFixed(2)}</td>
                        <td className={`${cx.td} text-right font-mono ${wColor}`}>{wPct}%</td>
                        <td className={cx.td}><Badge color={statusColor(e.status)}>{e.status}</Badge></td>
                        <td className={cx.td}>
                          <div className="flex gap-1.5" onClick={ev => ev.stopPropagation()}>
                            {e.status === 'Draft' && <>
                              <button className={cx.btnGreen} onClick={() => handleComplete(e._id)}>✓ Complete</button>
                              <button className={cx.btnR}     onClick={() => handleCancel(e._id)}>Cancel</button>
                            </>}
                            {e.status === 'Completed' && <Badge color="green">Done</Badge>}
                            {e.status === 'Cancelled' && <Badge color="red">Cancelled</Badge>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {detail && (
          <div className="w-80 flex-shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-white font-mono">{detail.batchCode}</p>
              <button className="text-dark-500 hover:text-white text-lg" onClick={() => setDetail(null)}>✕</button>
            </div>

            <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Badge color={statusColor(detail.status)}>{detail.status}</Badge>
                <span className="text-[10px] font-mono text-dark-500">{detail.processType} · {detail.shift}</span>
              </div>

              {/* Wastage gauge */}
              <WastageGauge pct={detail.wastage?.percentage ?? 0}/>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Raw In',    `${detail.rawMaterials.reduce((s,r)=>s+r.quantityUsed,0).toFixed(2)} MT`],
                  ['FG Out',   `${detail.finishedGoods.reduce((s,g)=>s+g.quantityProduced,0).toFixed(2)} MT`],
                  ['Wastage',  `${detail.wastage?.quantity?.toFixed(2) ?? 0} MT`],
                  ['Machine',  detail.machineId || '—'],
                ].map(([k,v]) => (
                  <div key={k} className="bg-dark-800 rounded-lg px-3 py-2">
                    <p className="text-[9px] font-mono text-dark-500 uppercase">{k}</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              {/* Raw materials */}
              <div>
                <p className="text-[9px] font-mono text-dark-500 uppercase tracking-widest mb-2">Raw Materials Used</p>
                {detail.rawMaterials.map((r,i) => (
                  <div key={i} className="flex justify-between text-xs py-1 border-b border-dark-800/50">
                    <span className="text-dark-300">{r.itemId?.itemName || '—'}</span>
                    <span className="font-mono text-red-400">-{r.quantityUsed} MT</span>
                  </div>
                ))}
              </div>

              {/* Finished goods */}
              <div>
                <p className="text-[9px] font-mono text-dark-500 uppercase tracking-widest mb-2">Finished Goods Produced</p>
                {detail.finishedGoods.map((g,i) => (
                  <div key={i} className="flex justify-between text-xs py-1 border-b border-dark-800/50">
                    <span className="text-dark-300">{g.itemId?.itemName || '—'}</span>
                    <span className="font-mono text-green-400">+{g.quantityProduced} MT</span>
                  </div>
                ))}
              </div>

              {detail.wastage?.reason && (
                <p className="text-[10px] text-dark-500 font-mono">Wastage reason: {detail.wastage.reason}</p>
              )}
              {detail.notes && (
                <p className="text-[10px] text-dark-500">Notes: {detail.notes}</p>
              )}

              {detail.status === 'Draft' && (
                <button className={`${cx.btnGreen} w-full justify-center`}
                  onClick={() => handleComplete(detail._id)}>
                  ✓ Complete Production
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Production Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setModal(false)}>
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">New Production Entry</h2>
              <button className="text-dark-400 hover:text-white text-lg" onClick={() => setModal(false)}>✕</button>
            </div>

            <div className="space-y-4">

              {/* Batch code + date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>Batch Code *</label>
                  <div className="flex gap-2">
                    <input className={cx.input} placeholder="PROD-202503-001"
                      value={form.batchCode} onChange={e => setForm(f => ({ ...f, batchCode: e.target.value }))}/>
                    <button type="button" className={cx.btnG} onClick={autoBatchCode} title="Auto-generate">⚙</button>
                  </div>
                </div>
                <div>
                  <label className={cx.label}>Production Date</label>
                  <input className={cx.input} type="date"
                    value={form.productionDate} onChange={e => setForm(f => ({ ...f, productionDate: e.target.value }))}/>
                </div>
              </div>

              {/* Process + shift */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={cx.label}>Process Type</label>
                  <select className={cx.select} value={form.processType}
                    onChange={e => setForm(f => ({ ...f, processType: e.target.value }))}>
                    {PROCESS_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cx.label}>Shift</label>
                  <select className={cx.select} value={form.shift}
                    onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}>
                    {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cx.label}>Machine ID</label>
                  <input className={cx.input} placeholder="e.g. EXT-01"
                    value={form.machineId} onChange={e => setForm(f => ({ ...f, machineId: e.target.value }))}/>
                </div>
              </div>

              {/* Operator + supervisor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>Operator Name</label>
                  <input className={cx.input} placeholder="e.g. Ramesh Kumar"
                    value={form.operatorName} onChange={e => setForm(f => ({ ...f, operatorName: e.target.value }))}/>
                </div>
                <div>
                  <label className={cx.label}>Supervisor Name</label>
                  <input className={cx.input} placeholder="e.g. Suresh Patel"
                    value={form.supervisorName} onChange={e => setForm(f => ({ ...f, supervisorName: e.target.value }))}/>
                </div>
              </div>

              {/* Raw Materials */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cx.label}>Raw Materials Consumed *</label>
                  <button className={cx.btnG} onClick={addRM}>+ Add Material</button>
                </div>
                {form.rawMaterials.map((rm, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-end">
                    <div className="col-span-5">
                      {i === 0 && <label className={cx.label}>Material</label>}
                      <select className={cx.select} value={rm.itemId}
                        onChange={e => updateRM(i, 'itemId', e.target.value)}>
                        <option value="">— Select —</option>
                        {products.filter(p => p.itemType === 'Raw Material' || p.itemType === 'Additive / Masterbatch')
                          .map(p => <option key={p._id} value={p._id}>{p.itemName}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      {i === 0 && <label className={cx.label}>Batch No.</label>}
                      <input className={cx.input} placeholder="LOT-..."
                        value={rm.batchNumber} onChange={e => updateRM(i, 'batchNumber', e.target.value)}/>
                    </div>
                    <div className="col-span-3">
                      {i === 0 && <label className={cx.label}>Qty (MT)</label>}
                      <input className={cx.input} type="number" min="0" step="0.01" placeholder="0.00"
                        value={rm.quantityUsed} onChange={e => updateRM(i, 'quantityUsed', e.target.value)}/>
                    </div>
                    <div className="col-span-1 flex items-end pb-0.5">
                      {form.rawMaterials.length > 1 &&
                        <button className="text-red-400 hover:text-red-300 text-lg leading-none" onClick={() => removeRM(i)}>×</button>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Finished Goods */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cx.label}>Finished Goods Produced *</label>
                  <button className={cx.btnG} onClick={addFG}>+ Add Output</button>
                </div>
                {form.finishedGoods.map((fg, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-end">
                    <div className="col-span-5">
                      {i === 0 && <label className={cx.label}>Product</label>}
                      <select className={cx.select} value={fg.itemId}
                        onChange={e => updateFG(i, 'itemId', e.target.value)}>
                        <option value="">— Select —</option>
                        {products.filter(p => p.itemType === 'Finished Goods')
                          .map(p => <option key={p._id} value={p._id}>{p.itemName}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      {i === 0 && <label className={cx.label}>New Batch No.</label>}
                      <input className={cx.input} placeholder="e.g. FG-PP20-001"
                        value={fg.batchNumber} onChange={e => updateFG(i, 'batchNumber', e.target.value)}/>
                    </div>
                    <div className="col-span-3">
                      {i === 0 && <label className={cx.label}>Qty (MT)</label>}
                      <input className={cx.input} type="number" min="0" step="0.01" placeholder="0.00"
                        value={fg.quantityProduced} onChange={e => updateFG(i, 'quantityProduced', e.target.value)}/>
                    </div>
                    <div className="col-span-1 flex items-end pb-0.5">
                      {form.finishedGoods.length > 1 &&
                        <button className="text-red-400 hover:text-red-300 text-lg leading-none" onClick={() => removeFG(i)}>×</button>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live wastage preview */}
              {totalRaw > 0 && (
                <div className="bg-dark-800/60 border border-dark-700 rounded-lg p-3 space-y-2">
                  <p className="text-[9px] font-mono text-dark-500 uppercase tracking-widest">Live Wastage Preview</p>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-dark-400">Raw In:  <span className="text-white">{totalRaw.toFixed(2)} MT</span></span>
                    <span className="text-dark-400">FG Out:  <span className="text-green-400">{totalFG.toFixed(2)} MT</span></span>
                    <span className="text-dark-400">Wastage: <span className={wastage > 0 ? 'text-amber-400' : 'text-green-400'}>{wastage.toFixed(2)} MT ({wastagePct}%)</span></span>
                  </div>
                  <WastageGauge pct={wastagePct}/>
                </div>
              )}

              {/* Wastage reason + notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>Wastage Reason</label>
                  <input className={cx.input} placeholder="e.g. Startup scrap, QC rejection"
                    value={form.wastageReason} onChange={e => setForm(f => ({ ...f, wastageReason: e.target.value }))}/>
                </div>
                <div>
                  <label className={cx.label}>Notes</label>
                  <input className={cx.input} placeholder="Additional remarks"
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>
                </div>
              </div>

              {/* Info tip */}
              <div className="bg-hive-500/5 border border-hive-500/15 rounded-lg px-3 py-2.5 text-[10px] font-mono text-hive-400">
                💡 Save as Draft first. Click <b>Complete</b> on the entry to deduct raw material stock and credit finished goods.
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className={cx.btnG} onClick={() => setModal(false)}>Cancel</button>
              <button className={cx.btnP} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save as Draft'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
