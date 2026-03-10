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

const ITEM_TYPES = [
  'Raw Material',
  'Finished Goods',
  'Packaging Material',
  'Additive / Masterbatch',
  'Consumable',
];


const POLYMER_GRADES = [
  'HDPE',
  'LDPE',
  'LLDPE',
  'PP Homopolymer',
  'PP Copolymer',
  'PVC',
  'ABS',
  'PET',
  'PS',
  'Other',
];

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

const Spinner = () => (
  <div className="flex items-center justify-center h-48 gap-3 text-dark-500 text-sm font-mono">
    <div className="w-4 h-4 border-2 border-dark-600 border-t-hive-400 rounded-full animate-spin" />
    Loading…
  </div>
);

const Products = () => {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLow, setFilterLow] = useState(false);
  const [modal, setModal]         = useState(null); // 'add' | 'edit'
  const [form, setForm]           = useState({});

  const fetchProducts = () => {
    const p = new URLSearchParams();
    if (search)    p.set('search', search);
    if (filterCat) p.set('category', filterCat);
    if (filterLow) p.set('lowStock', 'true');
    setLoading(true);
    api.get(`/products?${p}`)
      .then(r => {
        let data = r.data;
        if (filterType) data = data.filter(x => x.itemType === filterType);
        setProducts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); }, [search, filterCat, filterLow, filterType]);

  const openAdd = () => {
    setForm({
      itemName:          '',
      itemType:          'Raw Material',
      polymerGrade:      '',
      unit:              'Tonnes',
      department:        'Raw Materials',
      lowStockThreshold: 10,
      category:          '',
    });
    setModal('add');
  };

  const openEdit = (p) => { setForm({ ...p }); setModal('edit'); };

  const handleSave = async () => {
    try {
      if (modal === 'add') await api.post('/products', form);
      else                  await api.put(`/products/${form._id}`, form);
      setModal(null);
      fetchProducts();
    } catch (err) { alert(err.response?.data?.message || 'Error saving product'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    try { await api.delete(`/products/${id}`); fetchProducts(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const stockColor = (p) => {
    if (p.stock?.totalAvailable === 0) return 'red';
    if (p.isLowStock)                  return 'amber';
    return 'green';
  };
  const stockLabel = (p) => {
    if (p.stock?.totalAvailable === 0) return 'OUT';
    if (p.isLowStock)                  return 'LOW';
    return 'OK';
  };

  const typeBadgeColor = (t) => ({
    'Raw Material':          'blue',
    'Finished Goods':        'green',
    'Packaging Material':    'amber',
    'Additive / Masterbatch':'gray',
    'Consumable':            'gray',
  }[t] || 'gray');

 
  const rawCount      = products.filter(p => p.itemType === 'Raw Material').length;
  const chipsCount    = products.filter(p => p.itemType === 'Finished Goods').length;
  const lowCount      = products.filter(p => p.isLowStock || p.stock?.totalAvailable === 0).length;

  return (
    <div className="space-y-5">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Products</h1>
          <p className="text-[10px] font-mono text-dark-500 tracking-widest uppercase mt-0.5">
            {products.length} SKUs · {rawCount} raw materials · {chipsCount} finished chips
          </p>
        </div>
        <button className={cx.btnP} onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2 bg-dark-800 border border-dark-700 rounded-lg px-3 py-2">
          <span className="text-dark-500 text-sm">⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or grade…"
            className="bg-transparent text-sm text-dark-100 outline-none placeholder-dark-600 w-52"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-dark-800 border border-dark-700 text-dark-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 transition"
        >
          <option value="">All Types</option>
          {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="bg-dark-800 border border-dark-700 text-dark-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 transition"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <button
          onClick={() => setFilterLow(!filterLow)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition ${
            filterLow
              ? 'bg-red-500/15 border-red-500/40 text-red-400'
              : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-white'
          }`}
        >
          ⚡ Low / Out ({lowCount})
        </button>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        {loading ? <Spinner /> : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-dark-500">
            <span className="text-4xl mb-3">◈</span>
            <span className="text-sm">No products found</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={cx.th}>Item / Grade</th>
                  <th className={cx.th}>Type</th>
                  <th className={cx.th}>Polymer</th>
                  <th className={cx.th}>Unit</th>
                  <th className={cx.th}>Department</th>
                  <th className={`${cx.th} text-right`}>Available (T)</th>
                  <th className={`${cx.th} text-right`}>Threshold (T)</th>
                  <th className={`${cx.th} text-right`}>Stock</th>
                  <th className={cx.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-dark-800/40 transition">
                    <td className={`${cx.td} font-semibold text-white`}>{p.itemName}</td>
                    <td className={cx.td}>
                      <Badge color={typeBadgeColor(p.itemType)}>{p.itemType}</Badge>
                    </td>
                    <td className={`${cx.td} font-mono text-dark-400 text-xs`}>{p.polymerGrade || '—'}</td>
                    <td className={`${cx.td} font-mono text-dark-400`}>{p.unit}</td>
                    <td className={`${cx.td} text-dark-400`}>{p.department || '—'}</td>
                    <td className={`${cx.td} text-right font-mono ${
                      p.stock?.totalAvailable === 0 ? 'text-red-400' :
                      p.isLowStock ? 'text-amber-400' : 'text-dark-300'
                    }`}>
                      {p.stock?.totalAvailable ?? '—'}
                    </td>
                    <td className={`${cx.td} text-right font-mono text-dark-400`}>
                      {p.lowStockThreshold ?? '—'}
                    </td>
                    <td className={`${cx.td} text-right`}>
                      <Badge color={stockColor(p)}>{stockLabel(p)}</Badge>
                    </td>
                    <td className={cx.td}>
                      <div className="flex gap-2">
                        <button className={cx.btnG} onClick={() => openEdit(p)}>Edit</button>
                        <button className={cx.btnR} onClick={() => handleDelete(p._id)}>Del</button>
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
          onClick={() => setModal(null)}
        >
          <div
            className="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">
                {modal === 'add' ? 'Add Product / Material' : 'Edit Product'}
              </h2>
              <button className="text-dark-400 hover:text-white transition text-lg" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={cx.label}>Item Name *</label>
                <input
                  className={cx.input}
                  placeholder="e.g. HDPE Granules — F46003, Plastic Chips — HDPE"
                  value={form.itemName || ''}
                  onChange={e => setForm({ ...form, itemName: e.target.value })}
                />
              </div>

             
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>Item Type *</label>
                  <select
                    className={cx.select}
                    value={form.itemType || 'Raw Material'}
                    onChange={e => setForm({
                      ...form,
                      itemType:   e.target.value,
                      department: e.target.value === 'Finished Goods' ? 'Finished Goods' :
                                  e.target.value === 'Raw Material'   ? 'Raw Materials'  : form.department,
                    })}
                  >
                    {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cx.label}>Polymer Grade</label>
                  <select
                    className={cx.select}
                    value={form.polymerGrade || ''}
                    onChange={e => setForm({ ...form, polymerGrade: e.target.value })}
                  >
                    <option value="">— Select —</option>
                    {POLYMER_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>Unit</label>
                  <select
                    className={cx.select}
                    value={form.unit || 'Tonnes'}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                  >
                    <option value="Tonnes">Tonnes</option>
                    <option value="Kg">Kg</option>
                    <option value="Bags">Bags</option>
                    <option value="Nos">Nos</option>
                  </select>
                </div>
                <div>
                  <label className={cx.label}>Department</label>
                  <select
                    className={cx.select}
                    value={form.department || ''}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                  >
                    <option value="">— Select —</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Additives">Additives</option>
                    <option value="Stores">Stores</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>Batch / Lot No.</label>
                  <input
                    className={cx.input}
                    placeholder="e.g. LOT-HDPE-2026-01"
                    value={form.batchNumber || ''}
                    onChange={e => setForm({ ...form, batchNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className={cx.label}>Low Stock Threshold (T)</label>
                  <input
                    className={cx.input}
                    type="number"
                    min="0"
                    value={form.lowStockThreshold ?? 10}
                    onChange={e => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className={cx.label}>Category</label>
                <select
                  className={cx.select}
                  value={form.category?._id || form.category || ''}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">None</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div className="bg-hive-500/5 border border-hive-500/15 rounded-lg px-3 py-2.5 text-[10px] font-mono text-hive-400">
                Tip: Use item names like <em>"HDPE Granules — F46003"</em> or <em>"Plastic Chips — HDPE Natural"</em> for clarity.
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className={cx.btnG} onClick={() => setModal(null)}>Cancel</button>
              <button className={cx.btnP} onClick={handleSave}>Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
