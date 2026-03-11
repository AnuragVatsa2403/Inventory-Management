import React from 'react';
import { useState, useEffect } from 'react';
import api from '../utils/api';

const cx = {
  input:  'w-full bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 focus:ring-1 focus:ring-hive-500/30 transition placeholder-dark-600',
  select: 'w-full bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 transition',
  label:  'block text-[10px] font-mono text-dark-400 tracking-widest uppercase mb-1.5',
  th:     'text-left px-4 py-2.5 text-[9px] font-mono text-dark-500 tracking-widest uppercase border-b border-dark-800',
  td:     'px-4 py-3 text-sm text-dark-200 border-b border-dark-800/50',
  btnP:   'inline-flex items-center gap-1.5 px-4 py-2 bg-hive-500 hover:bg-hive-400 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-hive-500/20',
  btnG:   'inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white text-xs font-medium rounded-lg border border-dark-700 transition',
  btnR:   'inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition',
};

const DISPATCH_STATUSES = ['', 'Pending', 'Partial', 'Dispatched', 'Cancelled'];
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Badge = ({ children, color = 'gray' }) => {
  const c = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red:   'bg-red-500/10 text-red-400 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue:  'bg-hive-500/10 text-hive-400 border-hive-500/20',
    gray:  'bg-dark-700/60 text-dark-400 border-dark-600',
  }[color];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${c}`}>
      {children}
    </span>
  );
};

const payColor  = (s) => ({ Paid: 'green', Pending: 'amber' }[s] || 'gray');
const dispColor = (s) => ({ Dispatched: 'green', Partial: 'blue', Pending: 'amber', Cancelled: 'red' }[s] || 'gray');

const Spinner = () => (
  <div className="flex items-center justify-center h-48 gap-3 text-dark-500 text-sm font-mono">
    <div className="w-4 h-4 border-2 border-dark-600 border-t-hive-400 rounded-full animate-spin" />
    Loading…
  </div>
);

const Sales = () => {
  const [sales, setSales]           = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('');
  const [modal, setModal]           = useState(null);
  const [dispatchModal, setDispatchModal] = useState(null);
  const [form, setForm]             = useState({
    itemId:           '',
    quantityOrdered:  1,
    unitPrice:        0,
    paymentStatus:    'Pending',
    customer:         { name: '', gstin: '', phone: '', email: '', address: '' },
  });
  const [dispatchQty, setDispatchQty]       = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchSales = () => {
    setLoading(true);
    api.get(`/sales${filter ? `?dispatchStatus=${filter}` : ''}`)
      .then(r => setSales(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales();
    api.get('/products').then(r => setProducts(r.data)).catch(() => {});
  }, [filter]);

  const handleProductSelect = (id) => {
    const p = products.find(x => x._id === id);
    setSelectedProduct(p);
    setForm(f => ({ ...f, itemId: id }));
  };

  const handleCreate = async () => {
    try {
      await api.post('/sales', form);
      setModal(null);
      setForm({ itemId: '', quantityOrdered: 1, unitPrice: 0, paymentStatus: 'Pending', customer: { name: '', gstin: '', phone: '', email: '', address: '' } });
      setSelectedProduct(null);
      fetchSales();
    } catch (err) { alert(err.response?.data?.message || 'Error creating sale'); }
  };

  const handleDispatch = async () => {
    try {
      await api.post(`/sales/${dispatchModal._id}/dispatch`, { quantityDispatched: dispatchQty });
      setDispatchModal(null);
      fetchSales();
    } catch (err) { alert(err.response?.data?.message || 'Dispatch failed'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this sale order? Reserved stock will be released back to inventory.')) return;
    try { await api.delete(`/sales/${id}`); fetchSales(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const togglePayment = async (s) => {
    const next = s.paymentStatus === 'Paid' ? 'Pending' : 'Paid';
    try { await api.put(`/sales/${s._id}`, { paymentStatus: next }); fetchSales(); }
    catch {}
  };

  const remaining = (s) => s.quantityOrdered - s.quantityDispatched;

  const pendingT    = sales.filter(s => s.dispatchStatus === 'Pending').reduce((sum, s) => sum + remaining(s), 0);
  const unpaidCount = sales.filter(s => s.paymentStatus === 'Pending' && s.dispatchStatus !== 'Cancelled').length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Sales Orders</h1>
          <p className="text-[10px] font-mono text-dark-500 tracking-widest uppercase mt-0.5">
            {sales.length} orders · {pendingT.toFixed(1)} T pending dispatch · {unpaidCount} unpaid
          </p>
        </div>
        <button className={cx.btnP} onClick={() => setModal('create')}>+ New Sale</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {DISPATCH_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              filter === s
                ? 'bg-hive-500 border-hive-500 text-white'
                : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-white'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>
      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        {loading ? <Spinner /> : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-dark-500">
            <span className="text-4xl mb-3">◐</span>
            <span className="text-sm">No sales orders found</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={cx.th}>Date</th>
                  <th className={cx.th}>Material / Chips</th>
                  <th className={cx.th}>Customer</th>
                  <th className={`${cx.th} text-right`}>Ordered (T)</th>
                  <th className={`${cx.th} text-right`}>Dispatched (T)</th>
                  <th className={`${cx.th} text-right`}>Remaining (T)</th>
                  <th className={cx.th}>Payment</th>
                  <th className={cx.th}>Dispatch</th>
                  <th className={cx.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s._id} className="hover:bg-dark-800/40 transition">
                    <td className={`${cx.td} font-mono text-dark-400 whitespace-nowrap text-xs`}>
                      {new Date(s.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className={`${cx.td} font-semibold text-white`}>{s.itemId?.itemName || 'N/A'}</td>
                    <td className={`${cx.td} text-dark-300`}>
                      <div>{s.customer?.name || '—'}</div>
                      {s.customer?.gstin && (
                        <div className="text-[10px] font-mono text-dark-500">{s.customer.gstin}</div>
                      )}
                    </td>
                    <td className={`${cx.td} text-right font-mono`}>{s.quantityOrdered}</td>
                    <td className={`${cx.td} text-right font-mono`}>{s.quantityDispatched}</td>
                    <td className={`${cx.td} text-right font-mono ${remaining(s) > 0 ? 'text-amber-400' : 'text-dark-500'}`}>
                      {remaining(s)}
                    </td>
                    <td className={cx.td}>
                      <button onClick={() => togglePayment(s)} title="Click to toggle payment status">
                        <Badge color={payColor(s.paymentStatus)}>{s.paymentStatus}</Badge>
                      </button>
                    </td>
                    <td className={cx.td}>
                      <Badge color={dispColor(s.dispatchStatus)}>{s.dispatchStatus}</Badge>
                    </td>
                    <td className={cx.td}>
                      <div className="flex gap-1.5 flex-wrap">
                        {s.dispatchStatus !== 'Dispatched' && s.dispatchStatus !== 'Cancelled' && (
                          <button
                            className={cx.btnG}
                            onClick={() => { setDispatchModal(s); setDispatchQty(Math.min(1, remaining(s))); }}
                          >
                            Dispatch
                          </button>
                        )}
                        {s.dispatchStatus !== 'Dispatched' && s.dispatchStatus !== 'Cancelled' && (
                          <button className={cx.btnR} onClick={() => handleCancel(s._id)}>Cancel</button>
                        )}
                        <a
                          className={cx.btnG}
                          href={`${API_BASE}/pdf/invoice/${s._id}`}
                          target="_blank"
                          rel="noreferrer"
                          download
                        >
                          ↓ Invoice
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">New Sale Order</h2>
                <p className="text-[10px] font-mono text-dark-500 mt-0.5">Finished goods / chips dispatch</p>
              </div>
              <button className="text-dark-400 hover:text-white text-lg" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={cx.label}>Material / Chips *</label>
                <select className={cx.select} value={form.itemId} onChange={e => handleProductSelect(e.target.value)}>
                  <option value="">Select product…</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.itemName} [{p.itemType}] — Available: {p.stock?.totalAvailable ?? '?'} T
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="bg-hive-500/5 border border-hive-500/20 rounded-lg px-3 py-2 text-xs font-mono text-hive-400">
                  Available stock: <strong>{selectedProduct.stock?.totalAvailable ?? 0} Tonnes</strong>
                  {selectedProduct.polymerGrade && ` · Grade: ${selectedProduct.polymerGrade}`}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={cx.label}>Quantity (T) *</label>
                  <input
                    className={cx.input}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.quantityOrdered}
                    onChange={e => setForm({ ...form, quantityOrdered: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className={cx.label}>Unit Price (₹/T)</label>
                  <input
                    className={cx.input}
                    type="number"
                    min="0"
                    placeholder="₹"
                    value={form.unitPrice}
                    onChange={e => setForm({ ...form, unitPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className={cx.label}>Payment</label>
                  <select className={cx.select} value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })}>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              {form.quantityOrdered > 0 && form.unitPrice > 0 && (
                <div className="bg-green-500/5 border border-green-500/15 rounded-lg px-3 py-2 text-xs font-mono text-green-400">
                  Invoice value: ₹{(form.quantityOrdered * form.unitPrice).toLocaleString('en-IN')}
                </div>
              )}

        
              <div className="border-t border-dark-800 pt-4">
                <p className={cx.label} style={{ marginBottom: '10px' }}>Customer Details</p>
                <div className="space-y-2">
                  <input className={cx.input} placeholder="Customer / Company name *" value={form.customer?.name || ''} onChange={e => setForm({ ...form, customer: { ...form.customer, name: e.target.value } })} />
                  <input className={cx.input} placeholder="GSTIN (e.g. 27AAAAA0000A1Z5)" value={form.customer?.gstin || ''} onChange={e => setForm({ ...form, customer: { ...form.customer, gstin: e.target.value.toUpperCase() } })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className={cx.input} placeholder="Phone" value={form.customer?.phone || ''} onChange={e => setForm({ ...form, customer: { ...form.customer, phone: e.target.value } })} />
                    <input className={cx.input} type="email" placeholder="Email" value={form.customer?.email || ''} onChange={e => setForm({ ...form, customer: { ...form.customer, email: e.target.value } })} />
                  </div>
                  <input className={cx.input} placeholder="Delivery address" value={form.customer?.address || ''} onChange={e => setForm({ ...form, customer: { ...form.customer, address: e.target.value } })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className={cx.btnG} onClick={() => setModal(null)}>Cancel</button>
              <button className={cx.btnP} onClick={handleCreate}>Create Sale Order</button>
            </div>
          </div>
        </div>
      )}

    
      {dispatchModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDispatchModal(null)}>
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Dispatch Material</h2>
              <button className="text-dark-400 hover:text-white text-lg" onClick={() => setDispatchModal(null)}>✕</button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg px-3 py-2.5 mb-4">
              ⚠ Dispatching will deduct stock from the Stock Ledger.
            </div>

            <div className="space-y-2 mb-4 text-xs font-mono text-dark-400">
              <p>Material: <span className="text-white font-semibold">{dispatchModal.itemId?.itemName}</span></p>
              <p>Customer: <span className="text-dark-200">{dispatchModal.customer?.name || '—'}</span></p>
              <p>Ordered: <span className="text-dark-200">{dispatchModal.quantityOrdered} T</span></p>
              <p>Already dispatched: <span className="text-dark-200">{dispatchModal.quantityDispatched} T</span></p>
              <p>Remaining: <span className="text-amber-400 font-semibold">{remaining(dispatchModal)} T</span></p>
            </div>

            <div>
              <label className={cx.label}>Qty to Dispatch (Tonnes) *</label>
              <input
                className={cx.input}
                type="number"
                min="0.01"
                step="0.01"
                max={remaining(dispatchModal)}
                value={dispatchQty}
                onChange={e => setDispatchQty(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className={cx.btnG} onClick={() => setDispatchModal(null)}>Cancel</button>
              <button className={cx.btnP} onClick={handleDispatch}>Confirm Dispatch →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
