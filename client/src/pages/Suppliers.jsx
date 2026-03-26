import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const cx = {
  input:  'w-full bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 focus:ring-1 focus:ring-hive-500/30 transition placeholder-dark-600',
  label:  'block text-[10px] font-mono text-dark-400 tracking-widest uppercase mb-1.5',
  th:     'text-left px-4 py-2.5 text-[9px] font-mono text-dark-500 tracking-widest uppercase border-b border-dark-800',
  td:     'px-4 py-3 text-sm text-dark-200 border-b border-dark-800/50',
  btnP:   'inline-flex items-center gap-1.5 px-4 py-2 bg-hive-500 hover:bg-hive-400 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-hive-500/20',
  btnG:   'inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white text-xs font-medium rounded-lg border border-dark-700 transition',
  btnR:   'inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition',
};

const SUPPLIER_TYPES = [
  'Petrochemical Manufacturer','Polymer Distributor',
  'Masterbatch Supplier','Packaging Supplier','Trading Company','Other',
];

const Badge = ({ children, color = 'gray' }) => {
  const c = {
    green:'bg-green-500/10 text-green-400 border-green-500/20',
    red:  'bg-red-500/10 text-red-400 border-red-500/20',
    amber:'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue: 'bg-hive-500/10 text-hive-400 border-hive-500/20',
    gray: 'bg-dark-700/60 text-dark-400 border-dark-600',
  }[color];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${c}`}>{children}</span>;
};

const Spinner = () => (
  <div className="flex items-center justify-center h-48 gap-3 text-dark-500 text-sm font-mono">
    <div className="w-4 h-4 border-2 border-dark-600 border-t-hive-400 rounded-full animate-spin" />Loading…
  </div>
);

const ScoreRing = ({ score }) => {
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  const col  = score >= 8 ? '#22c55e' : score >= 6 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="6"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke={col} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-extrabold text-white leading-none">{score}</span>
        <span className="text-[9px] font-mono text-dark-500">/10</span>
      </div>
    </div>
  );
};

const ScoreBar = ({ label, value, max, color = 'hive' }) => {
  const bg = { hive:'bg-hive-500', green:'bg-green-500', amber:'bg-amber-500' }[color];
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-dark-400">{label}</span>
        <span className="text-white">{value} / {max}</span>
      </div>
      <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
        <div className={`h-full ${bg} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100,(value/max)*100)}%` }}/>
      </div>
    </div>
  );
};

const PerformancePanel = ({ supplierId }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/suppliers/${supplierId}/performance`);
      setData(r.data);
    } catch { setData({ error: true }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [supplierId]);

  if (loading) return (
    <div className="flex items-center gap-2 py-6 text-dark-500 text-xs font-mono">
      <div className="w-3 h-3 border border-dark-600 border-t-hive-400 rounded-full animate-spin"/>Calculating…
    </div>
  );

  if (data?.error || !data?.performance) return (
    <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 text-center">
      <p className="text-dark-500 text-xs font-mono">No completed orders yet.</p>
      <p className="text-dark-600 text-[10px] mt-1">Performance will appear after first GRN is received.</p>
    </div>
  );

  const p = data.performance;
  const scoreColor = p.overallScore >= 8 ? 'green' : p.overallScore >= 6 ? 'amber' : 'red';
  const scoreLabel = p.overallScore >= 8 ? 'Excellent' : p.overallScore >= 6 ? 'Good' : 'Needs Improvement';

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Supplier Performance</h3>
          <p className="text-[10px] font-mono text-dark-500 mt-0.5">Based on {p.totalOrders} completed order{p.totalOrders !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreRing score={p.overallScore}/>
          <Badge color={scoreColor}>{scoreLabel}</Badge>
        </div>
      </div>

      <div className="space-y-3 bg-dark-800/40 rounded-lg p-4">
        <p className="text-[9px] font-mono text-dark-500 uppercase tracking-widest mb-3">Score Breakdown</p>
        <ScoreBar label="On-Time Delivery (40%)"       value={p.onTimeScore}      max={4} color="hive"/>
        <ScoreBar label="Quantity Accuracy (30%)"      value={p.qtyAccuracyScore} max={3} color="green"/>
        <ScoreBar label="Quality / No Rejection (30%)" value={p.qualityScore}     max={3} color="amber"/>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          ['Total Orders',      p.totalOrders],
          ['On Time',           p.onTimeDeliveries],
          ['Late',              p.lateDeliveries],
          ['Ordered (MT)',      p.totalQtyOrdered],
          ['Received (MT)',     p.totalQtyReceived],
          ['Rejected (MT)',     p.rejectedQty],
          ['Avg Price / MT',    p.avgPricePerTonne ? `₹${p.avgPricePerTonne.toLocaleString('en-IN')}` : '—'],
          ['Last Updated',      p.lastUpdated ? new Date(p.lastUpdated).toLocaleDateString('en-IN') : '—'],
        ].map(([label, value]) => (
          <div key={label} className="bg-dark-800 rounded-lg px-3 py-2.5">
            <p className="text-[9px] font-mono text-dark-500 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <button className={cx.btnG} onClick={load}>↻ Refresh</button>
    </div>
  );
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState(false);
  const [selectedId,setSelectedId]= useState(null);
  const [form,      setForm]      = useState({ supplierName:'', supplierType:'Polymer Distributor', contactInfo:{}, leadTimeDays:7, paymentTerms:'', gstin:'' });
  const [editing,   setEditing]   = useState(null);

  const fetchSuppliers = () => {
    setLoading(true);
    api.get(`/suppliers${search ? `?search=${search}` : ''}`)
      .then(r => setSuppliers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSuppliers(); }, [search]);

  const openAdd = () => {
    setForm({ supplierName:'', supplierType:'Polymer Distributor', contactInfo:{}, leadTimeDays:7, paymentTerms:'', gstin:'' });
    setEditing(null); setModal(true);
  };
  const openEdit = (s) => { setForm({ ...s, gstin: s.contactInfo?.gstin || s.gstin || '' }); setEditing(s._id); setModal(true); };

  const handleSave = async () => {
    try {
      editing ? await api.put(`/suppliers/${editing}`, form) : await api.post('/suppliers', form);
      setModal(false); fetchSuppliers();
    } catch (err) { alert(err.response?.data?.message || 'Error saving supplier'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this supplier?')) return;
    try { await api.delete(`/suppliers/${id}`); fetchSuppliers(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const selectedSupplier = suppliers.find(s => s._id === selectedId);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Suppliers</h1>
          <p className="text-[10px] font-mono text-dark-500 tracking-widest uppercase mt-0.5">
            {suppliers.length} active · click any row to view performance
          </p>
        </div>
        <button className={cx.btnP} onClick={openAdd}>+ Add Supplier</button>
      </div>

      <div className="flex gap-2">
        <div className="flex items-center gap-2 bg-dark-800 border border-dark-700 rounded-lg px-3 py-2">
          <span className="text-dark-500 text-sm">⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search suppliers…"
            className="bg-transparent text-sm text-dark-100 outline-none placeholder-dark-600 w-52"/>
        </div>
      </div>

      <div className={`flex gap-4 ${selectedId ? 'items-start' : ''}`}>
        {/* Table */}
        <div className="flex-1 bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
          {loading ? <Spinner /> : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-dark-500">
              <span className="text-4xl mb-3">◎</span><span className="text-sm">No suppliers found</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={cx.th}>Supplier Name</th>
                    <th className={cx.th}>GSTIN</th>
                    <th className={`${cx.th} text-right`}>Lead Time</th>
                    <th className={cx.th}>Payment</th>
                    <th className={cx.th}>Performance</th>
                    <th className={cx.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(s => {
                    const p = s.performance;
                    const scoreColor = !p ? 'gray' : p.overallScore >= 8 ? 'green' : p.overallScore >= 6 ? 'amber' : 'red';
                    return (
                      <tr key={s._id}
                        className={`hover:bg-dark-800/40 transition cursor-pointer ${selectedId === s._id ? 'bg-dark-800/60 border-l-2 border-hive-500' : ''}`}
                        onClick={() => setSelectedId(selectedId === s._id ? null : s._id)}
                      >
                        <td className={`${cx.td} font-semibold text-white`}>{s.supplierName}</td>
                        <td className={`${cx.td} font-mono text-dark-400 text-xs`}>{s.contactInfo?.gstin || s.gstin || '—'}</td>
                        <td className={`${cx.td} text-right font-mono text-hive-400`}>{s.leadTimeDays}d</td>
                        <td className={`${cx.td} text-dark-400 text-xs`}>{s.paymentTerms || '—'}</td>
                        <td className={cx.td}>
                          {p
                            ? <Badge color={scoreColor}>{p.overallScore}/10</Badge>
                            : <span className="text-dark-600 text-xs font-mono">No data yet</span>
                          }
                        </td>
                        <td className={cx.td}>
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <button className={cx.btnG} onClick={() => openEdit(s)}>Edit</button>
                            <button className={cx.btnR} onClick={() => handleDelete(s._id)}>Del</button>
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

        {/* Performance panel — appears on row click */}
        {selectedId && (
          <div className="w-80 flex-[0_0_auto] space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-white truncate">{selectedSupplier?.supplierName}</p>
              <button className="text-dark-500 hover:text-white text-lg leading-none ml-2"
                onClick={() => setSelectedId(null)}>✕</button>
            </div>
            <PerformancePanel supplierId={selectedId}/>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setModal(false)}>
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">{editing ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button className="text-dark-400 hover:text-white text-lg" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={cx.label}>Supplier Name *</label>
                <input className={cx.input} placeholder="e.g. Reliance Industries Ltd"
                  value={form.supplierName || ''} onChange={e => setForm({ ...form, supplierName: e.target.value })}/>
              </div>
              <div>
                <label className={cx.label}>Supplier Type</label>
                <select className="w-full bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 transition"
                  value={form.supplierType || ''} onChange={e => setForm({ ...form, supplierType: e.target.value })}>
                  {SUPPLIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>Email</label>
                  <input className={cx.input} type="email" placeholder="purchase@supplier.com"
                    value={form.contactInfo?.email || ''} onChange={e => setForm({ ...form, contactInfo: { ...form.contactInfo, email: e.target.value } })}/>
                </div>
                <div>
                  <label className={cx.label}>Phone</label>
                  <input className={cx.input} placeholder="+91 98765 43210"
                    value={form.contactInfo?.phone || ''} onChange={e => setForm({ ...form, contactInfo: { ...form.contactInfo, phone: e.target.value } })}/>
                </div>
              </div>
              <div>
                <label className={cx.label}>Address</label>
                <input className={cx.input} placeholder="City, State"
                  value={form.contactInfo?.address || ''} onChange={e => setForm({ ...form, contactInfo: { ...form.contactInfo, address: e.target.value } })}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>GSTIN</label>
                  <input className={cx.input} placeholder="27AAAAA0000A1Z5"
                    value={form.gstin || ''} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })}/>
                </div>
                <div>
                  <label className={cx.label}>Lead Time (Days)</label>
                  <input className={cx.input} type="number" min="0"
                    value={form.leadTimeDays ?? 7} onChange={e => setForm({ ...form, leadTimeDays: Number(e.target.value) })}/>
                </div>
              </div>
              <div>
                <label className={cx.label}>Payment Terms</label>
                <input className={cx.input} placeholder="e.g. Net 30, Advance, LC at sight"
                  value={form.paymentTerms || ''} onChange={e => setForm({ ...form, paymentTerms: e.target.value })}/>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className={cx.btnG} onClick={() => setModal(false)}>Cancel</button>
              <button className={cx.btnP} onClick={handleSave}>Save Supplier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
