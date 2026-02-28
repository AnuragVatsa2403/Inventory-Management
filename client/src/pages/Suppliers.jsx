import React from 'react';
import { useState, useEffect } from 'react';
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
  'Petrochemical Manufacturer',
  'Polymer Distributor',
  'Masterbatch Supplier',
  'Packaging Supplier',
  'Trading Company',
  'Other',
];

const Spinner = () => (
  <div className="flex items-center justify-center h-48 gap-3 text-dark-500 text-sm font-mono">
    <div className="w-4 h-4 border-2 border-dark-600 border-t-hive-400 rounded-full animate-spin" />
    Loading…
  </div>
);

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({
    supplierName:  '',
    supplierType:  'Polymer Distributor',
    contactInfo:   {},
    leadTimeDays:  7,
    paymentTerms:  '',
    gstin:         '',
  });
  const [editing, setEditing]     = useState(null);

  const fetchSuppliers = () => {
    setLoading(true);
    api.get(`/suppliers${search ? `?search=${search}` : ''}`)
      .then(r => setSuppliers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSuppliers(); }, [search]);

  const openAdd = () => {
    setForm({ supplierName: '', supplierType: 'Polymer Distributor', contactInfo: {}, leadTimeDays: 7, paymentTerms: '', gstin: '' });
    setEditing(null);
    setModal(true);
  };
  const openEdit = (s) => { setForm(s); setEditing(s._id); setModal(true); };

  const handleSave = async () => {
    try {
      editing
        ? await api.put(`/suppliers/${editing}`, form)
        : await api.post('/suppliers', form);
      setModal(false);
      fetchSuppliers();
    } catch (err) { alert(err.response?.data?.message || 'Error saving supplier'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this supplier?')) return;
    try { await api.delete(`/suppliers/${id}`); fetchSuppliers(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Suppliers</h1>
          <p className="text-[10px] font-mono text-dark-500 tracking-widest uppercase mt-0.5">
            {suppliers.length} active · petrochemical & polymer vendors
          </p>
        </div>
        <button className={cx.btnP} onClick={openAdd}>+ Add Supplier</button>
      </div>

  
      <div className="flex gap-2">
        <div className="flex items-center gap-2 bg-dark-800 border border-dark-700 rounded-lg px-3 py-2">
          <span className="text-dark-500 text-sm">⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search suppliers…"
            className="bg-transparent text-sm text-dark-100 outline-none placeholder-dark-600 w-52"
          />
        </div>
      </div>

    
      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        {loading ? <Spinner /> : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-dark-500">
            <span className="text-4xl mb-3">◎</span>
            <span className="text-sm">No suppliers found</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={cx.th}>Supplier Name</th>
                  <th className={cx.th}>Type</th>
                  <th className={cx.th}>Contact</th>
                  <th className={cx.th}>Email</th>
                  <th className={cx.th}>GSTIN</th>
                  <th className={`${cx.th} text-right`}>Lead Time</th>
                  <th className={cx.th}>Payment Terms</th>
                  <th className={cx.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s._id} className="hover:bg-dark-800/40 transition">
                    <td className={`${cx.td} font-semibold text-white`}>{s.supplierName}</td>
                    <td className={`${cx.td} text-dark-400 text-xs`}>{s.supplierType || '—'}</td>
                    <td className={`${cx.td} font-mono text-dark-400 text-xs`}>{s.contactInfo?.phone || '—'}</td>
                    <td className={`${cx.td} font-mono text-dark-400 text-xs`}>{s.contactInfo?.email || '—'}</td>
                    <td className={`${cx.td} font-mono text-dark-400 text-xs`}>{s.gstin || '—'}</td>
                    <td className={`${cx.td} text-right font-mono text-hive-400`}>{s.leadTimeDays}d</td>
                    <td className={`${cx.td} text-dark-400 text-xs`}>{s.paymentTerms || '—'}</td>
                    <td className={cx.td}>
                      <div className="flex gap-2">
                        <button className={cx.btnG} onClick={() => openEdit(s)}>Edit</button>
                        <button className={cx.btnR} onClick={() => handleDelete(s._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setModal(false)}
        >
          <div
            className="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">
                {editing ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button className="text-dark-400 hover:text-white text-lg" onClick={() => setModal(false)}>✕</button>
            </div>

            <div className="space-y-3">
              {/* Name + Type */}
              <div>
                <label className={cx.label}>Supplier Name *</label>
                <input
                  className={cx.input}
                  placeholder="e.g. Reliance Industries Ltd"
                  value={form.supplierName || ''}
                  onChange={e => setForm({ ...form, supplierName: e.target.value })}
                />
              </div>
              <div>
                <label className={cx.label}>Supplier Type</label>
                <select
                  className={'w-full bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 transition'}
                  value={form.supplierType || ''}
                  onChange={e => setForm({ ...form, supplierType: e.target.value })}
                >
                  {SUPPLIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>Email</label>
                  <input
                    className={cx.input}
                    type="email"
                    placeholder="purchase@supplier.com"
                    value={form.contactInfo?.email || ''}
                    onChange={e => setForm({ ...form, contactInfo: { ...form.contactInfo, email: e.target.value } })}
                  />
                </div>
                <div>
                  <label className={cx.label}>Phone</label>
                  <input
                    className={cx.input}
                    placeholder="+91 98765 43210"
                    value={form.contactInfo?.phone || ''}
                    onChange={e => setForm({ ...form, contactInfo: { ...form.contactInfo, phone: e.target.value } })}
                  />
                </div>
              </div>
              <div>
                <label className={cx.label}>Address</label>
                <input
                  className={cx.input}
                  placeholder="City, State"
                  value={form.contactInfo?.address || ''}
                  onChange={e => setForm({ ...form, contactInfo: { ...form.contactInfo, address: e.target.value } })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>GSTIN</label>
                  <input
                    className={cx.input}
                    placeholder="27AAAAA0000A1Z5"
                    value={form.gstin || ''}
                    onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className={cx.label}>Lead Time (Days)</label>
                  <input
                    className={cx.input}
                    type="number"
                    min="0"
                    value={form.leadTimeDays ?? 7}
                    onChange={e => setForm({ ...form, leadTimeDays: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className={cx.label}>Payment Terms</label>
                <input
                  className={cx.input}
                  placeholder="e.g. Net 30, Advance, LC at sight"
                  value={form.paymentTerms || ''}
                  onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
                />
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
