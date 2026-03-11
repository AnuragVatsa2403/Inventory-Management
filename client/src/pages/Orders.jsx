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

const STATUSES = ['', 'Pending', 'Partial', 'Received', 'Cancelled'];

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

const statusColor = (s) => ({ Pending: 'amber', Partial: 'blue', Received: 'green', Cancelled: 'red' }[s] || 'gray');

const Spinner = () => (
  <div className="flex items-center justify-center h-48 gap-3 text-dark-500 text-sm font-mono">
    <div className="w-4 h-4 border-2 border-dark-600 border-t-hive-400 rounded-full animate-spin" />
    Loading…
  </div>
);

const Orders = () => {
  const [orders, setOrders]       = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');
  const [modal, setModal]         = useState(null);     // 'create'
  const [receiveModal, setReceiveModal] = useState(null);
  const [form, setForm]           = useState({
    supplierId: '',
    items:      [],
    orderDate:  new Date().toISOString().split('T')[0],
    notes:      '',
  });
  const [receiveForm, setReceiveForm] = useState({ itemId: '', quantityReceived: 1, batchNumber: '' });
  const [reordering, setReordering]   = useState(false);
  const [msg, setMsg]                 = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    api.get(`/orders${filter ? `?status=${filter}` : ''}`)
      .then(r => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    api.get('/suppliers').then(r => setSuppliers(r.data)).catch(() => {});
    api.get('/products').then(r => setProducts(r.data)).catch(() => {});
  }, [filter]);


  const addItem    = () => setForm({ ...form, items: [...form.items, { itemId: '', quantityOrdered: 1, unitPrice: 0 }] });
  const updateItem = (i, k, v) => {
    const items = [...form.items];
    items[i] = { ...items[i], [k]: v };
    setForm({ ...form, items });
  };
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const totalTonnes = form.items.reduce((sum, it) => sum + (Number(it.quantityOrdered) || 0), 0);

  const handleCreate = async () => {
    try {
      await api.post('/orders', form);
      setModal(null);
      setForm({ supplierId: '', items: [], orderDate: new Date().toISOString().split('T')[0], notes: '' });
      fetchOrders();
    } catch (err) { alert(err.response?.data?.message || 'Error creating order'); }
  };

  const handleReceive = async () => {
    try {
      await api.post(`/orders/${receiveModal._id}/receive`, receiveForm);
      setReceiveModal(null);
      fetchOrders();
    } catch (err) { alert(err.response?.data?.message || 'Error recording GRN'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try { await api.delete(`/orders/${id}`); fetchOrders(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleReorder = async () => {
    setReordering(true); setMsg(null);
    try {
      const { data } = await api.post('/reorder/run');
      setMsg({ text: `✓ Auto-reorder complete — ${data.results.created} POs created, ${data.results.skipped} skipped.`, ok: true });
      fetchOrders();
    } catch (err) {
      setMsg({ text: '⚠ ' + (err.response?.data?.message || 'Auto-reorder failed.'), ok: false });
    } finally { setReordering(false); }
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Purchase Orders</h1>
          <p className="text-[10px] font-mono text-dark-500 tracking-widest uppercase mt-0.5">
            {orders.length} orders · raw material procurement
          </p>
        </div>
        <div className="flex gap-2">
          <button className={cx.btnG} onClick={handleReorder} disabled={reordering}>
            {reordering ? '⟳ Running…' : '⟳ Auto-Reorder'}
          </button>
          <button className={cx.btnP} onClick={() => setModal('create')}>+ New PO</button>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border ${
          msg.ok
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          {msg.text}
        </div>
      )}


      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
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
        {loading ? <Spinner /> : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-dark-500">
            <span className="text-4xl mb-3">⬡</span>
            <span className="text-sm">No purchase orders</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={cx.th}>PO Date</th>
                  <th className={cx.th}>Supplier</th>
                  <th className={cx.th}>Material Lines</th>
                  <th className={`${cx.th} text-right`}>Total (T)</th>
                  <th className={cx.th}>Status</th>
                  <th className={cx.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const totalQty = o.items?.reduce((s, it) => s + (it.quantityOrdered || 0), 0) || 0;
                  return (
                    <tr key={o._id} className="hover:bg-dark-800/40 transition">
                      <td className={`${cx.td} font-mono text-dark-400`}>
                        {new Date(o.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className={`${cx.td} font-semibold text-white`}>{o.supplierId?.supplierName || 'N/A'}</td>
                      <td className={`${cx.td} font-mono text-dark-400`}>{o.items?.length || 0} line(s)</td>
                      <td className={`${cx.td} text-right font-mono text-hive-400`}>{totalQty} T</td>
                      <td className={cx.td}><Badge color={statusColor(o.status)}>{o.status}</Badge></td>
                      <td className={cx.td}>
                        <div className="flex gap-2">
                          {o.status !== 'Received' && o.status !== 'Cancelled' && (
                            <button
                              className={cx.btnG}
                              onClick={() => {
                                setReceiveModal(o);
                                setReceiveForm({ itemId: o.items?.[0]?.itemId?._id || '', quantityReceived: 1, batchNumber: '' });
                              }}
                            >
                              GRN
                            </button>
                          )}
                          {o.status === 'Pending' && (
                            <button className={cx.btnR} onClick={() => handleDelete(o._id)}>Del</button>
                          )}
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
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">New Purchase Order</h2>
                <p className="text-[10px] font-mono text-dark-500 mt-0.5">Raw material procurement · Polytime Industries</p>
              </div>
              <button className="text-dark-400 hover:text-white text-lg" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="space-y-4">
          
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>Supplier *</label>
                  <select className={cx.select} value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                    <option value="">Select supplier…</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.supplierName}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cx.label}>PO Date</label>
                  <input className={cx.input} type="date" value={form.orderDate} onChange={e => setForm({ ...form, orderDate: e.target.value })} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cx.label} style={{ margin: 0 }}>Material Lines</label>
                  <button className={cx.btnG} onClick={addItem}>+ Add Line</button>
                </div>

                {form.items.length === 0 && (
                  <p className="text-xs font-mono text-dark-600 text-center py-4 bg-dark-800/40 rounded-lg">
                    No items — click "Add Line" to add raw materials
                  </p>
                )}

                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 mb-2 items-end">
                    <div>
                      {i === 0 && <label className={cx.label}>Material</label>}
                      <select
                        className={cx.select}
                        value={item.itemId}
                        onChange={e => updateItem(i, 'itemId', e.target.value)}
                      >
                        <option value="">Select material…</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.itemName} ({p.itemType}) — Avail: {p.stock?.totalAvailable ?? '?'} T
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      {i === 0 && <label className={cx.label}>Qty (Tonnes)</label>}
                      <input
                        className={cx.input}
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Tonnes"
                        value={item.quantityOrdered}
                        onChange={e => updateItem(i, 'quantityOrdered', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      {i === 0 && <label className={cx.label}>Unit Price (₹)</label>}
                      <input
                        className={cx.input}
                        type="number"
                        min="0"
                        placeholder="₹/tonne"
                        value={item.unitPrice}
                        onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))}
                      />
                    </div>
                    <button className={cx.btnR} onClick={() => removeItem(i)}>✕</button>
                  </div>
                ))}

                {form.items.length > 0 && (
                  <div className="flex justify-end mt-2">
                    <div className="bg-hive-500/5 border border-hive-500/15 rounded-lg px-3 py-1.5 text-xs font-mono text-hive-400">
                      Total: <strong>{totalTonnes.toFixed(2)} Tonnes</strong>
                      {' · ₹'}
                      {form.items.reduce((s, it) => s + (it.quantityOrdered * it.unitPrice), 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={cx.label}>Notes / Remarks</label>
                <input
                  className={cx.input}
                  placeholder="e.g. Urgent delivery, specific LOT required…"
                  value={form.notes || ''}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className={cx.btnG} onClick={() => setModal(null)}>Cancel</button>
              <button className={cx.btnP} onClick={handleCreate}>Create PO</button>
            </div>
          </div>
        </div>
      )}

      {receiveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setReceiveModal(null)}>
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">Goods Receipt Note (GRN)</h2>
                <p className="text-[10px] font-mono text-dark-500 mt-0.5">
                  Supplier: {receiveModal.supplierId?.supplierName}
                </p>
              </div>
              <button className="text-dark-400 hover:text-white text-lg" onClick={() => setReceiveModal(null)}>✕</button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg px-3 py-2.5 mb-4">
              ⚠ Recording a GRN will update the Stock Ledger and increase available inventory.
            </div>

            <div className="space-y-3">
              <div>
                <label className={cx.label}>Material Line *</label>
                <select
                  className={cx.select}
                  value={receiveForm.itemId}
                  onChange={e => setReceiveForm({ ...receiveForm, itemId: e.target.value })}
                >
                  <option value="">Select line item…</option>
                  {receiveModal.items?.map(item => (
                    <option key={item.itemId?._id || item.itemId} value={item.itemId?._id || item.itemId}>
                      {item.itemId?.itemName || 'Item'} — Ordered: {item.quantityOrdered} T, Received so far: {item.quantityReceived} T
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>Qty Received (Tonnes) *</label>
                  <input
                    className={cx.input}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Tonnes"
                    value={receiveForm.quantityReceived}
                    onChange={e => setReceiveForm({ ...receiveForm, quantityReceived: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className={cx.label}>Batch / LOT No.</label>
                  <input
                    className={cx.input}
                    placeholder="e.g. LOT-HDPE-2026-01"
                    value={receiveForm.batchNumber}
                    onChange={e => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className={cx.btnG} onClick={() => setReceiveModal(null)}>Cancel</button>
              <button className={cx.btnP} onClick={handleReceive}>Confirm GRN →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
